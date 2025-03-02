module.exports.handler = async function (event, context) {
  console.log('Handler invoked');

  try {
    const { base64Image, userLocation } = JSON.parse(event.body);
    console.log('Parsed input:', { base64Image, userLocation });

    const apiKey = process.env.GEMINI_API_KEY;
    // Logs API key status for Netlify function logs
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

    //#2 ==Do Not Push==
    // Problem: bug: image cannot be analyzed when there's no user input for the location
    //  Fix : -- fixed ...(userLocation ? [{ text: userLocation }] : []
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: `Analyze the image independently to determine the location using landmarks, buildings, or geography. 
                      Do not directly merge the user's suggested location ("${userLocation}") into the final location result.
                      - If the image is AI-generated, fictional, or a digital screen (e.g., a screenshot of a website or text message), respond with "Invalid image" and explain why.
                      - If the image depicts a real-world location, always provide the most specific place possible (e.g., building name, street, landmark, or city) and include an accuracy percentage (e.g., "Accuracy: 0% - 100%") if the location is confidently identifiable.
                      - Display the determined location first, followed by the explanation.
                      - Compare the determined location with the user's suggested location:
                      - If the suggestion matches the result, confirm it.
                      - If the suggestion is incorrect but helped guide the result, acknowledge it in a separate sentence, but do not include it within the final location details.
                      - If the location is unclear, **use the user's suggestion to refine the analysis and attempt to validate it against the image details before dismissing it.** 
                      - Always note uncertainty or the need for further clarification.
                      - Keep explanations concise (under 35 words) and avoid using "*".`,
            },
            ...(userLocation ? [{ text: userLocation }] : []),
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
    };

    // Problem/Bug: Console log is too long
    // Fix: -- Refactored and removed some console logs
    // Sending a POST request to the Gemini AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: response.statusText, details: errorText }),
      };
    }

    const data = await response.json();
    const locationText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Location not found.';

    return {
      statusCode: 200,
      body: JSON.stringify({ location: locationText }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error analyzing the image.', details: error.message }),
    };
  }
};
