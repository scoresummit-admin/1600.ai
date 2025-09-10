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

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!anthropicApiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' });
  }

  try {
    const { messages, max_tokens = 1000, temperature = 0.1, system, fullText, imageBase64 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Validation: reject if insufficient context
    if ((!fullText || fullText.length < 200) && !imageBase64) {
      return res.status(400).json({ error: 'Insufficient context: need either fullText (≥200 chars) or imageBase64' });
    }

    // MIME type validation and data cleaning for images
    let cleanedMessages = messages;
    if (imageBase64) {
      cleanedMessages = messages.map(msg => {
        if (msg.content && Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map(item => {
              if (item.type === 'image' && item.source) {
                let cleanBase64 = item.source.data;
                
                // Strip data: URI prefix if present
                if (cleanBase64.startsWith('data:')) {
                  cleanBase64 = cleanBase64.split(',')[1];
                }
                
                // Detect actual MIME type from magic bytes
                let actualMimeType;
                if (cleanBase64.startsWith('iVBORw0KGgo')) {
                  actualMimeType = 'image/png';
                } else if (cleanBase64.startsWith('/9j/')) {
                  actualMimeType = 'image/jpeg';
                } else {
                  actualMimeType = 'image/png'; // Default
                }
                
                // Validate declared vs actual MIME type
                if (item.source.media_type && item.source.media_type !== actualMimeType) {
                  console.warn(`MIME type mismatch: declared ${item.source.media_type}, actual ${actualMimeType}`);
                }
                
                return {
                  ...item,
                  source: {
                    ...item.source,
                    media_type: actualMimeType,
                    data: cleanBase64
                  }
                };
              }
              return item;
            })
          };
        }
        return msg;
      });
    }

    // Try Opus 4.1 first, fallback to Sonnet 4 if unavailable
    let modelToUse = 'claude-opus-4-1-20250805';
    let response;
    
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: cleanedMessages.filter(m => m.role !== 'system'),
          system: system || cleanedMessages.find(m => m.role === 'system')?.content,
          max_tokens,
          temperature,
        }),
      });
    } catch (error) {
      console.error('Opus API error, trying Sonnet fallback:', error);
      modelToUse = 'claude-3-5-sonnet-20241022';
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: cleanedMessages.filter(m => m.role !== 'system'),
          system: system || cleanedMessages.find(m => m.role === 'system')?.content,
          max_tokens,
          temperature,
        }),
      });
    }

    // If Opus returned 4xx due to availability, try Sonnet
    if (!response.ok && response.status >= 400 && response.status < 500 && modelToUse === 'claude-opus-4-1-20250805') {
      console.log('Opus unavailable (4xx), falling back to Sonnet 4...');
      modelToUse = 'claude-3-5-sonnet-20241022';
      response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens,
        temperature,
      }),
    });

          model: modelToUse,
          messages: cleanedMessages.filter(m => m.role !== 'system'),
          system: system || cleanedMessages.find(m => m.role === 'system')?.content,
      return res.status(response.status).json({ 
        error: `Anthropic API error: ${response.statusText}`,
        details: errorText
      });
    }
    }

    const data = await response.json();
    
    return res.status(200).json({
      content: data.content[0].text,
      usage: data.usage,
      model: modelToUse
    });

  } catch (error) {
    console.error('Anthropic API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}