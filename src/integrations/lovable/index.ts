// Supabase OAuth wrapper — replaces the Lovable-managed cloud auth.
// Google sign-in now routes through your own Supabase project directly.

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

type OAuthResult =
  | { redirected: true; error?: never }
  | { redirected: false; error: Error }
  | { redirected: false; error?: never };

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: SignInOptions
    ): Promise<OAuthResult> => {
      const redirectTo = opts?.redirect_uri ?? window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { redirected: false, error };
      }

      // Supabase handles the browser redirect internally — tell the caller
      // the page is redirecting so it doesn't try to do anything else.
      return { redirected: true };
    },
  },
};
