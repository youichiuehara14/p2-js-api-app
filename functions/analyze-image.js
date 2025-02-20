const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  console.log('Handler invoked');
  try {
    console.log('Event:', event);
    console.log('Context:', context);

    const { base64Image, userLocation } = JSON.parse(event.body);
    console.log('Parsed input:', { base64Image, userLocation });

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key:', apiKey ? 'Exists' : 'Not Found');
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const requestData = {
      contents: [
        {
          parts: [
            { text: `What is the location of this image? The user suggests: ${userLocation}.` },
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
    };

    console.log('Request Data:', requestData);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error analyzing the image.' }),
    };
  }
};
