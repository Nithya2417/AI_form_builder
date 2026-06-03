from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Body, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import requests
import json
import re
import os
import tempfile
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# Load environment variables from a local .env file if present.
load_dotenv()

# Optional OCR dependencies. We import lazily and surface friendly errors when missing.
try:
    import pytesseract
    from PIL import Image
    from pdf2image import convert_from_path
    _ocr_import_error = None
except Exception as _e:
    pytesseract = None
    Image = None
    convert_from_path = None
    _ocr_import_error = _e

app = FastAPI()

BUILD_DIR = Path(__file__).resolve().parent / "ai-form-builder" / "build"
if BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=BUILD_DIR / "static"), name="static")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB", "ai_form_autofill")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "saved_forms")
mongo_client = None
saved_collection = None


# Configure CORS to allow the frontend dev server to call the API during development.
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Return React app index if built, otherwise redirect to docs."""
    build_index = Path(__file__).resolve().parent / "ai-form-builder" / "build" / "index.html"
    if build_index.exists():
        return FileResponse(build_index)
    return RedirectResponse(url="/docs")


@app.on_event("startup")
def startup():
    global mongo_client, saved_collection
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI environment variable is required for MongoDB persistence.")
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    mongo_client.server_info()
    saved_collection = mongo_client[MONGODB_DB][MONGODB_COLLECTION]

API_URL = os.getenv("NIA_API_URL", "https://nia.naslabs.ai/api/v1/chat/completions")
API_KEY = os.getenv("NIA_API_KEY")

# Tesseract path (Windows)
if pytesseract:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def extract_text(file_path):
    if _ocr_import_error is not None:
        raise RuntimeError(
            "OCR dependencies are not available. Install Pillow, pytesseract and pdf2image, and ensure Tesseract and Poppler are installed."
        )

    text = ""

    if file_path.lower().endswith(".pdf"):
        # convert_from_path requires poppler to be installed on the system
        images = convert_from_path(file_path)
        for img in images:
            text += pytesseract.image_to_string(img)
    else:
        text = pytesseract.image_to_string(Image.open(file_path))

    return text


@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    try:
        # Save uploaded file to a temp file to avoid writing into project dir
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            file_path = tmp.name

        # OCR
        text = extract_text(file_path)

        # API call
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "nia-a-1.0",
            "messages": [
                {
                    "role": "user",
                    "content": f"""
Extract the following fields and return ONLY JSON:
Name, Email, Skills, Experience.

Text:
{text}
"""
                }
            ]
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
        response_json = response.json()

        content = response_json["choices"][0]["message"]["content"]

        # Clean JSON
        cleaned = re.sub(r"```json|```", "", content).strip()
        data = json.loads(cleaned)

        # cleanup temp file
        try:
            os.remove(file_path)
        except Exception:
            pass

        return data
    except Exception as e:
        # cleanup temp file on error
        try:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
        return {"error": str(e)}


def build_extraction_prompt(fields, schema_suffix=""):
    schema = "\n".join(
        f'- "{f.get("label", "")}" (type: {f.get("type", "text")}{", required" if f.get("required") else ", optional"})'
        for f in fields
    )

    return (
        f"You are an expert data extraction assistant.\n\n"
        f"Your job is to read the document and extract values for the following form fields:\n\n"
        f"{schema}\n\n"
        "Rules:\n"
        "- Respond ONLY with a valid JSON object.\n"
        "- Keys must be the EXACT field labels listed above.\n"
        "- Values must be strings (or null if not found).\n"
        "- Do NOT include markdown, code fences, or any explanation.\n"
        "- If a value is not present in the document, set it to null.\n\n"
        "Example output format:\n"
        '{"Full Name": "John Doe", "Email Address": "john@example.com", "Notes": null}'
    )


def simple_text_extraction(text, field_defs):
    extracted = {}
    for field in field_defs:
        label = field.get("label", "").strip()
        value = None
        if label:
            match = re.search(re.escape(label) + r"[:\-]\s*(.+)", text, re.IGNORECASE)
            if match:
                value = match.group(1).split("\n")[0].strip()
                if value == "":
                    value = None
        if not value and "email" in label.lower():
            email_match = re.search(r"([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})", text)
            if email_match:
                value = email_match.group(1)
        extracted[label] = value
    return extracted


@app.post("/extract")
async def extract(file: UploadFile = File(...), fields: str = Form(...), api_key: str = Form(None)):
    key = api_key or os.getenv("NIA_API_KEY") or API_KEY

    try:
        field_defs = json.loads(fields)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid fields JSON: {exc}")

    try:
        file_bytes = await file.read()
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        raw_text = extract_text(tmp_path)
        try:
            os.remove(tmp_path)
        except Exception:
            pass

        if not key:
            print("[BACKEND] No Nia API key configured; using local OCR extraction fallback")
            return simple_text_extraction(raw_text, field_defs)

        prompt = build_extraction_prompt(field_defs)
        prompt += "\n\nText:\n" + raw_text.strip()

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}"
        }

        payload = {
            "model": "nia-a-2.0",
            "max_tokens": 1500,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}]
        }

        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 404:
                print("[NIA FALLBACK] 404 from Nia, returning OCR-only extraction")
                return simple_text_extraction(raw_text, field_defs)
            raise

        response_json = response.json()
        print("[NIA RESPONSE DEBUG]:", json.dumps(response_json)[:2000])

        if response_json.get("error"):
            raise HTTPException(status_code=502, detail=str(response_json.get("error")))

        content = response_json["choices"][0]["message"]["content"]
        cleaned = re.sub(r"^```[a-z]*\n|```$", "", content).strip()
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            raise HTTPException(status_code=502, detail="No JSON object found in Nia response.")

        extracted = json.loads(match.group(0))
        return extracted

    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Nia API request failed: {exc}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to parse Nia response JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/config")
async def config():
    return {
        "nia_configured": bool(API_KEY or os.getenv("NIA_API_KEY"))
    }


@app.post("/records")
async def save_form_record(record: dict = Body(...)):
    if not record.get("fields") or not record.get("values"):
        raise HTTPException(status_code=400, detail="Missing required form payload.")

    if saved_collection is None:
        raise HTTPException(status_code=500, detail="MongoDB is not configured.")

    saved_at = record.get("saved_at") or datetime.utcnow().isoformat()
    document = {
        "fields": record["fields"],
        "values": record["values"],
        "autofilled": record.get("autofilled", {}),
        "missing": record.get("missing", {}),
        "file_name": record.get("file_name"),
        "saved_at": saved_at,
    }

    try:
        result = saved_collection.insert_one(document)
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save record: {exc}")

    return {"id": str(result.inserted_id), "status": "saved", "saved_at": saved_at}


@app.get("/records")
async def list_saved_forms():
    if saved_collection is None:
        raise HTTPException(status_code=500, detail="MongoDB is not configured.")

    try:
        rows = list(saved_collection.find({}, sort=[("saved_at", -1)]))
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to list records: {exc}")

    return [
        {
            "id": str(row["_id"]),
            "fields": row.get("fields", {}),
            "values": row.get("values", {}),
            "autofilled": row.get("autofilled", {}),
            "missing": row.get("missing", {}),
            "file_name": row.get("file_name"),
            "saved_at": row.get("saved_at"),
        }
        for row in rows
    ]


if BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(BUILD_DIR / "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        candidate = BUILD_DIR / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(BUILD_DIR / "index.html")


