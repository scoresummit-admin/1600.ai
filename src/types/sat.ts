// Core SAT types and interfaces

export type Section = 'MATH' | 'EBRW';

export type EbrwDomain = 
  | 'information_ideas' 
  | 'craft_structure' 
  | 'expression_of_ideas' 
  | 'standard_english_conventions';

export type MathDomain = 
  | 'algebra' 
  | 'advanced_math' 
  | 'problem_solving_data_analysis' 
  | 'geometry_trigonometry';

export type ModelName =
  | 'anthropic/claude-opus-4.1'
  | 'openai/o3-pro'
  | 'openai/gpt-5'
  | 'x-ai/grok-4'
  | 'anthropic/claude-4.1-sonnet';

export interface SatItem {
  source: string;
  promptText?: string;
  choices: string[];
  imageBase64?: string;
  isGridIn?: boolean;
}

export interface RoutedItem {
  section: Section;
  subdomain: EbrwDomain | MathDomain;
  imageBase64?: string;
  ocrText: string;
  fullText: string;
  question: string;
  choices: string[];
  isGridIn: boolean;
  hasFigure: boolean;
}

export interface SolverResult {
  final: string;
  confidence: number;
  meta: {
    method?: string;
    explanation?: string;
    evidence?: string[];
    elimination_notes?: string;
    python?: string;
    pythonResult?: any;
    checks?: string[];
  };
  model: string;
}

export interface VerifierReport {
  passed: boolean;
  score: number;
  notes: string[];
  checks: string[];
}

export interface AggregatedAnswer {
  answer: string;
  confidence: number;
  section: Section;
  subdomain: EbrwDomain | MathDomain;
  timeMs: number;
  modelVotes: SolverResult[];
  verifier: VerifierReport;
  shortExplanation: string;
  evidenceOrChecks: string[];
}

export interface ModelConfig {
  enabled_models: ModelName[];
  reasoning_effort: 'low' | 'medium' | 'high';
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