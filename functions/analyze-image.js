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

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze the image and determine the location using landmarks, buildings, or geography first. The image should be assessed independently, without considering the user's suggestion unless the analysis is unclear. 
                - If the image appears to be AI-generated, fictional, or a digital screen (e.g., screenshot of a website or text message), respond with 'Invalid image' and explain why.
                - If the image depicts a real-world location, provide the most specific place possible (e.g., building name, street, landmark, or city) with an accuracy percentage (e.g., 'Accuracy: 0% - 100%') if the location is confidently identifiable.
                - If the image does not clearly indicate a location, only then consider the user's location suggestion and compare it with the analyzed result.
                - If the user's suggestion matches or helps identify the location, mention it. If the suggestion is wrong, explain why it was not accurate.
                - Always note when the result is uncertain or when further clarification is needed. Keep the explanation concise, under 35 words, and avoid using '*' in the result.`,
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
