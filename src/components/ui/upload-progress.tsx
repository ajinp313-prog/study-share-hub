import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  progress: number;
  isVisible: boolean;
  className?: string;
}

export const UploadProgress = ({
  progress,
  isVisible,
  className,
}: UploadProgressProps) => {
  if (!isVisible) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Uploading...</span>
        <span className="font-medium text-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
