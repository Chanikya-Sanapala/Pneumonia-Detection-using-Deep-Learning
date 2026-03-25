import os

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "model.tflite")

def check_model():
    if os.path.exists(MODEL_PATH):
        print(f"✅ TFLite model found at {MODEL_PATH}")
    else:
        print(f"❌ TFLite model NOT found at {MODEL_PATH}")
        print("Please run convert_to_tflite.py locally and push the .tflite file to the models/ folder.")
        # We don't exit(1) here yet because the user might be about to push it.
    
if __name__ == "__main__":
    check_model()
