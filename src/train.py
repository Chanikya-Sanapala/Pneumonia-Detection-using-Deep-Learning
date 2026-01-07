"""
src/train.py

Training script for Pneumonia detection (transfer learning with VGG16).
- Expects dataset at data/chest_xray/{train,val,test} with NORMAL/ PNEUMONIA subfolders.
- Saves best model to models/VGG16.h5 and training history to models/training_history.json.

Usage:
    python -m src.train
or (from project root)
    python src/train.py

Optional CLI args:
    --epochs           Initial training epochs (default: 12)
    --finetune_epochs  Additional fine-tuning epochs (default: 6)
    --batch_size       Batch size (default: 32)
    --model_path       Output model path (default: models/VGG16.h5)
    --fine_tune        If provided, performs a second stage of fine-tuning (unfreezes top layers)
"""
import os
import json
import argparse
import numpy as np
import tensorflow as tf

from tensorflow.keras.applications import VGG16
from tensorflow.keras.layers import GlobalAveragePooling2D, Dropout, Dense
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# local imports (ensure package-like import if running as module)
try:
    from src.dataset import get_generators, IMG_SIZE
    from src.utils import plot_learning_curves
except Exception:
    # if run as script from src/ directly, adjust import
    from dataset import get_generators, IMG_SIZE
    from utils import plot_learning_curves

# --- Configurable defaults ---
DEFAULT_MODEL_PATH = os.path.join('models', 'VGG16.h5')
DEFAULT_HISTORY = os.path.join('models', 'training_history.json')


def build_transfer_model(input_shape=(224, 224, 3), lr=1e-4):
    """Builds a transfer-learning model using VGG16 (imagenet weights, include_top=False)."""
    base = VGG16(weights='imagenet', include_top=False, input_shape=input_shape)
    # Freeze base
    for layer in base.layers:
        layer.trainable = False

    x = base.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.5)(x)
    x = Dense(128, activation='relu')(x)
    out = Dense(1, activation='sigmoid')(x)

    model = Model(inputs=base.input, outputs=out)
    model.compile(optimizer=Adam(learning_rate=lr), loss='binary_crossentropy', metrics=['accuracy'])
    return model


def compute_generator_class_weight(generator):
    """
    Compute class weights from a Keras DirectoryIterator (generator).
    Returns a dict {class_index: weight}
    """
    # generator.classes is an array of integer labels
    y = generator.classes
    classes = np.unique(y)
    weights = compute_class_weight(class_weight='balanced', classes=classes, y=y)
    class_weight = {int(c): float(w) for c, w in zip(classes, weights)}
    return class_weight


def fine_tune_model(model, base_layer_trainable_from=-4, lr=1e-5):
    """
    Unfreeze top layers of the base model (VGG16) for fine-tuning.
    base_layer_trainable_from: negative index counting from the end of base layers to unfreeze.
    """
    # find VGG16 base model within the model (first layer is VGG16 input)
    # We assume model.layers contains the base as the initial part.
    # Set last N layers trainable
    # Heuristic: unfreeze last N layers of the model (excluding classification head)
    for i, layer in enumerate(model.layers):
        # default keep everything frozen first; we'll selectively unfreeze below
        pass

    # Unfreeze last N layers (approx)
    total = len(model.layers)
    start = max(0, total + base_layer_trainable_from)  # base_layer_trainable_from negative
    for i in range(start, total):
        model.layers[i].trainable = True

    # Recompile with lower lr
    model.compile(optimizer=Adam(learning_rate=lr), loss='binary_crossentropy', metrics=['accuracy'])
    return model


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--epochs', type=int, default=12, help='Initial training epochs')
    p.add_argument('--finetune_epochs', type=int, default=6, help='Fine-tuning epochs (if --fine_tune used)')
    p.add_argument('--batch_size', type=int, default=32)
    p.add_argument('--model_path', type=str, default=DEFAULT_MODEL_PATH)
    p.add_argument('--history_path', type=str, default=DEFAULT_HISTORY)
    p.add_argument('--fine_tune', action='store_true', help='Unfreeze top layers and fine-tune')
    return p.parse_args()


def main():
    args = parse_args()

    os.makedirs(os.path.dirname(args.model_path) or '.', exist_ok=True)

    print("Preparing data generators...")
    train_gen, val_gen, test_gen = get_generators(batch_size=args.batch_size)
    print(f"Found {train_gen.samples} training samples, {val_gen.samples} val samples.")

    input_shape = (IMG_SIZE[0], IMG_SIZE[1], 3)
    model = build_transfer_model(input_shape=input_shape, lr=1e-4)
    model.summary()

    # compute class weights
    class_weight = compute_generator_class_weight(train_gen)
    print("Class weights:", class_weight)

    # Callbacks
    checkpoint = ModelCheckpoint(args.model_path, monitor='val_loss', save_best_only=True, verbose=1)
    early = EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True, verbose=1)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7, verbose=1)

    # steps
    steps_per_epoch = int(np.ceil(train_gen.samples / train_gen.batch_size))
    validation_steps = int(np.ceil(val_gen.samples / val_gen.batch_size))

    print(f"Starting training for {args.epochs} epochs...")
    history = model.fit(
        train_gen,
        epochs=args.epochs,
        validation_data=val_gen,
        class_weight=class_weight,
        callbacks=[checkpoint, early, reduce_lr],
        steps_per_epoch=steps_per_epoch,
        validation_steps=validation_steps,
        verbose=1
    )

    # Save history
    try:
        with open(args.history_path, 'w') as f:
            json.dump(history.history, f)
        print(f"Saved training history to {args.history_path}")
    except Exception as e:
        print("Warning: could not save history:", e)

    # Optional fine-tune
    if args.fine_tune:
        print("Starting fine-tuning stage: unfreezing top layers...")
        # Load best weights saved
        if os.path.exists(args.model_path):
            print("Loading best model weights from checkpoint for fine-tune step.")
            model = tf.keras.models.load_model(args.model_path)
        # Unfreeze last few layers (heuristic)
        model = fine_tune_model(model, base_layer_trainable_from=-12, lr=1e-5)
        # New callbacks for fine-tune
        checkpoint_ft = ModelCheckpoint(args.model_path, monitor='val_loss', save_best_only=True, verbose=1)
        early_ft = EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True, verbose=1)
        reduce_lr_ft = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7, verbose=1)

        print(f"Fine-tuning for {args.finetune_epochs} epochs...")
        history_ft = model.fit(
            train_gen,
            epochs=args.finetune_epochs,
            validation_data=val_gen,
            class_weight=class_weight,
            callbacks=[checkpoint_ft, early_ft, reduce_lr_ft],
            steps_per_epoch=steps_per_epoch,
            validation_steps=validation_steps,
            verbose=1
        )

        # merge histories
        for k, v in history_ft.history.items():
            history.history.setdefault(k, []).extend(v)

        # save merged history
        try:
            with open(args.history_path, 'w') as f:
                json.dump(history.history, f)
            print(f"Updated training history saved to {args.history_path}")
        except Exception as e:
            print("Warning: could not save updated history:", e)

    # create plots if utils available
    try:
        plot_learning_curves(history, out_path='research_paper_figures/learning_curves.png')
        print("Saved learning curves to research_paper_figures/learning_curves.png")
    except Exception as e:
        print("Could not create learning curves:", e)

    print("Training finished. Best model saved to:", args.model_path)
    print("You can now run `python main.py` to evaluate on the test set (after ensuring models/VGG16.h5 exists).")


if __name__ == '__main__':
    main()
