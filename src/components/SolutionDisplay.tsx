import { RoutedItem, SolverResult } from '../types/sat';
import { runPython } from '../lib/pythonSandbox';
import { openrouterClient } from './model-clients';

const SYSTEM_MATH = `You are an expert SAT Math solver with Python programming capabilities.

CRITICAL REQUIREMENTS:
1. ALWAYS provide working Python code that solves the problem step-by-step
2. Use sympy for symbolic math, numpy for numerical calculations
3. The Python code MUST set a 'result' variable with the final answer
4. For multiple choice, return the LETTER (A, B, C, D) as the result
5. For grid-in, return the NUMERIC value as the result

Available Python libraries:
- sympy (import as: from sympy import *)
- numpy (import as: import numpy as np)  
- math, fractions, statistics

Template structure:
{
  "answer": "A|B|C|D|numeric_value",
  "confidence": 0.0-1.0,
  "method": "symbolic|numeric|hybrid",
  "explanation": "Brief 1-2 sentence explanation",
  "python_code": "# Python code that solves the problem
from sympy import *
# Your solution code here
result = 'A'  # or numeric value"
}

Example for polynomial addition:
{
  "answer": "C",
  "confidence": 0.95,
  "method": "symbolic", 
  "explanation": "Combine like terms in both polynomials",
  "python_code": "from sympy import *
x = symbols('x')
expr1 = 2*x**2 + x - 9
expr2 = x**2 + 6*x + 1
simplified = expr1 + expr2
result = 'C'"
}

Always include working Python code that can be executed to verify your answer.`;

// Math concurrent trio models
const MATH_MODELS = [
  'openai/gpt-5',
  'x-ai/grok-4',
  'qwen/qwen3-235b-a22b-thinking-2507'
];

export class MathSolver {
  constructor() {}

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const timeoutMs = 45000; // 45s total timeout for speed
    console.log(`🔄 Math solver starting concurrent trio with early return (${timeoutMs}ms timeout)...`);
    
