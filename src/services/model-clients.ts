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
  const timeoutMs = options.timeout_ms || 75000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  console.log(`🔄 OpenRouter ${model} request (${timeoutMs}ms timeout)...`);

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
    
    console.log(`✅ OpenRouter ${model} response received (${response.status})`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter ${model} error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenRouter proxy error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content?.trim() || '';
    
    console.log(`🎯 OpenRouter ${model} completed successfully (${text.length} chars)`);
    return { raw: data, text };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ OpenRouter ${model} request failed:`, error);
    throw error;
  }
}