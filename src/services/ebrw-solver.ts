import { RoutedItem, SolverResult } from '../../types/sat';

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

export class EBRWSolver {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async solve(item: RoutedItem, timeoutMs = 12000): Promise<SolverResult> {
    const startTime = Date.now();
    console.log('🔄 EBRW solver starting with timeout:', Math.min(timeoutMs, 45000));
    
    try {
      // Primary solve with GPT-5 (low effort)
      const primaryResult = await this.solvePrimary(item, Math.min(timeoutMs * 0.7, 30000));
      
      // Check if escalation is needed
      if (primaryResult.confidence < 0.75) {
        console.log('🔄 EBRW escalating to GPT-5-Thinking...');
        try {
          const escalatedResult = await this.solveEscalated(item, Math.min(timeoutMs * 0.3, 20000));
          
          // Return the higher confidence result
          const finalResult = {
            ...escalatedResult,
            meta: {
              ...escalatedResult.meta,
              primaryResult: primaryResult.final,
              escalated: true
            }
          };
          console.log(`✅ EBRW solved with escalation: ${finalResult.final} (${finalResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
          return finalResult;
        } catch (error) {
          console.warn('EBRW escalation failed:', error);
          primaryResult.meta.escalationFailed = true;
        }
      }
      
      console.log(`✅ EBRW solved: ${primaryResult.final} (${primaryResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return primaryResult;
    } catch (error) {
      console.error('EBRW solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(item: RoutedItem, timeoutMs = 12000): Promise<SolverResult> {
    console.log('🔄 EBRW primary solver starting with timeout:', timeoutMs);
    
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

Extract the passage, question, and choices from this SAT image, then solve it. Focus on providing 1-2 short, direct quotes as evidence.`
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
        { role: 'user', content: userPrompt }
      ];
    }
    
    console.log('📡 Making OpenAI API call for EBRW solving...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages,
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received');
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

  private async solveEscalated(item: RoutedItem, timeoutMs = 10000): Promise<SolverResult> {
    console.log('🔄 EBRW escalated solver starting with timeout:', timeoutMs);
    
    let messages;
    
    if (item.imageBase64) {
      // Image-first approach for escalation
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${SYSTEM_EBRW}

Domain: ${item.subdomain}

This question requires deeper analysis. Previous attempt had low confidence or ambiguity.

Extract the passage, question, and choices from this SAT image, then provide a thorough analysis. Focus on providing precise, short quotes as evidence.`
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
      // Fallback to text-based escalation
      const userPrompt = `Domain: ${item.subdomain}

This question requires deeper analysis. Previous attempt had low confidence or ambiguity.

${item.fullText}

Choices:
${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;
      
      messages = [
        { role: 'user', content: `${SYSTEM_EBRW}\n\n${userPrompt}` }
      ];
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-thinking',
        messages,
        max_completion_tokens: 3000,
        reasoning_effort: 'high'
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
      confidence: Math.min(0.98, result.confidence_0_1 + 0.15), // Boost confidence for deep reasoning
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
}