import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelConfig, ModelName } from '../types/sat';

export class LLMClient {
  private config: ModelConfig;
  private googleAI?: GoogleGenerativeAI;

  constructor(config: ModelConfig) {
    this.config = config;
    if (config.google_api_key) {
      this.googleAI = new GoogleGenerativeAI(config.google_api_key);
    }
  }

  async callModel(
    model: ModelName,
    messages: Array<{ role: string; content: string }>,
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
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    switch (model) {
      case 'gpt-5':
      case 'gpt-5-thinking':
      case 'o4-mini':
        return this.callOpenAI(model, messages, options);
      
      case 'claude-3.5-sonnet':
        return this.callAnthropic(messages, options);
      
      case 'gemini-2.5-pro':
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const userMessage = messages.find(m => m.role === 'user')?.content || '';
        const fullPrompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
        return this.callGemini(fullPrompt, options);
      
      case 'qwen2.5-math-72b':
        const sysMsg = messages.find(m => m.role === 'system')?.content || '';
        const usrMsg = messages.find(m => m.role === 'user')?.content || '';
        const qwenPrompt = sysMsg ? `${sysMsg}\n\n${usrMsg}` : usrMsg;
        return this.callQwen(qwenPrompt, options);
      
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  private async callOpenAI(
    model: ModelName,
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    if (!this.config.openai_api_key) {
      throw new Error('OpenAI API key not configured');
    }

    const modelMap = {
      'gpt-5': 'gpt-4o',  // Placeholder until GPT-5 is available
      'gpt-5-thinking': 'o1-preview',
      'o4-mini': 'o1-mini'
    };

    const actualModel = modelMap[model as keyof typeof modelMap] || 'gpt-4o';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: actualModel,
        messages,
        temperature: options.temperature || this.config.temperature,
        max_tokens: options.max_tokens || this.config.max_tokens,
        tools: options.tools,
        reasoning_effort: options.reasoning_effort,
      }),
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
    messages: Array<{ role: string; content: string }>,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    if (!this.config.anthropic_api_key) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.anthropic_api_key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
        max_tokens: options.max_tokens || this.config.max_tokens,
        temperature: options.temperature || this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: data.usage
    };
  }

  private async callGemini(
    prompt: string,
    options: any
  ): Promise<{ content: string; usage?: any }> {
    if (!this.googleAI) {
      throw new Error('Google API key not configured');
    }

    const model = this.googleAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: options.temperature || this.config.temperature,
        maxOutputTokens: options.max_tokens || this.config.max_tokens,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      content: response.text(),
      usage: response.usageMetadata
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
    if (newConfig.google_api_key) {
      this.googleAI = new GoogleGenerativeAI(newConfig.google_api_key);
    }
  }
}