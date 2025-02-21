module.exports.handler = async function (event, context) {
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

    const updatedRequestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze the image and determine the location using landmarks, buildings, or geography. The user suggests: '${userLocation}'. If the image is AI-generated, fictional, or a digital screen (e.g., screenshot of a website, text message), respond with 'Invalid image' and briefly explain why. If it's a real location, provide up to 5 possible locations, ranked from most accurate to least accurate. For each location, provide the name of the place (e.g., building, street, landmark), followed by the city and country. Include the accuracy percentage for each location (e.g., 'Accuracy: 0% - 100%'). If the location is unclear, state 'Unable to determine location' and briefly explain why. Keep each explanation under 35 words with no minimum limit. Don't use the '*' character in the result.`,
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
