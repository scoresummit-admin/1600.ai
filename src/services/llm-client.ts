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
      'o4-mini': 'o1-mini'
    };

    const actualModel = modelMap[model as keyof typeof modelMap] || model;

    const isO1Family  = /^(o1|o3|o4)(-|$)/i.test(actualModel);   // e.g. o1, o1-mini, o4-mini
    const isGPT5Family = /^gpt-5(\b|[-_])/i.test(actualModel);   // gpt-5, gpt-5-thinking, gpt-5-*
    
    // All models use chat completions format
    let processedMessages = messages;
    if (isO1Family) {
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessage = messages.find(m => m.role === 'user');
      
      if (systemMessage && userMessage) {
        processedMessages = [{
          role: 'user',
          content: `${systemMessage.content}\n\n${userMessage.content}`
        }];
      } else {
        processedMessages = messages.filter(m => m.role !== 'system');
      }
    }
    
    const requestBody: any = {
      model: actualModel,
      messages: processedMessages,
      temperature: isO1Family ? 1 : (options.temperature || this.config.temperature)
    };
    
    // optional: accept either option name on input
    const desiredMax = options.max_completion_tokens ?? options.max_tokens ?? this.config.max_tokens ?? 2000;

    if (isO1Family || isGPT5Family) {
      delete requestBody.max_tokens;                // <- hard stop: never leak wrong key
      requestBody.max_completion_tokens = desiredMax;
    } else {
      delete requestBody.max_completion_tokens;     // keep payload clean
      requestBody.max_tokens = desiredMax;
    }

    // Add reasoning_effort for reasoning models
    if ((isO1Family || isGPT5Family) && options.reasoning_effort) {
      requestBody.reasoning_effort = options.reasoning_effort;
    }
    
    // tools only for non-o1 / non-gpt-5
    if (!isO1Family && !isGPT5Family && options.tools) {
      requestBody.tools = options.tools;
    }

    // Optional dev logging to verify payload
    if (import.meta.env?.DEV) console.log('openai payload →', JSON.stringify(requestBody));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage
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