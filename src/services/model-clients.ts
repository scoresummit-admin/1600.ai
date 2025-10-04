interface ModelResponse {
  raw: any;
  text: string;
}

interface ModelOptions {
  temperature?: number;
  max_tokens?: number;
  timeout_ms?: number;
  provider?: any;
  reasoning?: {
    effort: 'minimal' | 'low' | 'medium' | 'high';
  };
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

export async function openaiResponsesClient(
  model: string,
  messages: Array<{ role: string; content: string | Array<any> }>,
  options: ModelOptions = {}
): Promise<ModelResponse> {
  const controller = new AbortController();
  const timeoutMs = options.timeout_ms || 75000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  console.log(`🔄 OpenAI ${model} request via Responses API (${timeoutMs}ms timeout)...`);

  try {
    const requestBody: Record<string, any> = {
      model,
      input: messages.map(message => ({
        role: message.role,
        content: message.content
      }))
    };

    if (typeof options.temperature === 'number') {
      requestBody.temperature = options.temperature;
    }

    if (typeof options.max_tokens === 'number') {
      requestBody.max_output_tokens = options.max_tokens;
    }

    if (options.reasoning) {
      requestBody.reasoning = options.reasoning;
    }

    const response = await fetch('/api/openai/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`✅ OpenAI ${model} response received (${response.status})`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI ${model} error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`OpenAI proxy error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const textFromOutput = Array.isArray(data.output_text)
      ? data.output_text.join('\n')
      : data.output_text;

    const fallbackText = Array.isArray(data.output)
      ? data.output
          .map((segment: any) =>
            Array.isArray(segment.content)
              ? segment.content
                  .map((part: any) => part?.text || part?.content || '')
                  .join('')
              : ''
          )
          .join('\n')
      : '';

    const text = (textFromOutput || fallbackText || '').trim();

    console.log(`🎯 OpenAI ${model} completed successfully (${text.length} chars)`);

    return { raw: data, text };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ OpenAI ${model} request failed:`, error);
    throw error;
  }
}

