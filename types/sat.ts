export type Section = "EBRW" | "MATH";

export type EbrwDomain =
  | "craft_structure"
  | "information_ideas"
  | "standard_english_conventions"
  | "expression_of_ideas";

export type MathDomain = "algebra" | "advanced_math" | "psda" | "geometry_trig";

export interface SatItem {
  id: string;
  source: "text" | "screenshot";
  promptText?: string;
  imageBase64?: string;
  choices?: string[];        // ["A ...","B ...","C ...","D ..."]
  isGridIn?: boolean;
}

export interface RoutedItem {
  section: Section;
  subdomain: EbrwDomain | MathDomain;
  imageBase64?: string;         // Primary source of truth
  ocrText?: string;            // Supplementary text from OCR
  fullText: string;           // verbatim passage + question from UI/OCR
  passageText?: string;       // just the passage part (if separable)
  questionText?: string;      // just the question stem (if separable)
  choices: string[];
  isGridIn: boolean;
  hasFigure: boolean;
}

export interface SolverResult {
  final: string;                  // "A"|"B"|"C"|"D" or numeric string
  confidence: number;             // 0..1
  meta: Record<string, any>;
  model: string;                  // "gpt-5" | "o4-mini" | "claude-3.5-sonnet" | "gemini-2.5-pro"
}

export interface VerifierReport {
  passed: boolean;
  score: number;                  // 0..1
  notes: string[];
  checks?: string[];              // ["substitute_back","units","domain"]
}

export interface AggregatedAnswer {
  answer: string;
  confidence: number;             // 0..1
  section: Section;
  subdomain: EbrwDomain | MathDomain;
  timeMs: number;
  modelVotes: SolverResult[];
  verifier: VerifierReport;
  shortExplanation: string;
  evidenceOrChecks: string[];     // up to 2 items
}

// Legacy compatibility types (will be phased out)
export type SATSection = Section;
export type EBRWDomain = EbrwDomain;
export type MathDomainLegacy = MathDomain;
export type ModelName = 'gpt-5' | 'gpt-5-thinking' | 'o4-mini' | 'claude-opus-4-1-20250805' | 'claude-sonnet-4-20250514' | 'gemini-2.5-pro' | 'qwen2.5-math-72b';

export interface SATQuestionLegacy {
  id: string;
  prompt_text: string;
  choices: string[];
  is_gridin: boolean;
  has_figure: boolean;
  figure_url?: string;
  extracted_numbers: number[];
  time_budget_s: number;
}

export interface RouterOutputLegacy {
  section: SATSection;
  subdomain: EbrwDomain | MathDomain;
  prompt_text: string;
  choices: string[];
  is_gridin: boolean;
  has_figure: boolean;
  extracted_numbers: number[];
  time_budget_s: number;
}

export interface EBRWSolutionLegacy {
  final_choice: 'A' | 'B' | 'C' | 'D';
  confidence_0_1: number;
  domain: EbrwDomain;
  short_explanation: string;
  evidence: string[];
  elimination_notes: Record<string, string>;
  model: ModelName;
}

export interface MathSolutionLegacy {
  answer_value_or_choice: string;
  confidence_0_1: number;
  method: 'symbolic' | 'numeric' | 'hybrid';
  checks: string[];
  short_explanation: string;
  model: ModelName;
  code_hash?: string;
}

export interface ModelVoteLegacy {
  model: ModelName;
  choice_or_value: string;
  confidence: number;
  reasoning?: string;
}

export interface VerificationResultLegacy {
  passed: boolean;
  confidence_adjustment: number;
  notes: string[];
}

export interface SATSolutionLegacy {
  final_choice_or_value: string;
  section: SATSection;
  subdomain: EbrwDomain | MathDomain;
  confidence_0_1: number;
  time_ms: number;
  model_votes: ModelVoteLegacy[];
  short_explanation: string;
  evidence_or_checklist: string[];
  verification_result: VerificationResultLegacy;
  escalated: boolean;
}

export interface ModelConfig {
  openai_api_key?: string;
  anthropic_api_key?: string;
  google_api_key?: string;
  azure_endpoint?: string;
  azure_api_key?: string;
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