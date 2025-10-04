import { SatItem, AggregatedAnswer, PerformanceMetrics, Section } from '../types/sat';
import { SATRouter } from './router';
import { EBRWSolver } from './ebrw-solver';
import { MathSolver } from './math-solver';
import { EBRWVerifier } from './verifier/ebrw-verifier';
import { MathVerifier } from './verifier/math-verifier';
import { SATAggregator } from './core/aggregate';

export class SATEngine {
  private router: SATRouter;
  private ebrwSolver: EBRWSolver;
  private mathSolver: MathSolver;
  private ebrwVerifier: EBRWVerifier;
  private mathVerifier: MathVerifier;
  private aggregator: SATAggregator;
  private metrics: PerformanceMetrics;

  constructor() {
    this.router = new SATRouter();
    this.ebrwSolver = new EBRWSolver();
    this.mathSolver = new MathSolver();
    this.ebrwVerifier = new EBRWVerifier();
    this.mathVerifier = new MathVerifier();
    this.aggregator = new SATAggregator();
    this.metrics = {
      total_questions: 0,
      correct_answers: 0,
      accuracy_rate: 0,
      avg_latency_ms: 0,
      p95_latency_ms: 0,
      escalation_rate: 0,
      model_usage: {
        'openai/gpt-5': 0,
        'openai/gpt-5-thinking': 0,
        'x-ai/grok-4': 0,
        'anthropic/claude-opus-4.1': 0,
        'anthropic/claude-4.1-sonnet': 0
      }
    };
  }

  async solveQuestion(
    imageDataUrl: string,
    section: Section,
    correctAnswer?: string
  ): Promise<AggregatedAnswer> {
    const startTime = Date.now();
    
    try {
      console.log('🎯 SAT Engine starting pipeline...');

      // 1. Create input item
      const inputItem: SatItem = {
        source: 'screenshot',
        choices: [], // Will be extracted by vision models
        imageBase64: imageDataUrl,
        isGridIn: false // Will be determined by vision models
      };

      // 2. Route the item (Router phase)
      console.log('📍 Router phase starting...');
      const routedItem = await this.router.routeItem(inputItem, section);
      console.log(`📍 Routed as: ${routedItem.section}/${routedItem.subdomain}`);

      // 3. Solve based on section (Solver phase)
      console.log(`🔄 ${routedItem.section} solver phase starting...`);
      let solverResult;
      if (routedItem.section === 'EBRW') {
        solverResult = await this.ebrwSolver.solve(routedItem);
      } else {
        solverResult = await this.mathSolver.solve(routedItem);
      }
      console.log(`✅ Solver completed: ${solverResult.final} (${solverResult.confidence.toFixed(2)})`);

      // 4. Verify the result (Verifier phase)
      console.log('🔍 Verifier phase starting...');
      let verifierReport;
      if (routedItem.section === 'EBRW') {
        verifierReport = await this.ebrwVerifier.verify(routedItem, solverResult);
      } else {
        verifierReport = await this.mathVerifier.verify(routedItem, solverResult);
      }
      console.log(`🔍 Verification: ${verifierReport.passed ? 'PASSED' : 'FAILED'} (${verifierReport.score.toFixed(2)})`);

      // 5. Aggregate final result (Aggregator phase)
      console.log('🎯 Aggregator phase starting...');
      const aggregatedAnswer = await this.aggregator.aggregate(
        routedItem,
        solverResult,
        verifierReport,
        startTime
      );

      // 6. Update metrics
      this.updateMetrics(aggregatedAnswer, correctAnswer, startTime);

      const totalTime = Date.now() - startTime;
      console.log(`🏁 SAT Engine completed in ${totalTime}ms: ${aggregatedAnswer.answer} (${aggregatedAnswer.confidence.toFixed(2)})`);

      return aggregatedAnswer;

    } catch (error) {
      console.error('❌ SAT Engine pipeline error:', error);
      throw error;
    }
  }

  private updateMetrics(result: AggregatedAnswer, correctAnswer?: string, startTime?: number): void {
    this.metrics.total_questions++;
    
    if (correctAnswer && result.answer === correctAnswer) {
      this.metrics.correct_answers++;
    }
    
    this.metrics.accuracy_rate = this.metrics.correct_answers / this.metrics.total_questions;
    
    if (startTime) {
      const latency = Date.now() - startTime;
      this.metrics.avg_latency_ms = (
        (this.metrics.avg_latency_ms * (this.metrics.total_questions - 1)) + latency
      ) / this.metrics.total_questions;
      this.metrics.p95_latency_ms = Math.max(this.metrics.p95_latency_ms, latency);
    }

    // Update model usage
    result.modelVotes.forEach(vote => {
      if (vote.model in this.metrics.model_usage) {
        (this.metrics.model_usage as any)[vote.model]++;
      }
    });

    // Update escalation rate (simplified - if we have more than 1 model vote, it was escalated)
    if (result.modelVotes.length > 1) {
      this.metrics.escalation_rate = (this.metrics.escalation_rate * (this.metrics.total_questions - 1) + 1) / this.metrics.total_questions;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}