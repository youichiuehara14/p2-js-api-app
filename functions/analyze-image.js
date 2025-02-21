exports.handler = async function (event, context) {
  console.log('Handler invoked');

  try {
    const { base64Image, userLocation } = JSON.parse(event.body);
    console.log('Parsed input:', { base64Image, userLocation });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key is missing');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key is missing' }),
      };
    }

    console.log('API Key is present, proceeding with request.');

    const fetch = await import('node-fetch').then((mod) => mod.default);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze the image and determine the location using recognizable landmarks, buildings, or geography. The user suggests: '${userLocation}'. If the image is AI-generated, fictional, or not a real-world photo, state that and briefly explain why. If it's a real location, provide the likely location and key identifying features. If unclear, state 'Unable to determine location' with a brief reason.`,
            },
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
    };

    console.log('Request Data:', JSON.stringify(requestData, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error('API request failed:', response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: response.statusText, details: errorText }),
      };
    }

    const data = await response.json();
    console.log('Full Response Data:', JSON.stringify(data, null, 2));

    const locationText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Location not found.';
    console.log('Extracted Location Text:', locationText);

    return {
      statusCode: 200,
      body: JSON.stringify({ location: locationText }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error analyzing the image.', details: error.message }),
    };
  }
};
