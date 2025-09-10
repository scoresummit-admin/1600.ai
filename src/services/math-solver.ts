import { RoutedItem, SolverResult } from '../../types/sat';
import { openrouterClient, openaiClient } from './model-clients';

const SYSTEM_MATH = `You are an expert SAT Math solver with image understanding.

Return ONLY a JSON object (no code fences, no commentary) with this exact schema:
{
  "answer_value_or_choice": "A|B|C|D|<numeric>",
  "confidence_0_1": number,
  "method": "symbolic"|"numeric"|"hybrid",
  "checks": string[],
  "short_explanation": "≤2 sentences",
  "python": string|null
}

Policy:
- Extract variables and constraints.
- Solve accurately; exact where feasible (fractions/simplify) or numeric if fine.
- Verify with quick checks: substitute_back | units | domain | graph_consistency.
- For MC, return the LETTER; for grid-in, return a simplified numeric (no units).
- Set "python": null for now. No chain-of-thought.`;

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
        finalResult = qwenResult.status === 'fulfilled' ? qwenResult.value : deepseekResult.value as SolverResult;
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
          } else {
            finalResult = mistralResult;
          }
        } else {
          // No majority - use domain preference
          finalResult = this.selectByDomainPreference(item, votes, qwenResult.status === 'fulfilled' ? qwenResult : null, deepseekResult.status === 'fulfilled' ? deepseekResult : null, mistralResult);
          finalModel = finalResult.model;
        }
      } catch (error) {
        console.warn(`Mistral tiebreaker failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fall back to highest confidence
        const bestVote = votes.sort((a, b) => b.confidence - a.confidence)[0];
        if (bestVote.model === this.qwenTextModel && qwenResult.status === 'fulfilled') {
          finalResult = qwenResult.value;
        } else if (deepseekResult.status === 'fulfilled') {
          finalResult = deepseekResult.value;
        } else {
          throw new Error('No valid results from any model');
        }
        finalModel = bestVote.model;
      }
    }

    // Update model votes in result
    finalResult.meta.modelVotes = votes;
    finalResult.model = finalModel;

    const latencyMs = Date.now() - startTime;
    console.log(`{router: 'text', modelsTried: [${modelsTried.join(', ')}], finalModel: '${finalModel}', is_gridin: ${item.isGridIn}, latencyMs: ${latencyMs}}`);

    return finalResult;
  }

  private selectByDomainPreference(
    item: RoutedItem, 
    votes: ModelVote[], 
    qwenResult: PromiseSettledResult<SolverResult>, 
    deepseekResult: PromiseSettledResult<SolverResult>,
    mistralResult?: SolverResult
  ): SolverResult {
    // Prefer Qwen for algebra/advanced_math, DeepSeek for PSDA/geometry_trig
    const preferQwen = item.subdomain === 'algebra' || item.subdomain === 'advanced_math';
    
    if (preferQwen && qwenResult.status === 'fulfilled' && qwenResult.value) {
      return qwenResult.value;
    } else if (!preferQwen && deepseekResult.status === 'fulfilled' && deepseekResult.value) {
      return deepseekResult.value;
    } else if (mistralResult) {
      return mistralResult;
    }
    
    // Fallback to highest confidence
    const bestVote = votes.sort((a, b) => b.confidence - a.confidence)[0];
    if (bestVote.model === this.qwenTextModel && qwenResult.status === 'fulfilled') {
      return qwenResult.value;
    } else if (deepseekResult.status === 'fulfilled') {
      return deepseekResult.status === 'fulfilled' ? deepseekResult.value : mistralResult!;
    } else {
      return mistralResult || (() => { throw new Error('No valid results available'); })();
    }
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
    
    return this.parseResponse(response.text, model);
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
    return this.parseResponse(response.text, model);
  }

  private parseResponse(text: string, model: string): SolverResult {
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
    
    return {
      final: answer,
      confidence,
      meta: {
        method: parsed.method || 'hybrid',
        checks: parsed.checks || [],
        explanation: parsed.short_explanation || 'Solution computed',
        python: null // Always null for now
      },
      model
    };
  }
}