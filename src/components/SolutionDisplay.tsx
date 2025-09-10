import React from 'react';
import { CheckCircle, XCircle, Clock, Brain, Target, AlertTriangle } from 'lucide-react';
import { AggregatedAnswer } from '../../types/sat';

interface SolutionDisplayProps {
  solution: AggregatedAnswer | null;
  isLoading: boolean;
}

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Analyzing question through SAT pipeline...</p>
            <p className="text-sm text-slate-500 mt-2">Router → Solver → Verifier → Aggregator</p>
          </div>
        </div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="card p-6">
        <div className="text-center py-12 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter a question above to see the AI solution</p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success-600 bg-success-50';
    if (confidence >= 0.7) return 'text-warning-600 bg-warning-50';
    return 'text-error-600 bg-error-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="w-5 h-5" />;
    if (confidence >= 0.7) return <AlertTriangle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Main Solution */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Solution</h2>
            <p className="text-sm text-slate-600">
              {solution.section} • {solution.subdomain.replace('_', ' ')}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getConfidenceColor(solution.confidence)}`}>
            {getConfidenceIcon(solution.confidence)}
            <span className="font-medium">
              {(solution.confidence * 100).toFixed(0)}% confident
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="text-2xl font-bold text-slate-800 mb-2">
            Answer: {solution.answer}
          </div>
          <p className="text-slate-700">{solution.shortExplanation}</p>
        </div>

        {/* Evidence/Checklist */}
        <div className="mb-4">
          <h3 className="font-medium text-slate-800 mb-2">
            {solution.section === 'EBRW' ? 'Evidence' : 'Checks'}
          </h3>
          <ul className="space-y-1">
            {solution.evidenceOrChecks.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Performance Metrics */}
        <div className="flex items-center gap-6 text-sm text-slate-600 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{(solution.timeMs / 1000).toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{solution.modelVotes.length} model{solution.modelVotes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={`flex items-center gap-1 ${solution.verifier.passed ? 'text-success-600' : 'text-error-600'}`}>
            {solution.verifier.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{solution.verifier.passed ? 'Verified' : 'Failed'}</span>
          </div>
          {solution.section === 'MATH' && solution.modelVotes[0]?.meta?.pythonResult && (
            <div className={`flex items-center gap-1 ${solution.modelVotes[0].meta.pythonResult.ok ? 'text-success-600' : 'text-error-600'}`}>
              <span className="font-mono text-xs">🐍</span>
              <span>{solution.modelVotes[0].meta.pythonResult.ok ? 'Python ✓' : 'Python ✗'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Model Votes */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Model Consensus</h3>
        <div className="space-y-3">
          {solution.modelVotes.map((vote, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">{vote.model}</div>
                  {vote.meta?.explanation && (
                    <div className="text-sm text-slate-600">{vote.meta.explanation}</div>
                  )}
                  {vote.meta?.pythonResult?.ok && (
                    <div className="text-xs text-success-600 font-mono">
                      🐍 Python: {vote.meta.pythonResult.result}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{vote.final}</div>
                <div className="text-sm text-slate-600">
                  {(vote.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Python Code Display for Math */}
      {solution.section === 'MATH' && solution.modelVotes[0]?.meta?.python && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="font-mono text-lg">🐍</span>
            Python Verification Code
          </h3>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono">
              <code>{solution.modelVotes[0].meta.python}</code>
            </pre>
          </div>
          {solution.modelVotes[0].meta.pythonResult && (
            <div className="mt-3 text-sm">
              <div className={`flex items-center gap-2 ${
                solution.modelVotes[0].meta.pythonResult.ok ? 'text-success-600' : 'text-error-600'
              }`}>
                {solution.modelVotes[0].meta.pythonResult.ok ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Result: {solution.modelVotes[0].meta.pythonResult.result}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Error: {solution.modelVotes[0].meta.pythonResult.error}</span>
                  </>
                )}
              </div>
              {solution.modelVotes[0].meta.pythonResult.stdout && (
                <div className="mt-2 bg-slate-100 p-2 rounded text-xs font-mono">
                  <strong>Output:</strong> {solution.modelVotes[0].meta.pythonResult.stdout}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Verification Results */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Verification</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {solution.verifier.passed ? (
              <CheckCircle className="w-5 h-5 text-success-500" />
            ) : (
              <XCircle className="w-5 h-5 text-error-500" />
            )}
            <span className={`font-medium ${solution.verifier.passed ? 'text-success-700' : 'text-error-700'}`}>
              {solution.verifier.passed ? 'Verification Passed' : 'Verification Failed'}
            </span>
            <span className="text-sm text-slate-600">({(solution.verifier.score * 100).toFixed(0)}%)</span>
          </div>
          <ul className="ml-7 space-y-1">
            {solution.verifier.notes.map((note, index) => (
              <li key={index} className="text-sm text-slate-600">{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};