import { RoutedItem, SolverResult } from '../../types/sat';
import { runPython } from '../lib/pythonSandbox';

const SYSTEM_MATH = `You are an expert SAT Math solver with access to a Python sandbox (SymPy, fractions, math) and image analysis capabilities.

When given an image, analyze the SAT math question directly from the image, including any graphs, diagrams, or figures.

Return ONLY the JSON schema; do not reveal chain-of-thought.

Cheat-sheet:
- Algebra: linear equations/inequalities, systems, slopes & intercepts, absolute value, piecewise.
- Advanced Math: quadratics (vertex, discriminant), polynomials (roots/factors), rational functions (domains, asymptotes), exponents & logs (change of base), function composition & inverse.
- PSDA: ratios/rates/percent, unit conversion, weighted average & mixture, median/mean, standard deviation intuition, two-way tables, linear models (slope = rate).
- Geometry & Trig: similar triangles, circle arc/sector, angle relationships, area/volume basics, Pythagorean & special triangles, basic sine/cosine in right triangles, coordinate geometry distance & midpoint.
- Always check domain restrictions (no division by zero, radicand ≥ 0), and verify by substitution.

Solve policy:
1) Extract variables and constraints.
2) Generate minimal Python to compute EXACTLY (fractions/simplify); or evaluate every choice programmatically and select the one that satisfies constraints.
3) Perform verification ("substitute_back" and any relevant "units"/"domain" checks).
4) Output the JSON; include the python code string.

Required JSON schema:
{
  "answer_value_or_choice": "A|B|C|D|<numeric>",
  "confidence_0_1": number,
  "method": "symbolic|numeric|hybrid",
  "checks": ["substitute_back"|"units"|"domain"|"graph_consistency"],
  "short_explanation": "≤2 sentences",
  "python": "code string"
}`;

export class MathSolver {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async solve(item: RoutedItem, timeoutMs: number = 16000): Promise<SolverResult> {
    const startTime = Date.now();
    console.log('Math solver timeout:', Math.min(timeoutMs, 50000)); // Cap at 50s
    
    try {
      // Primary solve with o4-mini
      const primaryResult = await this.solvePrimary(item, Math.min(timeoutMs * 0.9, 45000));
      
      // Execute Python code if provided
      if (primaryResult.meta.python) {
        try {
          const pythonResult = await runPython(primaryResult.meta.python);
          if (pythonResult.ok) {
            primaryResult.meta.pythonResult = pythonResult.result;
            primaryResult.meta.pythonOutput = pythonResult.stdout;
            
            // Boost confidence if Python execution succeeded
            primaryResult.confidence = Math.min(0.95, primaryResult.confidence + 0.1);
          } else {
            console.warn('Python execution failed:', pythonResult.error);
            primaryResult.meta.pythonError = pythonResult.error;
            primaryResult.confidence *= 0.8; // Reduce confidence if Python failed
          }
        } catch (error) {
          console.warn('Python sandbox error:', error);
          primaryResult.confidence *= 0.8;
        }
      }
      
      console.log(`✅ Math solved: ${primaryResult.final} (${primaryResult.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return primaryResult;
      
    } catch (error) {
      console.error('Math solver error:', error);
      throw error;
    }
  }

  private async solvePrimary(item: RoutedItem, timeoutMs = 14000): Promise<SolverResult> {
    console.log('Math solver primary timeout:', timeoutMs); // Use the parameter
    
    let messages;
    
    if (item.imageBase64) {
      // Image-first approach
      const userContent = `${SYSTEM_MATH}

Domain: ${item.subdomain}
${item.isGridIn ? 'Grid-in question (numeric answer)' : 'Multiple choice'}

Extract and solve this SAT math question from the image. Pay attention to any graphs, diagrams, or figures. Generate Python code to compute the exact answer.

${item.ocrText ? `OCR Text (for reference): ${item.ocrText}` : ''}`;
      
      messages = [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: userContent
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${item.imageBase64}`
            }
          }
        ]
      }];
    } else {
      // Fallback to text-based approach
      const userPrompt = `Domain: ${item.subdomain}
${item.isGridIn ? 'Grid-in question (numeric answer)' : 'Multiple choice'}

${item.fullText}

${!item.isGridIn ? `Choices:\n${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` : ''}`;
      
      // Flatten system message into user message for o1-mini
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
        model: 'o1-mini',
        messages,
        temperature: 1,
        max_completion_tokens: 1000,
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
      final: result.answer_value_or_choice,
      confidence: result.confidence_0_1,
      meta: {
        method: result.method,
        checks: result.checks,
        explanation: result.short_explanation,
        python: result.python
      },
      model: 'o4-mini'
    };
  }
}