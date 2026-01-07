import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, make_response
from werkzeug.utils import secure_filename
from predict import predict_from_path, load_model_once
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import io

# Config
UPLOAD_FOLDER = "uploads"             # relative to webapp/
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# Create app
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "replace_this_with_a_random_secret_in_production"

# Ensure upload folder exists
os.makedirs(os.path.join(os.path.dirname(__file__), app.config["UPLOAD_FOLDER"]), exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/", methods=["GET", "POST"])
def index():
    """
    GET: show upload form
    POST: receive uploaded image, save it, run model, show result (redirect to result view)
    """
    if request.method == "POST":
        if "file" not in request.files:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return {"success": False, "error": "No file part in the request"}
            flash("No file part in the request")
            return redirect(request.url)
        file = request.files["file"]
        if file.filename == "":
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return {"success": False, "error": "No file selected"}
            flash("No file selected")
            return redirect(request.url)
        if file and allowed_file(file.filename):
            fname = secure_filename(file.filename)
            save_path = os.path.join(app.config["UPLOAD_FOLDER"], fname)
            # Save inside webapp/uploads/
            full_save_path = os.path.join(os.path.dirname(__file__), save_path)
            file.save(full_save_path)

            # ensure model loaded (optional)
            try:
                load_model_once()   # loads model if not already loaded; will raise if missing
            except FileNotFoundError as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return {"success": False, "error": str(e)}
                flash(str(e))
                return redirect(request.url)

            # predict
            try:
                result = predict_from_path(full_save_path)
            except Exception as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return {"success": False, "error": "Prediction error: " + str(e)}
                flash("Prediction error: " + str(e))
                return redirect(request.url)

            # Check if AJAX request
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return {
                    "success": True,
                    "redirect": url_for('uploaded_file', filename=fname),
                    "filename": fname,
                    "result": {
                        "label": result["label"],
                        "confidence": result["confidence"],
                        "score": result["score"]
                    }
                }
            
            # show result page for normal form submission
            return render_template("result.html", filename=fname, result=result)
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return {"success": False, "error": "Unsupported file type. Allowed: png, jpg, jpeg"}
            flash("Unsupported file type. Allowed: png, jpg, jpeg")
            return redirect(request.url)

    # GET
    return render_template("index.html")

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    """Serve the uploaded files (images) for display in result view."""
    uploads_dir = os.path.join(os.path.dirname(__file__), app.config["UPLOAD_FOLDER"])
    return send_from_directory(uploads_dir, filename)

@app.route("/download-pdf/<filename>")
def download_pdf(filename):
    """Generate and download PDF report with prediction results."""
    try:
        # Get file path
        uploads_dir = os.path.join(os.path.dirname(__file__), app.config["UPLOAD_FOLDER"])
        image_path = os.path.join(uploads_dir, filename)
        
        # Get prediction results
        result = predict_from_path(image_path)
        
        # Create PDF in memory
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Set up colors
        primary_color = HexColor('#1a1a2e')
        accent_color = HexColor('#ff006e')
        text_color = HexColor('#333333')
        
        # Header
        p.setFillColor(primary_color)
        p.rect(0, height - 100, width, 100, fill=True, stroke=False)
        
        p.setFillColor(HexColor('#ffffff'))
        p.setFont("Helvetica-Bold", 24)
        p.drawString(50, height - 60, "Pneumonia Detection Report")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 85, "AI-Powered Medical Analysis")
        
        # Date and time
        p.setFillColor(text_color)
        p.setFont("Helvetica", 10)
        from datetime import datetime
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        p.drawString(width - 200, height - 30, f"Generated: {current_time}")
        
        # Patient Information Section
        p.setFillColor(text_color)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 140, "Analysis Details")
        
        p.line(50, height - 145, width - 50, height - 145)
        
        # Prediction Results
        y_position = height - 180
        
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y_position, "Prediction Result:")
        
        # Set color based on result
        if result["label"] == "PNEUMONIA":
            p.setFillColor(HexColor('#dc2626'))
        else:
            p.setFillColor(HexColor('#16a34a'))
        
        p.setFont("Helvetica-Bold", 18)
        p.drawString(200, y_position, result["label"])
        
        # Confidence Score
        p.setFillColor(text_color)
        p.setFont("Helvetica", 12)
        y_position -= 30
        p.drawString(50, y_position, f"Confidence: {(result['confidence'] * 100):.2f}%")
        
        y_position -= 25
        p.drawString(50, y_position, f"Raw Score: {result['score']:.4f}")
        
        y_position -= 25
        p.drawString(50, y_position, "Model: VGG16 Transfer Learning")
        
        y_position -= 25
        p.drawString(50, y_position, f"Image File: {filename}")
        
        # Add the X-ray image with better error handling
        y_position -= 60
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y_position, "Chest X-Ray Image:")
        
        y_position -= 30
        
        try:
            # Calculate image dimensions to fit on page
            img_max_width = 300
            img_max_height = 250
            
            # Open and resize image
            img_reader = ImageReader(image_path)
            img_width, img_height = img_reader.getSize()
            
            # Calculate scaling
            scale_w = img_max_width / img_width
            scale_h = img_max_height / img_height
            scale = min(scale_w, scale_h)
            
            new_width = img_width * scale
            new_height = img_height * scale
            
            # Center the image
            img_x = (width - new_width) / 2
            
            # Draw border around image
            p.setStrokeColor(HexColor('#e5e7eb'))
            p.setLineWidth(2)
            p.rect(img_x - 5, y_position - new_height - 5, new_width + 10, new_height + 10)
            
            # Draw image with safer parameters
            p.drawImage(img_reader, img_x, y_position - new_height, width=new_width, height=new_height)
            
        except Exception as e:
            print(f"Error adding image to PDF: {e}")
            # If image fails, add a placeholder text
            p.setFillColor(text_color)
            p.setFont("Helvetica", 10)
            p.drawString(50, y_position - 50, f"[Image could not be embedded: {str(e)}]")
            p.drawString(50, y_position - 70, f"Image file: {filename}")
        
        # Footer
        p.setFillColor(primary_color)
        p.rect(0, 0, width, 40, fill=True, stroke=False)
        
        p.setFillColor(HexColor('#ffffff'))
        p.setFont("Helvetica", 10)
        p.drawString(50, 20, "© 2025 Pneumonia Detection AI - Medical Grade Analysis")
        p.drawString(width - 250, 20, "Dataset: Kaggle Chest X-Ray")
        
        # Disclaimer
        p.setFillColor(text_color)
        p.setFont("Helvetica-Oblique", 9)
        disclaimer_text = "This AI-generated report is for informational purposes only and should not replace professional medical diagnosis."
        p.drawString(50, 60, disclaimer_text)
        
        # Finalize PDF
        p.save()
        
        # Prepare response
        buffer.seek(0)
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=pneumonia_report_{filename.split(".")[0]}.pdf'
        
        return response
        
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        # Return error if PDF generation fails
        return f"Error generating PDF: {str(e)}", 500

@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    # Run app from webapp folder: python app.py
    app.run(debug=True, host="127.0.0.1", port=5000)
