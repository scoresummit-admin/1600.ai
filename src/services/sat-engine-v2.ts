import { SATRouter } from './router';
import { EBRWSolver } from './ebrw-solver';
import { MathSolver } from './math-solver';
import { EBRWVerifier } from './verifier/ebrw-verifier';
import { MathVerifier } from './verifier/math-verifier';
import { SATAggregator } from './core/aggregate';
import { SatItem, AggregatedAnswer, PerformanceMetrics } from '../../types/sat';

export class SATEngine {
  private router: SATRouter;
  private ebrwSolver: EBRWSolver;
  private mathSolver: MathSolver;
  private ebrwVerifier: EBRWVerifier;
  private mathVerifier: MathVerifier;
  private aggregator: SATAggregator;
  private metrics: PerformanceMetrics;
  private latencies: number[] = [];

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
        'gpt-5': 0,
        'gpt-5-thinking': 0,
        'o4-mini': 0,
        'claude-opus-4-1-20250805': 0,
        'claude-sonnet-4-20250514': 0,
        'gemini-2.5-pro': 0,
        'qwen2.5-math-72b': 0
      }
    };
  }

  async solveQuestion(
    imageBase64: string,
    ocrText: string,
    choices: string[],
    correctAnswer?: string
  ): Promise<AggregatedAnswer> {
    const startTime = Date.now();
    const maxTimeMs = 30000; // Hard 30s limit
    
    try {
      console.log('🚀 Starting 1600.ai high-accuracy pipeline...');
      
      // Create SatItem
      const item: SatItem = {
        id: `q_${Date.now()}`,
        source: 'screenshot',  // We're now primarily screenshot-based
        imageBase64: imageBase64, // Actual base64 image data
        promptText: ocrText, // OCR text for fallback
        choices: choices.length > 0 ? choices : undefined,
        isGridIn: choices.length === 0
      };
      
      // Step 1: Route the question (7s budget)
      const routedItem = await Promise.race([
        this.router.routeItem(item),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Router timeout')), 7000)
        )
      ]);
      
      const routeTime = Date.now() - startTime;
      console.log(`📍 Routed as ${routedItem.section}/${routedItem.subdomain} in ${routeTime}ms`);
      
      const remainingTime = maxTimeMs - (Date.now() - startTime);
      
      // Step 2: Solve based on section
      let solverResult;
      let verifierReport;
      
      if (routedItem.section === 'EBRW') {
        // EBRW Pipeline: GPT-5 → Claude Verifier
        console.log('📚 Solving EBRW question...');
        
        try {
          solverResult = await Promise.race([
            this.ebrwSolver.solve(routedItem, Math.min(remainingTime * 0.6, 12000)),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('EBRW solver timeout')), 12000)
            )
          ]);
          console.log('✅ EBRW solver completed:', solverResult.final);
        } catch (error) {
          console.error('❌ EBRW solver failed:', error);
          throw error;
        }
        
        this.metrics.model_usage['gpt-5']++;
        if (solverResult.meta.escalated) {
          this.metrics.model_usage['gpt-5-thinking']++;
        }
        
        try {
          verifierReport = await Promise.race([
            this.ebrwVerifier.verify(routedItem, solverResult),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('EBRW verifier timeout')), 8000)
            )
          ]);
          console.log('✅ EBRW verifier completed:', verifierReport.passed ? 'PASSED' : 'FAILED');
        } catch (error) {
          console.error('❌ EBRW verifier failed:', error);
          // Create fallback verification
          verifierReport = {
            passed: false,
            score: 0.3,
            notes: ['Verifier failed due to error'],
            checks: ['error']
          };
        }
        
        this.metrics.model_usage['claude-3.5-sonnet']++;
        this.metrics.model_usage['claude-opus-4-1-20250805']++;
        
      } else {
        // Math Pipeline: o4-mini → Python → Math Verifier
        console.log('🔢 Solving Math question...');
        
        try {
          solverResult = await Promise.race([
            this.mathSolver.solve(routedItem, Math.min(remainingTime * 0.7, 16000)),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Math solver timeout')), 16000)
            )
          ]);
          console.log('✅ Math solver completed:', solverResult.final);
        } catch (error) {
          console.error('❌ Math solver failed:', error);
          throw error;
        }
        
        this.metrics.model_usage['o4-mini']++;
        
        try {
          verifierReport = await Promise.race([
            this.mathVerifier.verify(routedItem, solverResult),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Math verifier timeout')), 6000)
            )
          ]);
          console.log('✅ Math verifier completed:', verifierReport.passed ? 'PASSED' : 'FAILED');
        } catch (error) {
          console.error('❌ Math verifier failed:', error);
          // Create fallback verification
          verifierReport = {
            passed: false,
            score: 0.3,
            notes: ['Verifier failed due to error'],
            checks: ['error']
          };
        }
      }
      
      // Step 3: Aggregate results
      const aggregatedAnswer = await this.aggregator.aggregate(
        routedItem,
        solverResult,
        verifierReport,
        startTime
      );
      
      // Update metrics
      this.updateMetrics(aggregatedAnswer, correctAnswer);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Question solved: ${aggregatedAnswer.answer} (confidence: ${aggregatedAnswer.confidence.toFixed(2)}) in ${totalTime}ms`);
      
      // Apply timeout penalty if we exceeded budget
      if (totalTime > maxTimeMs) {
        aggregatedAnswer.confidence *= 0.7;
        console.warn(`⚠️ Exceeded time budget: ${totalTime}ms > ${maxTimeMs}ms`);
      }
      
      return aggregatedAnswer;
      
    } catch (error) {
      console.error('❌ SAT Engine error:', error);
      
      // Return fallback solution
      const fallbackAnswer: AggregatedAnswer = {
        answer: 'A',
        confidence: 0.2,
        section: 'EBRW',
        subdomain: 'information_ideas',
        timeMs: Date.now() - startTime,
        modelVotes: [],
        verifier: { passed: false, score: 0.1, notes: ['System error occurred'] },
        shortExplanation: 'System encountered an error',
        evidenceOrChecks: ['Error in pipeline']
      };
      
      this.updateMetrics(fallbackAnswer);
      return fallbackAnswer;
    }
  }

  private updateMetrics(answer: AggregatedAnswer, correctAnswer?: string) {
    this.metrics.total_questions++;
    
    if (correctAnswer && answer.answer === correctAnswer) {
      this.metrics.correct_answers++;
    }
    
    this.metrics.accuracy_rate = this.metrics.correct_answers / this.metrics.total_questions;
    
    // Update latency metrics
    this.latencies.push(answer.timeMs);
    if (this.latencies.length > 20) {
      this.latencies.shift(); // Keep rolling window of last 20
    }
    
    this.metrics.avg_latency_ms = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    
    // Calculate p95 latency
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
    this.metrics.p95_latency_ms = sortedLatencies[p95Index] || 0;
    
    // Update escalation rate
    const escalated = answer.modelVotes.some((vote: any) => vote.meta?.escalated);
    if (escalated) {
      this.metrics.escalation_rate = (this.metrics.escalation_rate * (this.metrics.total_questions - 1) + 1) / this.metrics.total_questions;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}