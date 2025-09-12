import { RoutedItem, SolverResult } from '../types/sat';
import { openrouterClient } from './model-clients';

const SYSTEM_EBRW = `You are an expert SAT Evidence-Based Reading & Writing solver.

CRITICAL REQUIREMENTS:
1. Extract specific text evidence from passages when available
2. Eliminate wrong choices with clear reasoning
3. Use domain-specific strategies for different question types
4. Provide confidence score based on evidence strength

Response format:
{
  "answer": "A|B|C|D",
  "confidence": 0.0-1.0,
  "explanation": "Brief explanation of reasoning",
  "evidence": ["quote1", "quote2"],
  "elimination": "Why other choices are wrong"
}

For Standard English Conventions: Focus on grammar, punctuation, and usage rules.
For Expression of Ideas: Focus on clarity, concision, and logical organization.
For Information & Ideas: Focus on main ideas, supporting evidence, and inferences.
For Craft & Structure: Focus on word choice, text structure, and author's purpose.`;

// EBRW concurrent quartet models
const EBRW_MODELS = [
  'openai/o3',
  'openai/gpt-5',
  'x-ai/grok-4',
  'anthropic/claude-sonnet-4'
];

export class EBRWSolver {
  constructor() {}

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const timeoutMs = 40000; // 40s total timeout
    console.log(`🔄 EBRW solver starting concurrent quartet (${timeoutMs}ms timeout)...`);
    
    try {
      // Dispatch all four models concurrently
      const individualTimeout = Math.min(timeoutMs * 0.8, 32000); // 80% of total timeout, max 32s
      
      const results = await this.raceForResults(item, individualTimeout, timeoutMs);
      
      console.log(`🔄 EBRW models completed: ${results.length}/${EBRW_MODELS.length} successful`);
      
      if (results.length === 0) {
        throw new Error('All EBRW models failed');
      }
      
      // Select best result based on evidence quality and consensus
      const bestResult = await this.selectBestEBRWResult(results);
      
      console.log(`✅ EBRW solved: ${bestResult.final} (${bestResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return bestResult;
      
    } catch (error) {
      console.error('EBRW solver error:', error);
      throw error;
    }
  }

  private async raceForResults(item: RoutedItem, individualTimeout: number, totalTimeout: number): Promise<SolverResult[]> {
    const results: SolverResult[] = [];
    const promises = EBRW_MODELS.map((model, index) => 
      this.solveWithModelSafe(item, model, individualTimeout).then(result => ({
        result,
        index,
        model
      }))
    );
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasResolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          if (results.length > 0) {
            console.log(`⏱️ EBRW timeout with ${results.length} results, proceeding...`);
            resolve(results);
          } else {
            reject(new Error('EBRW total timeout with no results'));
          }
        }
      }, totalTimeout);
      
      promises.forEach(promise => {
        promise.then(({ result }) => {
          if (!hasResolved && result.confidence > 0.1) {
            results.push(result);
            console.log(`✅ EBRW ${result.model} completed: ${result.final} (${result.confidence.toFixed(2)})`);
            
            // Return early if we have 3+ good results or all completed
            if (results.length >= 3 || completed >= EBRW_MODELS.length - 1) {
              hasResolved = true;
              clearTimeout(timeoutId);
              console.log(`🚀 EBRW early return with ${results.length} results`);
              resolve(results);
              return;
            }
          }
          
          completed++;
          if (completed >= EBRW_MODELS.length && !hasResolved) {
            hasResolved = true;
            clearTimeout(timeoutId);
            resolve(results);
          }
        }).catch(error => {
          console.warn(`EBRW model failed:`, error);
          completed++;
          if (completed >= EBRW_MODELS.length && !hasResolved) {
            hasResolved = true;
            clearTimeout(timeoutId);
            resolve(results);
          }
        });
      });
    });
  }

  private async solveWithModelSafe(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    try {
      return await this.solveWithModel(item, model, timeoutMs);
    } catch (error) {
      console.warn(`🔄 EBRW ${model} failed:`, error);
      return {
        final: 'A',
        confidence: 0.1,
        meta: {
          method: 'fallback',
          explanation: `${model} failed to respond`,
          checks: ['model_failure']
        },
        model
      };
    }
  }

  private async solveWithModel(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    console.log(`🔄 EBRW solving with ${model} (${timeoutMs}ms timeout)...`);
    
    const userPrompt = `Problem: ${item.question}

Choices:
${item.choices.map((c, i) => `${String.fromCharCode(65 + i)}) ${c}`).join('\n')}

Domain: ${item.subdomain}

Solve this systematically with evidence extraction.`;
    
    const messages = [
      { 
        role: 'user', 
        content: `${SYSTEM_EBRW}

${userPrompt}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.` 
      }
    ];
    
    const response = await openrouterClient(model, messages, {
      temperature: 0.05,
      max_tokens: 3000,
      timeout_ms: timeoutMs
    });
    
    let result;
    try {
      const cleanedResponse = response.text.replace(/```json\s*|\s*```/g, '').trim();
      result = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error(`${model} JSON parse error:`, error);
      throw new Error(`Invalid JSON response from ${model}`);
    }
    
    const finalAnswer = result.answer || 'A';
    let finalConfidence = result.confidence || 0.5;
    
    // Boost confidence if evidence was provided
    if (result.evidence && Array.isArray(result.evidence) && result.evidence.length > 0) {
      finalConfidence = Math.min(0.95, finalConfidence + 0.1);
    }
    
    return {
      final: finalAnswer,
      confidence: Math.max(0.1, Math.min(1.0, finalConfidence)),
      meta: {
        method: 'evidence_based',
        explanation: result.explanation,
        evidence: result.evidence || [],
        elimination_notes: result.elimination,
        checks: ['evidence_extraction', 'choice_elimination']
      },
      model
    };
  }

  private async selectBestEBRWResult(results: SolverResult[]): Promise<SolverResult> {
    if (results.length === 1) {
      return results[0];
    }

    // Look for consensus among results
    const voteCounts = new Map<string, number>();
    const votesByAnswer = new Map<string, SolverResult[]>();
    
    results.forEach(result => {
      const answer = result.final;
      voteCounts.set(answer, (voteCounts.get(answer) || 0) + 1);
      if (!votesByAnswer.has(answer)) {
        votesByAnswer.set(answer, []);
      }
      votesByAnswer.get(answer)!.push(result);
    });

    // Find consensus
    let maxVotes = 0;
    let consensusAnswer = '';
    
    for (const [answer, votes] of voteCounts) {
      if (votes > maxVotes) {
        maxVotes = votes;
        consensusAnswer = answer;
      }
    }

    // If we have consensus, use highest confidence from that group
    if (maxVotes > 1) {
      const consensusResults = votesByAnswer.get(consensusAnswer)!;
      return consensusResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // No consensus - return highest confidence overall
    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }
}