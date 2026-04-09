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

      // Check item exists and user has access (owner or approved)
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
        return { signedUrl: null, error: "This file is pending approval", loading: false };
      }

      // Use public URL directly — bucket is public, so this is always reliable.
      // Access control is enforced above via DB check (approved or owner).
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        return { signedUrl: null, error: "Failed to get file URL", loading: false };
      }

      return { signedUrl: data.publicUrl, error: null, loading: false };
    } catch (err) {
      console.error("Unexpected error getting file URL:", err);
      return { signedUrl: null, error: "Failed to get file URL", loading: false };
    } finally {
      setLoading(false);
    }
  }, []);

  return { getSignedUrl, loading };
};
