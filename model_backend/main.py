import os
import uuid
import json
import pymongo
from datetime import datetime
from typing import Any, Dict, Optional
from tensorflow.keras.preprocessing import image

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
import numpy as np
from bson.binary import Binary

try:
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except Exception:
    TF_AVAILABLE = False

BASE_DIR = os.path.dirname(__file__)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "ayu_rakshak")
MONGO_COLLECTION = os.environ.get("MONGO_COLLECTION", "predictions")
MRI_MODEL_PATH = os.path.join(BASE_DIR, "models/MRI_FULL_MODEL.h5")
XRAY_MODEL_PATH = os.path.join(BASE_DIR, "models/X-RAY_FULL_MODEL.keras")

CLASS_MAPPINGS = {
    "mri": {
        0: "Notumor",
        1: "Glioma",
        2: "Meningioma",
        3: "Pituitary",
    },
    "xray": {0: "Normal", 1: "Pneumonia"},
}

def inv_class_mapping_for(model_name: str):
    return CLASS_MAPPINGS.get(model_name, {})


app = FastAPI(title="Ayu-Rakshak Prediction API")

# Allow CORS for local frontend during development. Adjust `allow_origins` for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB client/collection (initialized on startup)
mongo_client: Optional[pymongo.MongoClient] = None
mongo_coll = None


def init_db():
    """Initialize MongoDB connection and ensure indexes."""
    global mongo_client, mongo_coll
    mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    try:
        mongo_client.admin.command("ping")
    except Exception as e:
        raise RuntimeError(f"Could not connect to MongoDB at {MONGO_URI}: {e}")
    db = mongo_client[MONGO_DB]
    mongo_coll = db[MONGO_COLLECTION]
    mongo_coll.create_index("id", unique=True)


def save_result(record):
    if mongo_coll is None:
        raise RuntimeError("MongoDB collection is not initialized")
    mongo_coll.insert_one(record)


def get_result(record_id: str, include_image: bool = False):
    """Fetch a prediction record. By default `imageData` (binary) is excluded to avoid
    JSON serialization issues. If `include_image=True`, the image bytes are returned as
    base64-encoded string under the same key `imageData`.
    """
    if mongo_coll is None:
        raise RuntimeError("MongoDB collection is not initialized")
    projection = {"_id": 0}
    if not include_image:
        projection["imageData"] = 0

    doc = mongo_coll.find_one({"id": record_id}, projection)
    if not doc:
        return {}

    if include_image and "imageData" in doc and doc["imageData"] is not None:
        try:
            import base64

            doc["imageData"] = base64.b64encode(doc["imageData"]).decode("ascii")
        except Exception:
            # if conversion fails, remove the field to avoid serialization issues
            doc.pop("imageData", None)

    return doc


# Lazy model loader
class ModelBundle:
    def __init__(self):
        self.mri = None
        self.xray = None
        self.loaded = False

    def load(self):
        if self.loaded:
            return
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow / Keras not available in the environment. Install 'tensorflow'.")
        # Try to load models; catch deserialization errors and raise a helpful message
        load_errors = []
        if os.path.exists(MRI_MODEL_PATH):
            try:
                # try non-training/compile load first which is more tolerant
                self.mri = load_model(MRI_MODEL_PATH, compile=False)
                print("MRI model loaded")
            except Exception as e:
                print(f"Failed to load MRI model: {e}")
                load_errors.append((MRI_MODEL_PATH, e))
        if os.path.exists(XRAY_MODEL_PATH):
            try:
                self.xray = load_model(XRAY_MODEL_PATH, compile=False)
                print("X-ray model loaded")
            except Exception as e:
                print(f"Failed to load X-ray model: {e}")
                load_errors.append((XRAY_MODEL_PATH, e))
        if self.mri is None and self.xray is None:
            # If there were load errors, surface a more actionable message
            if load_errors:
                # create a short summary for the most likely cause
                paths = ", ".join(p for p, _ in load_errors)
                first_err = load_errors[0][1]
                msg = (
                    f"Failed to load model file(s): {paths}.\n"
                    f"This commonly happens when the model was saved with a different Keras/TensorFlow version than the one installed.\n"
                    f"Original error: {first_err}\n\n"
                    "Suggested fixes:\n"
                    " - Install a compatible TensorFlow/Keras version that was used to save the model (for example: `pip install 'tensorflow==2.11.0'` or the version you used).\n"
                    " - If you have access to the original environment, re-save the model in a more portable format (for example `model.save('model.h5')` or save weights and architecture separately).\n"
                    " - Re-export the model ensuring it does not include framework-specific config items (use `compile=False` when saving/loading where appropriate).\n"
                )
                raise RuntimeError(msg)
            raise FileNotFoundError("No model files found. Expected MRI.keras or X-RAY_FULL_MODEL.keras in the app directory.")
        self.loaded = True


