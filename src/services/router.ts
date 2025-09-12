import { SatItem, RoutedItem, Section, EbrwDomain, MathDomain } from '../types/sat';

export class SATRouter {
  constructor() {}

  async routeItem(inputItem: SatItem): Promise<RoutedItem> {
    console.log('📍 SATRouter starting classification...');
    
    const text = inputItem.promptText || '';
    const isGridIn = inputItem.isGridIn || inputItem.choices.length === 0;
    
    // Simple heuristic-based routing
    const section = this.classifySection(text, inputItem.choices);
    const subdomain = this.classifySubdomain(text, section, isGridIn);
    
    const routedItem: RoutedItem = {
      section,
      subdomain,
      imageBase64: inputItem.imageBase64,
      ocrText: inputItem.promptText || '',
      fullText: inputItem.promptText || '',
      question: inputItem.promptText || '',
      choices: inputItem.choices || [],
      isGridIn,
      hasFigure: !!inputItem.imageBase64
    };
    
    console.log(`📍 Classified as: ${section}/${subdomain}${isGridIn ? ' (grid-in)' : ''}`);
    return routedItem;
  }

  private classifySection(text: string, choices: string[]): Section {
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

  private classifySubdomain(text: string, section: Section, isGridIn: boolean): EbrwDomain | MathDomain {
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