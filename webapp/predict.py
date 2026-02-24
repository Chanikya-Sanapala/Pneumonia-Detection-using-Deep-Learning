"""
predict.py
Load model and expose a function to preprocess an uploaded image and return prediction.
"""
import os
import numpy as np
import cv2
from tensorflow.keras.models import load_model

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models', 'VGG16.h5')
IMG_SIZE = (224, 224)

_model = None

def load_model_once(model_path=None):
    global _model
    if _model is None:
        path = model_path or MODEL_PATH
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found at {path}. Train and save a model as {path}.")
        _model = load_model(path)
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
