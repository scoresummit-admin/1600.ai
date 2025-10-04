import { RoutedItem, SolverResult } from '../types/sat';
import { runPython } from '../lib/pythonSandbox';
import { openrouterClient } from './model-clients';

const SYSTEM_MATH = `You are an expert SAT Math solver.

Output & Safety Contract
Return ONLY a single JSON object (no extra text or markdown).
Keep explanation ≤2 sentences, no chain-of-thought.
Provide executable Python that works in a restricted sandbox:
No imports (import statements may be blocked).
Pre-injected modules available: sympy as sympy, np (NumPy), math, Fraction from fractions, statistics.
Set a final variable result to either the numeric value (for grid-in) or the selected letter ('A'|'B'|'C'|'D').
Prefer exact math: sympy.Rational, sympy.sqrt, sympy.nsimplify.
No file, network, or plotting. Keep runtime small.

Required JSON
{
"answer": "A|B|C|D|<numeric>",
"confidence_0_1": number,
"method": "symbolic|numeric|hybrid",
"short_explanation": "≤2 sentences",
"python": "# code that computes the final numeric quantity and assigns result"
}

Solve Policy
Parse and formalize variables, constraints, and what is asked.
Compute exactly when feasible (fractions or radicals). If numeric, use rationals or high precision then nsimplify.
Verify:
Substitute back or check constraints (domains: denominators ≠ 0, radicands ≥ 0, log arguments > 0).
If MCQ, compute the target value independently in Python; you may choose the letter in JSON after reasoning (Python should not rely on choices being present).

Formatting
Fractions in lowest terms; radicals simplified; π kept symbolic unless decimal is needed.
For grid-in: produce a plain number (integer, fraction like -3/4, or decimal). No units.

Topic Playbooks
Algebra: linear forms, slopes and intercepts, systems (eliminate or solve), absolute value cases, piecewise boundaries.
Advanced Math: quadratics (vertex or discriminant), polynomials (roots, factors, rational root theorem), rational functions (asymptotes, domains), exponentials and logs (change of base), inverse or compose.
PSDA: ratios, rates, percent, weighted average or mixtures, median or mean, two-way tables, linear models (slope = rate), unit conversions.
Geometry/Trig: similar triangles, circle arc or sector, angle chasing, area or volume, distance or midpoint, Pythagorean and special triangles, basic sin or cos in right triangles, coordinate geometry.

Python Template
# Pre-injected: sympy, np, math, Fraction, statistics
# Do NOT import. Keep prints minimal.

# 1) Define symbols or quantities
x = sympy.Symbol('x')

# 2) Compute target
expr = (x + 3)*(x - 5)
sol = sympy.solve(sympy.Eq(expr, 0), x)

# 3) Choose final numeric value if grid-in; otherwise compute the key quantity.
# Set result at the end:
result = sol  # or a number like Fraction(3,5) or float/int

Final step: Output the JSON only.`;

// Math solver now uses OpenAI O3 Pro exclusively via OpenRouter
const MATH_MODELS = [
  'openai/o3-pro'
];

export class MathSolver {
  constructor() {}

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const timeoutMs = 90000; // 90s overall budget
    console.log(`🔄 Math solver starting with ${MATH_MODELS.length} model(s) (${timeoutMs}ms overall)...`);

