import { LLMClient } from './llm-client';
import { RouterOutput, SATSection, EBRWDomain, MathDomain } from '../types/sat';

export class SATRouter {
  constructor(private llmClient: LLMClient) {}

  async routeQuestion(questionText: string, choices: string[]): Promise<RouterOutput> {
    const startTime = Date.now();
    
    // Clean and normalize text from OCR if needed
    const cleanedText = this.cleanOCRText(questionText);
    
    const systemPrompt = `You are an expert SAT question classifier. Analyze the question and return ONLY valid JSON.

EBRW Domains:
- craft_structure: Author's purpose, point of view, rhetorical devices, text structure
- information_ideas: Main ideas, supporting details, inferences, data interpretation  
- standard_english_conventions: Grammar, punctuation, sentence structure, usage
- expression_of_ideas: Organization, transitions, concision, style, tone

Math Domains:
- algebra: Linear equations, systems, inequalities, functions
- advanced_math: Quadratics, polynomials, rational functions, exponentials
- problem_solving_data_analysis: Ratios, percentages, statistics, data interpretation
- geometry_trigonometry: Area, volume, coordinate geometry, trigonometric functions

Required JSON output:
{
  "section": "EBRW|Math",
  "subdomain": "domain_name",
  "prompt_text": "cleaned and normalized question text",
  "choices": ["A", "B", "C", "D"],
  "is_gridin": false,
  "has_figure": false,
  "extracted_numbers": [numbers found],
  "time_budget_s": 25
}`;

    const userPrompt = `Question: ${cleanedText}

Choices:
${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    try {
      const response = await this.llmClient.callModel('gpt-5', [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        reasoning_effort: 'minimal',
        temperature: 0.1,
        max_tokens: 500,
        timeout_ms: 5000
      });

      const result = JSON.parse(response.content);
      
      // Validate and set defaults
      const routerOutput: RouterOutput = {
        section: this.validateSection(result.section),
        subdomain: result.subdomain,
        prompt_text: result.prompt_text || cleanedText,
        choices: result.choices || choices,
        is_gridin: result.is_gridin || false,
        has_figure: result.has_figure || false,
        extracted_numbers: result.extracted_numbers || this.extractNumbers(questionText),
        time_budget_s: result.time_budget_s || 25
      };

      const latency = Date.now() - startTime;
      console.log(`Router classified question in ${latency}ms as ${routerOutput.section}/${routerOutput.subdomain}`);

      return routerOutput;
    } catch (error) {
      console.error('Router error:', error);
      
      // Fallback classification
      return this.fallbackClassification(cleanedText, choices);
    }
  }

  private cleanOCRText(text: string): string {
    return text
      // Fix common OCR spacing issues
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Fix number/letter combinations
      .replace(/(\d)([a-zA-Z])/g, '$1 $2')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Fix common math symbols
      .replace(/\bx\b/g, '×')
      .replace(/\bdiv\b/g, '÷')
      // Remove artifacts
      .replace(/[|_]/g, '')
      .trim();
  }

  private validateSection(section: string): SATSection {
    if (section === 'EBRW' || section === 'Math') {
      return section;
    }
    
    // Fallback heuristics
    const text = section.toLowerCase();
    if (text.includes('math') || text.includes('algebra') || text.includes('geometry')) {
      return 'Math';
    }
    return 'EBRW';
  }

  private extractNumbers(text: string): number[] {
    const numberRegex = /-?\d+\.?\d*/g;
    const matches = text.match(numberRegex);
    return matches ? matches.map(Number).filter(n => !isNaN(n)) : [];
  }

  private fallbackClassification(questionText: string, choices: string[]): RouterOutput {
    const text = questionText.toLowerCase();
    
    // Math indicators
    const mathKeywords = ['equation', 'solve', 'graph', 'function', 'angle', 'area', 'volume', 'percent', 'ratio'];
    const isMath = mathKeywords.some(keyword => text.includes(keyword)) || 
                   /\d+/.test(questionText) || 
                   text.includes('=') || 
                   text.includes('x') || 
                   text.includes('y');

    if (isMath) {
      return {
        section: 'Math',
        subdomain: 'algebra' as MathDomain,
        prompt_text: questionText,
        choices,
        is_gridin: choices.length === 0,
        has_figure: false,
        extracted_numbers: this.extractNumbers(questionText),
        time_budget_s: 30
      };
    }

    // EBRW fallback
    return {
      section: 'EBRW',
      subdomain: 'information_ideas' as EBRWDomain,
      prompt_text: questionText,
      choices,
      is_gridin: false,
      has_figure: false,
      extracted_numbers: [],
      time_budget_s: 20
    };
  }
}