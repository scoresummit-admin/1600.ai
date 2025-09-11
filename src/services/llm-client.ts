import { ModelConfig, ModelName } from '../../types/sat';
import { openrouterClient } from './model-clients';

export class LLMClient {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    
    // Use environment variables as fallback
    if (!this.config.openrouter_api_key && import.meta.env.VITE_OPENROUTER_API_KEY) {
      this.config.openrouter_api_key = import.meta.env.VITE_OPENROUTER_API_KEY || '';
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
    const timeout = options.timeout_ms || 55000;

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
    // Configure Azure preference for all OpenAI models for better latency
    const providerConfig: any = {};
    if (model.startsWith('openai/')) {
      providerConfig.provider = {
        order: ['azure', 'openai'],
        require_parameters: false
      };
    }

    const response = await openrouterClient(model, messages, {
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.max_tokens || this.config.max_tokens,
      timeout_ms: options.timeout_ms,
      ...providerConfig
    });

    return {
      content: response.text,
      usage: response.raw.usage
    };
  }

  updateConfig(newConfig: Partial<ModelConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}