import { RoutedItem, SolverResult } from '../../types/sat';
import { runPython } from '../lib/pythonSandbox';

const SYSTEM_MATH = `You are an expert SAT Math solver with computational verification capabilities.

CRITICAL: You MUST provide step-by-step Python code using sympy/numpy for verification.

When given an image, analyze the SAT math question directly from the image. Extract the problem, numbers, and answer choices, then solve systematically.

For multiple choice: Return the letter (A, B, C, D) that matches your computed result.
For grid-in: Return the exact numeric value or simplified expression.

Use these Python libraries (already imported):
- sympy (as 'symbols', 'solve', 'simplify', 'expand', 'factor', etc.)
- numpy as np
- math, statistics, itertools, Fraction

MANDATORY: Your response must include working Python code that:
1. Defines variables using symbols('x y z') 
2. Sets up equations/expressions from the problem
3. Solves step-by-step using sympy
4. Assigns final answer to variable 'result'

Example Python structure:
# Define variables
x = symbols('x')
# Set up the problem
equation = Eq(2*x + 3, 7)
# Solve
solution = solve(equation, x)[0]
# Verify
result = solution  # This becomes the final answer

Return ONLY valid JSON:
{
  "final_answer": "A|B|C|D|numeric_value", 
  "confidence_0_1": 0.0-1.0,
  "method": "symbolic|numeric|hybrid",
  "short_explanation": "≤2 sentences explaining approach", 
  "python_code": "working Python code with result variable",
  "checks": ["substitute_back", "domain", "units"]
}`;

export class MathSolver {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async solve(item: RoutedItem, timeoutMs = 45000): Promise<SolverResult> {
    const startTime = Date.now();
    console.log('🔄 Math solver starting...');
    
