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

  function analyzeImage() {
    if (!fileInput.files.length) {
      return updateOutput('Please select an image.');
    }

    updateOutput('Analyzing image location');
    const file = fileInput.files[0];
    const reader = new FileReader();
    loadingPreview.hidden = false;
    preview.hidden = true;
    imgContainer.style.border = 'none';

    reader.onload = () => {
      const compress = new Compress();
      compress
        .compress([file], {
          size: 5,
          quality: 0.75,
          maxWidth: 1920,
          maxHeight: 1080,
          resize: true,
        })
        .then((compressedFiles) => {
          const compressedFile = compressedFiles[0];
          const base64Image = compressedFile.data.split(',')[1];
          sendToAI(base64Image, locationInput.value);
        });
    };

    reader.readAsDataURL(file);
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
        preview.hidden = false;
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
