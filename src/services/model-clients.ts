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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout_ms || 55000);

  try {
    const requestBody: any = {
      model,
      messages,
      temperature: options.temperature || 0.05,
      max_tokens: options.max_tokens || 3000,
    };

    // Add provider preferences if specified
    if (options.provider) {
      requestBody.provider = options.provider;
    }

    // Prepare headers with conditional Azure preference
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Azure preference for OpenAI models
    if (model.startsWith('openai/')) {
      headers['OpenRouter-Prefer-Providers'] = 'azure,openai';
    }

    const response = await fetch('/api/openrouter/route', {
      method: 'POST',
      headers,
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