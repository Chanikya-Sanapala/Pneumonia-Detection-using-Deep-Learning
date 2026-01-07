"""
main.py
Load trained model and run evaluation on test set, save ROC, confusion matrix, and CSV of predictions.
"""
import os
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from src.dataset import get_generators
from src.utils import plot_confusion_matrix, plot_roc, classification_report_metrics

def evaluate(model_path='models/VGG16.h5', out_csv='research_paper_figures/test_predictions.csv'):
    os.makedirs('research_paper_figures', exist_ok=True)
    model = load_model(model_path)
    _, _, test_gen = get_generators(batch_size=32)
    steps = int(np.ceil(test_gen.samples / test_gen.batch_size))

    y_true = []
    y_scores = []
    filenames = []

    test_gen.reset()
    for i in range(steps):
        x, y = next(test_gen)
        preds = model.predict(x)
        y_true.extend(y.tolist())
        y_scores.extend([float(p[0]) for p in preds])
        # filenames from generator
        batch_filenames = test_gen.filenames[i*test_gen.batch_size:(i+1)*test_gen.batch_size]
        filenames.extend(batch_filenames)

    # threshold at 0.5
    y_pred = [1 if s >= 0.5 else 0 for s in y_scores]

    # Save csv
    df = pd.DataFrame({
        'filename': filenames,
        'y_true': y_true,
        'y_score': y_scores,
        'y_pred': y_pred
    })
    df.to_csv(out_csv, index=False)

    # plots
    plot_confusion_matrix(y_true, y_pred)
    plot_roc(y_true, y_scores)
    metrics = classification_report_metrics(y_true, y_pred)
    print("Evaluation metrics:", metrics)
    print(f"Predictions saved to: {out_csv}")

if __name__ == '__main__':
    evaluate()
