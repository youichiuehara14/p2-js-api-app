const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  console.log('Handler invoked');
  try {
    const { base64Image, userLocation } = JSON.parse(event.body);
    console.log('Parsed input:', { userLocation });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key is missing');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key is missing' }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Get the Gemini model
    const model = genAI.getGenerativeModel({
      model: 'models/gemini-2.0-beta',
    });

    const generationConfig = {
      temperature: 1,
      maxOutputTokens: 2048,
      responseMimeType: 'text/plain',
    };

    const inputText = `Where was this image taken? The user suggests: '${userLocation}'. Identify landmarks or streets. If unclear, explain why. If not real-world, say: 'Invalid image, use a real-world photo.' Keep responses under 25 words.`;

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage({
      content: {
        parts: [
          { text: inputText },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    });

    const locationText = result?.response || 'Location not found.';
    console.log('Extracted Location Text:', locationText);

    return {
      statusCode: 200,
      body: JSON.stringify({ location: locationText }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error analyzing the image.',
        details: error.message,
      }),
    };
  }
};