    try {
      // Dispatch all three models concurrently with aggressive timeouts
      const individualTimeout = Math.min(timeoutMs * 0.7, 35000); // 70% of total timeout, max 35s
      
      // Return as soon as we get 2+ successful results OR all complete OR timeout
      const results = await this.raceForResults(item, individualTimeout, timeoutMs);
      
      console.log(`🔄 Math models completed: ${results.length}/${MATH_MODELS.length} successful`);
      
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
  
  private async raceForResults(item: RoutedItem, individualTimeout: number, totalTimeout: number): Promise<SolverResult[]> {
    const results: SolverResult[] = [];
    const promises = MATH_MODELS.map((model, index) => 
      this.solveWithModelSafe(item, model, individualTimeout).then(result => ({
        result,
        index,
        model
      }))
    );
    
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasResolved = false;
      
      // Overall timeout
      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          if (results.length > 0) {
            console.log(`⏱️ Math timeout with ${results.length} results, proceeding...`);
            resolve(results);
          } else {
            reject(new Error('Math total timeout with no results'));
          }
        }
      }, totalTimeout);
      
      promises.forEach(promise => {
        promise.then(({ result }) => {
          if (!hasResolved && result.confidence > 0.15) { // Filter out obvious fallbacks
            results.push(result);
            console.log(`✅ Math ${result.model} completed: ${result.final} (${result.confidence.toFixed(2)})`);
            
            // Return early if we have 2+ good results (especially with Python verification)
            const pythonVerified = results.filter(r => r.meta.pythonResult?.ok).length;
            if ((pythonVerified >= 2) || 
                (results.length >= 2 && results.some(r => r.confidence > 0.8)) ||
                results.length >= 3) {
              hasResolved = true;
              clearTimeout(timeoutId);
              console.log(`🚀 Math early return with ${results.length} results (${pythonVerified} Python verified)`);
              resolve(results);
              return;
            }
          }
          
          completed++;
          // If all models completed, return what we have
          if (completed >= MATH_MODELS.length && !hasResolved) {
            hasResolved = true;
            clearTimeout(timeoutId);
            resolve(results);
          }
        }).catch(error => {
          console.warn(`Math model failed:`, error);
          completed++;
          if (completed >= MATH_MODELS.length && !hasResolved) {
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
  'This is a grid-in question - provide the numeric answer.'
}

MUST include working Python code that sets 'result' variable.`;
      
      messages = [
        { 
          role: 'user', 
          content: `${SYSTEM_MATH}

${userPrompt}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.` 
        }
      ];
    }
    
    const response = await openrouterClient(model, messages, {
      temperature: 0.05,
      max_tokens: 4000,
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
    
    // Execute Python code if provided
    let pythonResult = null;
    let finalAnswer = result.answer;
    let finalConfidence = result.confidence;
    
    if (result.python_code) {
      console.log(`🐍 Executing Python verification code for ${model}...`);
      try {
        pythonResult = await runPython(result.python_code);
        
        if (pythonResult.ok) {
          const pythonAnswer = String(pythonResult.result);
          console.log(`🐍 ${model} Python result: ${pythonAnswer}, Model answer: ${finalAnswer}`);
          
          // Smart comparison between Python result and model answer
          if (this.compareAnswers(pythonAnswer, finalAnswer, item.choices)) {
            console.log(`✅ ${model} Python verification confirms model answer`);
            finalConfidence = Math.min(0.98, finalConfidence + 0.20); // +20% boost for Python confirmation
          } else {
            // Check if Python result matches any of the choices
            const matchingChoice = this.findMatchingChoice(pythonAnswer, item.choices);
            if (matchingChoice) {
              console.log(`🔄 ${model} Python result matches choice ${matchingChoice}, overriding model answer`);
              finalAnswer = matchingChoice;
              finalConfidence = Math.min(0.95, finalConfidence + 0.15); // +15% boost but override answer
            } else {
              console.log(`⚠️ ${model} Python result (${pythonAnswer}) doesn't match model answer (${finalAnswer}) or any choice`);
              finalConfidence *= 0.8; // Reduce confidence for disagreement
            }
          }
        } else {
          console.log(`❌ ${model} Python execution failed: ${pythonResult.error}`);
          finalConfidence *= 0.85; // Small penalty for failed Python execution
        }
      } catch (error) {
        console.error(`${model} Python execution error:`, error);
        finalConfidence *= 0.85;
      }
    } else {
      console.log(`⚠️ ${model} No Python code provided`);
      finalConfidence *= 0.8; // Penalty for not providing Python code
    }
    
    return {
      final: finalAnswer,
      confidence: Math.max(0.1, Math.min(1.0, finalConfidence)),
      meta: {
        method: result.method,
        explanation: result.explanation,
        python: result.python_code,
        pythonResult: pythonResult,
        checks: ['python_execution', 'symbolic_verification']
      },
      model
    };
  }

  private async selectBestMathResult(results: SolverResult[]): Promise<SolverResult> {
    if (results.length === 1) {
      return results[0];
    }

    // Prioritize results with successful Python verification
    const verifiedResults = results.filter(r => r.meta.pythonResult?.ok);
    
    if (verifiedResults.length > 0) {
      // Among verified results, look for consensus
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

      // Find consensus among verified results
      let maxVotes = 0;
      let consensusAnswer = '';
      
      for (const [answer, votes] of voteCounts) {
        if (votes > maxVotes) {
          maxVotes = votes;
          consensusAnswer = answer;
        }
      }

      // If we have consensus among verified results, use highest confidence from that group
      if (maxVotes > 1) {
        const consensusResults = votesByAnswer.get(consensusAnswer)!;
        return consensusResults.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
      }

      // No consensus among verified - return highest confidence verified result
      return verifiedResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // No verified results - fall back to highest confidence overall
    return results.reduce((best, current) => 
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