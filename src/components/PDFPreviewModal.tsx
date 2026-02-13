import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  title: string;
  onDownload?: () => void;
}

// Load PDF.js from CDN once
let pdfjsPromise: Promise<any> | null = null;
function loadPdfJs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js";
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
          pdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";
          resolve(pdfjs);
        } else {
          reject(new Error("PDF.js failed to load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js script"));
      document.head.appendChild(script);
    });
  }
  return pdfjsPromise;
}

const PDFPreviewModal = ({
  open,
  onOpenChange,
  signedUrl,
  title,
  onDownload,
}: PDFPreviewModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.5);
  const [numPages, setNumPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const blobUrlRef = useRef<string | null>(null);

  const renderPages = useCallback(async (pdfDoc: any, renderScale: number) => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing canvases
    container.innerHTML = "";

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: renderScale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = "block";
      canvas.style.margin = "0 auto 16px auto";
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";

      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }

      container.appendChild(canvas);
    }
  }, []);

  useEffect(() => {
    if (!open || !signedUrl) {
      // Cleanup
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      pdfDocRef.current = null;
      setError(null);
      setNumPages(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [pdfjs, resp] = await Promise.all([
          loadPdfJs(),
          fetch(signedUrl),
        ]);

        if (cancelled) return;
        if (!resp.ok) throw new Error(`Failed to load PDF (${resp.status})`);

        const blob = await resp.blob();
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);

        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        blobUrlRef.current = url;

        const loadingTask = pdfjs.getDocument(url);
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);

        await renderPages(pdfDoc, scale);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load PDF");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, signedUrl]);

  // Re-render when scale changes
  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderPages(pdfDocRef.current, scale);
    }
  }, [scale, renderPages, loading]);

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base sm:text-lg truncate pr-4">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              PDF preview of the selected document
            </DialogDescription>
            <div className="flex items-center gap-2 flex-shrink-0">
              {numPages > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              {signedUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="hidden sm:flex gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                  {onDownload && (
                    <Button
                      size="sm"
                      onClick={onDownload}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/50 p-4">
          {loading && !error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-destructive mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                  Open in New Tab instead
                </Button>
              </div>
            </div>
          )}

          <div ref={containerRef} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
