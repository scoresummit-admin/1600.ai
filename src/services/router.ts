import { SatItem, RoutedItem, Section, EbrwDomain, MathDomain } from '../types/sat';
import { ImageToTextExtractor } from './image-to-text-extractor';
import type { SATTranscription } from './image-to-text-extractor';

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
    const shouldExtractText = (section === 'EBRW');
    
    if (shouldExtractText && inputItem.imageBase64) {
      try {
        console.log(`📝 Extracting text from image for ${section} question...`);
        const extractedText = await this.imageToTextExtractor.extract(inputItem.imageBase64);
        const { questionText, fullText } = this.composeQuestionAndFullText(extractedText.transcription, extractedText.choices);

        routedItem.question = questionText;
        routedItem.choices = extractedText.choices;
        routedItem.fullText = fullText;
        routedItem.ocrText = JSON.stringify(extractedText.transcription);
        
        console.log(`✅ ${section} text extraction completed: ${extractedText.question.length} chars, ${extractedText.choices.length} choices`);
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

  private composeQuestionAndFullText(transcription: SATTranscription, choices: string[]): { questionText: string; fullText: string } {
    const segments: string[] = [];

    const trimmedInstructions = transcription.instructions.trim();
    if (trimmedInstructions) {
      segments.push(`Instructions:\n${trimmedInstructions}`);
    }

    if (transcription.passages.length > 0) {
      transcription.passages.forEach((passage, index) => {
        const label = passage.label ? passage.label : (transcription.passages.length > 1 ? `Passage ${index + 1}` : 'Passage');
        segments.push(`${label}:\n${passage.text.trim()}`);
      });
    } else if (transcription.passage) {
      segments.push(`Passage:\n${transcription.passage.trim()}`);
    }

    const notes = transcription.notes.map(note => note.trim()).filter(Boolean);
    if (notes.length > 0) {
      segments.push(`Notes:\n${notes.join('\n')}`);
    }

    if (transcription.figures.length > 0) {
      transcription.figures.forEach((figure, index) => {
        const label = figure.label || `Figure ${index + 1}`;
        const figureLines: string[] = [`${label} (${figure.type})`];
        if (figure.caption) {
          figureLines.push(figure.caption.trim());
        }
        if (figure.raw_text) {
          figureLines.push(figure.raw_text.trim());
        }
        if (figure.table.headers.length > 0 || figure.table.rows.length > 0) {
          figureLines.push(`Table Headers: ${figure.table.headers.join(' | ')}`);
          figure.table.rows.forEach((row, rowIndex) => {
            figureLines.push(`Row ${rowIndex + 1}: ${row.join(' | ')}`);
          });
        }
        segments.push(figureLines.join('\n'));
      });
    }

    const questionStem = transcription.question || transcription.questions[0]?.stem || '';
    if (questionStem) {
      segments.push(`Question:\n${questionStem.trim()}`);
    }

    const questionText = segments.length > 0 ? segments.join('\n\n') : (transcription.question || '').trim();
    const formattedChoices = choices.length > 0
      ? `Choices:\n${choices.map((choice, index) => `${String.fromCharCode(65 + index)}) ${choice}`).join('\n')}`
      : '';

    const fullText = formattedChoices ? `${questionText}\n\n${formattedChoices}` : questionText;

    return { questionText, fullText };
  }
}