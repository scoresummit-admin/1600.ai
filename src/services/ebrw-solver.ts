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

=====================================================
R&W: EXPRESSION OF IDEAS PLAYBOOK (HIGH PRIORITY)
(“Expression of Ideas” = revise to improve effectiveness for a SPECIFIED rhetorical goal: clarity, cohesion, accuracy, and purpose alignment.)
=====================================================

1) TRANSITIONS (relationship logic first, word choice second)
   - Identify the relationship between the prior and next idea:
     * Addition/Continuation → "also", "furthermore", "moreover"
     * Contrast/Concession → "however", "nevertheless", "though", "whereas"
     * Cause/Effect → "therefore", "consequently", "thus", "so"
     * Example/Illustration → "for example", "for instance"
     * Emphasis → "indeed", "in fact"
     * Sequence/Time → "then", "subsequently", "earlier", "finally"
     * Comparison/Similarity → "likewise", "similarly"
   - Algorithm:
     a) Read the sentence before and after the blank; summarize each in 3–5 mental words.
     b) Choose the transition category that preserves the *exact* logical link.
     c) Prefer the simplest, non-redundant option; avoid double-marking (e.g., “But however,”).
     d) Check punctuation compatibility: conjunctive adverbs (e.g., "however") need proper clause joining (semicolon/period), while FANBOYS join with a comma.
     e) Re-read with the candidate in place; if meaning shifts or redundancy appears, reject.

2) RHETORICAL SYNTHESIS (meet the stated goal precisely)
   - Read the directive (e.g., “Which option best accomplishes the goal of emphasizing ___ / summarizing ___ / highlighting contrast / matching audience ____?”).
   - Choose the option that:
     a) DIRECTLY addresses the specified goal words,
     b) Uses only supportable information from the notes/passage,
     c) Preserves tone/register and avoids exaggeration or new, unsupported claims,
     d) Maximizes clarity and concision (no fluff, no hedging unless required).
   - If two options are plausible, prefer the one with narrower, more directly targeted language over vague generalities.

3) CONCISION & PRECISION (delete needless words; keep meaning exact)
   - Replace wordy phrases with concise equivalents:
     * “due to the fact that” → “because”
     * “in order to” → “to”
     * “is a person who” → “is”
     * “at this point in time” → “now”
   - Eliminate redundancy (“each and every”, “various different”).
   - Prefer precise verbs over weak verb + noun (“make a decision” → “decide”).
   - Avoid ambiguous pronouns; specify the noun if clarity improves.

4) TONE & STYLE CONSISTENCY
   - Match the passage’s formality and perspective.
   - Avoid colloquialisms or loaded/emotional terms in academic contexts unless the source tone is informal.

5) ADD/DELETE SENTENCE DECISIONS
   - ADD only if new sentence clearly advances the stated purpose (e.g., clearer example, necessary contrast, key outcome).
   - DELETE if irrelevant, redundant, off-tone, or contradicts the author goal.
   - When asked to select a sentence that “best introduces/concludes,” ensure it encapsulates the paragraph’s main point without adding new, unaddressed details.

6) ORGANIZATION / SENTENCE PLACEMENT (if applicable)
   - The chosen location must maintain chronological or logical progression and avoid premature references (no pronoun “this/these/these findings” before antecedent).

Final Check (before output)
The chosen answer must be directly supported by your evidence list.
Elimination notes should name a specific flaw category (see taxonomy).
Output the JSON only.`;

// EBRW solver uses OpenAI O3 Pro exclusively (transcription still provided by o4 pipeline)
const EBRW_MODELS = [
  'openai/o3-pro'
];

export class EBRWSolver {
  constructor() {}

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const timeoutMs = 80000; // 80s total timeout - more time for Grok
    console.log(`🔄 EBRW solver starting with ${EBRW_MODELS.length} model(s) (${timeoutMs}ms timeout)...`);
    
    try {
      // Dispatch all configured models concurrently
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
        
        // If we have at least two models and they agree, return immediately
        if (allResults.length >= 2) {
          const [result1, result2] = allResults;
          if (result1.final === result2.final) {
            hasResolved = true;
            clearTimeout(timeoutId);
            console.log(`🚀 EBRW early consensus: ${result1.final} (both models agree)`);
            resolve(allResults);
            return;
          } else {
            console.log(`🔄 EBRW models disagree: ${result1.final} vs ${result2.final}`);
          }
        }
      };
      
      promises.forEach(promise => {
        promise.then(({ result }) => {
          if (!hasResolved && result.confidence > 0.1) {
            allResults.push(result);
            console.log(`✅ EBRW ${result.model} completed: ${result.final} (${result.confidence.toFixed(2)})`);
            
            // Track completion
            fastCompleted++;
            totalCompleted++;
            
            // Check for early consensus after each model completes
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
    
    // Create message - prefer extracted text over image for EBRW
    const messages = [];

    if (item.question && item.choices.length > 0) {
      // Use extracted text (preferred for EBRW)
      messages.push({
        role: 'user',
        content: `${SYSTEM_EBRW}

Problem: ${item.question}

Choices:
${item.choices.map((c, i) => `${String.fromCharCode(65 + i)}) ${c}`).join('\n')}

Domain: ${item.subdomain}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`
      });
    } else if (item.imageBase64) {
      // Fallback to image if text extraction failed
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
      // Final fallback
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
      max_tokens: 5000,
      timeout_ms: timeoutMs
    });
    
    let result;
    try {
      // More aggressive cleaning for Grok's response format
      const cleanedResponse = response.text
        .replace(/```json\s*/g, '')
        .replace(/\s*```/g, '')
        .replace(/^[^{]*/, '') // Remove any text before the first {
        .replace(/}[^}]*$/, '}') // Remove any text after the last }
        .trim();
      
      // If still no valid JSON structure, try to find JSON object
      if (!cleanedResponse.startsWith('{')) {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          result = JSON.parse(extractedJson);
        } else {
          throw new Error('No valid JSON object found in response');
        }
      } else {
        result = JSON.parse(cleanedResponse);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${model} JSON parse error:`, error);
      console.error(`${model} raw response:`, response.text.substring(0, 1000) + '...');
      throw new Error(`Invalid JSON response from ${model}: ${errorMessage}`);
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