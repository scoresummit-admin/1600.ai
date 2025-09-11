import { RoutedItem, SolverResult } from '../../types/sat';
import { openrouterClient } from './model-clients';

const SYSTEM_EBRW = `You are an expert SAT EBRW solver with image analysis capabilities.

When given an image, analyze the SAT question directly from the image. Extract the passage, question, and answer choices, then solve.

Return ONLY the JSON schema provided; do not reveal chain-of-thought. Provide a brief explanation and 1–2 evidence items (short direct quotes from the passage or a named grammar rule).

Cheat-sheet (for reference; use minimally):
- Craft & Structure: central idea, author's purpose, tone, meaning-in-context, function of a sentence, text structure, logical transitions.
- Information & Ideas: locate support, inference from explicit info, quantitative info in charts/tables, best evidence lines.
- Standard English Conventions (rules to name when applicable):
  • Subject–verb agreement; pronoun–antecedent agreement; pronoun case
  • Modifier placement & dangling modifiers
  • Parallelism (lists, paired constructions: either/or, not only/but also)
  • Verb tense & sequence; conditional mood
  • Punctuation: comma with nonessential appositive/relative clause; comma splice/run-on; semicolon vs comma; colon for explanation/list; dash for interruption
  • Possessives & plurals (its/it's, plural vs possessive), apostrophes
  • Comparison errors (like vs as; fewer/less)
  • Concision & redundancy; idioms & prepositions
- Expression of Ideas: organization, cohesion, precise word choice, concision, maintain tone and style.

Instructions:
1) Parse the item and options. If grammar, NAME the rule you used.
2) For reading questions, quote 3–8 words that directly support your choice (no ellipses mid-quote).
3) Prefer the most precise, concise option consistent with purpose and tone.
4) Output valid JSON only.

Required JSON schema:
{
  "final_choice": "A|B|C|D",
  "confidence_0_1": number,
  "domain": "craft_structure|information_ideas|standard_english_conventions|expression_of_ideas",
  "short_explanation": "≤2 sentences",
  "evidence": ["short quote or grammar rule", "optional second"],
  "elimination_notes": {"A": "...", "B": "...", "C": "...", "D": "..."}
}`;

// EBRW concurrent quartet models
const EBRW_MODELS = [
  'openai/o3',
  'openai/gpt-5',
  'x-ai/grok-4',
  'anthropic/claude-sonnet-4'
];

export class EBRWSolver {
  constructor() {}

  async solve(item: RoutedItem, timeoutMs = 50000): Promise<SolverResult> {
    const startTime = Date.now();
    const actualTimeout = Math.max(timeoutMs, 70000); // Ensure minimum 70s for EBRW
    console.log(`🔄 EBRW solver starting concurrent quartet (${actualTimeout}ms timeout)...`);
    
    try {
      // Dispatch all four models concurrently
      const individualTimeout = Math.min(actualTimeout * 0.8, 60000); // 80% of total timeout, max 60s
      const modelPromises = EBRW_MODELS.map(model => 
        this.solveWithModelSafe(item, model, individualTimeout)
      );
      
      // Wait for all results with overall timeout
      const results = await Promise.race([
        Promise.allSettled(modelPromises),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('EBRW concurrent timeout')), actualTimeout)
        )
      ]);
      
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<SolverResult> => result.status === 'fulfilled')
        .map(result => result.value);
      
      console.log(`🔄 EBRW models completed: ${successfulResults.length}/${EBRW_MODELS.length} successful`);
      
      if (successfulResults.length === 0) {
        throw new Error('All EBRW models failed');
      }
      
      // Select best result based on confidence and consensus
      const bestResult = this.selectBestResult(successfulResults);
      
      console.log(`✅ EBRW solved: ${bestResult.final} (${bestResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return bestResult;
      
    } catch (error) {
      console.error('EBRW solver error:', error);
      throw error;
    }
  }
  
  private async solveWithModelSafe(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    try {
      return await this.solveWithModel(item, model, timeoutMs);
    } catch (error) {
      console.warn(`🔄 EBRW ${model} failed:`, error);
      // Return a low-confidence fallback result instead of throwing
      return {
        final: 'A',
        confidence: 0.1,
        meta: {
          domain: 'information_ideas',
          explanation: `${model} failed to respond`,
          evidence: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          elimination_notes: {}
        },
        model
      };
    }
  }

  private async solveWithModel(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    console.log(`🔄 EBRW solving with ${model} (${timeoutMs}ms timeout)...`);
    
    let messages;
    
    if (item.imageBase64) {
      // Image-first approach
      messages = [
        { role: 'system', content: SYSTEM_EBRW },
        {
          role: 'user',
          content: [
            {
              type: 'text',

              text: `Domain: ${item.subdomain}

Extract the passage, question, and choices from this SAT image, then solve it. Focus on providing 1-2 short, direct quotes as evidence.

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${item.imageBase64}`
              }
            }
          ]
        }
      ];
    } else {
      // Fallback to text-based approach
      const userPrompt = `Domain: ${item.subdomain}

${item.fullText}

Choices:
${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;
      
      messages = [
        { role: 'system', content: SYSTEM_EBRW },
        { role: 'user', content: `${userPrompt}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.` }
      ];
    }
    
    const response = await openrouterClient(model, messages, {
      temperature: 0.05,
      max_tokens: 3000,
      timeout_ms: timeoutMs,
      // Prefer Azure for OpenAI models for better latency
      ...(model.startsWith('openai/') ? {
        provider: { order: ['azure', 'openai'] }
      } : {})
    });

    let content = response.text;
    
    // Handle JSON markdown wrapper
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(content);
    
    return {
      final: result.final_choice,
      confidence: result.confidence_0_1,
      meta: {
        domain: result.domain,
        explanation: result.short_explanation,
        evidence: result.evidence,
        elimination_notes: result.elimination_notes
      },
      model
    };
  }

  private selectBestResult(results: SolverResult[]): SolverResult {
    if (results.length === 1) {
      return results[0];
    }

    // Count votes for each answer
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

    // Find the answer with the most votes
    let maxVotes = 0;
    let consensusAnswer = '';
    
    for (const [answer, votes] of voteCounts) {
      if (votes > maxVotes) {
        maxVotes = votes;
        consensusAnswer = answer;
      }
    }

    // If we have a clear consensus (>50%), use the highest confidence result from that group
    if (maxVotes > results.length / 2) {
      const consensusResults = votesByAnswer.get(consensusAnswer)!;
      return consensusResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // No clear consensus - return the highest confidence result overall
    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }
}