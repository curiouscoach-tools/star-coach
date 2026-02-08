import React, { useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

export default function JobInput({ onAnalyze, isAnalyzing, error }) {
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobDescription.trim().length >= 50 && !isAnalyzing) {
      onAnalyze(jobDescription.trim());
    }
  };

  const isValid = jobDescription.trim().length >= 50;
  const charCount = jobDescription.trim().length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Prepare for Your Interview
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          Paste the job description below. I'll identify the key competencies you'll likely be asked about and help you prepare STAR answers for each.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <label htmlFor="job-description" className="text-sm font-medium text-gray-700">
              Job Description
            </label>
          </div>

          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here...

Include responsibilities, requirements, and any information about the team or company culture. The more detail, the better I can identify relevant competencies."
            rows={12}
            disabled={isAnalyzing}
            className="w-full px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset disabled:bg-gray-50 disabled:cursor-not-allowed"
          />

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {charCount < 50 ? (
                <span className="text-amber-600">
                  {50 - charCount} more characters needed
                </span>
              ) : (
                <span className="text-green-600">
                  {charCount} characters
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isAnalyzing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                isValid && !isAnalyzing
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Job Description'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Analysis failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Your job description is processed securely and not stored permanently.
        </p>
      </div>
    </div>
  );
}
