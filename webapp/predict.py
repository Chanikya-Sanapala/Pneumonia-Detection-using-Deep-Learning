"""
predict.py
Load model and expose a function to preprocess an uploaded image and return prediction.
Auto-downloads model from GitHub Releases if not present locally.
"""
import os
import sys

# Set memory-saving flags BEFORE importing tensorflow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['MALLOC_TRIM_THRESHOLD_'] = '100000'

import numpy as np
import cv2
from tensorflow.keras.models import load_model

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'VGG16.h5')
IMG_SIZE = (224, 224)

# Set this env var on Render, or it defaults to your GitHub Releases URL
MODEL_URL = os.environ.get(
    'MODEL_URL',
    'https://github.com/Chanikya-Sanapala/Major/releases/download/v1.0/VGG16.h5'
)

_model = None


def download_model(url, dest):
    """Download model file from URL with progress."""
    import urllib.request
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"[predict] Downloading model from {url} ...")
    try:
        urllib.request.urlretrieve(url, dest)
        size_mb = os.path.getsize(dest) / (1024 * 1024)
        print(f"[predict] Model downloaded successfully ({size_mb:.1f} MB)")
    except Exception as e:
        if os.path.exists(dest):
            os.remove(dest)
        raise RuntimeError(f"Failed to download model: {e}")


def load_model_once(model_path=None):
    global _model
    if _model is None:
        path = model_path or MODEL_PATH
        if not os.path.exists(path):
            print(f"[predict] Model not found at {path}, downloading fallback...")
            download_model(MODEL_URL, path)
        print(f"[predict] Loading model from {path}...")
        _model = load_model(path, compile=False)
        print("[predict] Model loaded successfully.")
    return _model


def preprocess_image(file_path, target_size=IMG_SIZE):
    # Read with cv2, convert to RGB, resize, scale
    img = cv2.imread(file_path)
    if img is None:
        raise ValueError("Failed to read image from " + file_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, target_size)
    img = img.astype('float32') / 255.0
    return np.expand_dims(img, axis=0)


def predict_from_path(file_path, model_path=None):
    model = load_model_once(model_path)
    x = preprocess_image(file_path)
    score = float(model.predict(x)[0][0])
    label = 'PNEUMONIA' if score >= 0.5 else 'NORMAL'
    confidence = score if score >= 0.5 else 1.0 - score
    return {'label': label, 'score': float(score), 'confidence': float(confidence)}


# Load model on startup in production (Render) to avoid timeout on first request
if os.environ.get('RENDER') or os.environ.get('PORT'):
    try:
        print("[predict] Startup model loading triggered...")
        load_model_once()
    except Exception as e:
        print(f"[predict] Startup model loading failed (will retry on request): {e}")


