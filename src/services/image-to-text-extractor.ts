import { openrouterClient } from './model-clients';

export interface SATTranscriptionFigure {
  label: string | null;
  type: 'graph' | 'chart' | 'table' | 'image' | 'diagram';
  caption: string | null;
  raw_text: string;
  table: {
    headers: string[];
    rows: string[][];
  };
}

export interface SATTranscriptionPassage {
  label: string | null;
  text: string;
  line_numbering: 'as_shown' | 'none';
}

export interface SATTranscriptionQuestion {
  number: string | null;
  stem: string;
  choices: string[];
}

export interface SATTranscription {
  metadata: {
    question_number: string | null;
    section_label: string | null;
    source_attribution: string | null;
  };
  instructions: string;
  passages: SATTranscriptionPassage[];
  figures: SATTranscriptionFigure[];
  notes: string[];
  questions: SATTranscriptionQuestion[];
  passage: string;
  question: string;
  choices: string[];
}

const SYSTEM_IMAGE_TO_TEXT = `You are an expert OCR-style transcriber for SAT Reading & Writing screenshots.
Your ONLY job is to transcribe ALL visible text with PERFECT fidelity into a single JSON object
matching the provided schema. Do NOT summarize, infer, or interpret any data.

Output: return ONLY the JSON object (no code fences, no commentary).

STRICT TRANSCRIPTION RULES
- Include ALL text from: instructions, passages (1–2), questions, answer choices, footnotes/notes,
  source lines (“Adapted from …”), and ALL text inside figures (graphs, charts, tables, images, diagrams).
- Preserve punctuation, capitalization, spelling, line breaks, hyphenation, symbols (%, °, →, ≤, ≥),
  smart quotes, em/en dashes, ellipses, and math.
- If line numbers are shown, keep them inline exactly as printed (e.g., “[1]”, “1 ”) within the passage text.
- For figures:
  * Transcribe axes labels, units, tick labels, legend text, captions, and any annotations into "raw_text".
  * Do NOT estimate or infer numeric values that are not printed.
  * If it is a table, also populate "table.headers" and "table.rows" cell-by-cell.
- If a screenshot contains more than one question, include all in "questions" in order of appearance.
  Also populate the backward-compat fields ("passage", "question", "choices") from the first question.

JSON SCHEMA (fill every applicable field; use empty strings or empty arrays if absent)
{
  "metadata": {
    "question_number": "string | null",
    "section_label": "string | null",
    "source_attribution": "string | null"
  },
  "instructions": "string",
  "passages": [
    { "label": "string | null", "text": "string", "line_numbering": "as_shown | none" }
  ],
  "figures": [
    { "label": "string | null", "type": "graph | chart | table | image | diagram", "caption": "string | null",
      "raw_text": "string",
      "table": { "headers": ["string","..."], "rows": [["string","..."], ["...","..."]] }
    }
  ],
  "notes": ["string", "..."],
  "questions": [
    { "number": "string | null", "stem": "string",
      "choices": ["string","string","string","string"] }
  ],
  "passage": "string",
  "question": "string",
  "choices": ["string","string","string","string"]
}

VALIDATION
- If a field is not present in the image, supply an empty string or empty array as appropriate.
- Ensure the JSON is valid and parsable (UTF-8). No extra keys. No comments. No code fences.
- Double-check that "choices" match exactly and are in the correct order.`;

interface ExtractionResult {
  question: string;
  choices: string[];
  transcription: SATTranscription;
}

export class ImageToTextExtractor {
  constructor() {}

  async extract(imageBase64: string): Promise<ExtractionResult> {
    console.log('📝 ImageToTextExtractor starting GPT-4o transcription with full SAT schema...');

    try {
      const messages = [
        {
          role: 'system',
          content: SYSTEM_IMAGE_TO_TEXT
        },
        {
          role: 'user',
          content: [
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

      const transcription = this.normalizeTranscription(result);

      const firstQuestion = transcription.questions[0];
      const questionText = transcription.question || firstQuestion?.stem || '';
      const choices = transcription.choices.length > 0
        ? transcription.choices
        : firstQuestion?.choices || [];

      console.log(`✅ ImageToTextExtractor completed: captured ${questionText.length} chars question, ${choices.length} choices, ${transcription.passages.length} passage(s)`);

      return {
        question: questionText,
        choices,
        transcription
      };

    } catch (error) {
      console.error('❌ ImageToTextExtractor failed:', error);
      throw error;
    }
  }

  private normalizeTranscription(raw: any): SATTranscription {
    const metadata = raw?.metadata ?? {};

    const ensureString = (value: unknown): string => (typeof value === 'string' ? value : '');
    const ensureStringOrNull = (value: unknown): string | null => (typeof value === 'string' ? value : value === null ? null : null);

    const passages: SATTranscriptionPassage[] = Array.isArray(raw?.passages)
      ? raw.passages.map((passage: any) => ({
          label: ensureStringOrNull(passage?.label),
          text: ensureString(passage?.text),
          line_numbering: passage?.line_numbering === 'as_shown' ? 'as_shown' : 'none'
        }))
      : [];

    const figures: SATTranscriptionFigure[] = Array.isArray(raw?.figures)
      ? raw.figures.map((figure: any) => ({
          label: ensureStringOrNull(figure?.label),
          type: ['graph', 'chart', 'table', 'image', 'diagram'].includes(figure?.type)
            ? figure.type
            : 'image',
          caption: ensureStringOrNull(figure?.caption),
          raw_text: ensureString(figure?.raw_text),
          table: {
            headers: Array.isArray(figure?.table?.headers) ? figure.table.headers.map(ensureString) : [],
            rows: Array.isArray(figure?.table?.rows)
              ? figure.table.rows.map((row: any) => Array.isArray(row) ? row.map(ensureString) : [])
              : []
          }
        }))
      : [];

    const questions: SATTranscriptionQuestion[] = Array.isArray(raw?.questions)
      ? raw.questions.map((question: any) => ({
          number: ensureStringOrNull(question?.number),
          stem: ensureString(question?.stem),
          choices: Array.isArray(question?.choices) ? question.choices.map(ensureString) : []
        }))
      : [];

    return {
      metadata: {
        question_number: ensureStringOrNull(metadata?.question_number),
        section_label: ensureStringOrNull(metadata?.section_label),
        source_attribution: ensureStringOrNull(metadata?.source_attribution)
      },
      instructions: ensureString(raw?.instructions),
      passages,
      figures,
      notes: Array.isArray(raw?.notes) ? raw.notes.map(ensureString) : [],
      questions,
      passage: ensureString(raw?.passage),
      question: ensureString(raw?.question),
      choices: Array.isArray(raw?.choices) ? raw.choices.map(ensureString) : []
    };
  }
}