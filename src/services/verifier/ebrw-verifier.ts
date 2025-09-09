import { RoutedItem, SolverResult, VerifierReport } from '../../types/sat';

export class EBRWVerifier {
  private anthropicApiKey: string;

  constructor() {
    this.anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  }

  async verify(item: RoutedItem, solverResult: SolverResult): Promise<VerifierReport> {
    const startTime = Date.now();
    
    try {
      // Verify evidence exists in the passage
      const evidenceCheck = this.verifyEvidence(solverResult.meta.evidence || [], item.normalizedPrompt);
      
      // Independent verification with Claude
      const independentResult = await this.independentVerification(item, solverResult);
      
      const passed = evidenceCheck.valid && 
                    independentResult.topChoice === solverResult.final &&
                    independentResult.score >= 0.7;
      
      const score = passed ? Math.min(0.95, independentResult.score) : independentResult.score * 0.6;
      
      const notes = [
        ...evidenceCheck.notes,
        `Independent verifier chose: ${independentResult.topChoice}`,
        `Verifier confidence: ${independentResult.score.toFixed(2)}`,
        independentResult.reasoning
      ];

      console.log(`🔍 EBRW verification completed in ${Date.now() - startTime}ms: ${passed ? 'PASSED' : 'FAILED'}`);
      
      return {
        passed,
        score,
        notes,
        checks: ['evidence_verification', 'independent_judge']
      };
      
    } catch (error) {
      console.error('EBRW verification error:', error);
      return {
        passed: false,
        score: 0.3,
        notes: ['Verification failed due to error'],
        checks: ['error']
      };
    }
  }

  private verifyEvidence(evidence: string[], passageText: string): { valid: boolean; notes: string[] } {
    const notes: string[] = [];
    let validCount = 0;
    
    for (const item of evidence) {
      // Check if it's a grammar rule (contains specific grammar terms)
      const grammarRules = [
        'subject-verb agreement', 'pronoun-antecedent agreement', 'pronoun case',
        'modifier placement', 'dangling modifier', 'parallelism', 'verb tense',
        'comma splice', 'run-on', 'semicolon', 'colon', 'apostrophe', 'possessive',
        'comparison', 'concision', 'redundancy', 'idiom'
      ];
      
      const isGrammarRule = grammarRules.some(rule => 
        item.toLowerCase().includes(rule.toLowerCase())
      );
      
      if (isGrammarRule) {
        validCount++;
        notes.push(`✓ Grammar rule identified: "${item}"`);
      } else if (passageText.toLowerCase().includes(item.toLowerCase())) {
        validCount++;
        notes.push(`✓ Evidence found: "${item}"`);
      } else {
        notes.push(`✗ Evidence not found: "${item}"`);
      }
    }
    
    const valid = validCount > 0;
    return { valid, notes };
  }

  private async independentVerification(item: RoutedItem, solverResult: SolverResult): Promise<{
    topChoice: string;
    score: number;
    reasoning: string;
  }> {
    const systemPrompt = `You are an independent SAT EBRW judge. Score each option 0-1 and provide brief reasoning.

Return JSON:
{
  "scores": {"A": 0.0-1.0, "B": 0.0-1.0, "C": 0.0-1.0, "D": 0.0-1.0},
  "best_choice": "A|B|C|D",
  "reasoning": "Brief explanation for your choice"
}`;

    const userPrompt = `${item.normalizedPrompt}

${item.choices.map((choice, i) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
          ],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      let content = data.content[0].text.trim();
      
      // Handle JSON markdown wrapper
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const result = JSON.parse(content);
      const proposedScore = result.scores[solverResult.final] || 0;
      
      return {
        topChoice: result.best_choice,
        score: proposedScore,
        reasoning: result.reasoning
      };
      
    } catch (error) {
      console.error('Independent verification failed:', error);
      return {
        topChoice: solverResult.final,
        score: 0.5,
        reasoning: 'Independent verification failed'
      };
    }
  }
}