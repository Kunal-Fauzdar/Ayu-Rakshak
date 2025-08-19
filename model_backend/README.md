Ayu-Rakshak — Prediction API

This small FastAPI app exposes two prediction routes for your project using existing Keras `.h5` models placed in the app directory.

Files
- `main.py` — FastAPI application with two endpoints:
  - POST `/api/predictions/upload` — upload an image and get predictions from available models
  - GET `/api/predictions/result/{id}` — fetch stored prediction by id
- `predictions.db` — SQLite DB created at first run to store prediction results (auto-created)
- Place your models in the same directory as `main.py` with these filenames (already present in your workspace):
  - `MRI_FULL_MODEL.h5`
  - `X-RAY_FULL_MODEL.h5`

Assumptions
- Models accept 224x224 RGB images normalized to [0,1]. If your models require a different preprocessing, update `preprocess_image` in `main.py`.
- TensorFlow / Keras is required to load `.h5` models. If not installed, the server will return a 503 status explaining the missing dependency.

Quick start (PowerShell)

1. Create and activate a virtual environment (optional but recommended):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Run the server:

```powershell
# from the directory containing main.py
uvicorn main:app --host 0.0.0.0 --port 8000
```

Usage examples (PowerShell)

Upload an image and get a prediction:

```powershell
$resp = Invoke-RestMethod -Uri http://127.0.0.1:8000/api/predictions/upload -Method Post -InFile path\to\image.jpg -ContentType 'multipart/form-data'
$resp | ConvertTo-Json -Depth 10
```

Fetch a saved prediction by id:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/predictions/result/<id> -Method Get
```

If your models need different preprocessing or input sizes, edit `preprocess_image` in `main.py`.
