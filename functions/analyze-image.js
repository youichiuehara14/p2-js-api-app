const fetch = require('node-fetch');

async function fetchApiData(apiUrl, requestData) {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.statusText, errorText);
      return { statusCode: response.status, error: response.statusText, details: errorText };
    }

    return { statusCode: 200, data: await response.json() };
  } catch (error) {
    console.error('API request error:', error);
    return { statusCode: 500, error: 'API request error', details: error.message };
  }
}

function buildRequestData(base64Image, userLocation) {
  return {
    contents: [
      {
        parts: [
          {
            text: `Analyze the image and determine the location using landmarks, buildings, or geography. The user suggests: '${userLocation}'. If the image is AI-generated, fictional, or a digital screen (e.g., screenshot of a website, text message), respond with 'Invalid image' and briefly explain why. If it's a real location, provide the most specific place first, such as the building name, street, or landmark, then mention the city and country. Display an accuracy percentage (e.g., 'Accuracy: 0% - 100%'). If the location is unclear, state 'Unable to determine location' and briefly explain why. Keep the explanation under 35 words with no minimum limit. don't use '*' character in the result`,
          },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        ],
      },
    ],
  };
}

function extractLocationText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Location not found.';
}

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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const requestData = buildRequestData(base64Image, userLocation);

    console.log('Request Data:', JSON.stringify(requestData, null, 2));

    const { statusCode, data, error, details } = await fetchApiData(apiUrl, requestData);

    if (statusCode !== 200) {
      return {
        statusCode,
        body: JSON.stringify({ error, details }),
      };
    }

    console.log('Full Response Data:', JSON.stringify(data, null, 2));

    const locationText = extractLocationText(data);
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
