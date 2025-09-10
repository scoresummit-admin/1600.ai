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

    // Mode dispatch
    let finalPrompt;
    let contents;

    if (mode === 'extract') {
      // Current behavior - extract passage/question/choices from image
      if (imageBase64) {
        contents = [{
          parts: [
            { text: prompt || 'Extract the FULL passage, question, and answer choices from this SAT question image. Return JSON: {"passage": "full passage text", "question": "question stem", "choices": ["A) choice text", "B) choice text", "C) choice text", "D) choice text"]}' },
            { 
              inlineData: {
                mimeType: imageBase64.startsWith('iVBORw0KGgo') ? 'image/png' : 'image/jpeg',
                data: imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64
              }
            }
          ]
        }];
      } else {
        contents = [{ parts: [{ text: prompt }] }];
      }
    } else if (mode === 'verify') {
      // Verification mode - score answer choices
      if (!imageBase64 || !ocrText || !choices || !claimedChoice) {
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
      return res.status(400).json({ error: 'Invalid mode. Use: extract, verify, or cross_solve' });
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Google API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ 
        error: 'Invalid response from Google API',
        details: data
      });
    }
    
    let content = data.candidates[0].content.parts[0].text;
    
    // Strip any code block wrapping - return compact JSON always
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    return res.status(200).json({
      content: content.trim(),
      usage: data.usageMetadata,
      mode
    });

  } catch (error) {
    console.error('Google API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}