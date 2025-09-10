import { ModelConfig, ModelName } from '../../types/sat';

export class LLMClient {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    
    // Use environment variables as fallback
    if (!this.config.openai_api_key && (import.meta.env.VITE_OPENAI_API_KEY || '')) {
      this.config.openai_api_key = import.meta.env.VITE_OPENAI_API_KEY || '';
    }
    if (!this.config.anthropic_api_key && (import.meta.env.VITE_ANTHROPIC_API_KEY || '')) {
      this.config.anthropic_api_key = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
    }
    if (!this.config.google_api_key && (import.meta.env.VITE_GOOGLE_API_KEY || '')) {
      this.config.google_api_key = import.meta.env.VITE_GOOGLE_API_KEY || '';
    }
  }

  async callModel(
    model: ModelName,
    messages: Array<{ role: string; content: string | Array<any> }>,
    options: {
      temperature?: number;
      max_tokens?: number;
      reasoning_effort?: string;
      tools?: any[];
      timeout_ms?: number;
    } = {}
  ): Promise<{ content: string; usage?: any }> {
    const startTime = Date.now();
    const timeout = options.timeout_ms || 30000;

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const requestPromise = this.makeRequest(model, messages, options);
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      const latency = Date.now() - startTime;
      console.log(`${model} responded in ${latency}ms`);
      
      return result as { content: string; usage?: any };
    } catch (error) {
      console.error(`Error calling ${model}:`, error);
      throw error;
    }
  }

  private async makeRequest(
    model: ModelName,
    messages: Array<{ role: string; content: string | Array<any> }>,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    switch (model) {
      case 'gpt-5':
      case 'gpt-5-thinking':
      case 'o4-mini':
        return this.callOpenAI(model, messages, options);
      
      case 'claude-opus-4-1-20250805':
      case 'claude-sonnet-4-20250514':
        return this.callAnthropic(messages, options);
      
      case 'gemini-2.5-pro':
        const systemMessage = this.extractTextContent(messages.find(m => m.role === 'system')?.content) || '';
        const userMessage = this.extractTextContent(messages.find(m => m.role === 'user')?.content) || '';
        const fullPrompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
        return this.callGemini(fullPrompt, options);
      
      case 'qwen2.5-math-72b':
        const sysMsg = this.extractTextContent(messages.find(m => m.role === 'system')?.content) || '';
        const usrMsg = this.extractTextContent(messages.find(m => m.role === 'user')?.content) || '';
        const qwenPrompt = sysMsg ? `${sysMsg}\n\n${usrMsg}` : usrMsg;
        return this.callQwen(qwenPrompt, options);
      
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  private async callOpenAI(
    model: ModelName,
    messages: Array<{ role: string; content: string | Array<any> }>,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    if (!this.config.openai_api_key) {
      throw new Error('OpenAI API key not configured');
    }

    const modelMap = {
      'gpt-5': 'gpt-5',
      'gpt-5-thinking': 'gpt-5-thinking',
      'o4-mini': 'o1-mini',
    } as const;

    const actualModel = modelMap[model as keyof typeof modelMap] || model;

    // Robust family detection
    const isOFamily   = /^(o1|o3|o4)(-|$)/i.test(actualModel);     // o1, o1-mini, o4-mini, etc.
    const isGPT5Family = /^gpt-5(\b|[-_])/i.test(actualModel);     // gpt-5, gpt-5-thinking, gpt-5-*

    // Flatten system+user for o*/gpt-5 (their chat behavior differs)
    let processedMessages = messages;
    if (isOFamily || isGPT5Family) {
      const sys = messages.find(m => m.role === 'system');
      const usr = messages.find(m => m.role === 'user');
      processedMessages = (sys && usr)
        ? [{ role: 'user', content: `${this.extractTextContent(sys.content)}\n\n${this.extractTextContent(usr.content)}` }]
        : messages.filter(m => m.role !== 'system');
    }

    // Decide max tokens once; accept either input name for convenience
    const desiredMax = options.max_completion_tokens
                    ?? options.max_tokens
                    ?? this.config.max_tokens
                    ?? 2000;

    // --- Build payload by whitelist (no deletes, no spreading) ---
    let requestBody: any;

    if (isOFamily || isGPT5Family) {
      requestBody = {
        model: actualModel,
        messages: processedMessages,
        temperature: 1, // per OpenAI guidance for o*; keeps it deterministic-ish
        max_completion_tokens: desiredMax,
      };
      if (options.reasoning_effort) {
        requestBody.reasoning_effort = options.reasoning_effort;
      }
      // Explicit guard: never allow 'max_tokens' to exist for these models
      if ('max_tokens' in requestBody) {
        throw new Error('Internal guard: max_tokens set for reasoning model');
      }
    } else {
      requestBody = {
        model: actualModel,
        messages: processedMessages,
        temperature: options.temperature ?? this.config.temperature,
        max_tokens: desiredMax,
      };
      if (options.tools) requestBody.tools = options.tools;
      // Explicit guard: never allow max_completion_tokens on non-reasoning models
      if ('max_completion_tokens' in requestBody) {
        throw new Error('Internal guard: max_completion_tokens set for non-reasoning model');
      }
    }

    // Optional: one-time payload sanity log
    if (import.meta.env?.DEV) {
      console.log('openai payload →', JSON.stringify(requestBody));
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Surface OpenAI's error JSON so you can see EXACTLY what they didn't like
      const err = await response.json().catch(() => null);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${err ? JSON.stringify(err) : 'no body'}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content ?? '',
      usage: data.usage,
    };
  }

  private async callAnthropic(
    messages: Array<{ role: string; content: string | Array<any> }>,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    // Call our serverless function instead of Anthropic directly
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens: options.max_tokens || this.config.max_tokens,
        temperature: options.temperature || this.config.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      content: data.content,
      usage: data.usage
    };
  }

  private async callGemini(
    prompt: string,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    // Call our serverless function instead of Google directly
    const response = await fetch('/api/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        temperature: options.temperature || this.config.temperature,
        maxOutputTokens: options.max_tokens || this.config.max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google API error: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      content: data.content,
      usage: data.usage
    };
  }

  private async callQwen(
    _prompt: string,
    _options: any
  ): Promise<{ content: string; usage?: any }> {
    // Placeholder for Qwen2.5-Math integration
    // This would typically use Azure OpenAI or a custom endpoint
    if (!this.config.azure_api_key) {
      throw new Error('Azure API key not configured for Qwen model');
    }

    // Mock response for now
    return {
      content: JSON.stringify({
        answer_value_or_choice: "A",
        confidence_0_1: 0.85,
        method: "symbolic",
        checks: ["substitute_back", "domain"],
        short_explanation: "Qwen mathematical analysis completed."
      }),
      usage: { total_tokens: 150 }
    };
  }

  updateConfig(newConfig: Partial<ModelConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  private extractTextContent(content: string | Array<any> | undefined): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    
    // Extract text from array content (for multi-modal messages)
    if (Array.isArray(content)) {
      return content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');
    }
    
    return '';
  }
}