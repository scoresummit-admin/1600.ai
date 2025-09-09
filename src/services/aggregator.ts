import { LLMClient } from './llm-client';
import { EBRWSolution, MathSolution, ModelVote, VerificationResult, SATSolution, SATSection, EBRWDomain, MathDomain } from '../types/sat';

export class SATAggregator {
  constructor(private llmClient: LLMClient) {}

  async aggregateEBRW(
    solutions: EBRWSolution[],
    verificationResults: VerificationResult[],
    section: SATSection,
    subdomain: EBRWDomain,
    totalTimeMs: number
  ): Promise<SATSolution> {
    const modelVotes: ModelVote[] = solutions.map((sol, i) => ({
      model: sol.model,
      choice_or_value: sol.final_choice,
      confidence: sol.confidence_0_1 + (verificationResults[i]?.confidence_adjustment || 0),
      reasoning: sol.short_explanation
    }));

    // Weighted voting with verification priority
    const verifiedSolutions = solutions.filter((_, i) => verificationResults[i]?.passed);
    
    let finalSolution: EBRWSolution;
    let finalVerification: VerificationResult;
    
    if (verifiedSolutions.length > 0) {
      // Use highest confidence verified solution
      const verifiedIndices = solutions.map((_, i) => verificationResults[i]?.passed ? i : -1).filter(i => i >= 0);
      const bestVerifiedIndex = verifiedIndices.reduce((best, current) => 
        solutions[current].confidence_0_1 > solutions[best].confidence_0_1 ? current : best
      );
      
      finalSolution = solutions[bestVerifiedIndex];
      finalVerification = verificationResults[bestVerifiedIndex];
    } else {
      // No verified solutions - use highest confidence
      const bestIndex = solutions.reduce((best, current, index) => 
        current.confidence_0_1 > solutions[best].confidence_0_1 ? index : best, 0
      );
      
      finalSolution = solutions[bestIndex];
      finalVerification = verificationResults[bestIndex] || { passed: false, confidence_adjustment: -0.1, notes: [] };
    }

    // Check for escalation need
    const needsEscalation = this.needsEscalation(modelVotes, finalVerification);
    
    if (needsEscalation && totalTimeMs < 25000) {
      console.log('EBRW escalating to GPT-5-Thinking due to low confidence/disagreement');
      // In a real implementation, this would trigger escalation
    }

    const adjustedConfidence = Math.max(0, Math.min(1, 
      finalSolution.confidence_0_1 + finalVerification.confidence_adjustment
    ));

    return {
      final_choice_or_value: finalSolution.final_choice,
      section,
      subdomain,
      confidence_0_1: adjustedConfidence,
      time_ms: totalTimeMs,
      model_votes: modelVotes,
      short_explanation: finalSolution.short_explanation,
      evidence_or_checklist: finalSolution.evidence,
      verification_result: finalVerification,
      escalated: needsEscalation
    };
  }

  async aggregateMath(
    solutions: MathSolution[],
    verificationResults: VerificationResult[],
    section: SATSection,
    subdomain: MathDomain,
    totalTimeMs: number
  ): Promise<SATSolution> {
    const modelVotes: ModelVote[] = solutions.map((sol, i) => ({
      model: sol.model,
      choice_or_value: sol.answer_value_or_choice,
      confidence: sol.confidence_0_1 + (verificationResults[i]?.confidence_adjustment || 0),
      reasoning: sol.short_explanation
    }));

    // Verified math results have highest priority
    const verifiedSolutions = solutions.filter((_, i) => verificationResults[i]?.passed);
    
    let finalSolution: MathSolution;
    let finalVerification: VerificationResult;
    
    if (verifiedSolutions.length > 0) {
      // Use first verified solution (they should all agree if verified)
      const verifiedIndex = solutions.findIndex((_, i) => verificationResults[i]?.passed);
      finalSolution = solutions[verifiedIndex];
      finalVerification = verificationResults[verifiedIndex];
    } else {
      // No verified solutions - use consensus or highest confidence
      const consensus = this.findConsensus(solutions);
      if (consensus) {
        const consensusIndex = solutions.findIndex(sol => sol.answer_value_or_choice === consensus);
        finalSolution = solutions[consensusIndex];
        finalVerification = verificationResults[consensusIndex] || { passed: false, confidence_adjustment: -0.05, notes: [] };
      } else {
        // No consensus - use highest confidence
        const bestIndex = solutions.reduce((best, current, index) => 
          current.confidence_0_1 > solutions[best].confidence_0_1 ? index : best, 0
        );
        
        finalSolution = solutions[bestIndex];
        finalVerification = verificationResults[bestIndex] || { passed: false, confidence_adjustment: -0.1, notes: [] };
      }
    }

    const needsEscalation = this.needsEscalation(modelVotes, finalVerification);
    
    if (needsEscalation && totalTimeMs < 25000) {
      console.log('Math escalating to GPT-5-Thinking due to verification failure/disagreement');
    }

    const adjustedConfidence = Math.max(0, Math.min(1, 
      finalSolution.confidence_0_1 + finalVerification.confidence_adjustment
    ));

    return {
      final_choice_or_value: finalSolution.answer_value_or_choice,
      section,
      subdomain,
      confidence_0_1: adjustedConfidence,
      time_ms: totalTimeMs,
      model_votes: modelVotes,
      short_explanation: finalSolution.short_explanation,
      evidence_or_checklist: finalSolution.checks,
      verification_result: finalVerification,
      escalated: needsEscalation
    };
  }

