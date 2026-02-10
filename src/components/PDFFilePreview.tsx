import { useState, useEffect } from "react";
import { FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFFilePreviewProps {
  file: File;
}

export const PDFFilePreview = ({ file }: PDFFilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? (
            <>
              <EyeOff className="mr-1 h-3 w-3" />
              Hide
            </>
          ) : (
            <>
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </>
          )}
        </Button>
      </div>
      {showPreview && previewUrl && (
        <div className="rounded-md border border-border overflow-hidden bg-muted/30">
          <iframe
            src={previewUrl}
            className="w-full h-48"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
};
