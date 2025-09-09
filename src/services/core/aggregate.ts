import { RoutedItem, SolverResult, VerifierReport, AggregatedAnswer } from '../../../types/sat';
import { EBRWSolver } from '../ebrw-solver';
import { MathSolver } from '../math-solver';

export class SATAggregator {
  private ebrwSolver: EBRWSolver;
  private mathSolver: MathSolver;

  constructor() {
    this.ebrwSolver = new EBRWSolver();
    this.mathSolver = new MathSolver();
  }

  async aggregate(
    item: RoutedItem,
    solverResult: SolverResult,
    verifierReport: VerifierReport,
    startTime: number,
    escalationResult?: SolverResult
  ): Promise<AggregatedAnswer> {
    const totalTime = Date.now() - startTime;
    let finalResult = solverResult;
    let finalConfidence = solverResult.confidence;
    const modelVotes = [solverResult];

    // Add escalation result if available
    if (escalationResult) {
      modelVotes.push(escalationResult);
      
      // Choose the better result
      if (escalationResult.confidence > solverResult.confidence || 
          (verifierReport.passed && escalationResult.final === solverResult.final)) {
        finalResult = escalationResult;
        finalConfidence = escalationResult.confidence;
      }
    }

    // Apply verification-based confidence adjustment
    if (item.section === 'MATH') {
      if (verifierReport.passed) {
        // Math verifier passed → accept answer with boosted confidence
        finalConfidence = Math.min(1.0, 0.75 + 0.25 * finalResult.confidence);
      } else {
        // Math verifier failed → check if we need escalation
        if (finalConfidence < 0.72 && !escalationResult) {
          try {
            console.log('🔄 Math escalating due to verification failure...');
            const escalated = await this.mathSolver.solve(item, 10000);
            modelVotes.push(escalated);
            finalResult = escalated;
            finalConfidence = escalated.confidence * 0.85; // Reduce confidence for failed verification
          } catch (error) {
            console.warn('Math escalation failed:', error);
            finalConfidence *= 0.7;
          }
        } else {
          finalConfidence *= 0.7;
        }
      }
    } else {
      // EBRW
      if (verifierReport.passed) {
        // EBRW verifier passed → accept answer with boosted confidence
        finalConfidence = Math.min(1.0, 0.7 + 0.3 * finalResult.confidence);
      } else {
        // EBRW verifier failed → check if we need escalation
        if (finalConfidence < 0.72 && !escalationResult) {
          try {
            console.log('🔄 EBRW escalating due to verification failure...');
            const escalated = await this.ebrwSolver.solve(item, 10000);
            modelVotes.push(escalated);
            finalResult = escalated;
            finalConfidence = escalated.confidence * 0.85;
          } catch (error) {
            console.warn('EBRW escalation failed:', error);
            finalConfidence *= 0.7;
          }
        } else {
          finalConfidence *= 0.7;
        }
      }
    }

    // Handle disagreement after escalation
    if (modelVotes.length > 1) {
      const answers = modelVotes.map(v => v.final);
      const uniqueAnswers = new Set(answers);
      
      if (uniqueAnswers.size > 1) {
        // Disagreement - choose highest verified score or reduce confidence
        const verifiedVote = modelVotes.find(v => v.final === finalResult.final);
        if (verifiedVote && verifierReport.passed) {
          finalConfidence = Math.min(0.9, verifiedVote.confidence);
        } else {
          finalConfidence *= 0.85;
        }
      }
    }

    // Extract evidence or checks (max 2 items)
    let evidenceOrChecks: string[] = [];
    if (item.section === 'EBRW') {
      evidenceOrChecks = (finalResult.meta.evidence || []).slice(0, 2);
    } else {
      evidenceOrChecks = (finalResult.meta.checks || []).slice(0, 2);
    }

    return {
      answer: finalResult.final,
      confidence: Math.max(0.1, Math.min(1.0, finalConfidence)),
      section: item.section,
      subdomain: item.subdomain,
      timeMs: totalTime,
      modelVotes,
      verifier: verifierReport,
      shortExplanation: finalResult.meta.explanation || 'Solution computed',
      evidenceOrChecks
    };
  }
}