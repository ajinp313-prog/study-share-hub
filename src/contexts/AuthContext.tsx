import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Set up the auth state listener FIRST so we don't miss events,
    // then immediately load the existing session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Once the listener fires at least once, loading is resolved.
        setLoading(false);
      }
    );

    // Trigger an immediate session load. The onAuthStateChange callback
    // above will receive the INITIAL_SESSION event and resolve loading.
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error("Failed to get initial session:", error);
        setLoading(false);
        return;
      }
      // If onAuthStateChange hasn't fired yet, apply the session now so the
      // UI doesn't flash unauthenticated for users with an existing session.
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty deps — subscribe exactly once for the lifetime of the provider.

  const signOut = async () => {
    // Clear local state first to give instant UI feedback.
    setSession(null);
    setUser(null);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.warn("Sign out error (session may already be expired):", error);
    }

    // Derive the storage key from the configured URL to avoid hardcoding project IDs.
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      localStorage.removeItem(storageKey);
    } catch {
      // If URL parsing fails, fall back to clearing all sb- prefixed keys.
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => localStorage.removeItem(k));
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
