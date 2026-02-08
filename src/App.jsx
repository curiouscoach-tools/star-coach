import React, { useEffect } from 'react';
import { useInterviewSession } from './hooks/useInterviewSession';
import JobInput from './components/JobInput';
import CompetencyReview from './components/CompetencyReview';
import CoachView from './components/coach/CoachView';
import SessionProgress from './components/SessionProgress';
import ExportPanel from './components/ExportPanel';

export default function App() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const {
    session,
    isAnalyzing,
    error,
    currentCompetency,
    progress,
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
  } = useInterviewSession();

  const renderContent = () => {
    switch (session.sessionPhase) {
      case 'input':
        return (
          <JobInput
            onAnalyze={analyzeJobDescription}
            isAnalyzing={isAnalyzing}
            error={error}
          />
        );

      case 'review':
        return (
          <CompetencyReview
            jobTitle={session.jobTitle}
            competencies={session.competencies}
            selectedCompetencies={session.selectedCompetencies}
            completedAnswers={session.completedAnswers}
            onToggle={toggleCompetency}
            onSelectAll={selectAllCompetencies}
            onDeselectAll={deselectAllCompetencies}
            onStartCoaching={startCoaching}
            onStartWithCompetency={startWithCompetency}
            onRestart={restartFromInput}
          />
        );

      case 'coaching':
        const currentAnswer = currentCompetency
          ? getAnswerForCompetency(currentCompetency.id)
          : null;

        return (
          <>
            <SessionProgress
              current={progress.current}
              total={progress.total}
              competencyName={currentCompetency?.name || ''}
              isComplete={!!currentAnswer}
              onPrevious={goToPreviousCompetency}
              onNext={goToNextCompetency}
              onBackToList={goToCompetencyList}
              onExport={goToExport}
              canGoNext={progress.current < progress.total}
              canGoPrevious={progress.current > 1}
            />
            <CoachView
              competency={currentCompetency}
              jobDescription={session.jobDescription}
              jobTitle={session.jobTitle}
              existingAnswer={currentAnswer}
              onComplete={completeCurrentCompetency}
              onSkip={goToNextCompetency}
            />
          </>
        );

      case 'complete':
        return (
          <ExportPanel
            jobTitle={session.jobTitle}
            completedAnswers={session.completedAnswers}
            onBackToList={goToCompetencyList}
            onRestart={restartFromInput}
          />
        );

      default:
        return (
          <JobInput
            onAnalyze={analyzeJobDescription}
            isAnalyzing={isAnalyzing}
            error={error}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/curious_coach_tools_logo.png"
              alt="STAR Coach"
              className="h-12 w-auto"
            />
            <span className="text-xl font-semibold text-gray-800">STAR Coach</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/curiouscoach-tools/star-coach"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://curiouscoach.tools"
              target="_blank"
              rel="noopener noreferrer"
              title="Curious Coach Tools"
            >
              <img
                src="/images/curious_coach_tools_logo.png"
                alt="Curious Coach Tools"
                className="h-10 w-auto"
              />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderContent()}
      </main>
    </div>
  );
}
