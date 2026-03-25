import os
import tensorflow as tf

def convert():
    model_h5 = "models/VGG16.h5"
    model_tflite = "models/model.tflite"
    
    if not os.path.exists(model_h5):
        print(f"Error: {model_h5} not found. Please download it first.")
        return

    print(f"Loading Keras model from {model_h5}...")
    model = tf.keras.models.load_model(model_h5)

    print("Converting to TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Enable optimizations for size
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    os.makedirs(os.path.dirname(model_tflite), exist_ok=True)
    with open(model_tflite, "wb") as f:
        f.write(tflite_model)
    
    print(f"Success! TFLite model saved to {model_tflite}")
    size_mb = os.path.getsize(model_tflite) / (1024 * 1024)
    print(f"TFLite size: {size_mb:.2f} MB")

if __name__ == "__main__":
    convert()
