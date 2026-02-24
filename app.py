"""
app.py (root-level entrypoint)
Vercel requires the Flask 'app' object to be importable from the root.
This file adds the webapp/ directory to sys.path so all webapp imports work,
then re-exports the Flask app object.
"""
import sys
import os

# Add the webapp directory to the module search path so that
# 'import app' and 'import predict' resolve to webapp/app.py and webapp/predict.py
_webapp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "webapp")
sys.path.insert(0, _webapp_dir)

# Also set CWD to webapp so relative paths (uploads, templates) resolve correctly
os.chdir(_webapp_dir)

# Now import the Flask app object (must be named 'app' for Vercel to detect it)
from app import app  # noqa: F401, E402

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)

