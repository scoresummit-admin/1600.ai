import { SatItem, RoutedItem, Section, EbrwDomain, MathDomain } from '../../types/sat';
import { openrouterClient } from './model-clients';

const SYSTEM_ROUTER = `You are an expert SAT question classifier. Analyze the question and return ONLY classification labels.

When given an image, examine it carefully to determine the question type and domain.
EBRW Domains:
- craft_structure: Author's purpose, point of view, rhetorical devices, text structure, meaning in context
- information_ideas: Main ideas, supporting details, inferences, data interpretation, quantitative info
- standard_english_conventions: Grammar, punctuation, sentence structure, usage, mechanics
- expression_of_ideas: Organization, transitions, concision, style, tone, word choice

Math Domains:
- algebra: Linear equations, systems, inequalities, functions, slopes
- advanced_math: Quadratics, polynomials, rational functions, exponentials, logs
- psda: Ratios, percentages, statistics, data interpretation, unit conversion
- geometry_trig: Area, volume, coordinate geometry, trigonometric functions

Required JSON output (classification ONLY - do not modify text):
{
  "section": "EBRW|MATH",
  "subdomain": "domain_name",
  "hasFigure": false
}`;

export class SATRouter {
  constructor() {}

  async routeItem(item: SatItem): Promise<RoutedItem> {
    const startTime = Date.now();
    
    try {
      let promptText = item.promptText || '';
      let choices = item.choices || [];
      let ocrText = '';
      let imageBase64 = '';
      let hasFigure = false;

      // Handle screenshot input with dual OCR
      if (item.source === 'screenshot' && item.imageBase64) {
        imageBase64 = item.imageBase64;
        console.log('🖼️ Processing screenshot with dual OCR...');
        const ocrResults = await this.dualOCR(item.imageBase64);
        
        // Reconcile OCR results
        ocrText = ocrResults.gpt5.text.length > ocrResults.grok4.text.length 
          ? ocrResults.gpt5.text 
          : ocrResults.grok4.text;
        
        // Set fullText from OCR for backward compatibility
        promptText = ocrText;
        
        // Use choices from the result with more choices, or combine if different
        if (ocrResults.gpt5.choices.length >= ocrResults.grok4.choices.length) {
          choices = ocrResults.gpt5.choices;
        } else {
          choices = ocrResults.grok4.choices;
        }
        
        // Mark as having figure if OCR results differ significantly
        hasFigure = Math.abs(ocrResults.gpt5.text.length - ocrResults.grok4.text.length) > 50 ||
                   ocrResults.gpt5.choices.length !== ocrResults.grok4.choices.length;
      }

      // Classify with GPT-5 (prefer image if available)
      const classification = await this.classifyQuestion(promptText, choices, imageBase64);
      
      const routedItem: RoutedItem = {
        section: classification.section,
        subdomain: classification.subdomain,
        imageBase64: imageBase64 || undefined,
        ocrText: ocrText || undefined,
        fullText: promptText, // verbatim from UI/OCR
        choices: choices,     // verbatim from UI/OCR
        isGridIn: item.isGridIn || choices.length === 0,
        hasFigure: hasFigure || classification.hasFigure
      };

      const routeTime = Date.now() - startTime;
      console.log(`📍 Routed as ${routedItem.section}/${routedItem.subdomain} in ${routeTime}ms`);
      
      return routedItem;
      
    } catch (error) {
      console.error('Router error:', error);
      return this.fallbackRouting(item);
    }
  }

  private async dualOCR(imageBase64: string): Promise<{
    gpt5: { text: string; choices: string[] };
    grok4: { text: string; choices: string[] };
  }> {
    const [gpt5Result, grok4Result] = await Promise.allSettled([
      this.extractWithModel(imageBase64, 'openai/gpt-5'),
      this.extractWithModel(imageBase64, 'x-ai/grok-4')
    ]);

    return {
      gpt5: gpt5Result.status === 'fulfilled' ? gpt5Result.value : { text: '', choices: [] },
      grok4: grok4Result.status === 'fulfilled' ? grok4Result.value : { text: '', choices: [] }
    };
  }

  private async extractWithModel(imageBase64: string, model: string): Promise<{ text: string; choices: string[] }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await openrouterClient(model, [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract the FULL passage, question, and answer choices from this SAT question image. Return JSON: {"passage": "full passage text", "question": "question stem", "choices": ["A) choice text", "B) choice text", "C) choice text", "D) choice text"]}'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }], {
        max_tokens: 2000,
        temperature: 0.1,
        timeout_ms: 60000,
        // Prefer Azure for OpenAI models for better latency
        ...(model.startsWith('openai/') ? {
          provider: { order: ['azure', 'openai'] }
        } : {})
      });

      clearTimeout(timeoutId);
      
      try {
        const parsed = JSON.parse(response.text);
        const fullText = parsed.passage ? `${parsed.passage}\n\nQuestion: ${parsed.question}` : parsed.text || '';
        return {
          text: fullText,
          choices: parsed.choices || []
        };
      } catch {
        return { text: response.text, choices: [] };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async classifyQuestion(
    promptText: string, 
    choices: string[], 
    imageBase64?: string
  ): Promise<{
    section: Section;
    subdomain: EbrwDomain | MathDomain;
    hasFigure: boolean;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s timeout

    try {
      let messages;
      
      if (imageBase64) {
        // Image-first approach: send image with brief instruction
        messages = [
          { role: 'system', content: SYSTEM_ROUTER },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Classify this SAT question from the image. Analyze the question type and domain.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ];
      } else {
        // Fallback to text-based classification
        const userPrompt = `Question: ${promptText}

Choices:
${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;
        
        messages = [
          { role: 'system', content: SYSTEM_ROUTER },
          { role: 'user', content: userPrompt }
        ];
      }

      const response = await openrouterClient('openai/gpt-5', messages, {
        temperature: 0.1,
        max_tokens: 800,
        timeout_ms: 40000,
        provider: { order: ['azure', 'openai'] }
      });

      clearTimeout(timeoutId);

      let content = response.text;
      
      // Handle JSON markdown wrapper
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const result = JSON.parse(content);
      
      return {
        section: result.section,
        subdomain: result.subdomain,
        hasFigure: result.hasFigure || false
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      .trim();
  }

  private fallbackRouting(item: SatItem): RoutedItem {
    const text = (item.promptText || '').toLowerCase();
    const choices = item.choices || [];
    
    // Math indicators
    const mathKeywords = ['equation', 'solve', 'graph', 'function', 'angle', 'area', 'volume', 'percent', 'ratio'];
    const isMath = mathKeywords.some(keyword => text.includes(keyword)) || 
                   text.includes('=') || 
                   /\b\d+\s*[+\-*/]\s*\d+\b/.test(text);

    if (isMath) {
      return {
        section: 'MATH',
        subdomain: 'algebra' as MathDomain,
        imageBase64: undefined,
        ocrText: undefined,
        fullText: this.cleanText(item.promptText || ''),
        choices,
        isGridIn: choices.length === 0,
        hasFigure: false
      };
    }

    return {
      section: 'EBRW',
      subdomain: 'information_ideas' as EbrwDomain,
      fullText: item.promptText || '',
      choices,
      isGridIn: false,
      hasFigure: false
    };
  }
}