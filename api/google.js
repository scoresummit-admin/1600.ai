export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const googleApiKey = process.env.GOOGLE_API_KEY;
  
  if (!googleApiKey) {
    console.error('Google API key not configured');
    return res.status(500).json({ error: 'Google API key not configured' });
  }

  try {
    const { 
      prompt, 
      temperature = 0.1, 
      maxOutputTokens = 2000, 
      model = 'gemini-2.5-pro',
      mode = 'extract',
      imageBase64,
      ocrText,
      choices,
      claimedChoice,
      quotes
    } = req.body;

    console.log(`Google API called with mode: ${mode}`);
    console.log(`Image data present: ${!!imageBase64}`);
    console.log(`Image data length: ${imageBase64 ? imageBase64.length : 0}`);

    // Mode dispatch
    let finalPrompt;
    let contents;

    if (mode === 'extract') {
      // Current behavior - extract passage/question/choices from image
      if (imageBase64) {
        // Clean the base64 data
        let cleanBase64 = imageBase64;
        if (cleanBase64.startsWith('data:')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        
        console.log(`Cleaned base64 length: ${cleanBase64.length}`);
        
        // Validate base64 format
        if (!cleanBase64 || cleanBase64.length < 100) {
          console.error('Invalid or too short base64 data');
          return res.status(400).json({ error: 'Invalid image data provided' });
        }
        
        contents = [{
          parts: [
            { text: prompt || 'Extract the FULL passage, question, and answer choices from this SAT question image. Return JSON: {"passage": "full passage text", "question": "question stem", "choices": ["A) choice text", "B) choice text", "C) choice text", "D) choice text"]}' },
            { 
              inlineData: {
                mimeType: cleanBase64.startsWith('iVBORw0KGgo') ? 'image/png' : 'image/jpeg',
                data: cleanBase64
              }
            }
          ]
        }];
      } else {
        console.error('No image data provided for extract mode');
        return res.status(400).json({ error: 'imageBase64 is required for extract mode' });
      }
    } else if (mode === 'verify') {
      // Verification mode - score answer choices
      if (!imageBase64 || !ocrText || !choices || !claimedChoice) {
        console.error('Missing required parameters for verify mode');
        return res.status(400).json({ error: 'Verify mode requires imageBase64, ocrText, choices, and claimedChoice' });
      }

      // Check if quotes appear in ocrText (case-insensitive)
      let quoteValidation = '';
      if (quotes && quotes.length > 0) {
        const quoteChecks = quotes.map(quote => {
          const found = ocrText.toLowerCase().includes(quote.toLowerCase());
          return `Quote "${quote}": ${found ? 'FOUND' : 'NOT FOUND'} in passage`;
        }).join('\n');
        quoteValidation = `\n\nQuote validation:\n${quoteChecks}`;
      }

      finalPrompt = `You are an independent SAT EBRW verifier. Analyze this question from the image and score each choice.

OCR Text: ${ocrText}

Claimed answer: ${claimedChoice}
${quoteValidation}

Score each choice 0.0-1.0 based on correctness. Return compact JSON:
{"scores": {"A": 0.0, "B": 0.0, "C": 0.0, "D": 0.0}, "best_choice": "A", "reasoning": "Brief explanation"}`;

      contents = [{
        parts: [
          { text: finalPrompt },
          { 
            inlineData: {
              mimeType: imageBase64.startsWith('iVBORw0KGgo') ? 'image/png' : 'image/jpeg',
              data: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64
            }
          }
        ]
      }];
    } else if (mode === 'cross_solve') {
      // Cross-solve mode - independent choice selection
      if (!imageBase64) {
        console.error('Missing imageBase64 for cross_solve mode');
        return res.status(400).json({ error: 'Cross_solve mode requires imageBase64' });
      }

      finalPrompt = `You are an independent SAT solver. Solve this question from the image and pick the best answer.

${ocrText ? `Reference text: ${ocrText}` : ''}

Return compact JSON:
{"final_choice": "A", "confidence_0_1": 0.95, "reasoning": "Brief explanation"}`;

      contents = [{
        parts: [
          { text: finalPrompt },
          { 
            inlineData: {
              mimeType: imageBase64.startsWith('iVBORw0KGgo') ? 'image/png' : 'image/jpeg',
              data: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64
            }
          }
        ]
      }];
    } else {
      console.error(`Invalid mode: ${mode}`);
      return res.status(400).json({ error: 'Invalid mode. Use: extract, verify, or cross_solve' });
    }

    console.log(`Making request to Google API with model: ${model}`);
    console.log(`Contents parts length: ${contents[0].parts.length}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      }),
    });

    console.log(`Google API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error response:', response.status, response.statusText);
      console.error('Google API error details:', errorText);
      return res.status(response.status).json({ 
        error: `Google API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('Google API success, processing response...');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Invalid Google API response structure:', JSON.stringify(data, null, 2));
      return res.status(500).json({ 
        error: 'Invalid response from Google API',
        details: data
      });
    }
    
    // Handle MAX_TOKENS case - model hit output limit with no content
    const candidate = data.candidates[0];
    if (candidate.finishReason === 'MAX_TOKENS' && (!candidate.content.parts || candidate.content.parts.length === 0)) {
      console.warn('Google API hit MAX_TOKENS with no output - increasing token budget');
      return res.status(500).json({ 
        error: 'Model hit token limit with no output',
        details: {
          finishReason: candidate.finishReason,
          usageMetadata: data.usageMetadata,
          suggestion: 'Increase maxOutputTokens parameter'
        }
      });
    }

    let content = candidate.content.parts[0].text;
    console.log('Raw Google API content:', content.substring(0, 200) + '...');
    if (!candidate.content.parts || !candidate.content.parts[0]) {
    }
    // Strip any code block wrapping - return compact JSON always
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    console.log('Processed content:', content.substring(0, 200) + '...');
    
    return res.status(200).json({
      content: content.trim(),
      usage: data.usageMetadata,
      mode
    });

  } catch (error) {
    console.error('Google API handler error:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}