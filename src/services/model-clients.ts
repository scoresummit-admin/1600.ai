interface ModelResponse {
  raw: any;
  text: string;
}

interface ModelOptions {
  temperature?: number;
  max_tokens?: number;
  timeout_ms?: number;
  provider?: any;
}

export async function openrouterClient(
  model: string,
  messages: Array<{ role: string; content: string | Array<any> }>,
  options: ModelOptions = {}
): Promise<ModelResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY not configured');
  }

  try {
      temperature: options.temperature || 0.1,
      max_tokens: options.max_tokens || 3000,
    };

    // Add provider preferences if specified
    if (options.provider) {
      requestBody.provider = options.provider;
    }

    const requestBody: any = {
      model,
      messages,
      temperature: options.temperature || 0.1,
      max_tokens: options.max_tokens || 3000,
    };

    // Add provider preferences if specified
    if (options.provider) {
      requestBody.provider = options.provider;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout_ms || 55000);

    const response = await fetch('/api/openrouter/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter proxy error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content?.trim() || '';
    
    return { raw: data, text };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}