import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";

// ─── Per-session upload rate limiter ────────────────────────────────────────
// Tracks how many uploads have been initiated in the current browser session.
// This resets on page reload, which is intentional — it prevents scripted
// bulk-upload abuse without penalising normal users who reload between uploads.
let sessionUploadCount = 0;
const SESSION_UPLOAD_LIMIT = 10;

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
}

interface UploadResult {
  filePath: string;
  error: Error | null;
}

export const useFileUpload = () => {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
  });

  // Keep a ref to the active XHR so we can abort it on unmount or cancellation.
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const uploadFile = useCallback(
    async (
      bucket: string,
      filePath: string,
      file: File
    ): Promise<UploadResult> => {
      // ── Session upload rate limit ──────────────────────────────────────────
      if (sessionUploadCount >= SESSION_UPLOAD_LIMIT) {
        const limitMessage =
          "Upload limit reached for this session. Please reload the page to continue.";
        setState({ progress: 0, uploading: false, error: limitMessage });
        return { filePath: "", error: new Error(limitMessage) };
      }

      setState({ progress: 0, uploading: true, error: null });

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          throw new Error("Not authenticated");
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

        return new Promise((resolve, reject) => {
          // Abort any previous in-flight upload before starting a new one.
          if (xhrRef.current) {
            xhrRef.current.abort();
          }

          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          let isCancelled = false;

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && !isCancelled) {
              const percentComplete = Math.round(
                (event.loaded / event.total) * 100
              );
              setState((prev) => ({ ...prev, progress: percentComplete }));
            }
          });

          xhr.addEventListener("load", () => {
            xhrRef.current = null;
            if (isCancelled) return;

            if (xhr.status >= 200 && xhr.status < 300) {
              // Increment session counter only on successful upload.
              sessionUploadCount += 1;
              setState({ progress: 100, uploading: false, error: null });
              resolve({ filePath, error: null });
            } else {
              const errorMessage = `Upload failed: ${xhr.statusText || xhr.status}`;
              setState({ progress: 0, uploading: false, error: errorMessage });
              logger.error("File upload HTTP error", xhr.status, xhr.statusText);
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener("error", () => {
            xhrRef.current = null;
            if (isCancelled) return;
            const errorMessage = "Network error during upload";
            setState({ progress: 0, uploading: false, error: errorMessage });
            logger.error("File upload network error");
            reject(new Error(errorMessage));
          });

          xhr.addEventListener("abort", () => {
            xhrRef.current = null;
            isCancelled = true;
            setState({ progress: 0, uploading: false, error: null });
            reject(new Error("Upload cancelled"));
          });

          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          xhr.setRequestHeader(
            "apikey",
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
          );
          xhr.setRequestHeader("x-upsert", "false");
          xhr.send(file);
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        logger.error("File upload exception", error);
        setState({
          progress: 0,
          uploading: false,
          error: message,
        });
        return { filePath: "", error: error instanceof Error ? error : new Error(message) };
      }
    },
    []
  );

  const resetUpload = useCallback(() => {
    // Abort any in-flight XHR when the form is reset/cancelled.
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setState({ progress: 0, uploading: false, error: null });
  }, []);

  return {
    ...state,
    uploadFile,
    resetUpload,
  };
};
