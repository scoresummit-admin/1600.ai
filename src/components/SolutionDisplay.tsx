import React from 'react';
import { CheckCircle, XCircle, Clock, Brain, Target, AlertTriangle } from 'lucide-react';
import { SATSolution } from '../types/sat';

interface SolutionDisplayProps {
  solution: SATSolution | null;
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
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getConfidenceColor(solution.confidence_0_1)}`}>
            {getConfidenceIcon(solution.confidence_0_1)}
            <span className="font-medium">
              {(solution.confidence_0_1 * 100).toFixed(0)}% confident
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="text-2xl font-bold text-slate-800 mb-2">
            Answer: {solution.final_choice_or_value}
          </div>
          <p className="text-slate-700">{solution.short_explanation}</p>
        </div>

        {/* Evidence/Checklist */}
        <div className="mb-4">
          <h3 className="font-medium text-slate-800 mb-2">
            {solution.section === 'EBRW' ? 'Evidence' : 'Verification Checklist'}
          </h3>
          <ul className="space-y-1">
            {solution.evidence_or_checklist.map((item, index) => (
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
            <span>{(solution.time_ms / 1000).toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{solution.model_votes.length} model{solution.model_votes.length !== 1 ? 's' : ''}</span>
          </div>
          {solution.escalated && (
            <div className="flex items-center gap-1 text-warning-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Escalated</span>
            </div>
          )}
        </div>
      </div>

      {/* Model Votes */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Model Consensus</h3>
        <div className="space-y-3">
          {solution.model_votes.map((vote, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">{vote.model}</div>
                  {vote.reasoning && (
                    <div className="text-sm text-slate-600">{vote.reasoning}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{vote.choice_or_value}</div>
                <div className="text-sm text-slate-600">
                  {(vote.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Results */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Verification</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {solution.verification_result.passed ? (
              <CheckCircle className="w-5 h-5 text-success-500" />
            ) : (
              <XCircle className="w-5 h-5 text-error-500" />
            )}
            <span className={`font-medium ${solution.verification_result.passed ? 'text-success-700' : 'text-error-700'}`}>
              {solution.verification_result.passed ? 'Verification Passed' : 'Verification Failed'}
            </span>
          </div>
          <ul className="ml-7 space-y-1">
            {solution.verification_result.notes.map((note, index) => (
              <li key={index} className="text-sm text-slate-600">{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};