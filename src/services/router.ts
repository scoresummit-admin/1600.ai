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
    // Use Promise.race to get the first successful OCR result, fallback to both if needed
    const timeout = 20000; // Increase to 20s timeout per OCR call
    
    try {
      // Try to get the first successful result quickly
      const firstResult = await Promise.race([
        this.extractWithModel(imageBase64, 'openai/gpt-5', timeout),
        this.extractWithModel(imageBase64, 'x-ai/grok-4', timeout),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OCR race timeout')), timeout * 0.8)) // 80% of individual timeout
      ]);
      
      // Got a quick result, use it for both (we'll improve this later)
      console.log('🔥 Fast OCR completed, using for both results');
      return {
        gpt5: firstResult,
        grok4: firstResult
      };
    } catch (error) {
      console.log('⚠️ Fast OCR failed, falling back to parallel OCR...');
      // Fallback to parallel execution with shorter timeouts
      const [gpt5Result, grok4Result] = await Promise.allSettled([
        this.extractWithModel(imageBase64, 'openai/gpt-5', 15000), // Increase to 15s
        this.extractWithModel(imageBase64, 'x-ai/grok-4', 15000)   // Increase to 15s
      ]);

      return {
        gpt5: gpt5Result.status === 'fulfilled' ? gpt5Result.value : { text: '', choices: [] },
        grok4: grok4Result.status === 'fulfilled' ? grok4Result.value : { text: '', choices: [] }
      };
    }
  }

  private async extractWithModel(imageBase64: string, model: string, timeoutMs: number = 20000): Promise<{ text: string; choices: string[] }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`🔄 Starting OCR with ${model} (${timeoutMs}ms timeout)...`);
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
        timeout_ms: timeoutMs, // Use the provided timeout
        // Prefer Azure for OpenAI models for better latency
        ...(model.startsWith('openai/') ? {
          provider: { order: ['azure', 'openai'] }
        } : {})
      });

      clearTimeout(timeoutId);
      console.log(`✅ OCR with ${model} completed successfully`);
      
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
      console.error(`❌ OCR with ${model} failed:`, error);
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
    const timeoutMs = 30000; // Reduce to 30s but be more reliable
    console.log(`🔄 Classifying question (${timeoutMs}ms timeout)...`);

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
        timeout_ms: timeoutMs,
        provider: { order: ['azure', 'openai'] }
      });

      console.log(`✅ Question classification completed`);

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
      console.error(`❌ Classification failed:`, error);
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