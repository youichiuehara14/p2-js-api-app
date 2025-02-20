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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'API key is missing' }),
      };
    }

    const fetch = await import('node-fetch').then((mod) => mod.default);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `What is the location of this image? The user suggests: ${userLocation}.`,
            },
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.statusText, errorText);
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: response.statusText, details: errorText }),
      };
    }

    const data = await response.json();
    console.log('Full Response Data:', data);

    const locationText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Location not found.';
    console.log('Extracted Location Text:', locationText);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ location: locationText }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Error analyzing the image.',
        details: error.message,
        stack: error.stack,
      }),
    };
  }
};
