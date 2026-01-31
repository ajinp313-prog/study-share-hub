import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SignedUrlParams {
  bucket: "papers" | "notes";
  filePath: string;
  itemId: string;
}

interface SignedUrlResult {
  signedUrl: string | null;
  error: string | null;
  loading: boolean;
}

export const useSignedUrl = () => {
  const [loading, setLoading] = useState(false);

  const getSignedUrl = useCallback(async (params: SignedUrlParams): Promise<SignedUrlResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-signed-url", {
        body: params,
      });

      if (error) {
        console.error("Error getting signed URL:", error);
        return { signedUrl: null, error: error.message, loading: false };
      }

      if (data?.error) {
        return { signedUrl: null, error: data.error, loading: false };
      }

      return { signedUrl: data.signedUrl, error: null, loading: false };
    } catch (err) {
      console.error("Unexpected error getting signed URL:", err);
      return { signedUrl: null, error: "Failed to get download URL", loading: false };
    } finally {
      setLoading(false);
    }
  }, []);

  return { getSignedUrl, loading };
};
