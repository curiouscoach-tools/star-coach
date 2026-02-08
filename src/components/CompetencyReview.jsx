import React from 'react';
import { CheckCircle2, Circle, Shuffle, ArrowRight, Play, RotateCcw, CheckCheck } from 'lucide-react';

export default function CompetencyReview({
  jobTitle,
  competencies,
  selectedCompetencies,
  completedAnswers,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onStartCoaching,
  onStartWithCompetency,
  onRestart
}) {
  const selectedCount = selectedCompetencies.length;
  const allSelected = selectedCount === competencies.length;
  const noneSelected = selectedCount === 0;

  const getCompetencyStatus = (competencyId) => {
    const isCompleted = completedAnswers.some(a => a.competencyId === competencyId);
    const isSelected = selectedCompetencies.includes(competencyId);
    return { isCompleted, isSelected };
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {jobTitle}
        </h1>
        <p className="text-gray-600">
          Based on this role, you'll likely be asked about these competencies.
          Select which ones you want to prepare.
        </p>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {selectedCount} of {competencies.length} selected
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={allSelected}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Select all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={onDeselectAll}
            disabled={noneSelected}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Clear selection
          </button>
        </div>
      </div>

      {/* Competency List */}
      <div className="space-y-3 mb-8">
        {competencies.map((competency) => {
          const { isCompleted, isSelected } = getCompetencyStatus(competency.id);

          return (
            <div
              key={competency.id}
              className={`bg-white rounded-lg border-2 transition-all ${
                isSelected
                  ? isCompleted
                    ? 'border-green-300 bg-green-50'
                    : 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => onToggle(competency.id)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {isSelected ? (
                      <CheckCircle2 className={`w-5 h-5 ${
                        isCompleted ? 'text-green-600' : 'text-indigo-600'
                      }`} />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${
                        isSelected ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {competency.name}
                      </h3>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <CheckCheck className="w-3 h-3" />
                          Prepared
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {competency.description}
                    </p>
                    <p className="text-sm text-gray-400 mt-2 italic">
                      "{competency.sampleQuestion}"
                    </p>
                  </div>

                  {/* Quick Start Button */}
                  {isSelected && (
                    <button
                      onClick={() => onStartWithCompetency(competency.id)}
                      className="flex-shrink-0 p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Start with this competency"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => onStartCoaching(false)}
          disabled={noneSelected}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            noneSelected
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          Work Through Selected ({selectedCount})
        </button>

        <button
          onClick={() => onStartCoaching(true)}
          disabled={noneSelected}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            noneSelected
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          Shuffle & Start
        </button>
      </div>

      {/* Restart Link */}
      <div className="mt-8 text-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="w-3 h-3" />
          Analyze a different job description
        </button>
      </div>
    </div>
  );
}
