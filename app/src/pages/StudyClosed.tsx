import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudyClosed = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "alex") {
      setIsAuthenticated(true);
      setError(false);
      // Navigate to introduction after a short delay
      setTimeout(() => {
        navigate("/intro");
      }, 500);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isAuthenticated) {
    return null; // Will navigate away
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-3 py-4 md:p-4 md:py-10">
      <div className="container max-w-2xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700 w-full">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-4 mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
            Studie beendet
          </h1>
          <p className="text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Universität Münster - Institut für Wirtschaftsinformatik - Bachelorarbeit
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-4 md:p-8 space-y-4 md:space-y-6 shadow-md bg-card">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
            </div>
            <h2 className="text-base md:text-2xl font-semibold text-foreground text-center">
              Die Studie ist abgeschlossen
            </h2>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed text-center">
              Vielen Dank für Ihr Interesse an unserer Studie. Die Datenerfassung wurde beendet 
              und eine weitere Teilnahme ist nicht mehr möglich.
            </p>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed text-center">
              Falls Sie Fragen haben oder weitere Informationen benötigen, können Sie sich gerne 
              an uns wenden.
            </p>
          </div>

          {/* Password Form */}
          <div className="pt-4 border-t">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Passwort (nur für Administratoren)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  placeholder="Passwort eingeben"
                  className={error ? "border-destructive" : ""}
                />
                {error && (
                  <p className="text-sm text-destructive">
                    Falsches Passwort. Bitte versuchen Sie es erneut.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="outline"
              >
                Zugriff anfordern
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-muted/50 p-3 md:p-4 rounded-lg">
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Kontakt:</strong> alexander.guennewig@uni-muenster.de
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudyClosed;

