function resizeAndConvertToBase64(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;

      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64.split(',')[1]); // Remove "data:image/jpeg;base64," part
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('app-upload-img');
  const preview = document.getElementById('preview');
  const loadingPreview = document.getElementById('app-preview-loading');
  const findLocationBtn = document.getElementById('app-find-location');
  const output = document.getElementById('output');
  const locationInput = document.getElementById('app-user-location');
  const imgContainer = document.getElementById('app-preview-wrapper');

  fileInput.addEventListener('change', handleImageUpload);
  findLocationBtn.addEventListener('click', analyzeImage);
  imgContainer.style.border = '1px solid black';

  document.getElementById('app-upload-img').addEventListener('change', function () {
    const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
    document.getElementById('file-name-display').textContent = fileName;

    resetState();
  });

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.hidden = false;
      loadingPreview.hidden = true;
      imgContainer.style.border = 'none';
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImage() {
    if (!fileInput.files.length) {
      return updateOutput('Please select an image.');
    }

    updateOutput('Analyzing image location...');
    loadingPreview.hidden = false;
    preview.hidden = true;
    imgContainer.style.border = 'none';

    const file = fileInput.files[0];

    try {
      const resizedBase64 = await resizeAndConvertToBase64(file);
      console.log('Resized Base64 Length:', resizedBase64.length);

      sendToAI(resizedBase64, locationInput.value);
    } catch (error) {
      console.error('Error processing image:', error);
      updateOutput('Error processing image.');
    }
  }

  function sendToAI(base64Image, userLocation) {
    fetch('/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, userLocation }),
    })
      .then((response) => response.json())
      .then((data) => {
        const resultText = data.location || 'Location not found.';
        updateOutput(`📍 Location: ${resultText}`);
        loadingPreview.hidden = true;
        preview.hidden = false;
        locationInput.hidden = true;
      })
      .catch(() => {
        updateOutput('Error analyzing the image. Try again.');
        loadingPreview.hidden = true;
        preview.hidden = false; // Ensure the preview image is shown on error
      });
  }

  function updateOutput(message) {
    output.textContent = message;
  }

  function resetState() {
    preview.hidden = true;
    loadingPreview.hidden = true;
    preview.src = '';
    output.textContent = 'Enter your image possible location';
    locationInput.value = '';
    imgContainer.style.border = '1px solid black';
    locationInput.hidden = false;
  }
});
