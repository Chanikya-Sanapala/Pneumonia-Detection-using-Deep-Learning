"""
wsgi.py - Render/production entrypoint
Adds webapp/ to sys.path so all webapp imports work, then re-exports the Flask app.
"""
import sys
import os

_webapp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webapp")
sys.path.insert(0, _webapp_dir)

# Set CWD to webapp so relative paths (uploads/, templates/) resolve correctly
os.chdir(_webapp_dir)

# Import the Flask app from webapp/app.py
from app import app  # noqa: F401, E402

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
