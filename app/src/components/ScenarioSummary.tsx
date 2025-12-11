import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, Flame, Users, TrendingUp, FileText } from "lucide-react";
import type { Scenario, UserAssessment } from "@/types/study";
import { getScenarioStatistics, type ScenarioStatistics } from "@/lib/studyStore";

interface ScenarioSummaryProps {
  scenario: Scenario;
  assessment: UserAssessment;
  onContinue: () => void;
  isLastScenario: boolean;
}

const ScenarioSummary = ({ scenario, assessment, onContinue, isLastScenario }: ScenarioSummaryProps) => {
  const [showPoints, setShowPoints] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [statistics, setStatistics] = useState<ScenarioStatistics | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    // Start point animation after a short delay
    const timer = setTimeout(() => {
      setShowPoints(true);
      animatePoints();
    }, 500);

    return () => clearTimeout(timer);
  }, [assessment.pointsEarned]);

  useEffect(() => {
    // Fetch statistics from database
    const fetchStats = async () => {
      const stats = await getScenarioStatistics(scenario.id);
      setStatistics(stats);
      setShowComparison(true); // Show immediately without delay
    };

    fetchStats();
  }, [scenario.id]);

  const animatePoints = () => {
    const duration = 1500;
    const steps = 50;
    const increment = assessment.pointsEarned / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= assessment.pointsEarned) {
        setAnimatedPoints(assessment.pointsEarned);
        clearInterval(interval);
      } else {
        setAnimatedPoints(Math.floor(current));
      }
    }, duration / steps);
  };

  const getStreakBonus = () => {
    if (assessment.pointsEarned > 150) return 50;
    return 0;
  };

  const getConfidenceBonus = () => assessment.confidence * 10;
  const basePoints = 100;

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-in fade-in">
      <Card className="max-w-2xl w-full shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {assessment.isCorrect ? (
              <div className="relative">
                <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24 text-green-500 animate-in zoom-in-50" />
              </div>
            ) : (
              <XCircle className="w-16 h-16 md:w-24 md:h-24 text-destructive animate-in zoom-in-50" />
            )}
          </div>
          <CardTitle className="text-lg md:text-3xl font-bold">
            {assessment.isCorrect ? "Perfekt erkannt!" : "Nicht ganz richtig"}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {assessment.isCorrect 
              ? "Du hast den Bias korrekt identifiziert!" 
              : "Weiter geht's - du wirst besser!"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Point Animation */}
          {assessment.isCorrect && (
            <div className="text-center py-8 relative">
              <div className="inline-flex items-center gap-3 px-4 md:px-8 py-4 md:py-6 rounded-2xl animate-in zoom-in-50">
                <Trophy className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                <div className="text-4xl md:text-6xl font-bold text-primary animate-pulse">
                  {showPoints ? `+${animatedPoints}` : "..."}
                </div>
              </div>
              
              {showPoints && animatedPoints === assessment.pointsEarned && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-2xl md:text-4xl animate-in fade-in">✨</div>
                </div>
              )}
            </div>
          )}

          {/* Point Breakdown */}
          {assessment.isCorrect && showPoints && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Basis-Punkte</span>
                <span className="text-lg font-bold text-primary">+{basePoints}</span>
              </div>
              
              {getConfidenceBonus() > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Selbstvertrauen Bonus</span>
                  <span className="text-lg font-bold text-primary">+{getConfidenceBonus()}</span>
                </div>
              )}
              
              {getStreakBonus() > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">Streak Bonus</span>
                  </div>
                  <span className="text-lg font-bold text-orange-500">+{getStreakBonus()}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Card className="p-4 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Deine Einschätzung</div>
              <div className="font-bold text-lg">
                {assessment.isBiased ? "Bias erkannt" : "Kein Bias"}
              </div>
            </Card>
            
            <Card className="p-4 bg-card/50">
              <div className="text-sm text-muted-foreground mb-1">Selbstvertrauen</div>
              <div className="font-bold text-lg">
                {assessment.confidence}/5
              </div>
            </Card>
          </div>

          {/* Reasoning */}
          {assessment.reasoning && (
            <Card className="p-4 bg-muted/30">
              <div className="text-sm text-muted-foreground mb-2">Deine Begründung:</div>
              <p className="text-sm">{assessment.reasoning}</p>
            </Card>
          )}

          {/* System Prompt Display */}
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">So sollte sich die KI während des Gesprächs im Hintergrund verhalten:</h3>
            </div>
            <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap bg-white/50 dark:bg-black/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              {scenario.systemPrompt}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              Dies waren die Instruktionen, die das KI-System während des Gesprächs erhalten hat.
            </p>
          </Card>

          {/* Comparison Statistics */}
          {showComparison && statistics && statistics.totalParticipants > 1 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold">Vergleich mit anderen Teilnehmern</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Confidence Comparison */}
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-muted-foreground mb-2">Selbstvertrauen</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{assessment.confidence}/5</span>
                    <span className="text-sm text-muted-foreground">Du</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-semibold text-muted-foreground">{statistics.averageConfidence}/5</span>
                    <span className="text-xs text-muted-foreground">Durchschnitt</span>
                  </div>
                  {assessment.confidence > statistics.averageConfidence && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>Überdurchschnittlich sicher</span>
                    </div>
                  )}
                </Card>

                {/* Performance Percentile */}
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-muted-foreground mb-2">Deine Leistung</div>
                  {assessment.isCorrect ? (
                    <>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {100 - statistics.correctPercentage}% übertroffen
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {100 - statistics.correctPercentage > 50 
                          ? "Besser als die meisten Teilnehmer" 
                          : `${100 - statistics.correctPercentage}% hatten es falsch`}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                        {statistics.correctPercentage}% waren korrekt
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Du lernst beim nächsten Mal dazu!
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* Bias Strength Ratings Comparison for Exploration Mode */}
              {scenario.type === 'exploration' && statistics.averageBiasStrengthRatings && assessment.biasStrengthRatings && (
                <Card className="p-4 bg-muted/30">
                  <div className="text-sm font-medium text-foreground mb-3">Bias-Stärke Bewertung im Vergleich:</div>
                  <div className="space-y-3">
                    {(['gender', 'age', 'ethnicity', 'status'] as const).map((category) => {
                      const categoryLabels: Record<string, string> = {
                        gender: 'Geschlecht',
                        age: 'Alter',
                        ethnicity: 'Herkunft/Ethnie',
                        status: 'Status',
                      };
                      
                      const userRating = assessment.biasStrengthRatings![category];
                      const avgRating = statistics.averageBiasStrengthRatings![category];
                      const maxRating = 5;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{categoryLabels[category]}</span>
                            <div className="flex gap-3 text-xs">
                              <span className="text-primary font-semibold">Du: {userRating}/5</span>
                              <span className="text-muted-foreground">Ø: {avgRating}/5</span>
                            </div>
                          </div>
                          <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden">
                            {/* Average bar (background) */}
                            <div 
                              className="absolute h-full bg-muted-foreground/30 transition-all duration-500"
                              style={{ width: `${(avgRating / maxRating) * 100}%` }}
                            />
                            {/* User bar (foreground) */}
                            <div 
                              className="absolute h-full bg-primary transition-all duration-500"
                              style={{ width: `${(userRating / maxRating) * 100}%` }}
                            />
                            {/* Labels inside bars */}
                            <div className="absolute inset-0 flex items-center justify-between px-2 text-xs pointer-events-none">
                              <span className="text-transparent">0</span>
                              <span className="text-transparent">5</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Basierend auf {statistics.totalParticipants} Teilnehmer{statistics.totalParticipants !== 1 ? 'n' : ''}
                  </div>
                </Card>
              )}
              
              {/* Category Distribution for Tutorial Mode (last 2 tutorials) */}
              {scenario.type === 'tutorial' && statistics.categoryDistribution && Object.keys(statistics.categoryDistribution).length > 0 && (
                <Card className="p-4 bg-muted/30">
                  <div className="text-sm text-muted-foreground mb-3">Was andere Teilnehmer gewählt haben:</div>
                  <div className="space-y-2">
                    {Object.entries(statistics.categoryDistribution).map(([category, count]) => {
                      const percentage = Math.round((count / statistics.totalParticipants) * 100);
                      const categoryLabels: Record<string, string> = {
                        gender: 'Geschlecht',
                        age: 'Alter',
                        ethnicity: 'Herkunft/Ethnie',
                        status: 'Status',
                      };
                      const isUserChoice = assessment.guessedCategory === category;
                      
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isUserChoice ? "font-semibold text-primary" : ""}>
                              {categoryLabels[category] || category}
                              {isUserChoice && " (Du)"}
                            </span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${isUserChoice ? "bg-primary" : "bg-muted-foreground/50"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Basierend auf {statistics.totalParticipants} Teilnehmer{statistics.totalParticipants !== 1 ? 'n' : ''}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Continue Button */}
          <Button 
            onClick={onContinue}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isLastScenario ? "Zum Endergebnis 🏆" : "Nächstes Szenario →"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioSummary;
