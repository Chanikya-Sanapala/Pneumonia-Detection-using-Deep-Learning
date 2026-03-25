import os
import sys
import numpy as np
import cv2

try:
    # Try importing tflite_runtime first (production)
    import tflite_runtime.interpreter as tflite
except ImportError:
    # Fallback to full tensorflow (local development if tflite-runtime not installed)
    try:
        import tensorflow.lite as tflite
    except ImportError:
        print("[predict] Error: Neither tflite-runtime nor tensorflow found.")
        sys.exit(1)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'model.tflite')
IMG_SIZE = (224, 224)

# Global variables for the interpreter
_interpreter = None
_input_details = None
_output_details = None

def load_model_once():
    """Load the TFLite model and set up the interpreter."""
    global _interpreter, _input_details, _output_details
    
    if _interpreter is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"TFLite model not found at {MODEL_PATH}. Please run conversion script.")
        
        print(f"[predict] Loading TFLite model from {MODEL_PATH}...")
        _interpreter = tflite.Interpreter(model_path=MODEL_PATH)
        _interpreter.allocate_tensors()
        
        _input_details = _interpreter.get_input_details()
        _output_details = _interpreter.get_output_details()
        print("[predict] TFLite Interpreter initialized successfully.")
    
    return _interpreter

def preprocess_image(file_path, target_size=IMG_SIZE):
    """Read image, convert, resize, and normalize for VGG16 input."""
    img = cv2.imread(file_path)
    if img is None:
        raise ValueError("Failed to read image from " + file_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, target_size)
    
    # Normalize to [0,1] as float32
    img = img.astype('float32') / 255.0
    return np.expand_dims(img, axis=0)

def predict_from_path(file_path):
    """Run inference on the given image path using TFLite."""
    interpreter = load_model_once()
    x = preprocess_image(file_path)
    
    # Set input tensor
    interpreter.set_tensor(_input_details[0]['index'], x)
    
    # Run inference
    interpreter.invoke()
    
    # Get prediction result
    output_data = interpreter.get_tensor(_output_details[0]['index'])
    score = float(output_data[0][0])
    
    label = 'PNEUMONIA' if score >= 0.5 else 'NORMAL'
    confidence = score if score >= 0.5 else 1.0 - score
    
    return {
        'label': label, 
        'score': score, 
        'confidence': confidence
    }

# Pre-load the model on startup if in production
if os.environ.get('RENDER') or os.environ.get('PORT'):
    try:
        load_model_once()
    except Exception as e:
        print(f"[predict] Startup pre-load failed: {e}")
