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

      // Check if the item exists and if the user is the owner or it is approved
      const tableName = bucket === "papers" ? "papers" : "notes";
      const { data: item, error: dbError } = await supabase
        .from(tableName)
        .select("id, status, user_id")
        .eq("id", itemId)
        .single();

      if (dbError || !item) {
        return { signedUrl: null, error: "Item not found", loading: false };
      }

      const { data: { user } } = await supabase.auth.getUser();
      const isOwner = user && item.user_id === user.id;
      const isApproved = item.status === "approved";

      if (!isApproved && !isOwner) {
        return { signedUrl: null, error: "This file is pending approval and cannot be previewed yet", loading: false };
      }

      // Generate signed URL directly via Supabase Storage (1 hour expiry)
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (error || !data?.signedUrl) {
        console.error("Error getting signed URL:", error);
        return { signedUrl: null, error: error?.message ?? "Failed to get download URL", loading: false };
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
