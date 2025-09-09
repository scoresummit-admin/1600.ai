import React, { useState } from 'react';
import { Send, FileText, Calculator, Image } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface QuestionInputProps {
  onSubmit: (question: string, choices: string[], correctAnswer?: string) => void;
  isLoading: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'grid-in'>('multiple-choice');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    const validChoices = questionType === 'multiple-choice' 
      ? choices.filter(choice => choice.trim()) 
      : [];
    
    onSubmit(question, validChoices, correctAnswer || undefined);
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const handleImageProcessed = (questionText: string, extractedChoices: string[]) => {
    setQuestion(questionText);
    
    if (extractedChoices.length >= 3) {
      // Multiple choice question detected
      setQuestionType('multiple-choice');
      const paddedChoices = [...extractedChoices];
      while (paddedChoices.length < 4) {
        paddedChoices.push('');
      }
      setChoices(paddedChoices.slice(0, 4));
    } else {
      // Likely a grid-in question
      setQuestionType('grid-in');
      setChoices(['', '', '', '']);
    }
    
    setIsProcessingImage(false);
  };

  const loadSampleQuestion = (type: 'ebrw' | 'math') => {
    if (type === 'ebrw') {
      setQuestion(`The following passage is from a 2019 article about urban planning.

Urban planners today face unprecedented challenges as cities grow rapidly and climate change intensifies. Traditional approaches to city design, which prioritized automobile access and suburban sprawl, are increasingly recognized as unsustainable. Modern planners must balance economic development with environmental protection while ensuring equitable access to resources for all residents.

The shift toward sustainable urban planning represents not just a change in methodology, but a fundamental reimagining of how cities should function. This transformation requires collaboration between government officials, community members, and environmental scientists to create spaces that are both livable and resilient.

Which choice best describes the main purpose of the passage?`);
      setChoices([
        'To criticize traditional urban planning methods as completely ineffective',
        'To explain the complex challenges facing modern urban planners and the need for new approaches',
        'To argue that economic development should take priority over environmental concerns',
        'To describe specific techniques used by environmental scientists in city planning'
      ]);
      setCorrectAnswer('B');
      setQuestionType('multiple-choice');
    } else {
      setQuestion(`A rectangular garden has a length that is 3 feet more than twice its width. If the perimeter of the garden is 54 feet, what is the width of the garden in feet?`);
      setChoices([
        '8',
        '9', 
        '12',
        '15'
      ]);
      setCorrectAnswer('A');
      setQuestionType('multiple-choice');
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">SAT Question Input</h2>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center text-sm">
              <input
                type="radio"
                value="text"
                checked={inputMode === 'text'}
                onChange={(e) => setInputMode(e.target.value as 'text')}
                className="mr-2"
              />
              Text Input
            </label>
            <label className="flex items-center text-sm">
              <input
                type="radio"
                value="image"
                checked={inputMode === 'image'}
                onChange={(e) => setInputMode(e.target.value as 'image')}
                className="mr-2"
              />
              <Image className="w-4 h-4 mr-1" />
              Screenshot
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadSampleQuestion('ebrw')}
            className="btn-secondary text-sm flex items-center gap-1"
            disabled={isLoading}
          >
            <FileText className="w-4 h-4" />
            EBRW Sample
          </button>
          <button
            type="button"
            onClick={() => loadSampleQuestion('math')}
            className="btn-secondary text-sm flex items-center gap-1"
            disabled={isLoading}
          >
            <Calculator className="w-4 h-4" />
            Math Sample
          </button>
        </div>
      </div>

      {inputMode === 'image' ? (
        <ImageUpload 
          onImageProcessed={handleImageProcessed}
          isProcessing={isProcessingImage}
        />
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Question Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="multiple-choice"
                checked={questionType === 'multiple-choice'}
                onChange={(e) => setQuestionType(e.target.value as 'multiple-choice')}
                className="mr-2"
              />
              Multiple Choice
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="grid-in"
                checked={questionType === 'grid-in'}
                onChange={(e) => setQuestionType(e.target.value as 'grid-in')}
                className="mr-2"
              />
              Grid-in (Numeric)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="question" className="block text-sm font-medium text-slate-700 mb-2">
            Question Text
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="input-field h-32 resize-none"
            placeholder="Enter the SAT question here..."
            required
          />
        </div>

        {questionType === 'multiple-choice' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Answer Choices
            </label>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="correct-answer" className="block text-sm font-medium text-slate-700 mb-2">
            Correct Answer (Optional - for testing)
          </label>
          <input
            id="correct-answer"
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="input-field w-24"
            placeholder={questionType === 'multiple-choice' ? 'A, B, C, or D' : 'Number'}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !question.trim() || isProcessingImage}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading || isProcessingImage ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isProcessingImage ? 'Processing Image...' : 'Solving...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Solve Question
            </>
          )}
        </button>
      </form>
      )}
    </div>
  );
};