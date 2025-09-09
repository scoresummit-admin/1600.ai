import { LLMClient } from './llm-client';
import { EBRWSolution, EBRWDomain } from '../types/sat';

export class EBRWSolver {
  constructor(private llmClient: LLMClient) {}

  async solve(
    prompt: string, 
    choices: string[], 
    domain: EBRWDomain,
    timeoutMs: number = 15000
  ): Promise<EBRWSolution> {
    const startTime = Date.now();

    try {
      // Primary solver: GPT-5 with low reasoning effort
      const primarySolution = await this.solvePrimary(prompt, choices, domain, timeoutMs * 0.6);
      
      // If confidence is high, return immediately
      if (primarySolution.confidence_0_1 >= 0.85) {
        console.log(`EBRW solved with high confidence (${primarySolution.confidence_0_1}) in ${Date.now() - startTime}ms`);
        return primarySolution;
      }

      // Cross-check with Claude 3.5 Sonnet for lower confidence answers
      try {
        const crossCheck = await this.solveCrossCheck(prompt, choices, domain, timeoutMs * 0.4);
        
        // If models agree, boost confidence
        if (crossCheck.final_choice === primarySolution.final_choice) {
          primarySolution.confidence_0_1 = Math.min(0.95, primarySolution.confidence_0_1 + 0.15);
          console.log(`EBRW models agreed, boosted confidence to ${primarySolution.confidence_0_1}`);
        } else {
          // Models disagree - return higher confidence solution
          const finalSolution = crossCheck.confidence_0_1 > primarySolution.confidence_0_1 ? crossCheck : primarySolution;
          console.log(`EBRW models disagreed, using ${finalSolution.model} solution`);
          return finalSolution;
        }
      } catch (error) {
        console.warn('EBRW cross-check failed:', error);
      }

      return primarySolution;
    } catch (error) {
      console.error('EBRW solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(
    prompt: string, 
    choices: string[], 
    domain: EBRWDomain,
    timeoutMs: number
  ): Promise<EBRWSolution> {
    const systemPrompt = `You are an expert SAT EBRW solver.

Constraints:
- Return ONLY the JSON schema below. Do not reveal chain-of-thought.
- Provide a short, exam-appropriate explanation (1–2 sentences) and 1–2 evidence items (either brief quotes from the given passage OR the exact grammar rule name). No step-by-step reasoning.
- Obey the section domains: Craft & Structure; Information & Ideas; Standard English Conventions; Expression of Ideas.
- If options are paraphrases, prefer the one that is most precise, concise, and consistent with the author's purpose and tone.

Required output (JSON):
{
  "final_choice": "A|B|C|D",
  "confidence_0_1": 0.0-1.0,
  "domain": "craft_structure|information_ideas|standard_english_conventions|expression_of_ideas",
  "short_explanation": "≤2 sentences.",
  "evidence": ["short quote or grammar rule", "optional second item"],
  "elimination_notes": {"A":"≤8 words","B":"≤8 words","C":"≤8 words","D":"≤8 words"}
}

Instructions:
1) Parse the item and options. If Standard English Conventions, name the rule (e.g., "subject–verb agreement," "modifier placement," "comma splice," "parallelism," "pronoun case," "apostrophe/plural," "comma with nonessential appositive").
2) If Craft & Structure or Information & Ideas, quote 3–8 words from the passage that directly support your answer (no ellipses mid-quote).
3) If two options seem viable, pick the one that best fits concision and cohesion.
4) Never copy the entire passage; only short quotes. Never include private chain-of-thought.`;

    const userPrompt = `Domain: ${domain}

Question: ${prompt}

Choices:
${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    const response = await this.llmClient.callModel('gpt-5', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.2,
      max_tokens: 800,
      timeout_ms: timeoutMs
    });

    // Handle both wrapped and unwrapped JSON responses
    let jsonContent = response.content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(jsonContent);
    
    return {
      final_choice: result.final_choice,
      confidence_0_1: result.confidence_0_1,
      domain: result.domain || domain,
      short_explanation: result.short_explanation,
      evidence: result.evidence || [],
      elimination_notes: result.elimination_notes || {},
      model: 'gpt-5'
    };
  }

  async solveCrossCheck(
    prompt: string, 
    choices: string[], 
    domain: EBRWDomain,
    timeoutMs: number
  ): Promise<EBRWSolution> {
    const systemPrompt = `You are an expert SAT EBRW cross-validator. Provide an independent analysis.

Return ONLY valid JSON:
{
  "final_choice": "A|B|C|D",
  "confidence_0_1": 0.0-1.0,
  "domain": "${domain}",
  "short_explanation": "≤2 sentences",
  "evidence": ["brief quote or rule"],
  "elimination_notes": {"A":"reason","B":"reason","C":"reason","D":"reason"}
}

Focus on precision, textual evidence, and grammatical correctness.`;

    const userPrompt = `${prompt}

${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    const response = await this.llmClient.callModel('claude-3.5-sonnet', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.1,
      max_tokens: 600,
      timeout_ms: timeoutMs
    });

    // Handle both wrapped and unwrapped JSON responses
    let jsonContent = response.content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(jsonContent);
    
    return {
      final_choice: result.final_choice,
      confidence_0_1: result.confidence_0_1,
      domain: result.domain || domain,
      short_explanation: result.short_explanation,
      evidence: result.evidence || [],
      elimination_notes: result.elimination_notes || {},
      model: 'claude-3.5-sonnet'
    };
  }

  // Google Gemini as additional validator for complex cases
  async solveWithGemini(
    prompt: string, 
    choices: string[], 
    domain: EBRWDomain,
    timeoutMs: number = 10000
  ): Promise<EBRWSolution> {
    const systemPrompt = `You are an expert SAT EBRW solver. Analyze this question and return only JSON.

{
  "final_choice": "A|B|C|D",
  "confidence_0_1": 0.0-1.0,
  "domain": "${domain}",
  "short_explanation": "Brief explanation",
  "evidence": ["supporting quote or rule"],
  "elimination_notes": {"A":"reason","B":"reason","C":"reason","D":"reason"}
}`;

    const fullPrompt = `${systemPrompt}

Question: ${prompt}

Choices:
${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    const response = await this.llmClient.callModel('gemini-2.5-pro', [
      { role: 'user', content: fullPrompt }
    ], {
      temperature: 0.1,
      max_tokens: 600,
      timeout_ms: timeoutMs
    });

    // Handle both wrapped and unwrapped JSON responses
    let jsonContent = response.content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace /```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(jsonContent);
    
    return {
      final_choice: result.final_choice,
      confidence_0_1: result.confidence_0_1,
      domain: result.domain || domain,
      short_explanation: result.short_explanation,
      evidence: result.evidence || [],
      elimination_notes: result.elimination_notes || {},
      model: 'gemini-2.5-pro'
    };
  }
}