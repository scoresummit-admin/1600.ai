import { SatItem, RoutedItem, Section, EbrwDomain, MathDomain } from '../types/sat';

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
  constructor() {}

  async routeItem(inputItem: SatItem, providedSection?: Section): Promise<RoutedItem> {
    console.log('📍 SATRouter starting classification...');

    // With vision models, we don't have text upfront - use provided section
    const section = providedSection || 'EBRW'; // Default to EBRW if not provided
    const subdomain = this.getDefaultSubdomain(section);

    const routedItem: RoutedItem = {
      section,
      subdomain,
      imageBase64: inputItem.imageBase64,
      ocrText: '', // No OCR anymore
      fullText: '', // Will be extracted by vision models
      question: '', // Will be extracted by vision models
      choices: [], // Will be extracted by vision models
      isGridIn: false, // Will be determined by vision models
      hasFigure: !!inputItem.imageBase64
    };

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