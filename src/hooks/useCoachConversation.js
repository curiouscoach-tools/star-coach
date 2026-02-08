import { useState, useCallback, useRef, useMemo } from 'react';

function buildInitialMessage(competency, jobTitle) {
  if (competency) {
    return {
      id: 'initial',
      role: 'assistant',
      content: `Let's prepare a STAR answer for **${competency.name}**${jobTitle ? ` for the ${jobTitle} role` : ''}.

"${competency.sampleQuestion}"

**Think of a specific example from your experience that demonstrates this competency.** What's the situation you'd like to talk about?`,
      timestamp: new Date().toISOString(),
      section: 'situation',
      isStreaming: false
    };
  }

  // Fallback for non-session mode (shouldn't happen with new flow)
  return {
    id: 'initial',
    role: 'assistant',
    content: `Hi! I'm here to help you prepare compelling STAR answers for your interview.

**What competency or skill are you preparing to discuss?**

For example: leadership, problem-solving, stakeholder management, delivering under pressure, etc.`,
    timestamp: new Date().toISOString(),
    section: 'situation',
    isStreaming: false
  };
}

// Build API-safe messages array: must start with user role, roles must alternate.
// Strips the initial UI greeting since it's not part of the real conversation.
function toApiMessages(msgs) {
  return msgs
    .filter(m => !m.id?.startsWith('initial'))
    .map(m => ({ role: m.role, content: m.content }));
}

// Derive section from which fields are actually populated.
// This is the ground truth — if the data is there, the section should advance.
const SECTION_ORDER = ['situation', 'task', 'action', 'result', 'complete'];

function deriveSectionFromData(updates) {
  if (!updates) return 'situation';
  const hasSituation = updates.situation != null && updates.situation.trim() !== '';
  const hasTask = updates.task != null && updates.task.trim() !== '';
  const hasAction = updates.action != null && updates.action.trim() !== '';
  const hasResult = updates.result != null && updates.result.trim() !== '';

  if (hasSituation && hasTask && hasAction && hasResult) return 'complete';
  if (hasSituation && hasTask && hasAction) return 'result';
  if (hasSituation && hasTask) return 'action';
  if (hasSituation) return 'task';
  return 'situation';
}

function furthestSection(a, b) {
  return SECTION_ORDER.indexOf(a) >= SECTION_ORDER.indexOf(b) ? a : b;
}

export function useCoachConversation(onStarUpdate, competency = null, jobDescription = '', jobTitle = '') {
  const initialMessage = useMemo(
    () => buildInitialMessage(competency, jobTitle),
    [competency?.id, jobTitle]
  );

  const [messages, setMessages] = useState([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState('situation');
  const currentSectionRef = useRef('situation');

  // Store context for API calls
  const contextRef = useRef({ competency, jobDescription, jobTitle });
  contextRef.current = { competency, jobDescription, jobTitle };

  const runExtraction = useCallback(async (conversationMessages) => {
    try {
      const apiMessages = toApiMessages(conversationMessages);

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          currentSection: currentSectionRef.current,
          competency: contextRef.current.competency,
          jobDescription: contextRef.current.jobDescription
        })
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Extraction API error:', response.status, errBody);
        return;
      }

      const data = await response.json();

      if (data.starUpdates && onStarUpdate) {
        onStarUpdate(data.starUpdates);
      }

      // Advance section based on whichever is further ahead:
      // the extractor's suggestion or what the data actually shows.
      const dataSection = deriveSectionFromData(data.starUpdates);
      const apiSection = data.suggestedSection || currentSectionRef.current;
      const nextSection = furthestSection(dataSection, apiSection);

      currentSectionRef.current = nextSection;
      setCurrentSection(nextSection);
    } catch (err) {
      console.error('Extraction error (non-fatal):', err);
    }
  }, [onStarUpdate]);

  const sendMessage = useCallback(async (content) => {
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      section: currentSectionRef.current,
      isStreaming: false
    };

    const placeholderId = `assistant-${Date.now()}`;
    const placeholderMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      section: currentSectionRef.current,
      isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, placeholderMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    try {
      const allMessages = [...messages, userMessage];
      const conversationHistory = toApiMessages(allMessages);

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          currentSection: currentSectionRef.current,
          competency: contextRef.current.competency,
          jobDescription: contextRef.current.jobDescription,
          jobTitle: contextRef.current.jobTitle
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          if (data === '[DONE]') continue;

          try {
            const text = JSON.parse(data);
            if (typeof text === 'string' && text !== '[ERROR]') {
              fullText += text;
              const updatedText = fullText;
              setMessages(prev => prev.map(m =>
                m.id === placeholderId
                  ? { ...m, content: updatedText }
                  : m
              ));
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      // Finalize the message
      setMessages(prev => prev.map(m =>
        m.id === placeholderId
          ? { ...m, isStreaming: false }
          : m
      ));
      setIsStreaming(false);
      setIsLoading(false);

      // Fire extraction in background (no await)
      const finalMessages = [...allMessages, { role: 'assistant', content: fullText }];
      runExtraction(finalMessages);

    } catch (err) {
      console.error('Coach conversation error:', err);
      // Remove the placeholder message on failure
      setMessages(prev => prev.filter(m => m.id !== placeholderId));
      setError(err.message || 'Failed to get response. Please try again.');
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, [messages, runExtraction]);

  const resetConversation = useCallback(() => {
    const newInitialMessage = buildInitialMessage(
      contextRef.current.competency,
      contextRef.current.jobTitle
    );
    setMessages([{
      ...newInitialMessage,
      id: `initial-${Date.now()}`,
      timestamp: new Date().toISOString()
    }]);
    currentSectionRef.current = 'situation';
    setCurrentSection('situation');
    setIsStreaming(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    currentSection,
    sendMessage,
    resetConversation
  };
}
