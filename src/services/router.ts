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

  private classifySection(text: string, _choices: string[]): Section {
    const lowerText = text.toLowerCase();
    
    // Math keywords
    const mathKeywords = [
      'equation', 'solve', 'function', 'graph', 'polynomial', 'quadratic',
      'algebra', 'geometry', 'triangle', 'circle', 'angle', 'slope',
      'statistics', 'probability', 'mean', 'median', 'standard deviation',
      'calculate', 'find the value', 'what is x', 'expression',
      'factor', 'expand', 'simplify', 'derivative', 'integral'
    ];
    
    // EBRW keywords
    const ebrwKeywords = [
      'passage', 'author', 'text', 'paragraph', 'sentence', 'word choice',
      'tone', 'purpose', 'main idea', 'support', 'evidence', 'claim',
      'argument', 'rhetoric', 'persuasive', 'narrative', 'descriptive',
      'context', 'meaning', 'inference', 'imply', 'suggest',
      'grammar', 'punctuation', 'comma', 'semicolon', 'apostrophe'
    ];

    const mathCount = mathKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const ebrwCount = ebrwKeywords.filter(keyword => lowerText.includes(keyword)).length;

    // Check for mathematical symbols and patterns
    const hasNumbers = /\d+/.test(text);
    const hasVariables = /[a-zA-Z]\s*=|\b[xy]\b/.test(text);
    const hasMathSymbols = /[+\-*÷×√π²³]/g.test(text);

    if (mathCount > ebrwCount || hasVariables || (hasNumbers && hasMathSymbols)) {
      return 'MATH';
    } else {
      return 'EBRW';
    }
  }

  private classifySubdomain(text: string, section: Section, _isGridIn: boolean): EbrwDomain | MathDomain {
    const lowerText = text.toLowerCase();

    if (section === 'MATH') {
      // Math subdomain classification
      const algebraKeywords = ['equation', 'solve', 'variable', 'linear', 'system', 'inequality'];
      const advancedMathKeywords = ['quadratic', 'polynomial', 'exponential', 'logarithm', 'function'];
      const geometryKeywords = ['triangle', 'circle', 'angle', 'area', 'volume', 'perimeter', 'coordinate'];
      const dataAnalysisKeywords = ['statistics', 'probability', 'mean', 'median', 'data', 'table', 'chart'];

      const algebraCount = algebraKeywords.filter(k => lowerText.includes(k)).length;
      const advancedCount = advancedMathKeywords.filter(k => lowerText.includes(k)).length;
      const geometryCount = geometryKeywords.filter(k => lowerText.includes(k)).length;
      const dataCount = dataAnalysisKeywords.filter(k => lowerText.includes(k)).length;

      const maxCount = Math.max(algebraCount, advancedCount, geometryCount, dataCount);
      
      if (maxCount === 0) return 'algebra'; // Default for math
      
      if (geometryCount === maxCount) return 'geometry_trigonometry';
      if (advancedCount === maxCount) return 'advanced_math';
      if (dataCount === maxCount) return 'problem_solving_data_analysis';
      return 'algebra';

    } else {
      // EBRW subdomain classification
      const craftKeywords = ['structure', 'organization', 'transition', 'sentence', 'paragraph'];
      const ideasKeywords = ['main idea', 'central claim', 'support', 'evidence', 'argument'];
      const grammarKeywords = ['comma', 'semicolon', 'apostrophe', 'subject', 'verb', 'pronoun'];
      const expressionKeywords = ['concise', 'redundant', 'word choice', 'tone', 'style'];

      const craftCount = craftKeywords.filter(k => lowerText.includes(k)).length;
      const ideasCount = ideasKeywords.filter(k => lowerText.includes(k)).length;
      const grammarCount = grammarKeywords.filter(k => lowerText.includes(k)).length;
      const expressionCount = expressionKeywords.filter(k => lowerText.includes(k)).length;

      const maxCount = Math.max(craftCount, ideasCount, grammarCount, expressionCount);
      
      if (maxCount === 0) return 'information_ideas'; // Default for EBRW
      
      if (grammarCount === maxCount) return 'standard_english_conventions';
      if (expressionCount === maxCount) return 'expression_of_ideas';
      if (craftCount === maxCount) return 'craft_structure';
      return 'information_ideas';
    }
  }
}