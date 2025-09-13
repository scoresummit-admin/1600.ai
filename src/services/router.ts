import { SatItem, RoutedItem, Section, EbrwDomain, MathDomain } from '../types/sat';
import { ImageToTextExtractor } from './image-to-text-extractor';

export const SYSTEM_ROUTER = `You are an expert SAT question router. Classify only the labels needed by the app. Some models may receive images; if so, you may use them to determine has_figure.

Output Contract
Return ONLY this JSON (no prose or markdown):
{
"section": "EBRW|Math",
"subdomain": "craft_structure|information_ideas|standard_english_conventions|expression_of_ideas|algebra|advanced_math|problem_solving_data_analysis|geometry_trigonometry",
"has_figure": true|false
}

Notes
Section must be exactly "EBRW" or "Math" (case-sensitive).
Math subdomains: use the exact strings above (no abbreviations).
Set has_figure = true iff the question meaningfully relies on a chart, graph, diagram, or figure.
If the prompt is text-only (including OCR), set has_figure to false.`;

export class SATRouter {
  private imageToTextExtractor: ImageToTextExtractor;

  constructor() {
    this.imageToTextExtractor = new ImageToTextExtractor();
  }

  async routeItem(inputItem: SatItem, providedSection?: Section): Promise<RoutedItem> {
    console.log('📍 SATRouter starting classification...');

    // With vision models, we don't have text upfront - use provided section
    const section = providedSection || 'EBRW'; // Default to EBRW if not provided
    const subdomain = this.getDefaultSubdomain(section);

    let routedItem: RoutedItem = {
      section,
      subdomain,
      imageBase64: inputItem.imageBase64,
      ocrText: '',
      fullText: '',
      question: '',
      choices: [],
      isGridIn: false,
      hasFigure: !!inputItem.imageBase64
    };

    // For EBRW questions with images, extract text using GPT-4o
    if (section === 'EBRW' && inputItem.imageBase64) {
      try {
        console.log('📝 Extracting text from image for EBRW question...');
        const extractedText = await this.imageToTextExtractor.extract(inputItem.imageBase64);
        
        routedItem.question = extractedText.question;
        routedItem.choices = extractedText.choices;
        routedItem.fullText = `${extractedText.question}\n\nChoices:\n${extractedText.choices.map((c, i) => `${String.fromCharCode(65 + i)}) ${c}`).join('\n')}`;
        
        console.log(`✅ Text extraction completed: ${extractedText.question.length} chars, ${extractedText.choices.length} choices`);
      } catch (error) {
        console.error('❌ Text extraction failed:', error);
        // Fall back to empty text - solvers will still get the image
      }
    }

    console.log(`📍 Routed as: ${section}/${subdomain}`);
    return routedItem;
  }

  private getDefaultSubdomain(section: Section): EbrwDomain | MathDomain {
    if (section === 'MATH') {
      return 'algebra'; // Default math subdomain
    } else {
      return 'information_ideas'; // Default EBRW subdomain
    }
  }
}