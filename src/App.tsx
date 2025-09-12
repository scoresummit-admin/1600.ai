import { useState } from 'react';
import { Brain, Zap, Target } from 'lucide-react';
import { QuestionInput } from './components/QuestionInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { SATEngine } from './services/sat-engine-v2';
import { AggregatedAnswer, Section } from './types/sat';

const satEngine = new SATEngine();

function App() {
  const [solution, setSolution] = useState<AggregatedAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionSubmit = async (
    imageBase64: string,
    ocrText: string,
    choices: string[],
    section: Section,
    correctAnswer?: string
  ) => {
    setIsLoading(true);
    setSolution(null);

    try {
      const result = await satEngine.solveQuestion(imageBase64, ocrText, choices, section, correctAnswer);
      setSolution(result);
    } catch (error) {
      console.error('Error solving question:', error);
      alert('Failed to solve question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">1600.ai</h1>
                <p className="text-xs text-slate-500 mt-0.5">SAT Perfect Score AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-warning-600" />
                  <span className="text-slate-600">Sub-30s latency</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-success-600" />
                  <span className="text-slate-600">≥1580 target</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <QuestionInput onSubmit={handleQuestionSubmit} isLoading={isLoading} />
          </div>

          {/* Solution Section */}
          <div className="space-y-6">
            {isLoading && (
              <div className="card p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Solving...</h3>
                <p className="text-slate-600">Running concurrent model inference with verification</p>
              </div>
            )}
            
            <SolutionDisplay solution={solution} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;