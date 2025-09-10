import React, { useState } from 'react';
import { Send, Image } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface QuestionInputProps {
  onSubmit: (imageBase64: string, ocrText: string, choices: string[], correctAnswer?: string) => void;
  isLoading: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, isLoading }) => {
  const [imageBase64, setImageBase64] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'grid-in'>('multiple-choice');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [hasProcessedImage, setHasProcessedImage] = useState(false);

  const handleSubmitScreenshot = () => {
    if (!imageBase64 || !ocrText.trim()) return;
    
    const validChoices = questionType === 'multiple-choice' 
      ? choices.filter(choice => choice.trim()) 
      : [];
    
    onSubmit(imageBase64, ocrText, validChoices);
  };

  const handleImageProcessed = (base64Data: string, questionText: string, extractedChoices: string[]) => {
    setIsProcessingImage(false);
    setImageBase64(base64Data);
    setOcrText(questionText);
    
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
    
    setHasProcessedImage(true);
  };

  const startImageProcessing = () => {
    setIsProcessingImage(true);
    setHasProcessedImage(false);
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Upload SAT Question Screenshot
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Upload a clear screenshot of your SAT question and the AI will solve it automatically
        </p>
      </div>

      <ImageUpload 
        onImageProcessed={handleImageProcessed}
        onStartProcessing={startImageProcessing}
        isProcessing={isProcessingImage}
      />

      {hasProcessedImage && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium text-slate-800 mb-2">OCR Preview (for verification):</h3>
            <div className="bg-white p-3 rounded border text-sm">
              {ocrText || 'No question text extracted'}
            </div>
          </div>

          {questionType === 'multiple-choice' && choices.some(c => c.trim()) && (
            <div className="space-y-2">
              <h3 className="font-medium text-slate-800">Extracted Choices:</h3>
              {choices.map((choice, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <div className="bg-white p-2 rounded border flex-1">
                    {choice || 'Empty choice'}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSubmitScreenshot}
              disabled={isLoading || !imageBase64 || !ocrText.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Solving Question...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Analyze Screenshot & Solve
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};