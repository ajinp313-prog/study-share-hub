import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "At least 6 characters", test: (p) => p.length >= 6 },
  { label: "Uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Number (0-9)", test: (p) => /[0-9]/.test(p) },
  { label: "Special character (!@#$...)", test: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(p) },
];

const getStrength = (password: string): { level: "weak" | "medium" | "strong"; score: number } => {
  const passedCount = requirements.filter((req) => req.test(password)).length;
  
  if (passedCount <= 2) return { level: "weak", score: passedCount };
  if (passedCount <= 4) return { level: "medium", score: passedCount };
  return { level: "strong", score: passedCount };
};

const strengthConfig = {
  weak: {
    label: "Weak",
    color: "bg-destructive",
    textColor: "text-destructive",
  },
  medium: {
    label: "Medium",
    color: "bg-amber-500",
    textColor: "text-amber-500",
  },
  strong: {
    label: "Strong",
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
  },
};

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { strength, passedRequirements } = useMemo(() => {
    const strength = getStrength(password);
    const passedRequirements = requirements.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
    return { strength, passedRequirements };
  }, [password]);

  if (!password) return null;

  const config = strengthConfig[strength.level];
  const progressWidth = (strength.score / requirements.length) * 100;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn("font-medium", config.textColor)}>{config.label}</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", config.color)}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 gap-1">
        {passedRequirements.map((req) => (
          <div
            key={req.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          >
            {req.passed ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
