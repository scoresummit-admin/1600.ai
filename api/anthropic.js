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
    const { messages, max_tokens = 1000, temperature = 0.1 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Anthropic API error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      content: data.content[0].text,
      usage: data.usage
    });

  } catch (error) {
    console.error('Anthropic API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}