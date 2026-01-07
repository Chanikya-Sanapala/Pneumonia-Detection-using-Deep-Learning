# test_env.py
import sys
print("Python:", sys.version.replace('\n', ' '))

try:
    import numpy as np
    print("numpy:", np.__version__)
except Exception as e:
    print("numpy import error:", e)

try:
    import cv2
    print("opencv:", cv2.__version__)
except Exception as e:
    print("opencv import error:", e)

try:
    import tensorflow as tf
    print("tensorflow:", tf.__version__)
except Exception as e:
    print("tensorflow import error:", e)

try:
    import flask
    print("flask:", flask.__version__)
except Exception as e:
    print("flask import error:", e)
