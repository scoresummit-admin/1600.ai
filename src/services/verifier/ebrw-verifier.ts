import { RoutedItem, SolverResult, VerifierReport } from '../../types/sat';

export class EBRWVerifier {
  constructor() {}

  async verify(item: RoutedItem, solverResult: SolverResult): Promise<VerifierReport> {
    console.log('🔍 EBRW verifier starting...');
    
    const checks: string[] = [];
    let score = 0.8; // Base score
    let passed = true;
    const notes: string[] = [];

    // Check if evidence was provided
    if (solverResult.meta.evidence && Array.isArray(solverResult.meta.evidence) && solverResult.meta.evidence.length > 0) {
      score += 0.1;
      checks.push('evidence_provided');
      notes.push('Evidence extracted from passage');
    } else {
      score -= 0.2;
      notes.push('No evidence provided - may indicate weak reasoning');
    }

    // Check if choice elimination was performed
    if (solverResult.meta.elimination_notes) {
      score += 0.1;
      checks.push('choice_elimination');
      notes.push('Wrong choices were eliminated');
    }

    // Confidence check
    if (solverResult.confidence >= 0.7) {
      score += 0.1;
      checks.push('high_confidence');
      notes.push('High model confidence');
    } else if (solverResult.confidence < 0.5) {
      score -= 0.2;
      passed = false;
      notes.push('Low confidence suggests uncertainty');
    }

    // Final answer format check
    if (/^[A-D]$/.test(solverResult.final)) {
      checks.push('valid_answer_format');
      notes.push('Answer format is valid');
    } else {
      score -= 0.3;
      passed = false;
      notes.push('Invalid answer format');
    }

    // Domain-specific checks
    if (item.subdomain === 'craft_structure' || item.subdomain === 'information_ideas') {
      // Text analysis questions - evidence is crucial
      if (!solverResult.meta.evidence || solverResult.meta.evidence.length === 0) {
        score -= 0.2;
        notes.push('Missing evidence for text analysis question');
      }
    }

    score = Math.max(0, Math.min(1, score));
    passed = passed && score >= 0.6;

    console.log(`🔍 EBRW verification: ${passed ? 'PASSED' : 'FAILED'} (${score.toFixed(2)})`);

    return {
      passed,
      score,
      notes,
      checks
    };
  }
}