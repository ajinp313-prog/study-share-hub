import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, X } from "lucide-react";

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  title: string;
  onDownload?: () => void;
}

const PDFPreviewModal = ({
  open,
  onOpenChange,
  signedUrl,
  title,
  onDownload,
}: PDFPreviewModalProps) => {
  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !signedUrl) {
      // Cleanup blob URL when modal closes
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    (async () => {
      try {
        const resp = await fetch(signedUrl);
        if (!resp.ok) throw new Error(`Failed to load PDF (${resp.status})`);
        const blob = await resp.blob();
        // Force correct MIME type for inline display
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        blobUrlRef.current = url;
        setBlobUrl(url);
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
  }, [open, signedUrl]);

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

        <div className="flex-1 overflow-hidden bg-muted/50">
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

          {blobUrl && (
            <embed
              src={`${blobUrl}#view=FitH`}
              type="application/pdf"
              className="w-full h-full"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewModal;
