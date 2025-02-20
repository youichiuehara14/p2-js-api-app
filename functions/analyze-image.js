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

    const fetch = await import('node-fetch').then((mod) => mod.default);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Where was this image taken? The user suggests: '${userLocation}'. If it's a real-world photo, identify any known landmarks or streets briefly. If it's a real photo but lacks enough details to determine the location, say: 'This is a real photo, but the location is unclear.' If it's not a real-world photo (e.g., a screenshot, drawing, AI-generated image, or contains only text), say: 'Invalid image. Please use a real-world photo.`,
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
      console.error('API request failed:', response.statusText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: response.statusText }),
      };
    }

    const data = await response.json();
    console.log('Full Response Data:', data);

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
      body: JSON.stringify({ error: 'Error analyzing the image.' }),
    };
  }
};
