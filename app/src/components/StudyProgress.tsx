import { Progress } from "@/components/ui/progress";

interface StudyProgressProps {
  current: number;
  total: number;
}

const StudyProgress = ({ current, total }: StudyProgressProps) => {
  const percentage = (current / total) * 100;

  return (
    <div className="bg-card border-b shadow-md">
      <div className="container max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Szenario {current} von {total}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(percentage)}% abgeschlossen
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    </div>
  );
};

export default StudyProgress;
