import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const uploadFile = useCallback(
    async (
      bucket: string,
      filePath: string,
      file: File
    ): Promise<UploadResult> => {
      setState({ progress: 0, uploading: true, error: null });

      try {
        // Get signed upload URL from Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          throw new Error("Not authenticated");
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round(
                (event.loaded / event.total) * 100
              );
              setState((prev) => ({ ...prev, progress: percentComplete }));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setState({ progress: 100, uploading: false, error: null });
              resolve({ filePath, error: null });
            } else {
              const errorMessage = `Upload failed: ${xhr.statusText}`;
              setState({ progress: 0, uploading: false, error: errorMessage });
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener("error", () => {
            const errorMessage = "Network error during upload";
            setState({ progress: 0, uploading: false, error: errorMessage });
            reject(new Error(errorMessage));
          });

          xhr.addEventListener("abort", () => {
            setState({ progress: 0, uploading: false, error: "Upload cancelled" });
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
      } catch (error: any) {
        setState({
          progress: 0,
          uploading: false,
          error: error.message || "Upload failed",
        });
        return { filePath: "", error };
      }
    },
    []
  );

  const resetUpload = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null });
  }, []);

  return {
    ...state,
    uploadFile,
    resetUpload,
  };
};
