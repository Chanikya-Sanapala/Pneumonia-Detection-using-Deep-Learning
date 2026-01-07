# Pneumonia Detection using Deep Learning

## Project structure
See the folder structure in the repository. Key folders:
- `data/` - dataset (train/val/test)
- `models/` - trained model (put trained `VGG16.h5` here)
- `src/` - training and helpers
- `webapp/` - Flask demo
- `research_paper_figures/` - evaluation plots

## Quickstart

1. Create & activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate        # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
