document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('app-upload-img');
  const preview = document.getElementById('preview');
  const loadingPreview = document.getElementById('app-preview-loading');
  const findLocationBtn = document.getElementById('app-find-location');
  const resetBtn = document.getElementById('app-reset');
  const output = document.getElementById('output');
  const locationInput = document.getElementById('app-user-location');
  const imgContainer = document.getElementById('app-preview-wrapper');

  imgContainer.style.border = '1px solid black';
  fileInput.addEventListener('change', handleImageUpload);
  findLocationBtn.addEventListener('click', analyzeImage);
  resetBtn.addEventListener('click', resetState);

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
      preview.src = 'data:image/jpeg;base64,' + resizedBase64;
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
        console.log('AI Full Response:', JSON.stringify(data, null, 2));
        const resultText = data.location || 'Location not found.';
        updateOutput(`📍 Location: ${resultText}`);
        loadingPreview.hidden = true;
        preview.hidden = false;
        locationInput.hidden = true;
        toggleButtons();
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

  function toggleButtons() {
    findLocationBtn.hidden = true;
    fileInput.hidden = true;
    resetBtn.hidden = false;
  }

  function resetState() {
    preview.hidden = true;
    loadingPreview.hidden = true;
    preview.src = '';
    output.textContent = 'Enter your image possible location';
    locationInput.value = '';
    imgContainer.style.border = '1px solid black';
    locationInput.hidden = false;
    findLocationBtn.hidden = false;
    fileInput.hidden = false;
    resetBtn.hidden = true;
  }
});