models = ModelBundle()

# Function to load and preprocess an image
def load_and_preprocess_image(image_path, service):
    if service == 'mri':
        image_shape = (168, 168)
        color='grayscale'
    else:
        image_shape = (224, 224)
        color='rgb'

    img = image.load_img(image_path, target_size=image_shape, color_mode=color)  # ✅ use rgb
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array



def run_predictions(img_array, service= None) :
    """Run prediction using available models. If `service` is provided ('mri' or 'xray'), only run that model."""
    # Ensure models loaded
    print("predicting ...")
    if not models.loaded:
        models.load()

    results= {}
    for name, m in (("mri", models.mri), ("xray", models.xray)):
        print(service)
        if service is not None and name != service:
            continue
        if m is None:
            # If a specific service was requested but the model is None, raise an error
            if service == name:
                raise RuntimeError(f"The {name.upper()} model failed to load. Please check the model file and TensorFlow/Keras compatibility.")
            continue
        print("doing")
        preds = m.predict(img_array)
        print(f"{name} predictions:", preds)
        preds_list = preds.tolist()
        try:
            if preds.ndim > 1 and preds.shape[-1] > 1:
                class_idx = int(np.argmax(preds, axis=-1)[0])
                probabilities = preds_list[0]
                label = None
                mapping = CLASS_MAPPINGS.get(name)
                if mapping is not None:
                    label = mapping.get(class_idx)
                results[name] = {
                    "class_index": class_idx,
                    "label": label,
                    "probabilities": probabilities,
                }
            else:
                val = float(preds.flatten()[0])
                label = None
                mapping = CLASS_MAPPINGS.get(name)
                if mapping is not None and 0 in mapping and 1 in mapping:
                    label = mapping.get(1) if val >= 0.5 else mapping.get(0)
                results[name] = {"value": val, "label": label}
        except Exception:
            results[name] = {"raw": preds_list}

    return results


@app.on_event("startup")
def startup_event():
    init_db()


async def _handle_upload(file: UploadFile, service: Optional[str] = None, userId: Optional[str] = None):
    suffix = os.path.splitext(file.filename)[1]
    tmp_name = f"{uuid.uuid4().hex}{suffix}"
    tmp_path = os.path.join(BASE_DIR, tmp_name)
    # read file bytes once
    content = await file.read()
    with open(tmp_path, "wb") as f:
        f.write(content)

    try:
        arr = load_and_preprocess_image(tmp_path, service)
    except Exception as e:
        # remove temporary file and surface a 400
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    try:
        preds = run_predictions(arr, service=service)
    except FileNotFoundError as e:
        os.remove(tmp_path)
        raise HTTPException(status_code=503, detail=str(e))
    except RuntimeError as e:
        os.remove(tmp_path)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

    record_id = uuid.uuid4().hex

    # Persist image bytes into the DB instead of saving a file on disk
    # Use BSON Binary to store raw bytes. Remove temporary file afterwards.
    image_data = Binary(content)
    try:
        os.remove(tmp_path)
    except Exception:
        # if removal fails, continue — we no longer rely on the file
        pass

    # derive a simple confidence score from predictions
    confidence = 0.0
    try:
        # look for probability arrays in preds
        for v in preds.values():
            if isinstance(v, dict) and "probabilities" in v:
                probs = v.get("probabilities") or []
                if isinstance(probs, (list, tuple)) and len(probs) > 0:
                    confidence = max(confidence, float(max(probs)))
            elif isinstance(v, dict) and "value" in v:
                # treat single-value outputs as confidence-like if in [0,1]
                val = float(v.get("value") or 0.0)
                if 0.0 <= val <= 1.0:
                    confidence = max(confidence, val)
    except Exception:
        confidence = 0.0

    # persist structured record as a MongoDB document
    document = {
        "id": record_id,
        "userId": userId,
        "imageData": image_data,
        "result": preds,
        "confidence": float(confidence),
        "createdAt": datetime.utcnow().isoformat(),
    }

    save_result(document)

    return JSONResponse({"id": record_id, "predictions": preds, "confidence": confidence})



@app.post("/api/predictions/upload/mri")
async def upload_and_predict_mri(file: UploadFile = File(...), userId: str = Form(None)):
    print("mri call")
    return await _handle_upload(file, service="mri", userId=userId)


@app.post("/api/predictions/upload/x-ray")
async def upload_and_predict_xray(file= File(...), userId = Form(None)):
    return await _handle_upload(file, service="xray", userId=userId)


@app.get("/api/predictions/result/{record_id}")
def get_prediction_result(record_id: str, include_image: bool = False):
    res = get_result(record_id, include_image=include_image)
    if not res:
        raise HTTPException(status_code=404, detail="Prediction id not found")
    return res
