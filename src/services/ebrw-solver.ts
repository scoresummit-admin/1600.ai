import { RoutedItem, SolverResult } from '../types/sat';
import { openrouterClient } from './model-clients';

// EBRW concurrent quartet models
const EBRW_MODELS = [
  'openai/o3',
  'openai/gpt-5', 
  'x-ai/grok-4',
  'anthropic/claude-sonnet-4'
];

const SYSTEM_EBRW = `You are an expert SAT Evidence-Based Reading & Writing (EBRW) solver.

CRITICAL REQUIREMENTS:
1. Extract specific evidence from the passage to support your answer
2. Eliminate wrong choices by identifying why they are incorrect
3. Return ONLY the letter (A, B, C, D) as your final answer
4. Focus on what the passage explicitly states or strongly implies

Template structure:
{
  "answer": "A|B|C|D",
  "confidence": 0.0-1.0,
  "evidence": ["Quote 1 from passage", "Quote 2 from passage"],
  "elimination": {
    "A": "Why A is wrong (if not chosen)",
    "B": "Why B is wrong (if not chosen)", 
    "C": "Why C is wrong (if not chosen)",
    "D": "Why D is wrong (if not chosen)"
  },
  "explanation": "Brief reasoning for the correct answer"
}

Always ground your answer in specific textual evidence.`;

export class EBRWSolver {
  constructor() {}

  async solve(item: RoutedItem): Promise<SolverResult> {
    const startTime = Date.now();
    const timeoutMs = 35000; // 35s timeout for EBRW
    
    console.log(`🔄 EBRW solver starting with primary model...`);
    
    try {
      // For now, use just the primary EBRW model (GPT-5)
      const result = await this.solveWithModel(item, EBRW_MODELS[1], timeoutMs);
      
      console.log(`✅ EBRW solved: ${result.final} (${result.confidence.toFixed(2)}) in ${Date.now() - startTime}ms`);
      return result;
      
    } catch (error) {
      console.error('EBRW solver error:', error);
      throw error;
    }
  }

  private async solveWithModel(item: RoutedItem, model: string, timeoutMs: number): Promise<SolverResult> {
    console.log(`🔄 EBRW solving with ${model} (${timeoutMs}ms timeout)...`);
    
    let messages;
    
    if (item.imageBase64) {
      // Image-first approach for EBRW
      messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${SYSTEM_EBRW}

Domain: ${item.subdomain}

Solve this SAT EBRW question from the image. Extract evidence from the passage and eliminate wrong choices.

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
      // Text-based approach
      const userPrompt = `Domain: ${item.subdomain}

${item.fullText}

${item.choices.length > 0 ? 
  `Choices:\n${item.choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}` :
  'This appears to be a different question type.'
}

Extract evidence from the passage and eliminate wrong choices.`;
      
      messages = [
        { 
          role: 'user', 
          content: `${SYSTEM_EBRW}

${userPrompt}

CRITICAL: Return ONLY valid JSON - no markdown, no explanations.` 
        }
      ];
    }
    
    const response = await openrouterClient(model, messages, {
      temperature: 0.1,
      max_tokens: 2000,
      timeout_ms: timeoutMs
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
      final: result.answer,
      confidence: Math.max(0.1, Math.min(1.0, result.confidence)),
      meta: {
        domain: item.subdomain,
        explanation: result.explanation,
        evidence: result.evidence,
        elimination_notes: result.elimination,
        checks: ['evidence_extraction', 'choice_elimination']
      },
      model
    };
  }
}