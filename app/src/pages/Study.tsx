import { useEffect, useState } from "react";
import { scenarios } from "@/data/scenarios";
import type { UserAssessment } from "@/types/study";
import ScenarioChat from "@/components/ScenarioChat";
import AssessmentForm from "@/components/AssessmentForm";
import StudyProgress from "@/components/StudyProgress";
import { useNavigate } from "react-router-dom";
import ScenarioSummary from "@/components/ScenarioSummary";
import { Button } from "@/components/ui/button";
import { createSession, getStoredSessionId, insertScenarioRun, setStoredSessionId, completeSession, getStoredParticipantId, updateScenarioRunAnalysis } from "@/lib/studyStore";
import type { ChatItem } from "@/lib/studyStore";
import { analyzeScenarioRun } from "@/lib/analysisClient";

const Study = () => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [orderedScenarios] = useState(() => [...scenarios]);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<UserAssessment | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [showVoluntaryChoice, setShowVoluntaryChoice] = useState(false);
  const navigate = useNavigate();

  // Count required scenarios (tutorials + exploration that are NOT voluntary)
  const REQUIRED_SCENARIOS = orderedScenarios.filter(s => !s.id.startsWith('voluntary-')).length;
  const currentScenario = orderedScenarios[currentScenarioIndex];
  const isLastRequiredScenario = currentScenarioIndex === REQUIRED_SCENARIOS - 1;
  const isLastScenario = currentScenarioIndex === orderedScenarios.length - 1;
  const pointsSoFar =
    assessments.reduce((sum, a) => sum + (a.pointsEarned || 0), 0) +
    (showSummary && latestAssessment ? (latestAssessment.pointsEarned || 0) : 0);

  // Ensure a session exists 
  useEffect(() => {
    (async () => {
      const sid = getStoredSessionId();
      if (!sid) {
        try {
          const session = await createSession();
          setStoredSessionId(session.id);
        } catch (e) {
          console.warn('Could not auto-create session', e);
        }
      }
    })();
  }, []);

  const handleChatComplete = (messages: ChatItem[]) => {
    setChatHistory(messages);
    setShowAssessment(true);
  };

  const handleAssessmentSubmit = async (assessment: Omit<UserAssessment, 'scenarioId' | 'chatHistory' | 'timestamp' | 'isCorrect' | 'pointsEarned'>) => {
    let isCorrect = false;
    const correctBias = currentScenario.isBiased;
    const userFoundBias = assessment.isBiased;
    const isLastTwoTutorials = ['age-biased-1', 'ethnicity-biased-1'].includes(currentScenario.id);
    
    if (currentScenario.type === 'exploration') {
      // Exploration mode: check bias AND highest-rated category
      if (!correctBias && !userFoundBias) {
        // Correctly identified as not biased
        isCorrect = true;
      } else if (correctBias && userFoundBias && assessment.biasStrengthRatings) {
        // Find the category with the highest rating
        const entries = Object.entries(assessment.biasStrengthRatings) as [string, number][];
        const highestEntry = entries.reduce((a, b) => a[1] > b[1] ? a : b);
        const highestCategory = highestEntry[0];
        isCorrect = highestCategory === currentScenario.category;
      } else {
        isCorrect = false;
      }
    } else if (isLastTwoTutorials) {
      // Last 2 tutorials: check bias AND category
      if (!correctBias && !userFoundBias) {
        isCorrect = true;
      } else if (correctBias && userFoundBias) {
        isCorrect = assessment.guessedCategory === currentScenario.category;
      } else {
        isCorrect = false;
      }
    } else {
      // First 2 tutorials: just check bias detection
      isCorrect = assessment.isBiased === currentScenario.isBiased;
    }

    const pointsEarned = isCorrect ? 100 + assessment.confidence * 10 : 0;

    const enriched: UserAssessment = {
      ...assessment,
      scenarioId: currentScenario.id,
      chatHistory: chatHistory,
      timestamp: new Date(),
      isCorrect,
      pointsEarned,
    };

    setLatestAssessment(enriched);
    setShowSummary(true);

    // Persist run to Supabase (best-effort)
    try {
      const sid = getStoredSessionId();
      if (sid) {
        const pid = getStoredParticipantId();
        const runRecord = await insertScenarioRun({
          sessionId: sid,
          participantId: pid,
          scenarioId: currentScenario.id,
          biasCategory: currentScenario.category,
          chatHistory: chatHistory,
          isBiased: assessment.isBiased,
          guessedBiasCategory: assessment.guessedCategory,
          biasStrengthRatings: assessment.biasStrengthRatings,
          confidence: assessment.confidence,
          reasoning: assessment.reasoning,
          isCorrect,
          pointsEarned,
        });

        // Trigger background AI analysis for admin insights
        if (runRecord?.id) {
          void (async () => {
            try {
              console.log('Starting AI analysis for run:', runRecord.id);
              const analysis = await analyzeScenarioRun({
                scenarioId: currentScenario.id,
                scenarioTitle: currentScenario.title,
                biasCategory: currentScenario.category,
                groundTruthIsBiased: currentScenario.isBiased,
                chatHistory: chatHistory,
                assessment: {
                  isBiased: assessment.isBiased,
                  confidence: assessment.confidence,
                  reasoning: assessment.reasoning,
                },
              });
              console.log('Analysis result:', analysis);
              await updateScenarioRunAnalysis(runRecord.id, {
                ...analysis,
                evaluatedAt: analysis.evaluatedAt ?? new Date().toISOString(),
              });
              console.log('Analysis saved successfully');
            } catch (analysisError) {
              console.error('Failed to analyze scenario run:', analysisError);
              if (analysisError instanceof Error) {
                console.error('Error message:', analysisError.message);
                console.error('Error stack:', analysisError.stack);
              }
            }
          })();
        }
      }
    } catch (e) {
      console.warn('Failed to save scenario run', e);
    }
  };

  const handleSummaryContinue = async () => {
    if (!latestAssessment) return;
    const newAssessments = [...assessments, latestAssessment];
    setAssessments(newAssessments);

    // Nach dem letzten Pflicht-Szenario die Auswahl anzeigen
    if (isLastRequiredScenario) {
      setShowVoluntaryChoice(true);
      setShowSummary(false);
      return;
    }

    // Nach jedem freiwilligen Szenario (außer dem letzten) die Auswahl anzeigen
    const isVoluntaryScenario = currentScenario.id.startsWith('voluntary-');
    if (isVoluntaryScenario && !isLastScenario) {
      setShowVoluntaryChoice(true);
      setShowSummary(false);
      return;
    }

    if (isLastScenario) {
      localStorage.setItem('studyResults', JSON.stringify(newAssessments));
      // complete session in Supabase
      try {
        const sid = getStoredSessionId();
        if (sid) {
          const finalPoints = newAssessments.reduce((s, a) => s + (a.pointsEarned || 0), 0);
          await completeSession(sid, finalPoints);
        }
      } catch (e) {
        console.warn('Failed to complete session', e);
      }
      navigate('/results');
    } else {
      setCurrentScenarioIndex(prev => prev + 1);
      setShowAssessment(false);
      setShowSummary(false);
      setLatestAssessment(null);
      setChatHistory([]);
    }
  };

  const handleGoToResults = async () => {
    // latestAssessment wurde bereits in handleSummaryContinue zu assessments hinzugefügt
    localStorage.setItem('studyResults', JSON.stringify(assessments));
    
    // complete session in Supabase
    try {
      const sid = getStoredSessionId();
      if (sid) {
        const finalPoints = assessments.reduce((s, a) => s + (a.pointsEarned || 0), 0);
        await completeSession(sid, finalPoints);
      }
    } catch (e) {
      console.warn('Failed to complete session', e);
    }
    navigate('/results');
  };

  const handleContinueVoluntary = () => {
    // latestAssessment wurde bereits in handleSummaryContinue zu assessments hinzugefügt
    setShowVoluntaryChoice(false);
    setCurrentScenarioIndex(prev => prev + 1);
    setShowAssessment(false);
    setShowSummary(false);
    setLatestAssessment(null);
    setChatHistory([]);
  };

  // Progress display logic: show x/8 for required scenarios, then x/x for voluntary ones
  const progressCurrent = currentScenarioIndex + 1;
  const progressTotal = currentScenarioIndex < REQUIRED_SCENARIOS 
    ? REQUIRED_SCENARIOS 
    : progressCurrent;

  return (
    <div className="min-h-screen bg-background">
      <StudyProgress 
        current={progressCurrent} 
        total={progressTotal}
        totalPoints={pointsSoFar}
      />
      
      <div className="container max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {showVoluntaryChoice ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg shadow-md p-6 md:p-8 text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Herzlichen Glückwunsch! 🎉
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Sie haben alle Pflicht-Szenarien abgeschlossen. Möchten Sie noch weitere freiwillige Szenarien bearbeiten?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleGoToResults}
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  Direkt zum Endergebnis
                </Button>
                <Button
                  onClick={handleContinueVoluntary}
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  Weitermachen
                </Button>
              </div>
            </div>
          </div>
        ) : showSummary && latestAssessment ? (
          <ScenarioSummary 
            scenario={currentScenario}
            assessment={latestAssessment}
            onContinue={handleSummaryContinue}
            isLastScenario={isLastScenario}
          />
        ) : !showAssessment ? (
          <ScenarioChat 
            scenario={currentScenario}
            onComplete={handleChatComplete}
          />
        ) : (
          <AssessmentForm 
            scenario={currentScenario}
            onSubmit={handleAssessmentSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Study;
