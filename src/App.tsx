import React, { useState, useCallback } from 'react';
import { Brain, Target, Clock, TrendingUp } from 'lucide-react';
import { QuestionInput } from './components/QuestionInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { ModelConfig } from './components/ModelConfig';
import { SATEngine } from './services/sat-engine';
import { SATSolution, ModelConfig as ModelConfigType, PerformanceMetrics } from './types/sat';

function App() {
  const [solution, setSolution] = useState<SATSolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  const [config, setConfig] = useState<ModelConfigType>({
    enabled_models: ['gpt-5', 'claude-3.5-sonnet', 'o4-mini'],
    reasoning_effort: 'low',
    max_tokens: 1000,
    temperature: 0.1
  });

  const [satEngine, setSatEngine] = useState<SATEngine | null>(null);

  const initializeEngine = useCallback(() => {
    if (config.openai_api_key || config.anthropic_api_key || config.google_api_key) {
      const engine = new SATEngine(config);
      setSatEngine(engine);
      return engine;
    }
    return null;
  }, [config]);

  const handleConfigChange = (newConfig: Partial<ModelConfigType>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    if (satEngine) {
      satEngine.updateConfig(updatedConfig);
    }
  };

  const handleQuestionSubmit = async (question: string, choices: string[], correctAnswer?: string) => {
    const engine = satEngine || initializeEngine();
    if (!engine) {
      alert('Please configure at least one API key in the model settings.');
      setShowConfig(true);
      return;
    }

    setIsLoading(true);
    setSolution(null);

    try {
      const result = await engine.solveQuestion(question, choices, correctAnswer);
      setSolution(result);
      setMetrics(engine.getMetrics());
    } catch (error) {
      console.error('Error solving question:', error);
      alert(`Error solving question: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API keys and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidConfig = config.openai_api_key || config.anthropic_api_key || config.google_api_key;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">1600.ai</h1>
                <p className="text-xs text-slate-600">SAT Perfect Score AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
              
              <ModelConfig
                config={config}
                onConfigChange={handleConfigChange}
                isOpen={showConfig}
                onToggle={() => setShowConfig(!showConfig)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasValidConfig && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center gap-2 text-warning-800">
              <Brain className="w-5 h-5" />
              <span className="font-medium">Configuration Required</span>
            </div>
            <p className="text-warning-700 mt-1">
              Please configure at least one API key to start solving SAT questions.
            </p>
          </div>
        )}

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
              1600.ai • Targeting ≥1580 SAT scores with sub-30s latency
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