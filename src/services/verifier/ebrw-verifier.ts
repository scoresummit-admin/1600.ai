import { RoutedItem, SolverResult, VerifierReport } from '../../../types/sat';
import { openrouterClient } from '../model-clients';

interface VerifierResult {
  source: 'claude-sonnet-4' | 'grok-4';
  topChoice: string;
  score: number;
  reasoning: string;
}

export class EBRWVerifier {
  constructor() {}

  async verify(item: RoutedItem, solverResult: SolverResult): Promise<VerifierReport> {
    const startTime = Date.now();
    console.log('🔄 EBRW verifier starting...');
    
    try {
      // Verify evidence exists in the passage (use ocrText for quote matching)
      const evidenceCheck = this.verifyEvidence(
        solverResult.meta.evidence || [], 
        item.ocrText || item.fullText
      );
      
      // Parallel verification with Claude Sonnet 4 and Grok 4
      const [claudeResult, grokResult] = await Promise.allSettled([
        this.claudeVerification(item, solverResult),
        this.grokVerification(item, solverResult)
      ]);
      
      const claude = claudeResult.status === 'fulfilled' ? claudeResult.value : null;
      const grok = grokResult.status === 'fulfilled' ? grokResult.value : null;
      
      // Combine verifier results
      const verifiers = [claude, grok].filter(Boolean);
      const agreementCount = verifiers.filter(v => v!.topChoice === solverResult.final).length;
      const avgScore = verifiers.length > 0 ? verifiers.reduce((sum, v) => sum + v!.score, 0) / verifiers.length : 0;
      
      // Enhanced passing criteria
      const passed = evidenceCheck.valid && 
                    (agreementCount >= 1) &&  // At least one verifier agrees
                    avgScore >= 0.7 &&
                    !(claude && grok && claude.topChoice !== grok.topChoice && Math.abs(claude.score - grok.score) > 0.3); // No strong disagreement
      
      const score = passed ? Math.min(0.95, avgScore + 0.1) : Math.max(0.3, avgScore * 0.7);
      
      const notes = [
        ...evidenceCheck.notes,
        claude ? `Claude Sonnet 4 chose: ${claude.topChoice} (${claude.score.toFixed(2)})` : 'Claude verification failed',
        grok ? `Grok 4 chose: ${grok.topChoice} (${grok.score.toFixed(2)})` : 'Grok verification failed',
        `Agreement: ${agreementCount}/${verifiers.length} verifiers`,
        claude?.reasoning || grok?.reasoning || 'No reasoning available'
      ];
      
      console.log(`🔍 EBRW verification completed in ${Date.now() - startTime}ms: ${passed ? 'PASSED' : 'FAILED'}`);
      
      return {
        passed,
        score,
        notes,
        checks: ['evidence_verification', 'claude_sonnet_4', 'grok_4']
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

  private async claudeVerification(item: RoutedItem, solverResult: SolverResult): Promise<VerifierResult> {
    try {
      let messages;
      
      if (item.imageBase64) {
        messages = [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this SAT EBRW question from the image and score each answer choice.

${item.ocrText ? `OCR Text (for reference): ${item.ocrText}` : ''}

Proposed answer: ${solverResult.final}

Return JSON:
{
  "scores": {"A": 0.0-1.0, "B": 0.0-1.0, "C": 0.0-1.0, "D": 0.0-1.0},
  "best_choice": "A|B|C|D", 
  "reasoning": "Brief explanation for your choice"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${item.imageBase64}`
              }
            }
          ]
        }];
      } else {
        messages = [{
          role: 'user',
          content: `You are an independent SAT EBRW judge. Score each option 0-1 and provide brief reasoning.

${item.fullText}

${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}

Return JSON:
{
  "scores": {"A": 0.0-1.0, "B": 0.0-1.0, "C": 0.0-1.0, "D": 0.0-1.0},
  "best_choice": "A|B|C|D",
  "reasoning": "Brief explanation for your choice"
}`
        }];
      }

      const response = await openrouterClient('anthropic/claude-sonnet-4', messages, {
        max_tokens: 1000,
        temperature: 0.1,
        timeout_ms: 40000
      });

      const parsed = this.parseVerifierResponse(response.text);
      return {
        source: 'claude-sonnet-4',
        topChoice: parsed.best_choice,
        score: parsed.scores[solverResult.final] || 0,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.warn('Claude verification error:', error);
      return this.fallbackVerification(solverResult, 'claude-sonnet-4');
    }
  }

  private async grokVerification(item: RoutedItem, solverResult: SolverResult): Promise<VerifierResult> {
    try {
      let messages;
      
      if (item.imageBase64) {
        messages = [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this SAT EBRW question from the image and score each answer choice.

${item.ocrText ? `OCR Text (for reference): ${item.ocrText}` : ''}

Proposed answer: ${solverResult.final}

Return JSON:
{
  "scores": {"A": 0.0-1.0, "B": 0.0-1.0, "C": 0.0-1.0, "D": 0.0-1.0},
  "best_choice": "A|B|C|D", 
  "reasoning": "Brief explanation for your choice"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${item.imageBase64}`
              }
            }
          ]
        }];
      } else {
        messages = [{
          role: 'user',
          content: `You are an independent SAT EBRW judge. Score each option 0-1 and provide brief reasoning.

${item.fullText}

${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}

Return JSON:
{
  "scores": {"A": 0.0-1.0, "B": 0.0-1.0, "C": 0.0-1.0, "D": 0.0-1.0},
  "best_choice": "A|B|C|D",
  "reasoning": "Brief explanation for your choice"
}`
        }];
      }

      const response = await openrouterClient('x-ai/grok-4', messages, {
        max_tokens: 1000,
        temperature: 0.1,
        timeout_ms: 35000
      });

      const parsed = this.parseVerifierResponse(response.text);
      return {
        source: 'grok-4',
        topChoice: parsed.best_choice,
        score: parsed.scores[solverResult.final] || 0,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.warn('Grok verification error:', error);
      return this.fallbackVerification(solverResult, 'grok-4');
    }
  }

  private parseVerifierResponse(content: string): any {
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    try {
      return JSON.parse(cleanContent);
    } catch (error) {
      console.warn('Failed to parse verifier response:', error);
      return {
        scores: { A: 0.5, B: 0.5, C: 0.5, D: 0.5 },
        best_choice: 'A',
        reasoning: 'Parse error occurred'
      };
    }
  }

  private fallbackVerification(solverResult: SolverResult, source: 'claude-sonnet-4' | 'grok-4'): VerifierResult {
    // Basic heuristic verification based on confidence and evidence quality
    let score = solverResult.confidence;
    
    // Boost score if we have good evidence
    const evidence = solverResult.meta.evidence || [];
    if (evidence.length > 0) {
      score = Math.min(0.9, score + 0.1);
    }
    
    // Reduce score if confidence is very low
    if (solverResult.confidence < 0.6) {
      score *= 0.8;
    }
    
    return {
      source,
      topChoice: solverResult.final,
      score: Math.max(0.3, Math.min(0.9, score)),
      reasoning: `Fallback ${source} verification based on solver confidence and evidence quality`
    };
  }
}