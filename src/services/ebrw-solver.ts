import { RoutedItem, SolverResult } from '../types/sat';
import { openrouterClient } from './model-clients';

const SYSTEM_EBRW = `You are an expert SAT Evidence-Based Reading & Writing (EBRW) solver.

Output Contract (strict)
Return ONLY a single JSON object (no prose, no markdown).
Do NOT include chain-of-thought. Keep explanations short, evidence-anchored.
If multiple passages or figures are present, cite evidence from the correct source.

Required JSON
{
"answer": "A|B|C|D",
"confidence_0_1": number,
"short_explanation": "≤2 sentences, evidence-based and concise.",
"evidence": ["verbatim quote(s) ≤ ~20 words each or line refs"],
"elimination_notes": {
"A": "why wrong (if not chosen)",
"B": "…",
"C": "…",
"D": "…"
}
}

Core Policy
Quote-then-decide: Find the smallest text span(s) that prove the correct choice. Prefer direct paraphrase over inference.
Eliminate systematically using a distractor taxonomy:
Out-of-scope (not supported anywhere)
Too strong/absolute (always, never, must)
Opposite/reverses relation
Partially true but misses the main point
Wrong focus (minor detail treated as main idea)

Calibration (confidence_0_1):
0.95–0.85: direct support (quote/paraphrase aligns cleanly)
0.75–0.65: inference with one reasonable step
0.55–0.45: weak or ambiguous support

No hallucinations: Every claim must be traceable to quoted evidence or standard grammar rules.

Domain Playbooks
Information & Ideas: Identify claim plus textual support; prefer options that subsume all the key elements of the passage’s statement (who, what, how, why). Avoid over-narrow or over-broad phrasings.
Craft & Structure: Track function of a paragraph or sentence (introduce, contrast, qualify, concede), tone (neutral, critical, analytical), and pivot cues (however, although, meanwhile). For vocabulary in context, prefer the sense that fits local syntax and discourse role, not the most common sense.
Expression of Ideas: Optimize clarity and concision without losing meaning; maintain tone and register; keep logical sequencing and transitions (cause→effect, contrast, example, concession).

Standard English Conventions (rule pack):
Sentence boundaries and comma splice: Independent clauses need period, semicolon, or comma plus FANBOYS; colon introduces explanation or list; dash pair or comma pair encloses nonrestrictive.
Agreement: Subject–verb; pronoun–antecedent (number, person, clarity). Indefinite pronouns (each, everyone) are singular.
Pronouns and case: who/whom; I/me; ambiguous references are wrong.
Verb tense and sequence: timeline consistency; conditional or subjunctive ("If I were..."); simple versus perfect aspect for completed action.
Modifiers: place next to the noun they modify; avoid danglers; maintain parallelism in lists or comparisons.
Comparison and idiom: fewer/less, between/among, adopt/adapt, compared with vs to, as/like, means of, different from.
Punctuation essentials: nonrestrictive equals comma pair; restrictive equals no commas; semicolon joins related independent clauses; colon after an independent clause only.
Apostrophes: singular vs plural possession; it's/its.
Concision rule: When two choices are both grammatical and preserve meaning, choose the shortest.

Final Check (before output)
The chosen answer must be directly supported by your evidence list.
Elimination notes should name a specific flaw category (see taxonomy).
Output the JSON only.`;

// EBRW concurrent quartet models
const EBRW_MODELS = [
  'anthropic/claude-opus-4.1',
  'openai/gpt-5',
  'x-ai/grok-4'
];

export class EBRWSolver {
  constructor() {}

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const timeoutMs = 60000; // 60s total timeout - more time for Grok
    console.log(`🔄 EBRW solver starting concurrent trio (${timeoutMs}ms timeout)...`);
    
