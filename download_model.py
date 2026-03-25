import os
import urllib.request

MODEL_URL = "https://github.com/Chanikya-Sanapala/Pneumonia-Detection-using-Deep-Learning/releases/download/v1.0/VGG16.h5"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "VGG16.h5")

def download_model():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
    
    if os.path.exists(MODEL_PATH):
        print(f"Model already exists at {MODEL_PATH}")
        return

    print(f"Downloading model from {MODEL_URL}...")
    try:
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print(f"Model downloaded successfully to {MODEL_PATH}")
    except Exception as e:
        print(f"Error downloading model: {e}")
        exit(1)

if __name__ == "__main__":
    download_model()
