import React, { useEffect, useCallback } from 'react';
import ChatPanel from './ChatPanel';
import StarPanel from './StarPanel';
import { useCoachConversation } from '../../hooks/useCoachConversation';
import { useStarBuilder } from '../../hooks/useStarBuilder';
import { CheckCircle2, ArrowRight, SkipForward } from 'lucide-react';

export default function CoachView({
  competency,
  jobDescription,
  jobTitle,
  existingAnswer,
  onComplete,
  onSkip
}) {
  const { star, updateStar, resetStar } = useStarBuilder();
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    resetConversation,
    currentSection
  } = useCoachConversation(updateStar, competency, jobDescription, jobTitle);

  // Reset conversation when competency changes
  useEffect(() => {
    resetConversation();
    resetStar();
  }, [competency?.id, resetConversation, resetStar]);

  // Load existing answer if we have one
  useEffect(() => {
    if (existingAnswer?.star) {
      updateStar(existingAnswer.star);
    }
  }, [existingAnswer, updateStar]);

  const handleReset = () => {
    resetConversation();
    resetStar();
  };

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete(star);
    }
  }, [onComplete, star]);

  const isAnswerComplete = currentSection === 'complete' || (
    star.situation?.trim() &&
    star.task?.trim() &&
    star.action?.trim() &&
    star.result?.trim()
  );

  // Calculate dynamic height based on whether we have a progress bar
  const viewHeight = competency ? 'h-[calc(100vh-88px-52px)]' : 'h-[calc(100vh-88px)]';

  return (
    <div className={`${viewHeight} flex flex-col`}>
      <div className="flex-1 flex">
        {/* Chat Panel - Left Side */}
        <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            error={error}
            onSendMessage={sendMessage}
            onReset={handleReset}
            currentSection={currentSection}
            competencyName={competency?.name}
          />
        </div>

        {/* STAR Panel - Right Side */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <StarPanel
              star={star}
              currentSection={currentSection}
            />
          </div>

          {/* Complete/Save Button - Only show when in session mode */}
          {competency && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex gap-3">
                {isAnswerComplete ? (
                  <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Save & Continue
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={!star.situation?.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      star.situation?.trim()
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5" />
                    Save Progress
                  </button>
                )}

                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Skip this competency"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
