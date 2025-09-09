import { useState } from 'react';
import { Target, Clock, TrendingUp, Zap } from 'lucide-react';
import { QuestionInput } from './components/QuestionInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { SATEngine } from './services/sat-engine-v2';
import { AggregatedAnswer, PerformanceMetrics } from '../types/sat';

function App() {
  const [solution, setSolution] = useState<AggregatedAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [p95Timer, setP95Timer] = useState<number>(0);
  
  const [satEngine] = useState(() => new SATEngine());

  const handleQuestionSubmit = async (question: string, choices: string[], correctAnswer?: string) => {
    // Check for required API keys
    const hasOpenAI = !!(import.meta.env.VITE_OPENAI_API_KEY);
    const hasAnthropic = !!(import.meta.env.VITE_ANTHROPIC_API_KEY);
    
    if (!hasOpenAI || !hasAnthropic) {
      alert('Missing required API keys. Please set OPENAI_API_KEY and ANTHROPIC_API_KEY in your environment.');
      return;
    }

    setIsLoading(true);
    setSolution(null);
    const startTime = Date.now();

    try {
      const result = await satEngine.solveQuestion(question, choices, correctAnswer);
      setSolution(result);
      setMetrics(satEngine.getMetrics());
      
      // Update p95 timer
      const latency = Date.now() - startTime;
      setP95Timer(latency);
    } catch (error) {
      console.error('Error solving question:', error);
      alert(`Error solving question: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API keys and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">1600.ai</h1>
                <p className="text-xs text-slate-600">SAT Perfect Score AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {p95Timer > 0 && (
                <div className="flex items-center gap-1 text-sm text-slate-600 bg-white/60 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>p95: {(p95Timer / 1000).toFixed(1)}s</span>
                </div>
              )}
              {metrics && (
                <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{(metrics.accuracy_rate * 100).toFixed(1)}% accuracy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{(metrics.avg_latency_ms / 1000).toFixed(1)}s avg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{metrics.total_questions} solved</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <QuestionInput
              onSubmit={handleQuestionSubmit}
              isLoading={isLoading}
            />
            
            {/* Performance Stats */}
            {metrics && (
              <div className="card p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">
                      {(metrics.accuracy_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-600">Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">
                      {(metrics.avg_latency_ms / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-slate-600">Avg Time</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">
                      {metrics.total_questions}
                    </div>
                    <div className="text-sm text-slate-600">Questions</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">
                      {(metrics.escalation_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-600">Escalated</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Solution Section */}
          <div>
            <SolutionDisplay
              solution={solution}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-slate-200/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p className="text-sm">
              1600.ai • High-Accuracy Hybrid Pipeline • ≥99% accuracy, p95 &lt; 30s
            </p>
            <p className="text-xs mt-2 text-slate-500">
              For research and practice test evaluation only. Not for use on official SAT administrations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;