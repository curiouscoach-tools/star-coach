import React, { useState, useRef, useCallback } from 'react';
import { FileText, Upload, Loader2, AlertCircle, X, FileCheck } from 'lucide-react';
import { parseDocument, getAcceptedFileTypes } from '../utils/documentParser';

export default function JobInput({ onAnalyze, isAnalyzing, error }) {
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jobDescription.trim().length >= 50 && !isAnalyzing && !isParsing) {
      onAnalyze(jobDescription.trim());
    }
  };

  const processFile = useCallback(async (file) => {
    setIsParsing(true);
    setParseError(null);
    setUploadedFile({ name: file.name, size: file.size });

    try {
      const result = await parseDocument(file);

      if (result.error) {
        setParseError(result.error);
        setUploadedFile(null);
        return;
      }

      if (result.isPdf) {
        // Need to send to server for PDF processing
        const base64 = await fileToBase64(file);

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64,
            filename: file.name
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to process PDF');
        }

        const data = await response.json();
        setJobDescription(data.text);
      } else {
        // Client-side parsing succeeded
        setJobDescription(result.text);
      }
    } catch (err) {
      console.error('File processing error:', err);
      setParseError(err.message || 'Failed to process file');
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleClear = useCallback(() => {
    setJobDescription('');
    setUploadedFile(null);
    setParseError(null);
  }, []);

  const isValid = jobDescription.trim().length >= 50;
  const charCount = jobDescription.trim().length;
  const displayError = parseError || error;

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
          Upload or paste the job description below. I'll identify the key competencies you'll likely be asked about.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* File Upload Zone */}
        <div
          className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : isParsing
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isParsing && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedFileTypes()}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isParsing || isAnalyzing}
          />

          {isParsing ? (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="font-medium">Processing {uploadedFile?.name}...</p>
              <p className="text-sm text-gray-500">Extracting text content</p>
            </div>
          ) : uploadedFile && jobDescription ? (
            <div className="flex items-center justify-center gap-3 text-green-700">
              <FileCheck className="w-6 h-6" />
              <span className="font-medium">{uploadedFile.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <Upload className="w-8 h-8 text-gray-400" />
              <p>
                <span className="font-medium text-indigo-600">Click to upload</span>
                {' '}or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                Supports .txt, .docx, .pdf, .pptx (max 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or paste below</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <label htmlFor="job-description" className="text-sm font-medium text-gray-700">
              Job Description
            </label>
            {uploadedFile && jobDescription && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (uploadedFile) setUploadedFile(null);
            }}
            placeholder="Paste the full job description here...

Include responsibilities, requirements, and any information about the team or company culture. The more detail, the better I can identify relevant competencies."
            rows={12}
            disabled={isAnalyzing || isParsing}
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
              disabled={!isValid || isAnalyzing || isParsing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                isValid && !isAnalyzing && !isParsing
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

        {displayError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {parseError ? 'File processing failed' : 'Analysis failed'}
              </p>
              <p className="text-sm text-red-600 mt-1">{displayError}</p>
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

/**
 * Convert file to base64 string (without data URL prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove "data:...;base64," prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
