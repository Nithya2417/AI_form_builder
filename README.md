# ai-form-autofill

This project provides a FastAPI backend for extracting fields from documents using OCR and the Nia API.

## Setup (Windows)

1. Install Python 3.8+ and pip.
2. Install Tesseract OCR:
   - Download from https://github.com/tesseract-ocr/tesseract and install (default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`).
3. Install Poppler (required by `pdf2image`):
   - Download Poppler for Windows and add the `bin` folder to your PATH. See: https://github.com/oschwartz10612/poppler-windows
4. Install Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

5. Set your NIA API key in environment variable `NIA_API_KEY` or provide it from the frontend.
6. Set your MongoDB connection string in environment variable `MONGODB_URI`.
   - Optional: set `MONGODB_DB` and `MONGODB_COLLECTION` if you want custom names.
   - To make values persistent, create a `.env` file in the project root with the variables below.

Example `.env` content:

```powershell
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB="ai_form_autofill"
MONGODB_COLLECTION="saved_forms"
NIA_API_KEY="nia_app_vf-I4CzOugoPhokP9eQf2IAy3BFjg0cc0erIL1IgfSY"
```

The backend automatically loads `.env` if it exists.

## Run

```powershell
uvicorn main:app --reload
```

The server will be available at http://127.0.0.1:8000

## Notes

- The frontend does not need to provide an API key. The backend will use `NIA_API_KEY` if configured, otherwise it will automatically fall back to local OCR extraction.
- If OCR dependencies are missing, the server will surface a clear error telling you which packages or system binaries are required.
 - For frontend development, the React app lives in `ai-form-builder/`. Start it with:

```powershell
cd ai-form-builder
npm install
npm start
```

 The React dev server runs on `http://localhost:3000` by default. The backend enables CORS for `localhost:3000` and `127.0.0.1:3000`. To change allowed origins set the `FRONTEND_ORIGINS` environment variable (comma-separated).

- If the Nia endpoint returns a 404 error, the backend now falls back to local OCR text extraction and field matching, so extraction can still work if OCR dependencies are installed.
