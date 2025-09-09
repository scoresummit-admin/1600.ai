import Tesseract from 'tesseract.js';

export class OCRService {
  private static instance: OCRService;
  private worker: Tesseract.Worker | null = null;

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async initialize(): Promise<void> {
    if (this.worker) return;

    try {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: m => console.log('OCR:', m)
      });
      
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,;:!?()[]{}"\'-+=*/÷×√π°%$€£¥ ',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      });
      
      console.log('OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw error;
    }
  }

  async extractText(imageFile: File): Promise<string> {
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker failed to initialize');
    }

    try {
      console.log('Starting OCR extraction...');
      const startTime = Date.now();
      
      const { data: { text } } = await this.worker.recognize(imageFile);
      
      const extractionTime = Date.now() - startTime;
      console.log(`OCR completed in ${extractionTime}ms`);
      
      // Clean up the extracted text
      const cleanedText = this.cleanExtractedText(text);
      
      return cleanedText;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  private cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR mistakes
      .replace(/\b0\b/g, 'O') // Zero to O in context
      .replace(/\bl\b/g, 'I') // lowercase l to I in context
      .replace(/\b5\b(?=\w)/g, 'S') // 5 to S when followed by letters
      // Clean up line breaks
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\n(?=[a-z])/g, ' ') // Join broken words
      // Trim and normalize
      .trim();
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('OCR worker terminated');
    }
  }

  // Enhanced extraction for SAT questions specifically
  async extractSATQuestion(imageFile: File): Promise<{
    questionText: string;
    choices: string[];
    hasChoices: boolean;
  }> {
    const fullText = await this.extractText(imageFile);
    
    // Parse SAT question structure
    const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let questionText = '';
    const choices: string[] = [];
    let inChoices = false;
    
    for (const line of lines) {
      // Detect choice patterns (A), B), C), D) or A. B. C. D.
      const choiceMatch = line.match(/^([A-D])[.)]\s*(.+)$/i);
      
      if (choiceMatch) {
        inChoices = true;
        const choiceText = choiceMatch[2].trim();
        choices.push(choiceText);
      } else if (!inChoices) {
        // Still building question text
        questionText += (questionText ? ' ' : '') + line;
      }
    }
    
    // If no choices found, might be a grid-in question
    const hasChoices = choices.length >= 3;
    
    return {
      questionText: questionText.trim(),
      choices: hasChoices ? choices : [],
      hasChoices
    };
  }
}