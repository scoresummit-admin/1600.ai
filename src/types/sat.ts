// SAT Question Types and Interfaces
export type SATSection = 'EBRW' | 'Math';

export type EBRWDomain = 
  | 'craft_structure' 
  | 'information_ideas' 
  | 'standard_english_conventions' 
  | 'expression_of_ideas';

export type MathDomain = 
  | 'algebra' 
  | 'advanced_math' 
  | 'problem_solving_data_analysis' 
  | 'geometry_trigonometry';

export type ModelName = 
  | 'openai/gpt-5'
  | 'openai/o3'
  | 'x-ai/grok-4'
  | 'deepseek/deepseek-r1'
  | 'anthropic/claude-sonnet-4';

export interface SATQuestion {
  id: string;
  prompt_text: string;
  choices: string[];
  is_gridin: boolean;
  has_figure: boolean;
  figure_url?: string;
  extracted_numbers: number[];
  time_budget_s: number;
}

export interface RouterOutput {
  section: SATSection;
  subdomain: EBRWDomain | MathDomain;
  prompt_text: string;
  choices: string[];
  is_gridin: boolean;
  has_figure: boolean;
  extracted_numbers: number[];
  time_budget_s: number;
}

export interface EBRWSolution {
  final_choice: 'A' | 'B' | 'C' | 'D';
  confidence_0_1: number;
  domain: EBRWDomain;
  short_explanation: string;
  evidence: string[];
  elimination_notes: Record<string, string>;
  model: ModelName;
}

export interface MathSolution {
  answer_value_or_choice: string;
  confidence_0_1: number;
  method: 'symbolic' | 'numeric' | 'hybrid';
  checks: string[];
  short_explanation: string;
  model: ModelName;
  code_hash?: string;
}

export interface ModelVote {
  model: ModelName;
  choice_or_value: string;
  confidence: number;
  reasoning?: string;
}

export interface VerificationResult {
  passed: boolean;
  confidence_adjustment: number;
  notes: string[];
}

export interface SATSolution {
  final_choice_or_value: string;
  section: SATSection;
  subdomain: EBRWDomain | MathDomain;
  confidence_0_1: number;
  time_ms: number;
  model_votes: ModelVote[];
  short_explanation: string;
  evidence_or_checklist: string[];
  verification_result: VerificationResult;
  escalated: boolean;
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