    try {
      // Dispatch all four models concurrently
      const individualTimeout = Math.min(timeoutMs * 0.9, 70000); // 90% of total timeout, max 70s
      
      const results = await this.raceForResults(item, individualTimeout, timeoutMs);
      
      console.log(`🔄 EBRW models completed: ${results.length}/${EBRW_MODELS.length} successful`);
      console.log(`🔄 EBRW individual results:`, results.map(r => `${r.model}: ${r.final} (${(r.confidence * 100).toFixed(1)}%)`));
      
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
    const fastModels = ['anthropic/claude-opus-4.1', 'openai/gpt-5']; // ~5s latency
    
    const allResults: SolverResult[] = [];
    const promises = EBRW_MODELS.map((model, index) => 
      this.solveWithModelSafe(item, model, individualTimeout).then(result => ({
        result,
        index,
        model
      }))
    );
    
    return new Promise((resolve, reject) => {
      let fastCompleted = 0;
      let totalCompleted = 0;
      let hasResolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          if (allResults.length > 0) {
            console.log(`⏱️ EBRW timeout after ${totalTimeout}ms with ${allResults.length} results, proceeding...`);
            resolve(allResults);
          } else {
            reject(new Error('EBRW total timeout with no results'));
          }
        }
      }, totalTimeout);
      
      const checkEarlyConsensus = () => {
        if (hasResolved) return;
        
        const fastResults = allResults.filter(r => fastModels.includes(r.model));
        
        // If we have both fast models and they agree, return immediately
        if (fastResults.length === 2) {
          const [result1, result2] = fastResults;
          if (result1.final === result2.final) {
            hasResolved = true;
            clearTimeout(timeoutId);
            console.log(`🚀 EBRW early consensus: ${result1.final} (both fast models agree, skipping Grok)`);
            resolve(fastResults);
            return;
          } else {
            console.log(`🔄 EBRW fast models disagree: ${result1.final} vs ${result2.final}, waiting for Grok...`);
          }
        }
      };
      
      promises.forEach(promise => {
        promise.then(({ result }) => {
          if (!hasResolved && result.confidence > 0.1) {
            allResults.push(result);
            console.log(`✅ EBRW ${result.model} completed: ${result.final} (${result.confidence.toFixed(2)})`);
            
            // Track completion
            if (fastModels.includes(result.model)) {
              fastCompleted++;
            }
            totalCompleted++;
            
            // Check for early consensus after each fast model completes
            checkEarlyConsensus();
            
            // All models completed
            if (totalCompleted >= EBRW_MODELS.length) {
              hasResolved = true;
              clearTimeout(timeoutId);
              console.log(`🚀 EBRW all models completed with ${allResults.length} results`);
              resolve(allResults);
            }
          } else {
            totalCompleted++;
            if (totalCompleted >= EBRW_MODELS.length && !hasResolved) {
              hasResolved = true;
              clearTimeout(timeoutId);
              resolve(allResults);
            }
          }
        }).catch(error => {
          console.warn(`🔄 EBRW model failed:`, error);
          totalCompleted++;
          if (totalCompleted >= EBRW_MODELS.length && !hasResolved) {
            hasResolved = true;
            clearTimeout(timeoutId);
            resolve(allResults);
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
    
    // Create vision message with image and question
    const messages = [];

    if (item.imageBase64) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${SYSTEM_EBRW}

Please solve this SAT EBRW question. Extract the question text and answer choices from the image, then provide your solution.

Domain: ${item.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`
          },
          {
            type: 'image_url',
            image_url: {
              url: item.imageBase64
            }
          }
        ]
      });
    } else {
      // Fallback if no image (shouldn't happen with new architecture)
      messages.push({
        role: 'user',
        content: `${SYSTEM_EBRW}

Problem: ${item.question}

Choices:
${item.choices.map((c, i) => `${String.fromCharCode(65 + i)}) ${c}`).join('\n')}

Domain: ${item.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`
      });
    }
    
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

    // Implement proper majority voting
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

    // Find majority vote
    let maxVotes = 0;
    let majorityAnswer = '';
    
    for (const [answer, votes] of voteCounts) {
      if (votes > maxVotes) {
        maxVotes = votes;
        majorityAnswer = answer;
      }
    }

    console.log(`🔄 EBRW vote breakdown:`, Array.from(voteCounts.entries()).map(([ans, count]) => `${ans}: ${count} votes`));
    console.log(`🔄 EBRW majority winner: ${majorityAnswer} with ${maxVotes} votes`);

    // Use majority vote (even if it's just 1 vote, pick the one with highest confidence)
    const majorityResults = votesByAnswer.get(majorityAnswer)!;
    return majorityResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
    );
  }
}