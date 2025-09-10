import { SatItem, RoutedItem, Section, EbrwDomain, MathDomain } from '../../types/sat';

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
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

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
        ocrText = ocrResults.openai.text.length > ocrResults.gemini.text.length 
          ? ocrResults.openai.text 
          : ocrResults.gemini.text;
        
        // Set fullText from OCR for backward compatibility
        promptText = ocrText;
        
        // Use choices from the result with more choices, or combine if different
        if (ocrResults.openai.choices.length >= ocrResults.gemini.choices.length) {
          choices = ocrResults.openai.choices;
        } else {
          choices = ocrResults.gemini.choices;
        }
        
        // Mark as having figure if OCR results differ significantly
        hasFigure = Math.abs(ocrResults.openai.text.length - ocrResults.gemini.text.length) > 50 ||
                   ocrResults.openai.choices.length !== ocrResults.gemini.choices.length;
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
    openai: { text: string; choices: string[] };
    gemini: { text: string; choices: string[] };
  }> {
    const [openaiResult, geminiResult] = await Promise.allSettled([
      this.extractWithOpenAI(imageBase64),
      this.extractWithGemini(imageBase64)
    ]);

    return {
      openai: openaiResult.status === 'fulfilled' ? openaiResult.value : { text: '', choices: [] },
      gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : { text: '', choices: [] }
    };
  }

  private async extractWithOpenAI(imageBase64: string): Promise<{ text: string; choices: string[] }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
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
          }],
          max_tokens: 2000,
          temperature: 0.1
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(content);
        const fullText = parsed.passage ? `${parsed.passage}\n\nQuestion: ${parsed.question}` : parsed.text || '';
        return {
          text: fullText,
          choices: parsed.choices || []
        };
      } catch {
        return { text: content, choices: [] };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async extractWithGemini(imageBase64: string): Promise<{ text: string; choices: string[] }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // Increase to 60s timeout

    try {
      console.log('🔄 Starting Gemini OCR extraction...');
      
      // Call our serverless function with proper image data
      const response = await fetch('/api/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'extract',
          imageBase64: imageBase64,
          temperature: 0.1,
          maxOutputTokens: 2000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log(`📡 Gemini API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API error:', response.status, response.statusText, errorData);
        throw new Error(`Google API error: ${response.statusText} - ${errorData.error || 'Unknown error'} - ${errorData.details || ''}`);
      }

      const data = await response.json();
      const content = data.content;
      
      console.log('✅ Gemini OCR completed, processing response...');
      
      try {
        const parsed = JSON.parse(content);
        const fullText = parsed.passage ? `${parsed.passage}\n\nQuestion: ${parsed.question}` : parsed.text || '';
        return {
          text: fullText,
          choices: parsed.choices || []
        };
      } catch {
        console.warn('⚠️ Failed to parse Gemini JSON response, using raw content');
        return { text: content, choices: [] };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Gemini extraction failed:', error.message);
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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          temperature: 0.1,
          max_tokens: 800,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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