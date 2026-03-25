/**
 * main.js
 * - Handles uploader drag/drop, preview, and upload POST to server
 * - Adds scroll reveal for elements with .reveal
 * - Provides small UX helpers (progress bar, messages)
 */

document.addEventListener('DOMContentLoaded', function(){
  const drop = document.getElementById('drop');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('preview');
  const previewImg = document.getElementById('previewImg');
  const fileName = document.getElementById('fileName');
  const message = document.getElementById('message');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar = document.getElementById('progressBar');
  const predictBtn = document.getElementById('predictBtn');
  const uploadForm = document.getElementById('uploadForm');

  // click zone opens file picker
  if (drop && fileInput) {
    drop.addEventListener('click', () => fileInput.click());
  }

  // drag/drop visual handlers
  ['dragenter','dragover'].forEach(evt => {
    if (!drop) return;
    drop.addEventListener(evt, e => { e.preventDefault(); drop.classList.add('hover'); });
  });
  ['dragleave','drop'].forEach(evt => {
    if (!drop) return;
    drop.addEventListener(evt, e => { e.preventDefault(); drop.classList.remove('hover'); });
  });

  if (drop) {
    drop.addEventListener('drop', e => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFile(fileInput.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
    });
  }

  function handleFile(file){
    if (!file) return;
    fileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = ev => {
      previewImg.src = ev.target.result;
      preview.hidden = false;
    };
    reader.readAsDataURL(file);
  }

  if (uploadForm) {
    console.log("[main] Upload form found, attaching submit listener");
    uploadForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      console.log("[main] Form submitted");
      
      const formData = new FormData(uploadForm);
      const file = formData.get('file');
      
      if (!file || file.size === 0){
        console.warn("[main] No file selected");
        showMessage('Please choose an image first', 'error');
        return;
      }
      
      console.log("[main] Starting fetch for file:", file.name);
      progressWrap.hidden = false;
      progressBar.style.width = '0%';
      predictBtn.disabled = true;
      predictBtn.innerText = "Analyzing...";

      fetch(uploadForm.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      }).then(resp => {
        console.log("[main] Server response status:", resp.status);
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          return resp.json();
        }
        return resp.text().then(txt => {
          console.error("[main] Server returned non-JSON:", txt.substring(0, 100));
          return { success: false, error: "Server error (non-JSON). See logs for details." };
        });
      })
      .then(data => {
        console.log("[main] Data received:", data);
        progressBar.style.width = '100%';
        predictBtn.disabled = false;
        predictBtn.innerText = "Predict";
        
        if (data && data.success) {
          displayResults(data);
        } else {
          showMessage(data && data.error ? data.error : 'Prediction failed', 'error');
        }
      }).catch(err => {
        console.error("[main] Fetch error:", err);
        showMessage('Connection error: ' + err.message, 'error');
        predictBtn.disabled = false;
        predictBtn.innerText = "Predict";
      });
    });
  }

  function displayResults(data) {
    // Create or update result display
    let resultContainer = document.getElementById('resultContainer');
    
    if (!resultContainer) {
      // Create result container if it doesn't exist
      resultContainer = document.createElement('div');
      resultContainer.id = 'resultContainer';
      resultContainer.className = 'result-container';
      
      // Insert after the upload form
      const uploadSection = document.querySelector('.upload-card');
      if (uploadSection) {
        uploadSection.parentNode.insertBefore(resultContainer, uploadSection.nextSibling);
      }
    }
    
    // Update result content
    const confidence = (data.result.confidence * 100).toFixed(2);
    const labelClass = data.result.label.toLowerCase() === 'pneumonia' ? 'pneumonia' : 'normal';
    
    resultContainer.innerHTML = `
      <div class="result-card">
        <h3>Prediction Result</h3>
        <div class="result-left">
          <img src="${data.redirect}" alt="uploaded" class="result-image" />
        </div>
        <div class="result-right">
          <p><strong>Label:</strong> <span class="label ${labelClass}">${data.result.label}</span></p>
          <p><strong>Confidence:</strong> <span class="confidence">${confidence}%</span></p>
          <p><strong>Raw score:</strong> ${data.result.score.toFixed(4)}</p>
          <p><strong>Model:</strong> VGG16 transfer learning</p>
          <div class="result-actions">
            <button class="btn" onclick="resetUpload()">Predict another</button>
            <a class="btn outline" href="/download-pdf/${data.filename}" download>Download Report</a>
          </div>
        </div>
      </div>

      <div class="disclaimer-banner">
        <div class="disclaimer-icon">⚠️</div>
        <p><strong>Important:</strong> This analysis is for educational purposes only and should not replace professional medical advice.</p>
      </div>

      <div class="what-next-section">
        <h3 class="what-next-title">What Next?</h3>
        <ul class="what-next-list">
          <li>
            <span class="what-next-icon">👨‍⚕️</span>
            <span>Consult with a healthcare professional immediately</span>
          </li>
          <li>
            <span class="what-next-icon">🏥</span>
            <span>Follow medical advice for treatment options</span>
          </li>
          <li>
            <span class="what-next-icon">⚙️</span>
            <span>Review our <a href="https://www.who.int/health-topics/pneumonia" target="_blank" rel="noopener">prevention tips</a></span>
          </li>
          <li>
            <span class="what-next-icon">💙</span>
            <span>Check <a href="https://www.cdc.gov/pneumonia/" target="_blank" rel="noopener">health measures</a> for pneumonia</span>
          </li>
        </ul>
      </div>
    `;
    
    // Hide progress and show results
    progressWrap.hidden = true;
    resultContainer.scrollIntoView({ behavior: 'smooth' });
  }
  
  function resetUpload() {
    // Reset the upload form
    if (fileInput) fileInput.value = '';
    if (preview) preview.hidden = true;
    if (fileName) fileName.textContent = '';
    if (message) message.hidden = true;
    if (progressWrap) progressWrap.hidden = true;
    if (resultContainer) resultContainer.remove();
    predictBtn.disabled = false;
  }

  function showMessage(text, type='info'){
    if (!message) return;
    message.textContent = text;
    message.hidden = false;
    // optionally style based on type
    if (type === 'error') {
      message.style.color = '#b91c1c';
      message.style.fontWeight = '600';
    } else {
      message.style.color = '';
      message.style.fontWeight = '';
    }
  }

  // --- Reveal on scroll for .reveal elements ---
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
