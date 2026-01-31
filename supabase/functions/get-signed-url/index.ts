import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignedUrlRequest {
  bucket: "papers" | "notes";
  filePath: string;
  itemId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bucket, filePath, itemId } = (await req.json()) as SignedUrlRequest;

    console.log(`[get-signed-url] Request for bucket: ${bucket}, itemId: ${itemId}`);

    // Validate input
    if (!bucket || !filePath || !itemId) {
      console.error("[get-signed-url] Missing required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: bucket, filePath, itemId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (bucket !== "papers" && bucket !== "notes") {
      console.error("[get-signed-url] Invalid bucket:", bucket);
      return new Response(
        JSON.stringify({ error: "Invalid bucket. Must be 'papers' or 'notes'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role to check approval status
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if the item is approved in the database
    const tableName = bucket === "papers" ? "papers" : "notes";
    const { data: item, error: dbError } = await supabaseAdmin
      .from(tableName)
      .select("id, status, user_id, file_path")
      .eq("id", itemId)
      .single();

    if (dbError || !item) {
      console.error("[get-signed-url] Item not found:", dbError);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify file path matches
    if (item.file_path !== filePath) {
      console.error("[get-signed-url] File path mismatch");
      return new Response(
        JSON.stringify({ error: "File path mismatch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check approval status - only approved items can be accessed publicly
    // Or the owner can access their own files
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabaseAdmin.auth.getUser(token);
      userId = claimsData?.user?.id || null;
    }

    const isOwner = userId && item.user_id === userId;
    const isApproved = item.status === "approved";

    if (!isApproved && !isOwner) {
      console.error("[get-signed-url] Access denied - not approved and not owner");
      return new Response(
        JSON.stringify({ error: "This file is not available for public access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[get-signed-url] Access granted - isApproved: ${isApproved}, isOwner: ${isOwner}`);

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error("[get-signed-url] Failed to create signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to generate download URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[get-signed-url] Signed URL generated successfully");

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[get-signed-url] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
