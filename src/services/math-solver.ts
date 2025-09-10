import { RoutedItem, SolverResult } from '../../types/sat';
import { openrouterClient, openaiClient } from './model-clients';
import { runPython } from '../lib/pythonSandbox';

const SYSTEM_MATH = `You are an expert SAT Math solver with image understanding.

Return ONLY a JSON object (no code fences, no commentary) with this exact schema:
{
  "answer_value_or_choice": "A|B|C|D|<numeric>",
  "confidence_0_1": number,
  "method": "symbolic"|"numeric"|"hybrid",
  "checks": string[],
  "short_explanation": "≤2 sentences",
  "python": "# Python code to solve/verify the problem\n# Use available modules: sympy, numpy, math\n# Common imports already available: symbols, solve, simplify, expand, factor, Eq\n# Set 'result' variable with final answer\n\n# Example structure:\n# x = symbols('x')\n# equation = Eq(2*x + 5, 13)\n# solution = solve(equation, x)[0]\n# result = solution"
}

Policy:
- Extract variables and constraints.
- Solve accurately; exact where feasible (fractions/simplify) or numeric if fine.
- ALWAYS provide Python code that solves the problem step-by-step.
- Use sympy for symbolic math, numpy for calculations.
- Use explicit function calls like symbols(), solve(), simplify() rather than import statements.
- Available functions: symbols, solve, simplify, expand, factor, Eq, sqrt, pi, sin, cos, tan, log, exp
- Verify with quick checks: substitute_back | units | domain | graph_consistency.
- For MC, return the LETTER; for grid-in, return a simplified numeric (no units).
- Python code should set 'result' variable with the final answer.

interface ModelVote {
  model: string;
  answer: string;
  confidence: number;
  explanation: string;
}

export class MathSolver {
  private qwenTextModel: string;
  private deepseekTextModel: string;
  private mistralTextModel: string;
  private qwenVLModel: string;
  private visionFallback: string;

  constructor() {
    this.qwenTextModel = import.meta.env.VITE_QWEN_TEXT_MODEL || 'qwen/qwen2.5-math-72b-instruct';
    this.deepseekTextModel = import.meta.env.VITE_DEEPSEEK_TEXT_MODEL || 'deepseek/deepseek-r1';
    this.mistralTextModel = import.meta.env.VITE_MISTRAL_TEXT_MODEL || 'mistral/mistral-large-latest';
    this.qwenVLModel = import.meta.env.VITE_QWEN_VL_MODEL || 'qwen/qwen2.5-vl-72b-instruct';
    this.visionFallback = import.meta.env.VITE_VISION_FALLBACK || 'gpt-4o';
  }

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const hasVision = item.hasFigure || !!item.imageBase64;
    
    console.log(`🔢 Math solver starting: ${hasVision ? 'vision' : 'text'} mode`);
    
    try {
      if (hasVision) {
        return await this.solveVision(item);
      } else {
        return await this.solveTextEnsemble(item);
      }
    } catch (error) {
      console.error('Math solver error:', error);
      throw error;
    } finally {
      const latencyMs = Date.now() - startTime;
      console.log(`🔢 Math solver completed in ${latencyMs}ms`);
    }
  }

  private async solveVision(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    let modelUsed = '';
    let modelsTried: string[] = [];

    // Try Qwen-VL first if configured
    if (this.qwenVLModel && import.meta.env.VITE_OPENROUTER_API_KEY) {
      try {
        modelsTried.push(this.qwenVLModel);
        const result = await this.callVisionModel(this.qwenVLModel, item, 'openrouter');
        modelUsed = this.qwenVLModel;
        
        const latencyMs = Date.now() - startTime;
        console.log(`{router: 'vision', modelsTried: [${modelsTried.join(', ')}], finalModel: '${modelUsed}', is_gridin: ${item.isGridIn}, latencyMs: ${latencyMs}}`);
        
        return result;
      } catch (error) {
        console.warn(`Qwen-VL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Check if it's an image_url error and retry with GPT-4o
        if (error instanceof Error && error.message.includes('image_url')) {
          console.log('Retrying with GPT-4o due to image_url error...');
        }
      }
    }

    // Fallback to GPT-4o if configured
    if (this.visionFallback === 'gpt-4o' && import.meta.env.VITE_OPENAI_API_KEY) {
      try {
        modelsTried.push('gpt-4o');
        const result = await this.callVisionModel('gpt-4o', item, 'openai');
        modelUsed = 'gpt-4o';
        
        const latencyMs = Date.now() - startTime;
        console.log(`{router: 'vision', modelsTried: [${modelsTried.join(', ')}], finalModel: '${modelUsed}', is_gridin: ${item.isGridIn}, latencyMs: ${latencyMs}}`);
        
        return result;
      } catch (error) {
        console.error(`GPT-4o vision fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw new Error('All vision models failed or not configured');
  }

  private async solveTextEnsemble(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const modelsTried: string[] = [];
    const votes: ModelVote[] = [];

    // Call Qwen and DeepSeek in parallel
    const [qwenResult, deepseekResult] = await Promise.allSettled([
      this.callTextModel(this.qwenTextModel, item).then(result => {
        modelsTried.push(this.qwenTextModel);
        return result;
      }),
      this.callTextModel(this.deepseekTextModel, item).then(result => {
        modelsTried.push(this.deepseekTextModel);
        return result;
      })
    ]);

    // Process results
    if (qwenResult.status === 'fulfilled' && qwenResult.value) {
      votes.push({
        model: this.qwenTextModel,
        answer: qwenResult.value.final,
        confidence: qwenResult.value.confidence,
        explanation: qwenResult.value.meta.explanation || ''
      });
    }

    if (deepseekResult.status === 'fulfilled' && deepseekResult.value) {
      votes.push({
        model: this.deepseekTextModel,
        answer: deepseekResult.value.final,
        confidence: deepseekResult.value.confidence,
        explanation: deepseekResult.value.meta.explanation || ''
      });
    }

    if (votes.length === 0) {
      throw new Error('Both Qwen and DeepSeek failed');
    }

    // Check for agreement
    let finalResult: SolverResult;
    let finalModel: string;

    if (votes.length === 2 && votes[0].answer === votes[1].answer) {
      // Agreement - pick the higher confidence one
      const bestVote = votes[0].confidence >= votes[1].confidence ? votes[0] : votes[1];
      if (bestVote.model === this.qwenTextModel && qwenResult.status === 'fulfilled') {
        finalResult = qwenResult.value;
      } else if (bestVote.model === this.deepseekTextModel && deepseekResult.status === 'fulfilled') {
        finalResult = deepseekResult.value;
      } else {
        finalResult = qwenResult.status === 'fulfilled' ? qwenResult.value : (deepseekResult as PromiseFulfilledResult<SolverResult>).value;
      }
      finalModel = bestVote.model;
    } else {
      // Disagreement - call Mistral as tiebreaker
      try {
        modelsTried.push(this.mistralTextModel);
        const mistralResult = await this.callTextModel(this.mistralTextModel, item);
        votes.push({
          model: this.mistralTextModel,
          answer: mistralResult.final,
          confidence: mistralResult.confidence,
          explanation: mistralResult.meta.explanation || ''
        });

        // Majority vote
        const answerCounts = new Map<string, { count: number; votes: ModelVote[] }>();
        votes.forEach(vote => {
          if (!answerCounts.has(vote.answer)) {
            answerCounts.set(vote.answer, { count: 0, votes: [] });
          }
          const entry = answerCounts.get(vote.answer)!;
          entry.count++;
          entry.votes.push(vote);
        });

        const majority = Array.from(answerCounts.entries())
          .sort((a, b) => b[1].count - a[1].count)[0];

        if (majority[1].count > 1) {
          // Clear majority
          const bestVote = majority[1].votes.sort((a, b) => b.confidence - a.confidence)[0];
          finalModel = bestVote.model;
          
          // Return the result from the winning model  
          if (bestVote.model === this.qwenTextModel && qwenResult.status === 'fulfilled') {
            finalResult = qwenResult.value;
          } else if (bestVote.model === this.deepseekTextModel && deepseekResult.status === 'fulfilled') {
            finalResult = deepseekResult.value;
          } else if (mistralResult) {
            finalResult = mistralResult;
          } else {
            throw new Error('No valid results available');
          }
        } else {
          // No majority - use domain preference
          if (qwenResult.status === 'fulfilled') {
            finalResult = qwenResult.value;
            finalModel = this.qwenTextModel;
          } else if (deepseekResult.status === 'fulfilled') {
            finalResult = deepseekResult.value;
            finalModel = this.deepseekTextModel;
          } else {
            throw new Error('No valid results from any model');
          }
        }
      } catch (error) {
        console.warn(`Mistral tiebreaker failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fall back to highest confidence
        const bestVote = votes.sort((a, b) => b.confidence - a.confidence)[0];
        finalModel = bestVote.model;
        
        if (bestVote.model === this.qwenTextModel && qwenResult.status === 'fulfilled') {
          finalResult = qwenResult.value;
        } else if (bestVote.model === this.deepseekTextModel && deepseekResult.status === 'fulfilled') {
          finalResult = deepseekResult.value;
        } else {
          throw new Error('No valid results from any model');
        }
      }
    }

    // Update model votes in result
    finalResult.meta.modelVotes = votes;
    finalResult.model = finalModel;

    const latencyMs = Date.now() - startTime;
    console.log(`{router: 'text', modelsTried: [${modelsTried.join(', ')}], finalModel: '${finalModel}', is_gridin: ${item.isGridIn}, latencyMs: ${latencyMs}}`);

    return finalResult;
  }

  private async callVisionModel(model: string, item: RoutedItem, provider: 'openrouter' | 'openai'): Promise<SolverResult> {
    const text = `Domain: ${item.subdomain}
${item.isGridIn ? 'Grid-in question (numeric answer)' : 'Multiple choice'}
${item.ocrText ? 'OCR (for reference): ' + item.ocrText : ''}`;

    const messages = [
      { role: 'system', content: SYSTEM_MATH },
      {
        role: 'user',
        content: [
          { type: 'text', text },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${item.imageBase64}` }
          }
        ]
      }
    ];

    const client = provider === 'openrouter' ? openrouterClient : openaiClient;
    const response = await client(model, messages);
    
    return await this.parseResponse(response.text, model);
  }

  private async callTextModel(model: string, item: RoutedItem): Promise<SolverResult> {
    const text = `Domain: ${item.subdomain}
${item.isGridIn ? 'Grid-in question (numeric answer)' : 'Multiple choice'}

${item.fullText}

${!item.isGridIn ? 'Choices:\n' + item.choices.map((c, i) => String.fromCharCode(65 + i) + ') ' + c).join('\n') : ''}`;

    const messages = [
      { role: 'system', content: SYSTEM_MATH },
      { role: 'user', content: [{ type: 'text', text }] }
    ];

    const response = await openrouterClient(model, messages);
    return await this.parseResponse(response.text, model);
  }

  private async parseResponse(text: string, model: string): Promise<SolverResult> {
    let parsed: any;
    
    try {
      // First attempt: direct JSON parse
      parsed = JSON.parse(text);
    } catch {
      try {
        // Second attempt: strip code fences
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        parsed = JSON.parse(cleaned);
      } catch {
        try {
          // Third attempt: extract first JSON object with regex
          const jsonMatch = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON object found');
          }
        } catch {
          throw new Error(`Failed to parse JSON response. First 300 chars: ${text.substring(0, 300)}... Last 300 chars: ...${text.substring(Math.max(0, text.length - 300))}`);
        }
      }
    }

    // Normalize and validate
    const confidence = Math.max(0, Math.min(1, parsed.confidence_0_1 || 0));
    const answer = parsed.answer_value_or_choice || 'A';
    
    // Execute Python code if provided
    let pythonResult = null;
    let finalAnswer = answer;
    let finalConfidence = confidence;
    
    if (parsed.python && typeof parsed.python === 'string' && parsed.python.trim().length > 10) {
      try {
        console.log(`🐍 Executing Python verification for ${model}...`);
        pythonResult = await runPython(parsed.python);
        
        if (pythonResult.ok && pythonResult.result !== null && pythonResult.result !== undefined) {
          const pythonAnswer = String(pythonResult.result);
          console.log(`🐍 Python result: ${pythonAnswer}, Original: ${answer}`);
          
          // Check if Python result matches or is close
          const pythonMatch = this.compareAnswers(pythonAnswer, answer);
          
          if (pythonMatch) {
            // Python verification successful - boost confidence
            finalConfidence = Math.min(0.98, confidence + 0.15);
            console.log(`✅ Python verification matches, confidence boosted to ${finalConfidence.toFixed(2)}`);
          } else {
            // Python disagrees - check which one to trust
            if (confidence < 0.8) {
              // Low confidence in original, trust Python
              finalAnswer = pythonAnswer;
              finalConfidence = Math.max(0.7, confidence);
              console.log(`🔄 Low confidence, using Python result: ${finalAnswer}`);
            } else {
              // High confidence in original, but Python disagrees - lower confidence
              finalConfidence = Math.max(0.6, confidence * 0.8);
              console.log(`⚠️ Python disagrees with high-confidence answer, reducing confidence to ${finalConfidence.toFixed(2)}`);
            }
          }
        } else {
          console.warn(`⚠️ Python execution failed or returned invalid result:`, pythonResult);
          finalConfidence = Math.max(0.5, confidence * 0.9); // Slight penalty for failed Python
        }
      } catch (error) {
        console.warn(`⚠️ Python execution error:`, error);
        finalConfidence = Math.max(0.5, confidence * 0.9); // Slight penalty for Python error
      }
    } else {
      console.log(`⚠️ No valid Python code provided by ${model}`);
      finalConfidence = Math.max(0.6, confidence * 0.85); // Penalty for missing Python verification
    }
    
    return {
      final: finalAnswer,
      confidence: finalConfidence,
      meta: {
        method: parsed.method || 'hybrid',
        checks: parsed.checks || [],
        explanation: parsed.short_explanation || 'Solution computed',
        python: parsed.python || null,
        pythonResult: pythonResult,
        originalAnswer: answer,
        originalConfidence: confidence
      },
      model
    };
  }

  private compareAnswers(answer1: string, answer2: string): boolean {
    // Remove whitespace and convert to lowercase
    const a1 = answer1.trim().toLowerCase();
    const a2 = answer2.trim().toLowerCase();
    
    // Direct string match
    if (a1 === a2) return true;
    
    // Try numeric comparison if both are numbers
    const num1 = parseFloat(a1);
    const num2 = parseFloat(a2);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      // Allow small floating point differences
      return Math.abs(num1 - num2) < 0.001;
    }
    
    // Try fraction comparison (e.g., "1/2" vs "0.5")
    try {
      const frac1 = this.evaluateFraction(a1);
      const frac2 = this.evaluateFraction(a2);
      if (frac1 !== null && frac2 !== null) {
        return Math.abs(frac1 - frac2) < 0.001;
      }
    } catch {
      // Ignore fraction parsing errors
    }
    
    return false;
  }

  private evaluateFraction(str: string): number | null {
    // Simple fraction evaluator for patterns like "3/4", "1/2", etc.
    const match = str.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (match) {
      const numerator = parseInt(match[1]);
      const denominator = parseInt(match[2]);
      if (denominator !== 0) {
        return numerator / denominator;
      }
    }
    return null;
  }
}