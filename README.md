# AI Form Autofill

A form builder and document extraction app with a FastAPI backend and React frontend.

- Build custom form fields in the browser
- Upload PDF, JPG, PNG documents
- Extract values using Nia AI or a local OCR fallback
- Review extracted values and save the filled form
- Persist saved submissions to MongoDB
- View saved records from the React UI

## Repository structure

- `main.py` — FastAPI backend with `/extract`, `/records`, and `/config`
- `ai-form-builder/` — React frontend app
- `requirements.txt` — backend Python dependencies
- `.env.example` — environment config template

## Features

- `POST /extract` — extract field values from uploaded documents
- `POST /records` — save reviewed form data to MongoDB
- `GET /records` — list saved form submissions
- `GET /config` — detect whether Nia is configured on the backend
- Optional fallback to local OCR extraction when Nia is not configured or returns 404

## Setup (Windows)

1. Install Python 3.8+ and pip.
2. Install Tesseract OCR:
   - Download from https://github.com/tesseract-ocr/tesseract and install.
   - Default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`
3. Install Poppler (required by `pdf2image`):
   - Download Poppler for Windows and add its `bin` folder to your PATH.
   - See: https://github.com/oschwartz10612/poppler-windows
4. Install Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

5. Create a `.env` file in the project root with your MongoDB connection and optional Nia API key.

Example `.env`:

```powershell
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB="ai_form_autofill"
MONGODB_COLLECTION="saved_forms"
NIA_API_KEY="your_nia_api_key_here"
```

6. Start the backend:

```powershell
uvicorn main:app --reload
```

7. Start the frontend for development:

```powershell
cd ai-form-builder
npm install
npm start
```

The React app runs at `http://localhost:3000` and the backend runs at `http://127.0.0.1:8000`.

## Deployment

If you build the React app, the backend can serve it from `ai-form-builder/build`.

```powershell
cd ai-form-builder
npm run build
```

Then access the app through the backend at `http://127.0.0.1:8000`.

## Notes

- The backend automatically loads `.env` values when present.
- If `NIA_API_KEY` is missing, the backend will use local OCR extraction instead.
- Saved forms are stored in MongoDB and can be reviewed through the React UI.
- To allow a different frontend origin, set `FRONTEND_ORIGINS` to a comma-separated list.

## GitHub

Repository: https://github.com/Nithya2417/AI_form_builder

---

If you want, I can also create a short pull request description for this feature set.