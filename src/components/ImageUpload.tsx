import React, { useState, useRef } from 'react';
import { Upload, Camera, FileImage, Loader2, X } from 'lucide-react';

interface ImageUploadProps {
  onImageProcessed: (questionText: string, choices: string[]) => void;
  onStartProcessing: () => void;
  isProcessing: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageProcessed, onStartProcessing, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Notify parent that processing is starting
    onStartProcessing();

    // Process with OCR
    try {
      const { OCRService } = await import('../services/ocr-service');
      const ocrService = OCRService.getInstance();
      
      const result = await ocrService.extractSATQuestion(file);
      onImageProcessed(result.questionText, result.choices);
    } catch (error) {
      console.error('OCR processing failed:', error);
      alert('Failed to process image. Please try again or enter the question manually.');
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl && (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="SAT Question Preview" 
            className="max-w-full h-auto rounded-lg border border-slate-200"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-50"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-slate-300 hover:border-slate-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-3">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-primary-600 animate-spin" />
              <p className="text-slate-600">Processing image with OCR...</p>
              <p className="text-sm text-slate-500">This may take a few seconds</p>
            </>
          ) : (
            <>
              <div className="flex justify-center space-x-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <Camera className="w-8 h-8 text-slate-400" />
                <FileImage className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-600 font-medium">
                  Upload SAT Question Screenshot
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Drag and drop or click to select an image
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Supports: JPG, PNG, WebP • Max 10MB
              </div>
            </>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
        <strong>Tips for best OCR results:</strong>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>Use high-resolution, clear images</li>
          <li>Ensure good lighting and contrast</li>
          <li>Crop to show only the question area</li>
          <li>Avoid shadows or glare on the text</li>
        </ul>
      </div>
    </div>
  );
};