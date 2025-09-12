import React, { useState } from 'react';
import { Send, Image } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { Section } from '../types/sat';

interface QuestionInputProps {
  onSubmit: (imageBase64: string, section: Section, correctAnswer?: string) => void;
  isLoading: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ onSubmit, isLoading }) => {
  const [imageBase64, setImageBase64] = useState('');
  const [section, setSection] = useState<Section>('EBRW');
  const [hasUploadedImage, setHasUploadedImage] = useState(false);

  const handleSubmit = () => {
    if (!imageBase64) return;
    
    onSubmit(imageBase64, section);
  };

  const handleImageUploaded = (base64Data: string) => {
    setImageBase64(base64Data);
    setHasUploadedImage(true);
  };


  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Image className="w-5 h-5" />
          Upload SAT Question
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Upload a clear image of your SAT question. Our vision AI will read and solve it directly.
        </p>
      </div>

      <ImageUpload 
        onImageUploaded={handleImageUploaded}
        isLoading={isLoading}
      />

      {hasUploadedImage && (
        <div className="bg-primary-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-primary-700">
            <Image className="w-5 h-5" />
            <span className="font-medium">Image uploaded successfully</span>
          </div>
          <p className="text-sm text-primary-600">
            Ready to analyze with vision AI models
          </p>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                className="text-primary-600"
                checked={section === 'EBRW'}
                onChange={() => setSection('EBRW')}
              />
              EBRW
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                className="text-primary-600"
                checked={section === 'MATH'}
                onChange={() => setSection('MATH')}
              />
              Math
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !imageBase64}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing with Vision AI...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Solve with Vision AI
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};