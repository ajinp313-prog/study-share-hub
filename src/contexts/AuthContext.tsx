import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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

// Derive the storage key from the project URL to avoid hardcoding
const getStorageKey = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const projectId = url.replace("https://", "").split(".")[0];
  return `sb-${projectId}-auth-token`;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
  const initializedRef = useRef(false);
>>>>>>> f72b69766683dba7af341a9dfaab9dab334d0566

  useEffect(() => {
    let isMounted = true;

<<<<<<< HEAD
    // Set up the auth state listener FIRST so we don't miss events,
    // then immediately load the existing session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Once the listener fires at least once, loading is resolved.
        setLoading(false);
=======
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          initializedRef.current = true;
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to get initial session:", error);
        if (isMounted) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Single subscription — no dependency on initialized state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (isMounted && initializedRef.current) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
>>>>>>> f72b69766683dba7af341a9dfaab9dab334d0566
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
<<<<<<< HEAD
  }, []); // Empty deps — subscribe exactly once for the lifetime of the provider.

  const signOut = async () => {
    // Clear local state first to give instant UI feedback.
=======
  }, []); // stable deps — runs once

  const signOut = async () => {
>>>>>>> f72b69766683dba7af341a9dfaab9dab334d0566
    setSession(null);
    setUser(null);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.warn("Sign out error (session may already be expired):", error);
    }
<<<<<<< HEAD

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
=======
    
    // Fallback: clear auth token using derived key
    localStorage.removeItem(getStorageKey());
>>>>>>> f72b69766683dba7af341a9dfaab9dab334d0566
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
