import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Scenario, BiasCategory, BiasStrengthRatings } from "@/types/study";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AssessmentFormProps {
  scenario: Scenario;
  onSubmit: (assessment: {
    isBiased: boolean;
    guessedCategory?: BiasCategory;
    biasStrengthRatings?: BiasStrengthRatings;
    confidence: number;
    reasoning: string;
  }) => void;
}

const BIAS_CATEGORIES: { value: BiasCategory; label: string }[] = [
  { value: 'gender', label: 'Geschlecht (Gender Bias)' },
  { value: 'age', label: 'Alter (Age Bias)' },
  { value: 'ethnicity', label: 'Herkunft/Ethnie (Ethnicity Bias)' },
  { value: 'status', label: 'Sozioökonomischer Status (Status Bias)' },
];

const AssessmentForm = ({ scenario, onSubmit }: AssessmentFormProps) => {
  const [isBiased, setIsBiased] = useState<boolean | null>(null);
  const [guessedCategory, setGuessedCategory] = useState<BiasCategory | null>(null);
  const [biasStrengthRatings, setBiasStrengthRatings] = useState<BiasStrengthRatings>({
    gender: 0,
    age: 0,
    ethnicity: 0,
    status: 0,
  });
  const [confidence, setConfidence] = useState<number>(3);
  const [reasoning, setReasoning] = useState("");

  // Check if this is one of the last two tutorials
  const isLastTwoTutorials = ['age-biased-1', 'ethnicity-biased-1'].includes(scenario.id);

  const handleSubmit = () => {
    if (isBiased === null || !reasoning.trim()) return;
    
    // Check if category is required but missing (for last 2 tutorials)
    if (isLastTwoTutorials && isBiased && !guessedCategory) return;
    
    // Check if at least one rating > 0 for exploration scenarios
    if (scenario.type === 'exploration' && isBiased) {
      const hasRating = Object.values(biasStrengthRatings).some(v => v > 0);
      if (!hasRating) return;
    }

    onSubmit({
      isBiased,
      guessedCategory: guessedCategory ?? undefined,
      biasStrengthRatings: scenario.type === 'exploration' && isBiased ? biasStrengthRatings : undefined,
      confidence,
      reasoning: reasoning.trim(),
    });
  };

  const isValid = 
    isBiased !== null && 
    reasoning.trim().length > 0 &&
    // For last 2 tutorials: category required if biased
    (!isLastTwoTutorials || !isBiased || guessedCategory !== null) &&
    // For exploration: at least one rating > 0 if biased
    (scenario.type !== 'exploration' || !isBiased || Object.values(biasStrengthRatings).some(v => v > 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      <Card className="p-4 md:p-6 shadow-md">
        <h2 className="text-base md:text-2xl font-semibold text-foreground mb-4">
          Bewertung: {scenario.title}
        </h2>
        
        <div className="space-y-6">
          
          <div className="space-y-3">
            <Label className="text-base font-medium">
              War die KI-Antwort verzerrt (biased)?
            </Label>
            <RadioGroup
              value={isBiased === null ? undefined : isBiased.toString()}
              onValueChange={(value) => {
                const newVal = value === 'true';
                setIsBiased(newVal);
                if (!newVal) setGuessedCategory(null);
              }}
            >
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isBiased === true
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem 
                  value="true" 
                  id="biased-yes" 
                  className={isBiased === true ? "border-primary data-[state=checked]:border-primary" : ""}
                />
                <Label htmlFor="biased-yes" className={`cursor-pointer flex-1 ${isBiased === true ? "font-semibold text-primary" : ""}`}>
                  Ja, die Antworten waren verzerrt
                </Label>
              </div>
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isBiased === false
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem 
                  value="false" 
                  id="biased-no"
                  className={isBiased === false ? "border-primary data-[state=checked]:border-primary" : ""}
                />
                <Label htmlFor="biased-no" className={`cursor-pointer flex-1 ${isBiased === false ? "font-semibold text-primary" : ""}`}>
                  Nein, die Antworten waren neutral/fair
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Kategorie Auswahl - nur bei letzten 2 Tutorials */}
          {isLastTwoTutorials && isBiased && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-base font-medium">
                Welche Art von Verzerrung haben Sie erkannt?
              </Label>
              <Select
                value={guessedCategory ?? undefined}
                onValueChange={(val) => setGuessedCategory(val as BiasCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Bitte wählen Sie eine Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  {BIAS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bias Stärke Bewertung - nur bei Exploration */}
          {scenario.type === 'exploration' && isBiased && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-base font-medium">
                Wie stark ist die Verzerrung in den folgenden Kategorien? (0 = nicht vorhanden, 5 = sehr stark)
              </Label>
              
              {BIAS_CATEGORIES.map((cat) => (
                <div key={cat.value} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">{cat.label}</Label>
                    <span className="text-sm font-semibold">{biasStrengthRatings[cat.value]}/5</span>
                  </div>
                  <Slider
                    value={[biasStrengthRatings[cat.value]]}
                    onValueChange={([value]) => 
                      setBiasStrengthRatings(prev => ({ ...prev, [cat.value]: value }))
                    }
                    min={0}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
              
              <p className="text-xs text-muted-foreground">
                Bewerten Sie jede Kategorie einzeln. Mindestens eine Kategorie muss über 0 bewertet werden.
              </p>
            </div>
          )}

          
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Wie sicher sind Sie sich? ({confidence}/5)
            </Label>
            <div className="pt-2">
              <Slider
                value={[confidence]}
                onValueChange={([value]) => setConfidence(value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Unsicher</span>
                <span>Sehr sicher</span>
              </div>
            </div>
          </div>

          
          <div className="space-y-3">
            <Label htmlFor="reasoning" className="text-base font-medium">
              Begründung Ihrer Einschätzung
            </Label>
            <Textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Beschreiben Sie, warum Sie zu dieser Einschätzung gekommen sind. Welche Aspekte der KI-Antworten haben Sie beachtet? Welche Strategien haben Sie verwendet?"
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mindestens ein paar Wörter erforderlich
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full"
            size="lg"
          >
            Bewertung abschicken
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AssessmentForm;
