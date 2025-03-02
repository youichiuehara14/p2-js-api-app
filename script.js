// Function to handle image resizing and converting to Base64
function resizeAndConvertToBase64(file, maxWidth = 2000, maxHeight = 2000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;

      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const format = file.type.includes('png') ? 'image/png' : 'image/jpeg';
        const quality = format === 'image/png' ? 1.0 : 0.95;

        const compressedBase64 = canvas.toDataURL(format, quality);
        resolve(compressedBase64.split(',')[1]);
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
}

// Function to handle file input change event
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('preview');
    const loadingPreview = document.getElementById('app-preview-loading');
    const imgContainer = document.getElementById('app-preview-wrapper');
    const fileNameDisplay = document.getElementById('file-name-display');

    preview.src = e.target.result;
    preview.hidden = false;
    loadingPreview.hidden = true;
    imgContainer.style.border = 'none';
    fileNameDisplay.textContent = file.name;
    // for debugging
    // console.log('Image uploaded and preview set.');
  };
  reader.readAsDataURL(file);
}

// Function to analyze the image
async function analyzeImage() {
  const fileInput = document.getElementById('app-upload-img');
  const locationInput = document.getElementById('app-user-location');
  const preview = document.getElementById('preview');
  const loadingPreview = document.getElementById('app-preview-loading');
  const imgContainer = document.getElementById('app-preview-wrapper');

  if (!fileInput.files.length) {
    updateOutput('Please select an image.');
    // for debugging
    // console.log('No image selected.');
    return;
  }

  updateOutput('Analyzing image location...');
  loadingPreview.hidden = false;
  preview.hidden = true;
  imgContainer.style.border = 'none';
  // for debugging
  // console.log('Starting image analysis...');

  const file = fileInput.files[0];

  try {
    const resizedBase64 = await resizeAndConvertToBase64(file);
    preview.src = 'data:image/jpeg;base64,' + resizedBase64;
    // for debugging
    // console.log('Image resized and converted to Base64.');
    sendToAI(resizedBase64, locationInput.value);
  } catch (error) {
    console.error('Error processing image:', error);
    updateOutput('Error processing image.');
  }
}

// Function to send the image data to the AI API
function sendToAI(base64Image, userLocation) {
  fetch('/.netlify/functions/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, userLocation }),
  })
    .then((response) => response.json())
    .then((data) => {
      // for debugging
      // console.log('AI Full Response:', JSON.stringify(data, null, 2));
      const resultText = data.location || 'Location not found.';
      updateOutput(`📍 Location: ${resultText}`);
      const loadingPreview = document.getElementById('app-preview-loading');
      const preview = document.getElementById('preview');
      const locationInput = document.getElementById('app-user-location');
      loadingPreview.hidden = true;
      preview.hidden = false;
      locationInput.hidden = true;
      toggleButtons();
    })
    .catch((error) => {
      console.error('Error analyzing the image:', error);
      updateOutput('Error analyzing the image. Try again.');
      const loadingPreview = document.getElementById('app-preview-loading');
      const preview = document.getElementById('preview');
      loadingPreview.hidden = true;
      preview.hidden = false;
    });
}

function updateOutput(message) {
  const output = document.getElementById('output');
  output.textContent = message;
}

function toggleButtons() {
  const findLocationBtn = document.getElementById('app-find-location');
  const fileInputLabel = document.getElementById('app-upload-btn');
  const resetBtn = document.getElementById('app-reset');

  findLocationBtn.hidden = true;
  fileInputLabel.style.display = 'none';
  resetBtn.hidden = false;
}

function resetState() {
  const preview = document.getElementById('preview');
  const loadingPreview = document.getElementById('app-preview-loading');
  const locationInput = document.getElementById('app-user-location');
  const imgContainer = document.getElementById('app-preview-wrapper');
  const findLocationBtn = document.getElementById('app-find-location');
  const fileInputLabel = document.getElementById('app-upload-btn');
  const resetBtn = document.getElementById('app-reset');
  const fileInput = document.getElementById('app-upload-img');
  const fileNameDisplay = document.getElementById('file-name-display');
  const output = document.getElementById('output');

  preview.hidden = true;
  loadingPreview.hidden = true;
  preview.src = '';
  output.textContent = 'Enter your image possible location';
  locationInput.value = '';
  imgContainer.style.border = '1px solid black';
  locationInput.hidden = false;
  findLocationBtn.hidden = false;
  fileInputLabel.style.display = 'flex';
  resetBtn.hidden = true;
  fileInput.value = '';
  fileNameDisplay.textContent = '';
  // for debugging
  // console.log('State has been reset.');
}

// Function to prevent default context menu
function preventDefaultContextMenu(event) {
  event.preventDefault();
}

// Function to initialize the app on DOMContentLoaded
function initializeApp() {
  const fileInput = document.getElementById('app-upload-img');
  const findLocationBtn = document.getElementById('app-find-location');
  const resetBtn = document.getElementById('app-reset');
  const imgContainer = document.getElementById('app-preview-wrapper');

  imgContainer.style.border = '1px solid black';
  fileInput.addEventListener('change', handleImageUpload);
  findLocationBtn.addEventListener('click', analyzeImage);
  resetBtn.addEventListener('click', resetState);

  document.querySelectorAll('#preview, #app-preview-loading').forEach((img) => {
    img.addEventListener('contextmenu', preventDefaultContextMenu);
  });

  console.log('App initialized');
}

// Call initializeApp function when DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeApp);
