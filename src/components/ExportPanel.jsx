import React, { useState, useCallback } from 'react';
import { Copy, Check, RotateCcw, MapPin, User, Zap, Trophy, ArrowLeft } from 'lucide-react';

function formatAnswerForCopy(answer) {
  const parts = [];
  parts.push(`## ${answer.competencyName}`);
  parts.push('');

  if (answer.star.situation?.trim()) {
    parts.push(`**Situation**`);
    parts.push(answer.star.situation.trim());
    parts.push('');
  }

  if (answer.star.task?.trim()) {
    parts.push(`**Task**`);
    parts.push(answer.star.task.trim());
    parts.push('');
  }

  if (answer.star.action?.trim()) {
    parts.push(`**Action**`);
    parts.push(answer.star.action.trim());
    parts.push('');
  }

  if (answer.star.result?.trim()) {
    parts.push(`**Result**`);
    parts.push(answer.star.result.trim());
    parts.push('');
  }

  return parts.join('\n');
}

function formatAllForCopy(answers, jobTitle) {
  const header = `# STAR Interview Answers\n## ${jobTitle}\n\n---\n\n`;
  const answersText = answers.map(formatAnswerForCopy).join('\n---\n\n');
  return header + answersText;
}

function StarSection({ icon: Icon, label, content, color }) {
  if (!content?.trim()) return null;

  return (
    <div className="mb-3">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap pl-5">{content}</p>
    </div>
  );
}

function AnswerCard({ answer, onCopy, copied }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-800">{answer.competencyName}</h3>
        <button
          onClick={() => onCopy(answer)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="p-4">
        <StarSection
          icon={MapPin}
          label="Situation"
          content={answer.star.situation}
          color="text-blue-600"
        />
        <StarSection
          icon={User}
          label="Task"
          content={answer.star.task}
          color="text-purple-600"
        />
        <StarSection
          icon={Zap}
          label="Action"
          content={answer.star.action}
          color="text-amber-600"
        />
        <StarSection
          icon={Trophy}
          label="Result"
          content={answer.star.result}
          color="text-green-600"
        />
      </div>
    </div>
  );
}

export default function ExportPanel({
  jobTitle,
  completedAnswers,
  onBackToList,
  onRestart
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopySingle = useCallback(async (answer) => {
    const text = formatAnswerForCopy(answer);
    await navigator.clipboard.writeText(text);
    setCopiedId(answer.competencyId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(async () => {
    const text = formatAllForCopy(completedAnswers, jobTitle);
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [completedAnswers, jobTitle]);

  if (completedAnswers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-600 mb-4">
          You haven't completed any STAR answers yet.
        </p>
        <button
          onClick={onBackToList}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competencies
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Your STAR Answers
        </h1>
        <p className="text-gray-600">
          {completedAnswers.length} answer{completedAnswers.length !== 1 ? 's' : ''} prepared for {jobTitle}
        </p>
      </div>

      {/* Copy All Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleCopyAll}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            copiedAll
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          {copiedAll ? (
            <>
              <Check className="w-5 h-5" />
              All Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy All Answers
            </>
          )}
        </button>
      </div>

      {/* Answer Cards */}
      <div className="space-y-4">
        {completedAnswers.map((answer) => (
          <AnswerCard
            key={answer.competencyId}
            answer={answer}
            onCopy={handleCopySingle}
            copied={copiedId === answer.competencyId}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onBackToList}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Prepare More
        </button>

        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Job Description
        </button>
      </div>
    </div>
  );
}
