// SAT Question Types and Interfaces
export type SATSection = 'EBRW' | 'MATH';

export type EbrwDomain = 
  | 'craft_structure' 
  | 'information_ideas' 
  | 'standard_english_conventions' 
  | 'expression_of_ideas';

export type MathDomain = 
  | 'algebra' 
  | 'advanced_math' 
  | 'problem_solving_data_analysis' 
  | 'geometry_trigonometry';

export type Section = SATSection;

export type ModelName = 
  | 'openai/gpt-5'
  | 'openai/o3'
  | 'x-ai/grok-4'
  | 'qwen/qwen3-235b-a22b-thinking-2507'
  | 'anthropic/claude-sonnet-4';

export interface SatItem {
  source: 'manual' | 'screenshot';
  promptText?: string;
  choices: string[];
  imageBase64?: string;
  isGridIn?: boolean;
}

export interface RoutedItem {
  section: SATSection;
  subdomain: EbrwDomain | MathDomain;
  imageBase64?: string;
  ocrText?: string;
  fullText: string;
  choices: string[];
  isGridIn: boolean;
  hasFigure: boolean;
}

export interface SolverResult {
  final: string;
  confidence: number;
  meta: {
    method?: 'symbolic' | 'numeric' | 'hybrid' | 'fallback';
    domain?: EbrwDomain;
    explanation?: string;
    evidence?: string[];
    elimination_notes?: Record<string, string>;
    python?: string;
    pythonResult?: {
      ok: boolean;
      result?: any;
      stdout?: string;
      error?: string;
    };
    checks?: string[];
  };
  model: string;
}

export interface VerifierReport {
  passed: boolean;
  score: number;
  notes: string[];
  checks?: string[];
}

export interface AggregatedAnswer {
  answer: string;
  confidence: number;
  section: SATSection;
  subdomain: EbrwDomain | MathDomain;
  timeMs: number;
  modelVotes: SolverResult[];
  verifier: VerifierReport;
  shortExplanation: string;
  evidenceOrChecks: string[];
}

export interface ModelConfig {
  openrouter_api_key?: string;
  enabled_models: ModelName[];
  reasoning_effort: 'minimal' | 'low' | 'medium' | 'high';
  max_tokens: number;
  temperature: number;
}

export interface PerformanceMetrics {
  total_questions: number;
  correct_answers: number;
  accuracy_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  escalation_rate: number;
  model_usage: Record<ModelName, number>;
}