import { RoutedItem, SolverResult, VerifierReport, AggregatedAnswer } from '../../types/sat';

export class SATAggregator {
  constructor() {}

  async aggregate(
    routedItem: RoutedItem,
    solverResult: SolverResult,
    verifierReport: VerifierReport,
    startTime: number
  ): Promise<AggregatedAnswer> {
    console.log('🎯 Aggregating results...');

    // Calculate final confidence based on solver confidence and verifier score
    let finalConfidence = solverResult.confidence;

    if (verifierReport.passed) {
      // Boost confidence if verification passed
      finalConfidence = Math.min(1.0, finalConfidence * (1 + (verifierReport.score * 0.2)));
    } else {
      // Reduce confidence if verification failed
      finalConfidence = finalConfidence * Math.max(0.5, verifierReport.score);
    }

    const totalTime = Date.now() - startTime;

    const aggregatedAnswer: AggregatedAnswer = {
      answer: solverResult.final,
      confidence: finalConfidence,
      section: routedItem.section,
      subdomain: routedItem.subdomain,
      timeMs: totalTime,
      modelVotes: [solverResult],
      verifier: verifierReport,
      shortExplanation: solverResult.meta.explanation || 'Solution found using advanced reasoning.',
      evidenceOrChecks: [
        ...(solverResult.meta.checks || []),
        ...(verifierReport.checks || [])
      ]
    };

    console.log(`🎯 Final aggregated answer: ${aggregatedAnswer.answer} (${(aggregatedAnswer.confidence * 100).toFixed(1)}%)`);

    return aggregatedAnswer;
  }
}