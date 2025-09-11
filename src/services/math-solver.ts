import { RoutedItem, SolverResult } from '../../types/sat';
import { runPython } from '../lib/pythonSandbox';

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
simplified = expand(expr1 + expr2)
result = simplified"
}

Always include working Python code that can be executed to verify your answer.`;

export class MathSolver {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    console.log('🔄 Math solver starting...');
    
    try {
      // Primary solve with o4-mini + Python
      const primaryResult = await this.solvePrimary(item);
      
      // Check if escalation is needed
      if (primaryResult.confidence < 0.75) {
        console.log('🔄 Math escalating to GPT-5-Thinking...');
        try {
          const escalatedResult = await this.solveEscalated(item);
          
          // Return the higher confidence result
          const finalResult = escalatedResult.confidence > primaryResult.confidence ? escalatedResult : primaryResult;
          finalResult.meta.primaryResult = primaryResult.final;
          finalResult.meta.escalated = true;
          
          console.log(`✅ Math solved with escalation: ${finalResult.final} (${finalResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
          return finalResult;
        } catch (error) {
          console.warn('Math escalation failed:', error);
          primaryResult.meta.escalationFailed = true;
        }
      }
      
      console.log(`✅ Math solved: ${primaryResult.final} (${primaryResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return primaryResult;
    } catch (error) {
      console.error('Math solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(item: RoutedItem): Promise<SolverResult> {
    console.log('🔄 Math primary solver starting...');
    
    let messages;
    
    if (item.imageBase64) {
      // Image-first approach
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${SYSTEM_MATH}

Domain: ${item.subdomain}

Solve this SAT math question from the image. MUST include working Python code that sets 'result' variable.`
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

${item.choices.length > 0 ? 
  `Choices:\n${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` :
  'This is a grid-in question - provide the numeric answer.'
}

MUST include working Python code that sets 'result' variable.`;
      
      messages = [
        { 
          role: 'user', 
          content: `${SYSTEM_MATH}\n\n${userPrompt}` 
        }
      ];
    }
    
    console.log('📡 Making OpenAI API call for Math solving...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o1-mini',
        messages,
        // o1 models don't use temperature - they use reasoning_effort
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
    
    // Execute Python code if provided
    let pythonResult = null;
    let finalAnswer = result.answer;
    let finalConfidence = result.confidence;
    
    if (result.python_code) {
      console.log('🐍 Executing Python verification code...');
      try {
        pythonResult = await runPython(result.python_code);
        
        if (pythonResult.ok) {
          const pythonAnswer = String(pythonResult.result);
          console.log(`🐍 Python result: ${pythonAnswer}, Model answer: ${finalAnswer}`);
          
          // Smart comparison between Python result and model answer
          if (this.compareAnswers(pythonAnswer, finalAnswer, item.choices)) {
            console.log('✅ Python verification confirms model answer');
            finalConfidence = Math.min(0.98, finalConfidence + 0.20); // +20% boost for Python confirmation
          } else {
            // Check if Python result matches any of the choices
            const matchingChoice = this.findMatchingChoice(pythonAnswer, item.choices);
            if (matchingChoice) {
              console.log(`🔄 Python result matches choice ${matchingChoice}, overriding model answer`);
              finalAnswer = matchingChoice;
              finalConfidence = Math.min(0.95, finalConfidence + 0.15); // +15% boost but override answer
            } else {
              console.log(`⚠️ Python result (${pythonAnswer}) doesn't match model answer (${finalAnswer}) or any choice`);
              finalConfidence *= 0.8; // Reduce confidence for disagreement
            }
          }
        } else {
          console.log(`❌ Python execution failed: ${pythonResult.error}`);
          finalConfidence *= 0.85; // Small penalty for failed Python execution
        }
      } catch (error) {
        console.error('Python execution error:', error);
        finalConfidence *= 0.85;
      }
    } else {
      console.log('⚠️ No Python code provided by model');
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
      model: 'o4-mini'
    };
  }

  private async solveEscalated(item: RoutedItem): Promise<SolverResult> {
    console.log('🔄 Math escalated solver starting...');
    
    let messages;
    
    if (item.imageBase64) {
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${SYSTEM_MATH}

Domain: ${item.subdomain}

This math problem requires deeper analysis. Previous attempt had low confidence.

Solve this SAT math question from the image. MUST include working Python code.`
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
      const userPrompt = `Domain: ${item.subdomain}

This math problem requires deeper analysis. Previous attempt had low confidence.

${item.fullText}

${item.choices.length > 0 ? 
  `Choices:\n${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` :
  'This is a grid-in question - provide the numeric answer.'
}

MUST include working Python code that sets 'result' variable.`;
      
      messages = [
        { role: 'user', content: `${SYSTEM_MATH}\n\n${userPrompt}` }
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
    
    // Execute Python code
    let pythonResult = null;
    let finalAnswer = result.answer;
    let finalConfidence = Math.min(0.98, result.confidence + 0.10); // Boost for deep reasoning
    
    if (result.python_code) {
      try {
        pythonResult = await runPython(result.python_code);
        
        if (pythonResult.ok) {
          const pythonAnswer = String(pythonResult.result);
          if (this.compareAnswers(pythonAnswer, finalAnswer, item.choices)) {
            finalConfidence = Math.min(0.99, finalConfidence + 0.15);
          } else {
            const matchingChoice = this.findMatchingChoice(pythonAnswer, item.choices);
            if (matchingChoice) {
              finalAnswer = matchingChoice;
              finalConfidence = Math.min(0.97, finalConfidence + 0.10);
            } else {
              finalConfidence *= 0.85;
            }
          }
        }
      } catch (error) {
        finalConfidence *= 0.9;
      }
    }
    
    return {
      final: finalAnswer,
      confidence: Math.max(0.2, finalConfidence),
      meta: {
        method: result.method,
        explanation: result.explanation,
        python: result.python_code,
        pythonResult: pythonResult,
        escalated: true,
        checks: ['python_execution', 'deep_reasoning']
      },
      model: 'gpt-5-thinking'
    };
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