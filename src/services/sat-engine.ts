import { LLMClient } from './llm-client';
import { SATRouter } from './router';
import { EBRWSolver } from './ebrw-solver';
import { MathSolver } from './math-solver';
import { SATVerifier } from './verifier';
import { SATAggregator } from './aggregator';
import { SATSolutionLegacy, ModelConfig, PerformanceMetrics, EBRWDomain, MathDomain } from '../../types/sat';
import type { SatItem } from '../../types/sat';

export class SATEngine {
  private llmClient: LLMClient;
  private router: SATRouter;
  private ebrwSolver: EBRWSolver;
  private mathSolver: MathSolver;
  private verifier: SATVerifier;
  private aggregator: SATAggregator;
  private metrics: PerformanceMetrics;

  constructor(config: ModelConfig) {
    this.llmClient = new LLMClient(config);
    this.router = new SATRouter();
    this.ebrwSolver = new EBRWSolver();
    this.mathSolver = new MathSolver();
    this.verifier = new SATVerifier(this.llmClient);
    this.aggregator = new SATAggregator(this.llmClient);
    
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
        'claude-3.5-sonnet': 0,
        'gemini-2.5-pro': 0,
        'qwen2.5-math-72b': 0
      }
    };
  }

  async solveQuestion(
    questionText: string, 
    choices: string[],
    correctAnswer?: string
  ): Promise<SATSolutionLegacy> {
    const startTime = Date.now();
    const maxTimeMs = 30000; // Hard 30s limit
    
    try {
      console.log('🚀 Starting SAT question solving pipeline...');
      
      // Step 1: Route the question (1-2s budget)
      const satItem: SatItem = {
        id: `q_${Date.now()}`,
        source: 'text',
        promptText: questionText,
        choices: choices.length > 0 ? choices : undefined,
        isGridIn: choices.length === 0
      };
      const routerOutput = await this.router.routeItem(satItem);
      const routeTime = Date.now() - startTime;
      console.log(`📍 Routed as ${routerOutput.section}/${routerOutput.subdomain} in ${routeTime}ms`);
      
      if (routeTime > 3000) {
        console.warn('⚠️ Router exceeded time budget');
      }

      const remainingTime = maxTimeMs - (Date.now() - startTime);
      
      // Step 2: Solve based on section
      if (routerOutput.section === 'EBRW') {
        const ebrwDomain = routerOutput.subdomain as EBRWDomain;
        const ebrwRouterOutput = {
          ...routerOutput,
          subdomain: ebrwDomain
        };
        return await this.solveEBRW(ebrwRouterOutput, choices, startTime, remainingTime, correctAnswer);
      } else {
        const mathDomain = routerOutput.subdomain as MathDomain;
        const mathRouterOutput = {
          ...routerOutput,
          subdomain: mathDomain
        };
        return await this.solveMath(mathRouterOutput, startTime, remainingTime, correctAnswer);
      }
      
    } catch (error) {
      console.error('❌ SAT Engine error:', error);
      
      // Determine section for fallback
      const fallbackSection = 'EBRW';
      const fallbackSubdomain = fallbackSection === 'EBRW' ? 'information_ideas' : 'algebra';
      
      // Return fallback solution
      return {
        final_choice_or_value: 'A',
        section: fallbackSection as any,
        subdomain: fallbackSubdomain as any,
        confidence_0_1: 0.1,
        time_ms: Date.now() - startTime,
        model_votes: [],
        short_explanation: 'Error occurred during solving',
        evidence_or_checklist: ['System error'],
        verification_result: { passed: false, confidence_adjustment: -0.5, notes: ['Error in pipeline'] },
        escalated: false
      };
    }
  }

  private async solveEBRW(
    routerOutput: any,
    choices: string[],
    startTime: number,
    remainingTime: number,
    correctAnswer?: string
  ): Promise<SATSolutionLegacy> {
    console.log('📚 Solving EBRW question...', routerOutput.section, routerOutput.subdomain);
    
    // Validate this is actually an EBRW question
    if (routerOutput.section !== 'EBRW') {
      console.error('❌ EBRW solver called with non-EBRW question:', routerOutput.section);
      throw new Error(`EBRW solver called with ${routerOutput.section} question`);
    }
    
    const solutions = [];
    const verificationResults = [];
    
    try {
      // Primary solve with GPT-5
      const primaryResult = await this.ebrwSolver.solve(routerOutput, Math.min(remainingTime * 0.6, 15000));
      
      // Convert SolverResult to EBRWSolution
      const primarySolution = {
        final_choice: primaryResult.final as 'A' | 'B' | 'C' | 'D',
        confidence_0_1: primaryResult.confidence,
        domain: primaryResult.meta.domain || routerOutput.subdomain,
        short_explanation: primaryResult.meta.explanation || 'Solution found',
        evidence: primaryResult.meta.evidence || [],
        elimination_notes: primaryResult.meta.elimination_notes || {},
        model: primaryResult.model as any
      };
      solutions.push(primarySolution);
      this.metrics.model_usage['gpt-5']++;
      
      // Verify primary solution
      const primaryVerification = await this.verifier.verifyEBRW(
        primarySolution,
        routerOutput.prompt_text,
        choices // Use original choices with full text
      );
      verificationResults.push(primaryVerification);
      
      // Cross-check with Claude if needed
      if (primaryResult.confidence < 0.85 || !primaryVerification.passed) {
        try {
          // Use escalation for cross-check
          const crossCheckResult = await this.ebrwSolver.solve(routerOutput, Math.min(remainingTime * 0.3, 10000));
          
          const crossCheckSolution = {
            final_choice: crossCheckResult.final as 'A' | 'B' | 'C' | 'D',
            confidence_0_1: crossCheckResult.confidence,
            domain: crossCheckResult.meta.domain || routerOutput.subdomain,
            short_explanation: crossCheckResult.meta.explanation || 'Cross-check solution',
            evidence: crossCheckResult.meta.evidence || [],
            elimination_notes: crossCheckResult.meta.elimination_notes || {},
            model: crossCheckResult.model as any
          };
          solutions.push(crossCheckSolution);
          this.metrics.model_usage['claude-3.5-sonnet']++;
          
          const crossVerification = await this.verifier.verifyEBRW(
            crossCheckSolution,
            routerOutput.normalizedPrompt,
            routerOutput.choices
          );
          verificationResults.push(crossVerification);
        } catch (error) {
          console.warn('Cross-check failed:', error);
        }
      }

      // Additional Google Gemini check for complex cases
      if (solutions.length > 1 && primaryResult.confidence < 0.8) {
        try {
          const geminiResult = await this.ebrwSolver.solve(routerOutput, 8000);
          
          const geminiSolution = {
            final_choice: geminiResult.final as 'A' | 'B' | 'C' | 'D',
            confidence_0_1: geminiResult.confidence,
            domain: geminiResult.meta.domain || routerOutput.subdomain,
            short_explanation: geminiResult.meta.explanation || 'Gemini verification',
            evidence: geminiResult.meta.evidence || [],
            elimination_notes: geminiResult.meta.elimination_notes || {},
            model: geminiResult.model as any
          };
          solutions.push(geminiSolution);
          this.metrics.model_usage['gemini-2.5-pro']++;
          
          const geminiVerification = await this.verifier.verifyEBRW(
            geminiSolution,
            routerOutput.normalizedPrompt,
            routerOutput.choices
          );
          verificationResults.push(geminiVerification);
        } catch (error) {
          console.warn('Gemini verification failed:', error);
        }
      }
      
    } catch (error) {
      console.error('EBRW solving error:', error);
      // Return fallback solution instead of throwing
      return {
        final_choice_or_value: 'B',
        section: 'EBRW',
        subdomain: routerOutput.subdomain,
        confidence_0_1: 0.5,
        time_ms: Date.now() - startTime,
        model_votes: [{
          model: 'gpt-5',
          choice_or_value: 'B',
          confidence: 0.5,
          reasoning: 'Fallback solution due to solver error'
        }],
        short_explanation: 'System encountered an error but provided best guess',
        evidence_or_checklist: ['Error in primary solver'],
        verification_result: { passed: false, confidence_adjustment: -0.2, notes: ['Solver error occurred'] },
        escalated: true
      };
    }
    
    const totalTime = Date.now() - startTime;
    const solution = await this.aggregator.aggregateEBRW(
      solutions,
      verificationResults,
      'EBRW',
      routerOutput.subdomain,
      totalTime
    );
    
    this.updateMetrics(solution, correctAnswer, totalTime);
    console.log(`✅ EBRW solved: ${solution.final_choice_or_value} (confidence: ${solution.confidence_0_1.toFixed(2)}) in ${totalTime}ms`);
    
    return solution;
  }

  private async solveMath(
    routerOutput: any,
    startTime: number,
    remainingTime: number,
    correctAnswer?: string
  ): Promise<SATSolutionLegacy> {
    console.log('🔢 Solving Math question...', routerOutput.section, routerOutput.subdomain);
    
    // Validate this is actually a Math question
    if (routerOutput.section !== 'Math') {
      console.error('❌ Math solver called with non-Math question:', routerOutput.section);
      throw new Error(`Math solver called with ${routerOutput.section} question`);
    }
    
    const solutions = [];
    const verificationResults = [];
    
    try {
      // Primary solve with o4-mini
      const primaryResult = await this.mathSolver.solve(routerOutput, Math.min(remainingTime * 0.7, 18000));
      
      // Convert SolverResult to MathSolution
      const primarySolution = {
        answer_value_or_choice: primaryResult.final,
        confidence_0_1: primaryResult.confidence,
        method: primaryResult.meta.method || 'hybrid',
        checks: primaryResult.meta.checks || [],
        short_explanation: primaryResult.meta.explanation || 'Solution computed',
        model: primaryResult.model as any
      };
      solutions.push(primarySolution);
      this.metrics.model_usage['o4-mini']++;
      
      // Verify primary solution
      const primaryVerification = await this.verifier.verifyMath(
        primarySolution,
        routerOutput.prompt_text,
        routerOutput.choices
      );
      verificationResults.push(primaryVerification);
      
      // Second opinion if confidence is low or verification failed
      if (primarySolution.confidence_0_1 < 0.9 || !primaryVerification.passed) {
        try {
          const secondResult = await this.mathSolver.solve(routerOutput, Math.min(remainingTime * 0.25, 12000));
          
          // Convert SolverResult to MathSolution
          const secondSolution = {
            answer_value_or_choice: secondResult.final,
            confidence_0_1: secondResult.confidence,
            method: secondResult.meta.method || 'hybrid',
            checks: secondResult.meta.checks || [],
            short_explanation: secondResult.meta.explanation || 'Second opinion',
            model: secondResult.model as any
          };
          solutions.push(secondSolution);
          this.metrics.model_usage['gpt-5-thinking']++;
          
          const secondVerification = await this.verifier.verifyMath(
            secondSolution,
            routerOutput.prompt_text,
            routerOutput.choices
          );
          verificationResults.push(secondVerification);
        } catch (error) {
          console.warn('Second math opinion failed:', error);
        }
      }

      // Google Gemini for additional mathematical verification
      if (solutions.length > 1 || primarySolution.confidence_0_1 < 0.85) {
        try {
          const geminiResult = await this.mathSolver.solve(routerOutput, 8000);
          
          // Convert SolverResult to MathSolution
          const geminiSolution = {
            answer_value_or_choice: geminiResult.final,
            confidence_0_1: geminiResult.confidence,
            method: geminiResult.meta.method || 'hybrid',
            checks: geminiResult.meta.checks || [],
            short_explanation: geminiResult.meta.explanation || 'Gemini verification',
            model: geminiResult.model as any
          };
          solutions.push(geminiSolution);
          this.metrics.model_usage['gemini-2.5-pro']++;
          
          const geminiVerification = await this.verifier.verifyMath(
            geminiSolution,
            routerOutput.prompt_text,
            routerOutput.choices
          );
          verificationResults.push(geminiVerification);
        } catch (error) {
          console.warn('Gemini math verification failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Math solving error:', error);
      // Return fallback solution instead of throwing
      return {
        final_choice_or_value: 'A',
        section: 'Math',
        subdomain: routerOutput.subdomain,
        confidence_0_1: 0.3,
        time_ms: Date.now() - startTime,
        model_votes: [{
          model: 'o4-mini',
          choice_or_value: 'A',
          confidence: 0.3,
          reasoning: 'Fallback solution due to solver error'
        }],
        short_explanation: 'System encountered an error but provided best guess',
        evidence_or_checklist: ['Error in primary solver'],
        verification_result: { passed: false, confidence_adjustment: -0.3, notes: ['Solver error occurred'] },
        escalated: true
      };
    }
    
    const totalTime = Date.now() - startTime;
    const solution = await this.aggregator.aggregateMath(
      solutions,
      verificationResults,
      'Math',
      routerOutput.subdomain,
      totalTime
    );
    
    this.updateMetrics(solution, correctAnswer, totalTime);
    console.log(`✅ Math solved: ${solution.final_choice_or_value} (confidence: ${solution.confidence_0_1.toFixed(2)}) in ${totalTime}ms`);
    
    return solution;
  }

  private updateMetrics(solution: SATSolutionLegacy, correctAnswer?: string, timeMs?: number) {
    this.metrics.total_questions++;
    
    if (correctAnswer && solution.final_choice_or_value === correctAnswer) {
      this.metrics.correct_answers++;
    }
    
    this.metrics.accuracy_rate = this.metrics.correct_answers / this.metrics.total_questions;
    
    if (timeMs) {
      // Update latency metrics (simplified)
      this.metrics.avg_latency_ms = (this.metrics.avg_latency_ms * (this.metrics.total_questions - 1) + timeMs) / this.metrics.total_questions;
      this.metrics.p95_latency_ms = Math.max(this.metrics.p95_latency_ms, timeMs);
    }
    
    if (solution.escalated) {
      this.metrics.escalation_rate = (this.metrics.escalation_rate * (this.metrics.total_questions - 1) + 1) / this.metrics.total_questions;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  updateConfig(newConfig: Partial<ModelConfig>) {
    this.llmClient.updateConfig(newConfig);
  }
}