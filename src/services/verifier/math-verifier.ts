import { RoutedItem, SolverResult, VerifierReport } from '../../types/sat';

export class MathVerifier {
  constructor() {}

  async verify(item: RoutedItem, solverResult: SolverResult): Promise<VerifierReport> {
    console.log('🔍 Math verifier starting...');
    
    const checks: string[] = [];
    let score = 0.7; // Base score
    let passed = true;
    const notes: string[] = [];

    // Python execution check (highest priority)
    if (solverResult.meta.pythonResult?.ok) {
      score += 0.2;
      checks.push('python_execution_successful');
      notes.push('Python execution successful and matches answer');
      
      // Verify Python result matches the final answer
      const pythonAnswer = String(solverResult.meta.pythonResult.result);
      if (this.compareAnswers(pythonAnswer, solverResult.final, item.choices)) {
        score += 0.1;
        checks.push('python_verification_matches');
        notes.push('Python result confirms model answer');
      } else {
        score -= 0.1;
        notes.push('Python result differs from model answer');
      }
    } else if (solverResult.meta.pythonResult?.error) {
      score -= 0.2;
      notes.push('Python execution failed');
    } else {
      score -= 0.1;
      notes.push('No Python verification provided');
    }

    // Domain checks
    if (this.isDomainAppropriate(item.subdomain, solverResult)) {
      score += 0.05;
      checks.push('domain_check_passed');
      notes.push('Domain check passed');
    }

    // Unit and reasonableness checks
    if (this.isAnswerReasonable(item, solverResult)) {
      score += 0.05;
      checks.push('reasonableness_check');
      notes.push('Answer appears reasonable');
    }

    // Confidence check
    if (solverResult.confidence >= 0.8) {
      score += 0.1;
      checks.push('high_confidence');
      notes.push('High model confidence');
    } else if (solverResult.confidence < 0.5) {
      score -= 0.2;
      passed = false;
      notes.push('Low confidence suggests uncertainty');
    }

    // Final answer format check
    if (item.isGridIn) {
      if (this.isValidNumericAnswer(solverResult.final)) {
        checks.push('valid_numeric_format');
        notes.push('Valid numeric answer for grid-in');
      } else {
        score -= 0.3;
        passed = false;
        notes.push('Invalid numeric format for grid-in');
      }
    } else {
      if (/^[A-D]$/.test(solverResult.final)) {
        checks.push('valid_choice_format');
        notes.push('Valid multiple choice answer');
      } else {
        score -= 0.3;
        passed = false;
        notes.push('Invalid choice format');
      }
    }

    score = Math.max(0, Math.min(1, score));
    passed = passed && score >= 0.6;

    console.log(`🔍 Math verification: ${passed ? 'PASSED' : 'FAILED'} (${score.toFixed(2)})`);

    return {
      passed,
      score,
      notes,
      checks
    };
  }

  private compareAnswers(pythonAnswer: string, modelAnswer: string, choices: string[]): boolean {
    const cleanPython = pythonAnswer.trim().toLowerCase();
    const cleanModel = modelAnswer.trim().toLowerCase();
    
    // Direct match
    if (cleanPython === cleanModel) return true;
    
    // Numeric comparison
    const num1 = parseFloat(cleanPython);
    const num2 = parseFloat(cleanModel);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      return Math.abs(num1 - num2) < 0.001;
    }
    
    return false;
  }

  private isDomainAppropriate(subdomain: string, result: SolverResult): boolean {
    // Basic domain consistency check
    if (subdomain === 'geometry_trigonometry') {
      // Should mention geometric concepts or use trig functions
      const explanation = result.meta.explanation?.toLowerCase() || '';
      const python = result.meta.python?.toLowerCase() || '';
      return explanation.includes('angle') || explanation.includes('triangle') || 
             python.includes('sin') || python.includes('cos') || python.includes('tan');
    }
    
    if (subdomain === 'algebra') {
      // Should involve algebraic manipulation
      const python = result.meta.python?.toLowerCase() || '';
      return python.includes('solve') || python.includes('simplify') || python.includes('expand');
    }
    
    // Default to true for other domains
    return true;
  }

  private isAnswerReasonable(item: RoutedItem, result: SolverResult): boolean {
    // Basic reasonableness checks
    const answer = result.final;
    
    if (item.isGridIn) {
      const num = parseFloat(answer);
      if (isNaN(num)) return false;
      
      // Check for reasonable ranges (basic sanity check)
      if (Math.abs(num) > 1000000) return false; // Very large numbers are suspicious
      if (num !== Math.floor(num) && Math.abs(num - Math.floor(num)) < 0.0001) {
        // Very close to integer, might be a precision issue
        return true;
      }
    }
    
    return true;
  }

  private isValidNumericAnswer(answer: string): boolean {
    const num = parseFloat(answer);
    return !isNaN(num) && isFinite(num);
  }
}