    try {
      // Dispatch all configured models (currently single-model)
      const individualTimeout = Math.min(timeoutMs - 5000, 85000); // leave buffer for aggregation

      const results = await this.runConcurrentModels(item, individualTimeout);
      console.log(`🔄 Math models completed: ${results.length}/${MATH_MODELS.length} successful`);
      console.log(`🔄 Math individual results:`, results.map(r => `${r.model}: ${r.final} (${(r.confidence * 100).toFixed(1)}%)`));

      if (results.length === 0) {
        throw new Error('All Math models failed');
      }

      // Select best result based on Python verification and consensus
      const bestResult = await this.selectBestMathResult(results);

      console.log(`✅ Math solved: ${bestResult.final} (${bestResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return bestResult;

    } catch (error) {
      console.error('Math solver error:', error);
      throw error;
    }
  }

  private async runConcurrentModels(item: RoutedItem, timeoutMs: number): Promise<SolverResult[]> {
    const results: SolverResult[] = [];

    for (const model of MATH_MODELS) {
      const result = await this.solveWithModelSafe(item, model, timeoutMs);
      if (result.confidence > 0.1) {
        console.log(`✅ Math ${model} completed: ${result.final} (${result.confidence.toFixed(2)})`);
      } else {
        console.warn(`⚠️ Math ${model} returned low-confidence fallback (${result.final})`);
      }
      results.push(result);
    }

    return results;
  }

  private async solveWithModelSafe(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    try {
      return await this.solveWithModel(item, model, timeoutMs);
    } catch (error) {
      console.warn(`🔄 Math ${model} failed:`, error);
      // Return a low-confidence fallback result instead of throwing
      return {
        final: item.choices.length > 0 ? 'A' : '0',
        confidence: 0.1,
        meta: {
          method: 'fallback',
          explanation: `${model} failed to respond`,
          python: `# ${model} failed\nresult = "${item.choices.length > 0 ? 'A' : '0'}"`,
          pythonResult: { ok: false, error: 'Model timeout/error' },
          checks: ['model_failure']
        },
        model
      };
    }
  }

  private async solveWithModel(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    console.log(`🔄 Math solving with ${model} (${timeoutMs}ms timeout)...`);
    
    // Create vision message with image
    const messages = [];

    if (item.imageBase64) {
      const isGridIn = item.choices.length === 0;
      const questionTypeInstruction = isGridIn 
        ? "This is a grid-in question - provide the numeric answer."
        : "This is a multiple choice question - choose A, B, C, or D.";

      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `${SYSTEM_MATH}

Please solve this SAT Math question. Extract the problem from the image and solve it.

${questionTypeInstruction}

MUST include working Python code that sets 'result' variable.

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
      // Final fallback if no image and no extracted text
      const isGridIn = item.choices.length === 0;
      const userPrompt = isGridIn 
        ? `Problem: ${item.question}\n\nThis is a grid-in question - provide the numeric answer.`
        : `Problem: ${item.question}\n\nChoices:\n${item.choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

      messages.push({
        role: 'user',
        content: `${SYSTEM_MATH}

${userPrompt}

MUST include working Python code that sets 'result' variable.

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.`
      });
    }
    
    const { response, modelUsed } = await this.invokeWithFallback(model, messages, {
      temperature: 0.05,
      max_tokens: 8000,
      timeout_ms: timeoutMs
    });
    
    let result;
    try {
      const cleanedResponse = response.text.replace(/```json\s*|\s*```/g, '').trim();
      result = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error(`${modelUsed} JSON parse error:`, error);
      throw new Error(`Invalid JSON response from ${modelUsed}`);
    }
    
    const rawAnswer = result.answer;
    let finalAnswer = typeof rawAnswer === 'number' ? String(rawAnswer) : (rawAnswer || (item.choices.length > 0 ? 'A' : '0'));
    let finalConfidence = typeof result.confidence_0_1 === 'number' ? result.confidence_0_1 : (typeof result.confidence === 'number' ? result.confidence : 0.5);
    let pythonResult: Awaited<ReturnType<typeof runPython>> = {
      ok: false,
      error: 'No Python code'
    };
    
    // Execute Python code if provided
    if (result.python) {
      try {
        const pythonExecResult = await runPython(result.python);
        pythonResult = pythonExecResult;
        
        if (pythonExecResult.ok) {
          const pythonAnswer = String(pythonExecResult.result).trim();
          console.log(`🐍 ${modelUsed} Python result: ${pythonAnswer}`);
          
          // Compare Python result with model answer
          if (this.compareAnswers(pythonAnswer, finalAnswer, item.choices)) {
            console.log(`✅ ${modelUsed} Python result matches model answer`);
            finalConfidence = Math.min(0.95, finalConfidence + 0.1); // +10% boost for verification
          } else {
            // Check if Python result matches any choice
            const matchingChoice = this.findMatchingChoice(pythonAnswer, item.choices);
            if (matchingChoice) {
              console.log(`🔄 ${modelUsed} Python result matches choice ${matchingChoice}, overriding model answer`);
              finalAnswer = matchingChoice;
              finalConfidence = Math.min(0.95, finalConfidence + 0.15); // +15% boost but override answer
            } else {
              console.log(`⚠️ ${modelUsed} Python result (${pythonAnswer}) doesn't match model answer (${finalAnswer}) or any choice`);
              finalConfidence *= 0.8; // Reduce confidence for disagreement
            }
          }
        } else {
          console.log(`❌ ${modelUsed} Python execution failed: ${pythonResult.error}`);
          finalConfidence *= 0.85; // Small penalty for failed Python execution
        }
      } catch (error) {
        console.error(`${modelUsed} Python execution error:`, error);
        finalConfidence *= 0.85;
      }
    } else {
      console.log(`⚠️ ${modelUsed} No Python code provided`);
      finalConfidence *= 0.8; // Penalty for not providing Python code
    }
    
    return {
      final: finalAnswer,
      confidence: Math.max(0.1, Math.min(1.0, finalConfidence)),
      meta: {
        method: typeof result.method === 'string' ? result.method : undefined,
        explanation: result.short_explanation || result.explanation,
        python: result.python,
        pythonResult: pythonResult,
        checks: ['python_execution', 'symbolic_verification']
      },
      model: modelUsed
    };
  }

  private async invokeWithFallback(
    primaryModel: string,
    messages: Array<{ role: string; content: string | Array<any> }>,
    options: { temperature: number; max_tokens: number; timeout_ms: number }
  ): Promise<{ response: Awaited<ReturnType<typeof openrouterClient>>; modelUsed: string }> {
    try {
      const response = await openrouterClient(primaryModel, messages, options);
      return { response, modelUsed: primaryModel };
    } catch (error) {
      if (primaryModel === 'openai/o3-pro' && this.isVerificationFailure(error)) {
        console.warn('⚠️ Math solver O3 Pro verification error (400). Switching to anthropic/claude-opus-4.1 fallback.');
        try {
          const response = await openrouterClient('anthropic/claude-opus-4.1', messages, options);
          return { response, modelUsed: 'anthropic/claude-opus-4.1' };
        } catch (fallbackError) {
          console.warn('⚠️ Math solver fallback failed after O3 Pro 400:', fallbackError);
          throw error;
        }
      }

      throw error;
    }
  }

  private isVerificationFailure(error: unknown): boolean {
    if (error instanceof Error) {
      return /\b400\b/.test(error.message);
    }

    const message = typeof error === 'string' ? error : '';
    return /\b400\b/.test(message);
  }

  private async selectBestMathResult(results: SolverResult[]): Promise<SolverResult> {
    if (results.length === 1) {
      return results[0];
    }

    // Prioritize results with successful Python verification
    const verifiedResults = results.filter(r => r.meta.pythonResult?.ok);
    
    if (verifiedResults.length > 0) {
      console.log(`🔄 Math ${verifiedResults.length} results have Python verification`);
      
      // Among verified results, look for majority vote
      const voteCounts = new Map<string, number>();
      const votesByAnswer = new Map<string, SolverResult[]>();
      
      verifiedResults.forEach(result => {
        const answer = result.final;
        voteCounts.set(answer, (voteCounts.get(answer) || 0) + 1);
        if (!votesByAnswer.has(answer)) {
          votesByAnswer.set(answer, []);
        }
        votesByAnswer.get(answer)!.push(result);
      });

      // Find majority among verified results
      let maxVotes = 0;
      let majorityAnswer = '';
      
      for (const [answer, votes] of voteCounts) {
        if (votes > maxVotes) {
          maxVotes = votes;
          majorityAnswer = answer;
        }
      }

      console.log(`🔄 Math verified vote breakdown:`, Array.from(voteCounts.entries()).map(([ans, count]) => `${ans}: ${count} votes`));
      console.log(`🔄 Math verified majority winner: ${majorityAnswer} with ${maxVotes} votes`);

      // Use majority from verified results (even if just 1, pick highest confidence)
      const majorityResults = votesByAnswer.get(majorityAnswer)!;
      return majorityResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // No verified results - do majority voting on all results
    console.log(`🔄 Math no Python verification, using all ${results.length} results for majority vote`);
    
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

    let maxVotes = 0;
    let majorityAnswer = '';
    
    for (const [answer, votes] of voteCounts) {
      if (votes > maxVotes) {
        maxVotes = votes;
        majorityAnswer = answer;
      }
    }

    console.log(`🔄 Math all results vote breakdown:`, Array.from(voteCounts.entries()).map(([ans, count]) => `${ans}: ${count} votes`));
    console.log(`🔄 Math all results majority winner: ${majorityAnswer} with ${maxVotes} votes`);

    const majorityResults = votesByAnswer.get(majorityAnswer)!;
    return majorityResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  private compareAnswers(pythonAnswer: string, modelAnswer: string, choices: string[]): boolean {
    // Clean both answers
    const cleanPython = pythonAnswer.trim().toLowerCase();
    const cleanModel = modelAnswer.trim().toLowerCase();
    
    // Direct match
    if (cleanPython === cleanModel) return true;
    
    // If model answer is a letter, check if Python result matches the content of that choice
    if (/^[a-d]$/i.test(modelAnswer)) {
      const choiceIndex = modelAnswer.toUpperCase().charCodeAt(0) - 65;
      if (choiceIndex >= 0 && choiceIndex < choices.length) {
        const choiceContent = this.extractMathExpression(choices[choiceIndex]);
        return this.compareMathExpressions(cleanPython, choiceContent);
      }
    }
    
    // Try numeric comparison
    const num1 = parseFloat(cleanPython);
    const num2 = parseFloat(cleanModel);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      return Math.abs(num1 - num2) < 0.001;
    }
    
    // Try math expression comparison
    return this.compareMathExpressions(cleanPython, cleanModel);
  }

  private findMatchingChoice(pythonAnswer: string, choices: string[]): string | null {
    const cleanPython = pythonAnswer.trim();
    
    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const choiceLetter = String.fromCharCode(65 + i);
      const choiceContent = this.extractMathExpression(choice);
      
      if (this.compareMathExpressions(cleanPython, choiceContent)) {
        return choiceLetter;
      }
    }
    
    return null;
  }

  private extractMathExpression(choiceText: string): string {
    // Handle common OCR errors and extract mathematical expression
    let expression = choiceText
      .replace(/[()]/g, '') // Remove parentheses from choice markers
      .replace(/^\w+\)\s*/, '') // Remove "A) " prefix
      .replace(/^\w+\.\s*/, '') // Remove "A. " prefix
      .replace(/22%/g, '2*x**2') // OCR error: 22% → 2x²
      .replace(/32%/g, '3*x**2') // OCR error: 32% → 3x²
      .replace(/(\d+)%/g, '$1*x**2') // General: N% → Nx²
      .replace(/(\d+)x/g, '$1*x') // Add multiplication: 7x → 7*x
      .replace(/x(\d+)/g, 'x**$1') // Powers: x2 → x**2
      .replace(/\s+/g, '') // Remove spaces
      .trim();
    
    return expression;
  }

  private compareMathExpressions(expr1: string, expr2: string): boolean {
    try {
      // Simple polynomial coefficient comparison
      const coeffs1 = this.extractPolynomialCoefficients(expr1);
      const coeffs2 = this.extractPolynomialCoefficients(expr2);
      
      if (coeffs1 && coeffs2) {
        return (
          Math.abs(coeffs1.x2 - coeffs2.x2) < 0.001 &&
          Math.abs(coeffs1.x1 - coeffs2.x1) < 0.001 &&
          Math.abs(coeffs1.x0 - coeffs2.x0) < 0.001
        );
      }
      
      // String comparison as fallback
      return expr1.replace(/\s/g, '') === expr2.replace(/\s/g, '');
    } catch {
      return false;
    }
  }

  private extractPolynomialCoefficients(expr: string): { x2: number; x1: number; x0: number } | null {
    try {
      // Extract coefficients from expressions like "3*x**2 + 7*x - 8"
      const x2Match = expr.match(/([+-]?\d*)\*?x\*\*2/);
      const x1Match = expr.match(/([+-]?\d*)\*?x(?!\*)/);
      const x0Match = expr.match(/([+-]?\d+)(?![*x])/);
      
      const x2 = x2Match ? (x2Match[1] === '' || x2Match[1] === '+' ? 1 : x2Match[1] === '-' ? -1 : parseFloat(x2Match[1])) : 0;
      const x1 = x1Match ? (x1Match[1] === '' || x1Match[1] === '+' ? 1 : x1Match[1] === '-' ? -1 : parseFloat(x1Match[1])) : 0;
      const x0 = x0Match ? parseFloat(x0Match[1]) : 0;
      
      return { x2, x1, x0 };
    } catch {
      return null;
    }
  }
}