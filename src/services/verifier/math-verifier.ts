import { RoutedItem, SolverResult, VerifierReport } from '../../types/sat';

export class MathVerifier {
  constructor() {}

  async verify(item: RoutedItem, solverResult: SolverResult): Promise<VerifierReport> {
    console.log('🔍 Math verifier starting...');
    
    const checks: string[] = [];
    let score = 0.7; // Base score
    let passed = true;
    const notes: string[] = [];

    // Check if Python code was provided and executed successfully
    if (solverResult.meta.pythonResult?.ok) {
      score += 0.2;
      checks.push('python_verified');
      notes.push('Python code executed successfully');
      
      // Extra boost if Python result matches final answer
      const pythonAnswer = String(solverResult.meta.pythonResult.result).trim();
      if (this.compareAnswers(pythonAnswer, solverResult.final, item.choices)) {
        score += 0.1;
        checks.push('python_matches_answer');
        notes.push('Python result confirms final answer');
      }
    } else if (solverResult.meta.python) {
      // Python code was provided but failed
      score -= 0.1;
      notes.push('Python code provided but failed to execute');
    } else {
      // No Python code provided
      score -= 0.2;
      notes.push('No Python verification code provided');
    }

    // Check confidence level
    if (solverResult.confidence >= 0.8) {
      score += 0.1;
      checks.push('high_confidence');
      notes.push('High solver confidence');
    } else if (solverResult.confidence < 0.5) {
      score -= 0.2;
      passed = false;
      notes.push('Low confidence suggests uncertainty');
    }

    // Answer format validation
    if (item.choices.length > 0) {
      // Multiple choice - should be A, B, C, or D
      if (/^[A-D]$/.test(solverResult.final)) {
        checks.push('valid_mc_format');
        notes.push('Valid multiple choice answer format');
      } else {
        score -= 0.3;
        passed = false;
        notes.push('Invalid multiple choice answer format');
      }
    } else {
      // Grid-in - should be numeric
      const numValue = parseFloat(solverResult.final);
      if (!isNaN(numValue)) {
        checks.push('valid_numeric_format');
        notes.push('Valid numeric answer format');
      } else {
        score -= 0.3;
        passed = false;
        notes.push('Invalid numeric answer format');
      }
    }

    // Domain-specific checks
    if (item.subdomain === 'algebra') {
      if (solverResult.meta.method === 'symbolic') {
        score += 0.05;
        checks.push('symbolic_algebra');
        notes.push('Used symbolic algebra approach');
      }
    } else if (item.subdomain === 'geometry_trigonometry') {
      if (solverResult.meta.explanation?.includes('angle') || 
          solverResult.meta.explanation?.includes('triangle') ||
          solverResult.meta.explanation?.includes('area')) {
        score += 0.05;
        checks.push('geometric_reasoning');
        notes.push('Shows geometric reasoning');
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
    
    // Try numeric comparison
    const num1 = parseFloat(cleanPython);
    const num2 = parseFloat(cleanModel);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      return Math.abs(num1 - num2) < 0.001;
    }
    
    return false;
  }
}