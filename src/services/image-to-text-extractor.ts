import { openrouterClient } from './model-clients';

const SYSTEM_IMAGE_TO_TEXT = `You are an expert text extractor for SAT questions. Your ONLY job is to accurately transcribe all text from the image.

CRITICAL: Extract text with PERFECT accuracy, preserving:
- All punctuation marks (commas, periods, semicolons, colons, apostrophes, quotation marks)
- All capitalization exactly as shown
- All formatting and line breaks
- All mathematical symbols and expressions
- All answer choice letters (A, B, C, D) exactly as they appear

Output Contract (strict)
Return ONLY a single JSON object with no extra text:
{
  "question": "Complete question text exactly as shown in the image",
  "choices": [
    "Choice A text exactly as shown",
    "Choice B text exactly as shown", 
    "Choice C text exactly as shown",
    "Choice D text exactly as shown"
  ]
}

Quality Requirements:
- Double-check every punctuation mark
- Preserve exact wording and spacing
- Include ALL text from the question stem
- Include ALL text from each answer choice
- Do NOT interpret, summarize, or modify the text
- Do NOT add explanations or reasoning
- If you see a passage, include the ENTIRE passage text

Examples of CRITICAL elements to preserve:
- "students'" vs "student's" vs "students"  
- "it's" vs "its"
- "However," vs "However"
- "U.S." vs "US"
- Mathematical expressions like "x² + 5x - 6"
- Quotation marks around dialogue or titles

Output the JSON only.`;

export class ImageToTextExtractor {
  constructor() {}

  async extract(imageBase64: string): Promise<{ question: string; choices: string[] }> {
    console.log('📝 ImageToTextExtractor starting GPT-4o transcription...');
    
    try {
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: SYSTEM_IMAGE_TO_TEXT
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ];

      const response = await openrouterClient('openai/gpt-4o', messages, {
        temperature: 0,
        max_tokens: 4000,
        timeout_ms: 30000
      });

      let result;
      try {
        const cleanedResponse = response.text
          .replace(/```json\s*/g, '')
          .replace(/\s*```/g, '')
          .trim();
        
        result = JSON.parse(cleanedResponse);
      } catch (error) {
        console.error('GPT-4o JSON parse error:', error);
        console.error('GPT-4o raw response:', response.text.substring(0, 500) + '...');
        throw new Error(`Invalid JSON response from GPT-4o text extractor`);
      }

      if (!result.question || !Array.isArray(result.choices)) {
        throw new Error('GPT-4o response missing required fields (question, choices)');
      }

      console.log(`✅ ImageToTextExtractor completed: extracted ${result.question.length} chars question, ${result.choices.length} choices`);
      
      return {
        question: result.question,
        choices: result.choices
      };
      
    } catch (error) {
      console.error('❌ ImageToTextExtractor failed:', error);
      throw error;
    }
  }
}