    try {
      // Primary solve with o4-mini
      const primaryResult = await this.solvePrimary(item, Math.min(timeoutMs * 0.8, 35000));
      console.log(`✅ Math solver completed: ${primaryResult.final} (confidence: ${primaryResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      
      return primaryResult;
    } catch (error) {
      console.error('Math solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(item: RoutedItem, timeoutMs = 30000): Promise<SolverResult> {
    console.log('🔄 Math primary solver starting...');
    
    let messages;
    
    if (item.imageBase64) {
      // Image-first approach
      messages = [
        { role: 'system', content: SYSTEM_MATH },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Domain: ${item.subdomain}

Extract and solve this SAT math question from the image. Provide working Python code for verification.

${item.choices.length > 0 ? 'Multiple choice - return the letter A, B, C, or D.' : 'Grid-in question - return the exact numeric value.'}`
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
      // Text-based fallback
      const userPrompt = `Domain: ${item.subdomain}

${item.fullText}

${item.choices.length > 0 ? 
  `Choices:\n${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` : 
  'Grid-in question: Provide the exact numeric answer.'}`;
      
      messages = [
        { role: 'system', content: SYSTEM_MATH },
        { role: 'user', content: userPrompt }
      ];
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o1-mini',
        messages,
        max_completion_tokens: 3000,
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
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON response:', content);
      throw new Error('Invalid JSON response from model');
    }
    
    // Execute Python code if provided
    let pythonResult = null;
    let finalAnswer = result.final_answer;
    let confidence = result.confidence_0_1;
    
    if (result.python_code) {
      console.log('🐍 Executing Python verification code...');
      try {
        pythonResult = await runPython(result.python_code);
        console.log('Python execution result:', pythonResult);
        
        if (pythonResult.ok) {
          const computedAnswer = String(pythonResult.result);
          
          // Compare Python result with model answer
          const comparison = this.compareAnswers(computedAnswer, finalAnswer, item.choices);
          
          if (comparison.match) {
            // Python confirms the answer - boost confidence
            confidence = Math.min(1.0, confidence + 0.20);
            console.log(`✅ Python verification successful: ${computedAnswer} matches choice ${finalAnswer}`);
          } else if (comparison.matchesChoice) {
            // Python result matches a different choice - override the answer
            finalAnswer = comparison.matchedChoice!;
            confidence = Math.min(1.0, confidence + 0.15);
            console.log(`🔄 Python override: changing answer to ${finalAnswer} based on computation ${computedAnswer}`);
          } else {
            // Python result doesn't match any choice clearly
            confidence = Math.max(0.3, confidence - 0.10);
            console.warn(`⚠️ Python result ${computedAnswer} doesn't clearly match any choice`);
          }
        } else {
          console.warn('Python execution failed:', pythonResult.error);
          confidence = Math.max(0.4, confidence - 0.15);
        }
      } catch (error) {
        console.error('Python execution error:', error);
        confidence = Math.max(0.4, confidence - 0.15);
      }
    } else {
      console.warn('No Python code provided - applying penalty');
      confidence = Math.max(0.3, confidence - 0.15);
    }
    
    return {
      final: finalAnswer,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      meta: {
        method: result.method || 'hybrid',
        explanation: result.short_explanation,
        checks: result.checks || ['basic_verification'],
        python: result.python_code,
        pythonResult: pythonResult
      },
      model: 'o4-mini'
    };
  }

  private compareAnswers(pythonResult: string, modelAnswer: string, choices: string[]): {
    match: boolean;
    matchesChoice: boolean;
    matchedChoice?: string;
  } {
    // Direct string comparison (for grid-in or exact matches)
    if (this.normalizeAnswer(pythonResult) === this.normalizeAnswer(modelAnswer)) {
      return { match: true, matchesChoice: false };
    }

    // For multiple choice, check if Python result matches the content of any choice
    if (choices.length > 0) {
      for (let i = 0; i < choices.length; i++) {
        const choiceLetter = String.fromCharCode(65 + i); // A, B, C, D
        const choiceContent = choices[i];
        
        if (this.mathExpressionMatch(pythonResult, choiceContent)) {
          return {
            match: choiceLetter === modelAnswer,
            matchesChoice: true,
            matchedChoice: choiceLetter
          };
        }
      }
    }

    // No clear match found
    return { match: false, matchesChoice: false };
  }

  private mathExpressionMatch(result: string, choice: string): boolean {
    const cleanResult = this.cleanMathExpression(result);
    const cleanChoice = this.cleanMathExpression(choice);
    
    // Direct string match after cleaning
    if (cleanResult === cleanChoice) {
      return true;
    }
    
    // Try to compare as polynomial expressions
    try {
      const resultCoeffs = this.extractPolynomialCoeffs(cleanResult);
      const choiceCoeffs = this.extractPolynomialCoeffs(cleanChoice);
      
      if (resultCoeffs && choiceCoeffs) {
        return JSON.stringify(resultCoeffs) === JSON.stringify(choiceCoeffs);
      }
    } catch (error) {
      // Ignore parsing errors
    }
    
    // Try numeric comparison
    try {
      const resultNum = parseFloat(cleanResult);
      const choiceNum = parseFloat(cleanChoice);
      
      if (!isNaN(resultNum) && !isNaN(choiceNum)) {
        return Math.abs(resultNum - choiceNum) < 0.001;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    
    return false;
  }

  private cleanMathExpression(expr: string): string {
    return expr
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\*\*/g, '^')  // ** to ^
      .replace(/\*/g, '')     // Remove multiplication signs
      .replace(/\^2/g, '²')   // Convert ^2 to superscript
      .replace(/\^3/g, '³')   // Convert ^3 to superscript
      .replace(/32%/g, '3x²') // OCR error: 32% → 3x²
      .replace(/22%/g, '2x²') // OCR error: 22% → 2x²
      .replace(/7x/g, '7x')   // Ensure 7x is preserved
      .replace(/(\d)([a-z])/g, '$1*$2') // Add multiplication between number and variable
      .replace(/([a-z])(\d)/g, '$1^$2'); // Convert x2 to x^2
  }

  private extractPolynomialCoeffs(expr: string): number[] | null {
    try {
      // Simple polynomial coefficient extraction for expressions like "3x^2 + 7x - 8"
      const terms = expr.replace(/\s+/g, '').split(/(?=[+-])/);
      const coeffs: {[key: number]: number} = {};
      
      for (const term of terms) {
        if (term === '') continue;
        
        // Constant term
        if (!/[a-z]/.test(term)) {
          coeffs[0] = (coeffs[0] || 0) + parseFloat(term);
          continue;
        }
        
        // Extract coefficient and power
        const match = term.match(/([+-]?\d*)[a-z](?:\^?(\d+))?/);
        if (match) {
          const coeff = match[1] === '' || match[1] === '+' ? 1 : 
                       match[1] === '-' ? -1 : 
                       parseFloat(match[1]);
          const power = match[2] ? parseInt(match[2]) : 1;
          coeffs[power] = (coeffs[power] || 0) + coeff;
        }
      }
      
      // Convert to array [constant, x^1, x^2, ...]
      const maxPower = Math.max(...Object.keys(coeffs).map(Number));
      const result = new Array(maxPower + 1).fill(0);
      for (const [power, coeff] of Object.entries(coeffs)) {
        result[parseInt(power)] = coeff;
      }
      
      return result;
    } catch (error) {
      return null;
    }
  }

  private normalizeAnswer(answer: string): string {
    return answer.toString().toLowerCase().trim().replace(/\s+/g, '');
  }
}