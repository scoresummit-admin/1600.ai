import { ModelConfig, ModelName } from '../types/sat';

// Default configuration for models
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  enabled_models: [
    'openai/gpt-5',
    'openai/o3', 
    'x-ai/grok-4',
    'qwen/qwen3-235b-a22b-thinking-2507',
    'anthropic/claude-sonnet-4'
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
  'openai/o3': {
    strengths: ['complex_reasoning', 'math', 'analysis'],
    supports_images: true,
    context_length: 200000,
    cost_tier: 'highest'
  },
  'x-ai/grok-4': {
    strengths: ['reasoning', 'analysis', 'math'],
    supports_images: true,
    context_length: 131072,
    cost_tier: 'high'
  },
  'qwen/qwen3-235b-a22b-thinking-2507': {
    strengths: ['math', 'reasoning', 'competition_problems'],
    supports_images: true,
    context_length: 32768,
    cost_tier: 'medium'
  },
  'anthropic/claude-sonnet-4': {
    strengths: ['reading', 'analysis', 'evidence_extraction'],
    supports_images: true,
    context_length: 200000,
    cost_tier: 'high'
  }
};

export function getModelForTask(task: 'math' | 'ebrw', priority: 'speed' | 'accuracy' = 'accuracy'): ModelName[] {
  if (task === 'math') {
    if (priority === 'speed') {
      return ['openai/gpt-5', 'x-ai/grok-4', 'qwen/qwen3-235b-a22b-thinking-2507'];
    } else {
      return ['openai/o3', 'openai/gpt-5', 'qwen/qwen3-235b-a22b-thinking-2507'];
    }
  } else { // EBRW
    if (priority === 'speed') {
      return ['openai/gpt-5', 'anthropic/claude-sonnet-4'];
    } else {
      return ['openai/o3', 'anthropic/claude-sonnet-4', 'openai/gpt-5'];
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