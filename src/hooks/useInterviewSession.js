import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'star-coach-session';

const initialSessionState = {
  jobDescription: '',
  jobTitle: '',
  competencies: [],
  selectedCompetencies: [],
  currentIndex: 0,
  completedAnswers: [],
  sessionPhase: 'input' // 'input' | 'review' | 'coaching' | 'complete'
};

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored data has expected structure
      if (parsed && typeof parsed.sessionPhase === 'string') {
        // If we're in coaching/review/complete but have no competencies, reset to input
        // This handles stale data from older versions
        if (
          parsed.sessionPhase !== 'input' &&
          (!Array.isArray(parsed.competencies) || parsed.competencies.length === 0)
        ) {
          console.log('Resetting stale session - missing competencies');
          localStorage.removeItem(STORAGE_KEY);
          return initialSessionState;
        }
        return { ...initialSessionState, ...parsed };
      }
    }
  } catch (e) {
    console.error('Failed to load session from storage:', e);
  }
  return initialSessionState;
}

function saveToStorage(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session to storage:', e);
  }
}

export function useInterviewSession() {
  const [session, setSession] = useState(loadFromStorage);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Persist to localStorage whenever session changes
  useEffect(() => {
    saveToStorage(session);
  }, [session]);

  const analyzeJobDescription = useCallback(async (jobDescription) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      setSession(prev => ({
        ...prev,
        jobDescription,
        jobTitle: data.jobTitle,
        competencies: data.competencies,
        selectedCompetencies: data.competencies.map(c => c.id), // Select all by default
        sessionPhase: 'review'
      }));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const toggleCompetency = useCallback((competencyId) => {
    setSession(prev => {
      const isSelected = prev.selectedCompetencies.includes(competencyId);
      return {
        ...prev,
        selectedCompetencies: isSelected
          ? prev.selectedCompetencies.filter(id => id !== competencyId)
          : [...prev.selectedCompetencies, competencyId]
      };
    });
  }, []);

  const selectAllCompetencies = useCallback(() => {
    setSession(prev => ({
      ...prev,
      selectedCompetencies: prev.competencies.map(c => c.id)
    }));
  }, []);

  const deselectAllCompetencies = useCallback(() => {
    setSession(prev => ({
      ...prev,
      selectedCompetencies: []
    }));
  }, []);

  const startCoaching = useCallback((shuffled = false) => {
    setSession(prev => {
      let orderedCompetencies = [...prev.selectedCompetencies];

      if (shuffled) {
        // Fisher-Yates shuffle
        for (let i = orderedCompetencies.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [orderedCompetencies[i], orderedCompetencies[j]] = [orderedCompetencies[j], orderedCompetencies[i]];
        }
      }

      return {
        ...prev,
        selectedCompetencies: orderedCompetencies,
        currentIndex: 0,
        sessionPhase: 'coaching'
      };
    });
  }, []);

  const startWithCompetency = useCallback((competencyId) => {
    setSession(prev => {
      // Move the selected competency to the front
      const reordered = [
        competencyId,
        ...prev.selectedCompetencies.filter(id => id !== competencyId)
      ];

      return {
        ...prev,
        selectedCompetencies: reordered,
        currentIndex: 0,
        sessionPhase: 'coaching'
      };
    });
  }, []);

  const completeCurrentCompetency = useCallback((starAnswer) => {
    setSession(prev => {
      const currentCompetencyId = prev.selectedCompetencies[prev.currentIndex];
      const competency = prev.competencies.find(c => c.id === currentCompetencyId);

      const newAnswer = {
        competencyId: currentCompetencyId,
        competencyName: competency?.name || currentCompetencyId,
        star: starAnswer,
        completedAt: new Date().toISOString()
      };

      // Replace existing answer for this competency or add new one
      const existingIndex = prev.completedAnswers.findIndex(
        a => a.competencyId === currentCompetencyId
      );
      const updatedAnswers = existingIndex >= 0
        ? prev.completedAnswers.map((a, i) => i === existingIndex ? newAnswer : a)
        : [...prev.completedAnswers, newAnswer];

      const isLastCompetency = prev.currentIndex >= prev.selectedCompetencies.length - 1;

      return {
        ...prev,
        completedAnswers: updatedAnswers,
        currentIndex: isLastCompetency ? prev.currentIndex : prev.currentIndex + 1,
        sessionPhase: isLastCompetency ? 'complete' : 'coaching'
      };
    });
  }, []);

  const goToNextCompetency = useCallback(() => {
    setSession(prev => {
      if (prev.currentIndex >= prev.selectedCompetencies.length - 1) {
        return { ...prev, sessionPhase: 'complete' };
      }
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const goToPreviousCompetency = useCallback(() => {
    setSession(prev => {
      if (prev.currentIndex <= 0) return prev;
      return { ...prev, currentIndex: prev.currentIndex - 1 };
    });
  }, []);

  const goToCompetencyList = useCallback(() => {
    setSession(prev => ({
      ...prev,
      sessionPhase: 'review'
    }));
  }, []);

  const goToExport = useCallback(() => {
    setSession(prev => ({
      ...prev,
      sessionPhase: 'complete'
    }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(initialSessionState);
    setError(null);
  }, []);

  const restartFromInput = useCallback(() => {
    setSession(initialSessionState);
    setError(null);
  }, []);

  // Computed values
  const currentCompetency = session.competencies.find(
    c => c.id === session.selectedCompetencies[session.currentIndex]
  ) || null;

  const progress = {
    current: session.currentIndex + 1,
    total: session.selectedCompetencies.length,
    completed: session.completedAnswers.length
  };

  const getAnswerForCompetency = useCallback((competencyId) => {
    return session.completedAnswers.find(a => a.competencyId === competencyId);
  }, [session.completedAnswers]);

  return {
    // State
    session,
    isAnalyzing,
    error,
    currentCompetency,
    progress,

    // Actions
    analyzeJobDescription,
    toggleCompetency,
    selectAllCompetencies,
    deselectAllCompetencies,
    startCoaching,
    startWithCompetency,
    completeCurrentCompetency,
    goToNextCompetency,
    goToPreviousCompetency,
    goToCompetencyList,
    goToExport,
    resetSession,
    restartFromInput,
    getAnswerForCompetency
  };
}
