"""
utils.py
Helper functions for plotting and metrics.
"""
import os
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, roc_curve, auc, precision_recall_fscore_support

def save_plot(fig, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fig.savefig(path, bbox_inches='tight')
    plt.close(fig)

def plot_learning_curves(history, out_path='research_paper_figures/learning_curves.png'):
    fig, ax = plt.subplots(1,2, figsize=(12,4))
    ax[0].plot(history.history.get('loss', []), label='train_loss')
    ax[0].plot(history.history.get('val_loss', []), label='val_loss')
    ax[0].set_title('Loss')
    ax[0].legend()
    ax[1].plot(history.history.get('accuracy', []), label='train_acc')
    ax[1].plot(history.history.get('val_accuracy', []), label='val_acc')
    ax[1].set_title('Accuracy')
    ax[1].legend()
    save_plot(fig, out_path)

def plot_confusion_matrix(y_true, y_pred, labels=['NORMAL','PNEUMONIA'], out_path='research_paper_figures/confusion_matrix.png'):
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(5,4))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(xticks=[0,1], yticks=[0,1], xticklabels=labels, yticklabels=labels,
           ylabel='True label', xlabel='Predicted label', title='Confusion matrix')
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'), ha="center", va="center", color="white" if cm[i,j]>cm.max()/2. else "black")
    save_plot(fig, out_path)

def plot_roc(y_true, y_scores, out_path='research_paper_figures/roc_curve.png'):
    fpr, tpr, _ = roc_curve(y_true, y_scores)
    roc_auc = auc(fpr, tpr)
    fig, ax = plt.subplots(figsize=(6,5))
    ax.plot(fpr, tpr, label=f'ROC curve (area = {roc_auc:.3f})')
    ax.plot([0,1],[0,1],'k--')
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.set_title('Receiver Operating Characteristic')
    ax.legend(loc='lower right')
    save_plot(fig, out_path)

def classification_report_metrics(y_true, y_pred):
    prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, average='binary')
    return {'precision': float(prec), 'recall': float(rec), 'f1': float(f1)}
