import { LLMClient } from './llm-client';
import { MathSolution, MathDomain } from '../types/sat';

export class MathSolver {
  constructor(private llmClient: LLMClient) {}

  async solve(
    prompt: string, 
    choices: string[], 
    domain: MathDomain,
    isGridIn: boolean = false,
    timeoutMs: number = 18000
  ): Promise<MathSolution> {
    const startTime = Date.now();

    try {
      // Primary solver: o4-mini with Python tools
      const primarySolution = await this.solvePrimary(prompt, choices, domain, isGridIn, timeoutMs * 0.7);
      
      // If confidence is very high, return immediately
      if (primarySolution.confidence_0_1 >= 0.9) {
        console.log(`Math solved with high confidence (${primarySolution.confidence_0_1}) in ${Date.now() - startTime}ms`);
        return primarySolution;
      }

      // For lower confidence, get second opinion
      try {
        const secondOpinion = await this.solveWithGPT5Thinking(prompt, choices, domain, isGridIn, timeoutMs * 0.3);
        
        // If solutions agree, boost confidence
        if (this.solutionsAgree(primarySolution, secondOpinion)) {
          primarySolution.confidence_0_1 = Math.min(0.95, primarySolution.confidence_0_1 + 0.1);
          console.log(`Math solutions agreed, boosted confidence to ${primarySolution.confidence_0_1}`);
          return primarySolution;
        } else {
          // Disagreement - return higher confidence solution
          const finalSolution = secondOpinion.confidence_0_1 > primarySolution.confidence_0_1 ? secondOpinion : primarySolution;
          console.log(`Math solutions disagreed, using ${finalSolution.model} solution`);
          return finalSolution;
        }
      } catch (error) {
        console.warn('Math second opinion failed:', error);
        return primarySolution;
      }
    } catch (error) {
      console.error('Math solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(
    prompt: string, 
    choices: string[], 
    domain: MathDomain,
    isGridIn: boolean,
    timeoutMs: number
  ): Promise<MathSolution> {
    const systemPrompt = `You are an expert SAT Math solver with a built-in Python tool.

Constraints:
- Return ONLY the JSON below. Do not reveal chain-of-thought.
- Use a plan → compute → verify flow internally; show only the final answer + brief justification.
- Favor exact arithmetic and symbolic checks. Use Python for calculations, solving, and quick simulations.
- For grid-ins: output the numeric value in "answer_value_or_choice".
- Enforce domains: Algebra; Advanced Math; Problem-Solving & Data Analysis; Geometry & Trigonometry.

Required output (JSON):
{
  "answer_value_or_choice": "A|B|C|D|numeric",
  "confidence_0_1": 0.0-1.0,
  "method": "symbolic|numeric|hybrid",
  "checks": ["substitute_back|units|domain|graph_consistency"],
  "short_explanation": "≤2 sentences stating key step or property"
}

Solve policy:
1) Extract variables, constraints, and what is asked. Randomize option order internally to reduce letter bias; map back to original at the end.
2) If computation is needed, generate minimal Python code to compute. Prefer exact fractions, simplify radicals, and check domain (e.g., exclude extraneous roots).
3) Verify by substituting the result back into the original condition(s) and/or checking units.
4) If multiple choices are close, evaluate each choice programmatically and select the one that satisfies constraints.
5) Never output intermediate workings or code; only the required JSON.`;

    const userPrompt = `Domain: ${domain}
${isGridIn ? 'Grid-in question (numeric answer)' : 'Multiple choice'}

Question: ${prompt}

${!isGridIn ? `Choices:\n${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` : ''}`;

    const pythonTool = {
      type: "function",
      function: {
        name: "python_executor",
        description: "Execute Python code for mathematical calculations",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Python code to execute"
            }
          },
          required: ["code"]
        }
      }
    };

    const response = await this.llmClient.callModel('o4-mini', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.1,
      max_tokens: 1000,
      tools: [pythonTool],
      timeout_ms: timeoutMs
    });

    const result = JSON.parse(response.content);
    
    return {
      answer_value_or_choice: result.answer_value_or_choice,
      confidence_0_1: result.confidence_0_1,
      method: result.method || 'hybrid',
      checks: result.checks || ['substitute_back'],
      short_explanation: result.short_explanation,
      model: 'o4-mini',
      code_hash: this.generateCodeHash(response.content)
    };
  }

  private async solveWithGPT5Thinking(
    prompt: string, 
    choices: string[], 
    _domain: MathDomain,
    isGridIn: boolean,
    timeoutMs: number
  ): Promise<MathSolution> {
    const systemPrompt = `You are an expert SAT Math solver. Use deep reasoning to solve this problem.

Return ONLY valid JSON:
{
  "answer_value_or_choice": "${isGridIn ? 'numeric_value' : 'A|B|C|D'}",
  "confidence_0_1": 0.0-1.0,
  "method": "symbolic|numeric|hybrid",
  "checks": ["verification_methods"],
  "short_explanation": "Key insight in ≤2 sentences"
}`;

    const userPrompt = `${prompt}

${!isGridIn ? choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n') : ''}`;

    const response = await this.llmClient.callModel('gpt-5-thinking', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      reasoning_effort: 'medium',
      temperature: 0.1,
      max_tokens: 800,
      timeout_ms: timeoutMs
    });

    const result = JSON.parse(response.content);
    
    return {
      answer_value_or_choice: result.answer_value_or_choice,
      confidence_0_1: result.confidence_0_1,
      method: result.method || 'symbolic',
      checks: result.checks || ['domain'],
      short_explanation: result.short_explanation,
      model: 'gpt-5-thinking'
    };
  }

  // Google Gemini for additional mathematical verification
  async solveWithGemini(
    prompt: string, 
    choices: string[], 
    _domain: MathDomain,
    isGridIn: boolean,
    timeoutMs: number = 10000
  ): Promise<MathSolution> {
    const systemPrompt = `You are an expert SAT Math solver. Solve step-by-step and return JSON.

{
  "answer_value_or_choice": "${isGridIn ? 'numeric' : 'A|B|C|D'}",
  "confidence_0_1": 0.0-1.0,
  "method": "symbolic|numeric|hybrid",
  "checks": ["verification_methods"],
  "short_explanation": "Key mathematical insight"
}`;

    const fullPrompt = `${systemPrompt}

Question: ${prompt}

${!isGridIn ? `Choices:\n${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` : ''}`;

    const response = await this.llmClient.callModel('gemini-2.5-pro', [
      { role: 'user', content: fullPrompt }
    ], {
      temperature: 0.1,
      max_tokens: 800,
      timeout_ms: timeoutMs
    });

    const result = JSON.parse(response.content);
    
    return {
      answer_value_or_choice: result.answer_value_or_choice,
      confidence_0_1: result.confidence_0_1,
      method: result.method || 'numeric',
      checks: result.checks || ['substitute_back'],
      short_explanation: result.short_explanation,
      model: 'gemini-2.5-pro'
    };
  }

  private solutionsAgree(sol1: MathSolution, sol2: MathSolution): boolean {
    return sol1.answer_value_or_choice === sol2.answer_value_or_choice;
  }

  private generateCodeHash(content: string): string {
    // Simple hash for code tracking
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}