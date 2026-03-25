"""
app.py (root-level entrypoint)
Loads webapp/app.py directly via importlib to avoid circular import
(since this file is also named app.py).
"""
import sys
import os
import importlib.util

_webapp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webapp")

# Set CWD to webapp so relative paths (uploads/, templates/) resolve correctly
os.chdir(_webapp_dir)

# Add webapp to path so webapp/app.py can import predict, etc.
sys.path.insert(0, _webapp_dir)

# Load webapp/app.py under an alias to avoid the circular import
# (importing 'app' from this file would find itself)
_spec = importlib.util.spec_from_file_location(
    "webapp_app", os.path.join(_webapp_dir, "app.py")
)
_webapp_module = importlib.util.module_from_spec(_spec)
sys.modules["webapp_app"] = _webapp_module
_spec.loader.exec_module(_webapp_module)

# Re-export as 'app' so gunicorn's `app:app` finds it
app = _webapp_module.app

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
