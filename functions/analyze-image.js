const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    const model = genAI.getModel({
      model: 'models/gemini-2.0-flash',
    });

    const generationConfig = {
      temperature: 1,
      maxOutputTokens: 2048,
      responseMimeType: 'text/plain',
    };

    const inputText = `What is the location of this image? The user suggests: '${userLocation}'.`;

    const result = await model.generateMessage({
      prompt: {
        text: inputText,
        images: [
          {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        ],
      },
      generationConfig,
    });

    const locationText = result?.candidates?.[0]?.content || 'Location not found.';
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
