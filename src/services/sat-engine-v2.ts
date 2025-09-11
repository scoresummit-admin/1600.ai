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
        'openai/gpt-5': 0,
        'openai/o3': 0,
        'x-ai/grok-4': 0,
        'deepseek/deepseek-r1': 0,
        'anthropic/claude-sonnet-4': 0
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
    const maxTimeMs = 60000; // Hard 60s limit (1 minute as requested)
    
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
          setTimeout(() => reject(new Error('Router timeout')), 40000) // 40s for routing
        )
      ]);
      
      const routeTime = Date.now() - startTime;
      console.log(`📍 Routed as ${routedItem.section}/${routedItem.subdomain} in ${routeTime}ms`);
      
      const remainingTime = maxTimeMs - (Date.now() - startTime);
      
      // Step 2: Solve based on section
      let solverResult;
      let verifierReport;
      
      if (routedItem.section === 'EBRW') {
        // EBRW Pipeline: Concurrent quartet → Claude/Grok Verifier
        console.log('📚 Solving EBRW question with concurrent quartet...');
        
        try {
          solverResult = await Promise.race([
            this.ebrwSolver.solve(routedItem, Math.min(remainingTime * 0.7, 50000)), // Up to 50s
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('EBRW solver timeout')), Math.min(remainingTime * 0.7, 50000))
            )
          ]);
          console.log(`✅ EBRW solver completed: ${solverResult.final} (${solverResult.confidence.toFixed(2)} confidence)`);
        } catch (error) {
          console.error('❌ EBRW solver failed:', error);
          // Create fallback solution instead of failing completely
          solverResult = {
            final: 'A',
            confidence: 0.15,
            meta: {
              domain: 'information_ideas',
              explanation: 'Solver timeout or error occurred',
              evidence: ['Fallback due to system error'],
              elimination_notes: { 'Error': 'Pipeline timeout' }
            },
            model: 'fallback'
          };
        }
        
        // Update metrics for all EBRW models
        this.metrics.model_usage['openai/o3']++;
        this.metrics.model_usage['openai/gpt-5']++;
        this.metrics.model_usage['x-ai/grok-4']++;
        this.metrics.model_usage['anthropic/claude-sonnet-4']++;
        
        try {
          verifierReport = await Promise.race([
            this.ebrwVerifier.verify(routedItem, solverResult),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('EBRW verifier timeout')), Math.min(remainingTime * 0.3, 40000))
            )
          ]);
          console.log(`✅ EBRW verifier completed: ${verifierReport.passed ? 'PASSED' : 'FAILED'} (${verifierReport.score.toFixed(2)})`);
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
        
        // Additional verifier model usage
        this.metrics.model_usage['anthropic/claude-sonnet-4']++;
        this.metrics.model_usage['x-ai/grok-4']++;
        
      } else {
        // Math Pipeline: Concurrent trio → Math Verifier
        console.log('🔢 Solving Math question with concurrent trio...');
        
        try {
          solverResult = await Promise.race([
            this.mathSolver.solve(routedItem), // Math solver handles its own timeouts
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Math solver timeout')), Math.min(remainingTime * 0.8, 55000))
            )
          ]);
          console.log(`✅ Math solver completed: ${solverResult.final} (${solverResult.confidence.toFixed(2)} confidence)`);
        } catch (error) {
          console.error('❌ Math solver failed:', error);
          // Create fallback solution instead of failing completely
          solverResult = {
            final: routedItem.choices.length > 0 ? 'A' : '0',
            confidence: 0.15,
            meta: {
              method: 'fallback',
              explanation: 'Solver timeout or error occurred',
              python: `# Fallback solution\nresult = "${routedItem.choices.length > 0 ? 'A' : '0'}"`,
              pythonResult: { ok: false, error: 'Solver timeout' },
              checks: ['fallback']
            },
            model: 'fallback'
          };
        }
        
        // Update metrics for all Math models
        this.metrics.model_usage['openai/gpt-5']++;
        this.metrics.model_usage['x-ai/grok-4']++;
        this.metrics.model_usage['deepseek/deepseek-r1']++;
        
        try {
          verifierReport = await Promise.race([
            this.mathVerifier.verify(routedItem, solverResult),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Math verifier timeout')), Math.min(remainingTime * 0.2, 35000))
            )
          ]);
          console.log(`✅ Math verifier completed: ${verifierReport.passed ? 'PASSED' : 'FAILED'} (${verifierReport.score.toFixed(2)})`);
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
        console.warn(`⚠️ Exceeded time budget: ${totalTime}ms > ${maxTimeMs}ms - applying confidence penalty`);
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