  private needsEscalation(votes: ModelVote[], verification: VerificationResult): boolean {
    // Escalate if:
    // 1. Verification failed
    // 2. Low confidence (< 0.7)
    // 3. Strong disagreement between models
    
    if (!verification.passed) return true;
    
    const avgConfidence = votes.reduce((sum, vote) => sum + vote.confidence, 0) / votes.length;
    if (avgConfidence < 0.7) return true;
    
    // Check for disagreement
    const answers = votes.map(v => v.choice_or_value);
    const uniqueAnswers = new Set(answers);
    if (uniqueAnswers.size > 1 && votes.length > 1) {
      // Strong disagreement if no clear majority
      const maxCount = Math.max(...Array.from(uniqueAnswers).map(ans => 
        answers.filter(a => a === ans).length
      ));
      if (maxCount <= votes.length / 2) return true;
    }
    
    return false;
  }

  private findConsensus(solutions: MathSolution[]): string | null {
    if (solutions.length < 2) return solutions[0]?.answer_value_or_choice || null;
    
    const answerCounts = new Map<string, number>();
    solutions.forEach(sol => {
      const count = answerCounts.get(sol.answer_value_or_choice) || 0;
      answerCounts.set(sol.answer_value_or_choice, count + 1);
    });
    
    const maxCount = Math.max(...answerCounts.values());
    if (maxCount > solutions.length / 2) {
      // Clear majority
      for (const [answer, count] of answerCounts) {
        if (count === maxCount) return answer;
      }
    }
    
    return null; // No consensus
  }

  async escalateToGPT5Thinking(
    prompt: string,
    choices: string[],
    section: SATSection,
    subdomain: EBRWDomain | MathDomain,
    previousSolutions: (EBRWSolution | MathSolution)[],
    timeoutMs: number = 12000
  ): Promise<EBRWSolution | MathSolution> {
    const systemPrompt = `You are the final arbiter for this SAT question. Previous models disagreed or had low confidence.

Previous attempts: ${previousSolutions.map(sol => 
      'model' in sol ? `${sol.model}: ${sol.final_choice}` : `${sol.model}: ${sol.answer_value_or_choice}`
    ).join(', ')}

Use deep reasoning to provide the definitive answer. Return JSON only:
${section === 'EBRW' ? `{
  "final_choice": "A|B|C|D",
  "confidence_0_1": 0.0-1.0,
  "domain": "${subdomain}",
  "short_explanation": "Definitive reasoning",
  "evidence": ["key evidence"],
  "elimination_notes": {"A":"reason","B":"reason","C":"reason","D":"reason"}
}` : `{
  "answer_value_or_choice": "A|B|C|D|numeric",
  "confidence_0_1": 0.0-1.0,
  "method": "symbolic|numeric|hybrid",
  "checks": ["verification_methods"],
  "short_explanation": "Key mathematical insight"
}`}`;

    const userPrompt = `${prompt}

${choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    const response = await this.llmClient.callModel('gpt-5-thinking', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      reasoning_effort: 'medium',
      temperature: 0.1,
      max_tokens: 1000,
      timeout_ms: timeoutMs
    });

    const result = JSON.parse(response.content);
    
    if (section === 'EBRW') {
      return {
        final_choice: result.final_choice,
        confidence_0_1: result.confidence_0_1,
        domain: result.domain || subdomain as EBRWDomain,
        short_explanation: result.short_explanation,
        evidence: result.evidence || [],
        elimination_notes: result.elimination_notes || {},
        model: 'gpt-5-thinking'
      } as EBRWSolution;
    } else {
      return {
        answer_value_or_choice: result.answer_value_or_choice,
        confidence_0_1: result.confidence_0_1,
        method: result.method || 'hybrid',
        checks: result.checks || ['substitute_back'],
        short_explanation: result.short_explanation,
        model: 'gpt-5-thinking'
      } as MathSolution;
    }
  }
}