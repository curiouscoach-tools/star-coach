import React from 'react';
import { ChevronLeft, ChevronRight, List, Download, CheckCircle2 } from 'lucide-react';

export default function SessionProgress({
  current,
  total,
  competencyName,
  isComplete,
  onPrevious,
  onNext,
  onBackToList,
  onExport,
  canGoNext,
  canGoPrevious
}) {
  const progressPercent = (current / total) * 100;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {current} of {total}
          </span>
        </div>

        {/* Navigation and Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToList}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">All Competencies</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {isComplete && (
              <CheckCircle2 className="w-4 h-4 text-green-600 mr-1" />
            )}
            <span className="text-sm font-medium text-gray-800">
              {competencyName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                canGoPrevious
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {current === total ? (
              <button
                onClick={onExport}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export All</span>
              </button>
            ) : (
              <button
                onClick={onNext}
                disabled={!canGoNext}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  canGoNext
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
