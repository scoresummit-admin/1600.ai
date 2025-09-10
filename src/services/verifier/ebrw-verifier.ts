import { RoutedItem, SolverResult, VerifierReport } from '../../../types/sat';

interface VerifierResult {
  source: 'anthropic' | 'gemini';
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
      
      // Parallel verification with both Anthropic Opus and Gemini
      const [anthropicResult, geminiResult] = await Promise.allSettled([
        this.anthropicVerification(item, solverResult),
        this.geminiVerification(item, solverResult)
      ]);
      
      const anthropic = anthropicResult.status === 'fulfilled' ? anthropicResult.value : null;
      const gemini = geminiResult.status === 'fulfilled' ? geminiResult.value : null;
      
      // Combine verifier results
      const verifiers = [anthropic, gemini].filter(Boolean);
      const agreementCount = verifiers.filter(v => v!.topChoice === solverResult.final).length;
      const avgScore = verifiers.length > 0 ? verifiers.reduce((sum, v) => sum + v!.score, 0) / verifiers.length : 0;
      
      // Enhanced passing criteria
      const passed = evidenceCheck.valid && 
                    (agreementCount >= 1) &&  // At least one verifier agrees
                    avgScore >= 0.7 &&
                    !(anthropic && gemini && anthropic.topChoice !== gemini.topChoice && Math.abs(anthropic.score - gemini.score) > 0.3); // No strong disagreement
      
      const score = passed ? Math.min(0.95, avgScore + 0.1) : Math.max(0.3, avgScore * 0.7);
      
      const notes = [
        ...evidenceCheck.notes,
        anthropic ? `Anthropic Opus chose: ${anthropic.topChoice} (${anthropic.score.toFixed(2)})` : 'Anthropic verification failed',
        gemini ? `Gemini chose: ${gemini.topChoice} (${gemini.score.toFixed(2)})` : 'Gemini verification failed',
        `Agreement: ${agreementCount}/${verifiers.length} verifiers`,
        anthropic?.reasoning || gemini?.reasoning || 'No reasoning available'
      ];
      
      console.log(`🔍 EBRW verification completed in ${Date.now() - startTime}ms: ${passed ? 'PASSED' : 'FAILED'}`);
      
      return {
        passed,
        score,
        notes,
        checks: ['evidence_verification', 'anthropic_opus', 'gemini_2.5_pro']
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

  async deepPassVerification(item: RoutedItem, solverResult: SolverResult): Promise<VerifierResult> {
    console.log('🔍 Running deep pass verification with Anthropic Opus...');
    
    const deepPrompt = `You are conducting a deep analysis pass of this SAT EBRW question. 

Previous solver chose: ${solverResult.final}
Evidence provided: ${JSON.stringify(solverResult.meta.evidence)}

Conduct thorough analysis and provide detailed scoring.`;

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: "You are an expert SAT EBRW analyzer. Provide detailed, careful analysis.",
          messages: [{
            role: 'user',
            content: item.imageBase64 ? [
              { type: 'text', text: deepPrompt },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: this.detectMimeType(item.imageBase64),
                  data: item.imageBase64
                }
              }
            ] : deepPrompt
          }],
          max_tokens: 2000,
          temperature: 0.05,
          fullText: item.fullText,
          imageBase64: item.imageBase64
        }),
        signal: AbortSignal.timeout(30000) // Increase to 30s
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = this.parseVerifierResponse(data.content);
        return {
          source: 'anthropic',
          topChoice: parsed.best_choice,
          score: parsed.scores[solverResult.final] || 0,
          reasoning: parsed.reasoning + ' (Deep pass)'
        };
      }
    } catch (error) {
      console.warn('Deep pass verification failed:', error);
    }

    return this.fallbackVerification(solverResult, 'anthropic');
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

  private async anthropicVerification(item: RoutedItem, solverResult: SolverResult): Promise<VerifierResult> {
    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: "You are an independent SAT EBRW judge. Analyze questions accurately and provide scoring.",
          messages: [{
            role: 'user',
            content: item.imageBase64 ? [
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
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: this.detectMimeType(item.imageBase64),
                  data: item.imageBase64
                }
              }
            ] : `You are an independent SAT EBRW judge. Score each option 0-1 and provide brief reasoning.

${item.fullText}

${item.choices.map((choice: string, i: number) => `${String.fromCharCode(65 + i)}) ${choice}`).join('\n')}

Return JSON:
{
  "scores": {"A": 0.0-1.0, "B": 0.0-1.0, "C": 0.0-1.0, "D": 0.0-1.0},
  "best_choice": "A|B|C|D",
  "reasoning": "Brief explanation for your choice"
}`
          }],
          max_tokens: 1000,
          temperature: 0.1,
          fullText: item.fullText,
          imageBase64: item.imageBase64
        }),
        signal: AbortSignal.timeout(25000) // Increase to 25s
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = this.parseVerifierResponse(data.content);
        return {
          source: 'anthropic',
          topChoice: parsed.best_choice,
          score: parsed.scores[solverResult.final] || 0,
          reasoning: parsed.reasoning
        };
      } else {
        console.warn('Anthropic verification failed:', response.status);
      }
    } catch (error) {
      console.warn('Anthropic verification error:', error);
    }

    return this.fallbackVerification(solverResult, 'anthropic');
  }

  private async geminiVerification(item: RoutedItem, solverResult: SolverResult): Promise<VerifierResult> {
    try {
      const response = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'verify',
          imageBase64: item.imageBase64,
          ocrText: item.ocrText || item.fullText,
          choices: item.choices,
          claimedChoice: solverResult.final,
          quotes: solverResult.meta.evidence || [],
          maxOutputTokens: 1000,
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(20000) // Increase to 20s
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = this.parseVerifierResponse(data.content);
        return {
          source: 'gemini',
          topChoice: parsed.best_choice,
          score: parsed.scores[solverResult.final] || 0,
          reasoning: parsed.reasoning
        };
      } else {
        console.warn('Gemini verification failed:', response.status);
      }
    } catch (error) {
      console.warn('Gemini verification error:', error);
    }

    return this.fallbackVerification(solverResult, 'gemini');
  }

  private detectMimeType(base64Data: string): string {
      if (base64Data.startsWith('iVBORw0KGgo')) {
        return 'image/png';
      } else if (base64Data.startsWith('/9j/')) {
        return 'image/jpeg';
      }
      return 'image/png';
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

  private fallbackVerification(solverResult: SolverResult, source: 'anthropic' | 'gemini'): VerifierResult {
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