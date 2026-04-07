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
      const { bucket, filePath, itemId } = params;

      // Get the current session token to pass to the Edge Function
      const { data: { session } } = await supabase.auth.getSession();

      // Call the Edge Function which uses the service role key to create signed URLs
      // (the anon key cannot create signed URLs for private buckets)
      const { data, error } = await supabase.functions.invoke("get-signed-url", {
        body: { bucket, filePath, itemId },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });

      if (error) {
        console.error("Edge Function error:", error);
        return { signedUrl: null, error: "Failed to get download URL", loading: false };
      }

      if (data?.error) {
        return { signedUrl: null, error: data.error, loading: false };
      }

      if (!data?.signedUrl) {
        return { signedUrl: null, error: "Failed to get download URL", loading: false };
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


