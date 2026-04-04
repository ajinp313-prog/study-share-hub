import { useState, useEffect, useRef } from "react";
import { FileText, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFFilePreviewProps {
  file: File;
}

// Load PDF.js from CDN (shared singleton — same as PDFPreviewModal)
let pdfjsPromise: Promise<any> | null = null;
function loadPdfJs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
          resolve(pdfjs);
        } else {
          reject(new Error("PDF.js failed to load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js"));
      document.head.appendChild(script);
    });
  }
  return pdfjsPromise;
}

export const PDFFilePreview = ({ file }: PDFFilePreviewProps) => {
  const [showPreview, setShowPreview] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showPreview) return;
    let cancelled = false;

    (async () => {
      try {
        setPreviewError(false);
        const [pdfjs] = await Promise.all([loadPdfJs()]);
        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;

        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        const page = await pdfDoc.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 0.6 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch {
        if (!cancelled) setPreviewError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, showPreview]);

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

      {showPreview && (
        <div className="rounded-md border border-border overflow-hidden bg-muted/30 flex items-center justify-center min-h-[120px]">
          {previewError ? (
            <p className="text-xs text-muted-foreground p-4">
              Preview unavailable
            </p>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full"
              style={{ display: "block", margin: "0 auto" }}
            />
          )}
        </div>
      )}
    </div>
  );
};

