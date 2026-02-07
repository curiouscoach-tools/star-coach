import React from 'react';
import ChatPanel from './ChatPanel';
import StarPanel from './StarPanel';
import { useCoachConversation } from '../../hooks/useCoachConversation';
import { useStarBuilder } from '../../hooks/useStarBuilder';

export default function CoachView() {
  const { star, updateStar, resetStar } = useStarBuilder();
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    resetConversation,
    currentSection
  } = useCoachConversation(updateStar);

  const handleReset = () => {
    resetConversation();
    resetStar();
  };

  return (
    <div className="h-[calc(100vh-88px)] flex">
      {/* Chat Panel - Left Side */}
      <div className="w-1/2 border-r border-gray-200 bg-white">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          error={error}
          onSendMessage={sendMessage}
          onReset={handleReset}
          currentSection={currentSection}
        />
      </div>

      {/* STAR Panel - Right Side */}
      <div className="w-1/2 bg-gray-50">
        <StarPanel
          star={star}
          currentSection={currentSection}
        />
      </div>
    </div>
  );
}
