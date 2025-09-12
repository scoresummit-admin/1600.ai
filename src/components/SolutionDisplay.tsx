import React from 'react';
import { CheckCircle, XCircle, Clock, Code2, Calculator } from 'lucide-react';
import { AggregatedAnswer } from '../types/sat';

interface SolutionDisplayProps {
  solution: AggregatedAnswer | null;
}

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution }) => {
  if (!solution) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success-600';
    if (confidence >= 0.7) return 'text-warning-600';
    return 'text-error-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return 'badge-success';
    if (confidence >= 0.7) return 'badge-warning';
    return 'badge-error';
  };

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Solution</h2>
        <span className={`badge ${getConfidenceBadge(solution.confidence)}`}>
          {Math.round(solution.confidence * 100)}% confident
        </span>
      </div>

      {/* Main Answer */}
      <div className="bg-primary-50 p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl font-bold text-primary-600">
            Answer: {solution.answer}
          </div>
        </div>
        <p className="text-slate-700">{solution.shortExplanation}</p>
      </div>

      {/* Section Info */}
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span className="badge bg-slate-100 text-slate-700">
          {solution.section} • {solution.subdomain.replace('_', ' ')}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {(solution.timeMs / 1000).toFixed(1)}s
        </span>
      </div>

      {/* Checks */}
      <div className="space-y-3">
        <h3 className="font-medium text-slate-800">Checks</h3>
        <div className="grid grid-cols-1 gap-2">
          {solution.evidenceOrChecks.map((item: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
              <span className="text-slate-600">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Votes */}
      <div className="space-y-3">
        <h3 className="font-medium text-slate-800">
          {solution.timeMs >= 1000 ? `${(solution.timeMs / 1000).toFixed(1)}s` : `${solution.timeMs}ms`}
        </h3>
        <div className="text-sm text-slate-600">
          {solution.modelVotes.length} model{solution.modelVotes.length !== 1 ? 's' : ''}
        </div>
        
        <div className="space-y-2">
          {solution.modelVotes.map((vote: any, index: number) => (
            <div key={index} className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">{vote.model}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getConfidenceColor(vote.confidence)}`}>
                    {vote.final}
                  </span>
                  <span className="text-sm text-slate-500">
                    {Math.round(vote.confidence * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">{vote.meta.explanation}</p>
              
              {vote.meta.pythonResult && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    {vote.meta.pythonResult.ok ? (
                      <>
                        <Code2 className="w-3 h-3 text-success-500" />
                        <span>🐍 Python: {vote.meta.pythonResult.result}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-error-500" />
                        <span>Python failed: {vote.meta.pythonResult.error}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Verification */}
      <div className="space-y-3">
        <h3 className="font-medium text-slate-800">Verification</h3>
        <div className={`p-3 rounded-lg ${
          solution.verifier.passed ? 'bg-success-50' : 'bg-error-50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {solution.verifier.passed ? (
              <CheckCircle className="w-4 h-4 text-success-600" />
            ) : (
              <XCircle className="w-4 h-4 text-error-600" />
            )}
            <span className={`font-medium ${
              solution.verifier.passed ? 'text-success-800' : 'text-error-800'
            }`}>
              Verification {solution.verifier.passed ? 'Passed' : 'Failed'}
            </span>
            <span className="text-sm text-slate-600">
              ({Math.round(solution.verifier.score * 100)}%)
            </span>
          </div>
          {solution.verifier.notes.map((note: string, index: number) => (
            <div key={index} className="text-sm text-slate-700">
              ✓ {note}
            </div>
          ))}
        </div>
      </div>

      {/* Python Code (if available) */}
      {solution.modelVotes.some((vote: any) => vote.meta.python) && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-800 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            🐍 Python Verification Code
          </h3>
          {solution.modelVotes.filter((vote: any) => vote.meta.python).map((vote: any, index: number) => (
            <div key={index} className="bg-slate-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto">
              <pre>{vote.meta.python}</pre>
              {vote.meta.pythonResult?.ok && (
                <div className="mt-2 text-blue-300">
                  Result: {vote.meta.pythonResult.result}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};