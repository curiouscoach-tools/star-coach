import React, { useState, useCallback } from 'react';
import { MapPin, User, Zap, Trophy, Copy, Check } from 'lucide-react';

function formatStarAnswer(star) {
  const parts = [];

  if (star.situation?.trim()) {
    parts.push(`**Situation**\n${star.situation.trim()}`);
  }

  if (star.task?.trim()) {
    parts.push(`**Task**\n${star.task.trim()}`);
  }

  if (star.action?.trim()) {
    parts.push(`**Action**\n${star.action.trim()}`);
  }

  if (star.result?.trim()) {
    parts.push(`**Result**\n${star.result.trim()}`);
  }

  return parts.join('\n\n');
}

export default function StarPanel({ star, currentSection }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = formatStarAnswer(star);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [star]);

  const sections = [
    { key: 'situation', label: 'Situation', icon: MapPin, field: 'situation' },
    { key: 'task', label: 'Task', icon: User, field: 'task' },
    { key: 'action', label: 'Action', icon: Zap, field: 'action' },
    { key: 'result', label: 'Result', icon: Trophy, field: 'result' }
  ];

  const getSectionStatus = (sectionKey) => {
    const sectionIndex = sections.findIndex(s => s.key === sectionKey);
    const currentIndex = sections.findIndex(s => s.key === currentSection);

    if (currentSection === 'complete') return 'complete';
    if (sectionIndex < currentIndex) return 'complete';
    if (sectionIndex === currentIndex) return 'active';
    return 'pending';
  };

  const hasContent = (field) => {
    return star[field] && star[field].trim() !== '';
  };

  const renderContent = (section) => {
    const { field } = section;

    if (!hasContent(field)) {
      return (
        <p className="text-gray-400 text-sm italic">
          {getSectionStatus(section.key) === 'active'
            ? 'Being discussed...'
            : 'Not yet covered'}
        </p>
      );
    }

    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{star[field]}</p>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconColor = (status) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'active':
        return 'text-indigo-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Your STAR Answer</h2>
        <p className="text-sm text-gray-500">
          {star.competency
            ? `Demonstrating: ${star.competency}`
            : 'Your answer takes shape as we talk'}
        </p>
      </div>

      {/* STAR Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {sections.map((section) => {
            const status = getSectionStatus(section.key);
            const Icon = section.icon;

            return (
              <div
                key={section.key}
                className={`rounded-lg border p-4 transition-all ${getStatusColor(status)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${getIconColor(status)}`} />
                  <h3 className={`font-medium ${
                    status === 'pending' ? 'text-gray-400' : 'text-gray-800'
                  }`}>
                    {section.label}
                  </h3>
                </div>
                {renderContent(section)}
              </div>
            );
          })}
        </div>

        {/* Completion State */}
        {currentSection === 'complete' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Answer Ready!</h3>
            <p className="text-sm text-green-700">
              Your STAR answer covers all the key elements. Practice it out loud, then copy and save for reference.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleCopy}
          disabled={!star.situation?.trim()}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            copied
              ? 'bg-green-100 text-green-700 border border-green-300'
              : star.situation?.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy STAR Answer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
