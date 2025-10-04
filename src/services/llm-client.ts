import { ModelConfig, ModelName } from '../types/sat';

// Default configuration for models
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  enabled_models: [
    'anthropic/claude-opus-4.1',
    'openai/gpt-5',
    'openai/gpt-5-thinking',
    'x-ai/grok-4',
    'anthropic/claude-4.1-sonnet'
  ],
  reasoning_effort: 'medium',
  max_tokens: 3000,
  temperature: 0.05
};

// Model capabilities and preferences
export const MODEL_CAPABILITIES = {
  'openai/gpt-5': {
    strengths: ['general_reasoning', 'math', 'coding'],
    supports_images: true,
    context_length: 128000,
    cost_tier: 'high'
  },
  'openai/gpt-5-thinking': {
    strengths: ['reading', 'analysis', 'evidence_extraction'],
    supports_images: false,
    context_length: 128000,
    cost_tier: 'high'
  },
  'x-ai/grok-4': {
    strengths: ['reasoning', 'analysis', 'math', 'vision'],
    supports_images: true,
    context_length: 131072,
    cost_tier: 'high'
  },
  'anthropic/claude-opus-4.1': {
    strengths: ['reading', 'analysis', 'evidence_extraction', 'vision'],
    supports_images: true,
    context_length: 200000,
    cost_tier: 'high'
  },
  'anthropic/claude-4.1-sonnet': {
    strengths: ['reading', 'analysis', 'math', 'vision'],
    supports_images: true,
    context_length: 200000,
    cost_tier: 'high'
  }
};

export function getModelForTask(task: 'math' | 'ebrw', priority: 'speed' | 'accuracy' = 'accuracy'): ModelName[] {
  if (task === 'math') {
    if (priority === 'speed') {
      return ['openai/gpt-5', 'x-ai/grok-4', 'anthropic/claude-4.1-sonnet'];
    } else {
      return ['openai/gpt-5', 'x-ai/grok-4', 'anthropic/claude-4.1-sonnet'];
    }
  } else { // EBRW
    if (priority === 'speed') {
      return ['openai/gpt-5-thinking'];
    } else {
      return ['openai/gpt-5-thinking'];
    }
  }
}

export function validateModelConfig(config: Partial<ModelConfig>): ModelConfig {
  return {
    ...DEFAULT_MODEL_CONFIG,
    ...config,
    enabled_models: config.enabled_models || DEFAULT_MODEL_CONFIG.enabled_models,
    max_tokens: Math.min(config.max_tokens || DEFAULT_MODEL_CONFIG.max_tokens, 8000),
    temperature: Math.max(0, Math.min(config.temperature || DEFAULT_MODEL_CONFIG.temperature, 1))
  };
}