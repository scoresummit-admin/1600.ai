import { RoutedItem, SolverResult, EbrwDomain } from '../types/sat';

const SYSTEM_EBRW = `You are an expert SAT EBRW solver.

Return ONLY the JSON schema provided; do not reveal chain-of-thought. Provide a brief explanation and 1–2 evidence items (short direct quotes or a named grammar rule).

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

export class EBRWSolver {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async solve(item: RoutedItem, timeoutMs: number = 12000): Promise<SolverResult> {
    const startTime = Date.now();
    
    try {
      // Primary solve with GPT-5 (low effort)
      const primaryResult = await this.solvePrimary(item, timeoutMs * 0.8);
      
      // Check if escalation is needed
      if (primaryResult.confidence < 0.72 || this.isAmbiguous(primaryResult)) {
        console.log('🔄 EBRW escalating to GPT-5-Thinking...');
        try {
          const escalatedResult = await this.solveEscalated(item, timeoutMs * 0.2);
          
          // Return the higher confidence result
          const finalResult = escalatedResult.confidence > primaryResult.confidence ? escalatedResult : primaryResult;
          console.log(`✅ EBRW solved with escalation: ${finalResult.final} (${finalResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
          return finalResult;
        } catch (error) {
          console.warn('EBRW escalation failed:', error);
        }
      }
      
      console.log(`✅ EBRW solved: ${primaryResult.final} (${primaryResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return primaryResult;
      
    } catch (error) {
      console.error('EBRW solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(item: RoutedItem, timeoutMs: number): Promise<SolverResult> {
    const userPrompt = `Domain: ${item.subdomain}

Question: ${item.normalizedPrompt}

Choices:
${item.choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_EBRW },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        reasoning_effort: 'low'
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
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
      model: 'gpt-5'
    };
  }

  private async solveEscalated(item: RoutedItem, timeoutMs: number): Promise<SolverResult> {
    const userPrompt = `Domain: ${item.subdomain}

This question requires deeper analysis. Previous attempt had low confidence or ambiguity.

Question: ${item.normalizedPrompt}

Choices:
${item.choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o1-preview',
        messages: [
          { role: 'user', content: `${SYSTEM_EBRW}\n\n${userPrompt}` }
        ],
        max_completion_tokens: 1000,
        reasoning_effort: 'medium'
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Handle JSON markdown wrapper
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(content);
    
    return {
      final: result.final_choice,
      confidence: Math.min(0.95, result.confidence_0_1 + 0.1), // Boost confidence for escalated results
      meta: {
        domain: result.domain,
        explanation: result.short_explanation,
        evidence: result.evidence,
        elimination_notes: result.elimination_notes,
        escalated: true
      },
      model: 'gpt-5-thinking'
    };
  }

  private isAmbiguous(result: SolverResult): boolean {
    // Check if elimination notes suggest close competition between options
    const notes = result.meta.elimination_notes || {};
    const noteValues = Object.values(notes) as string[];
    
    // Look for indicators of ambiguity in elimination notes
    const ambiguityIndicators = ['close', 'similar', 'both', 'either', 'unclear', 'possible'];
    return noteValues.some(note => 
      ambiguityIndicators.some(indicator => 
        note.toLowerCase().includes(indicator)
      )
    );
  }
}