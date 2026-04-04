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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

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
        console.warn("Failed to get initial session:", error);
        if (isMounted) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth state changes AFTER getting the initial session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (isMounted && initializedRef.current) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Runs once for the lifetime of the provider.

  const signOut = async () => {
    // Clear local state first to give instant UI feedback.
    setSession(null);
    setUser(null);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.warn("Sign out error (session may already be expired):", error);
    }

    // Derive the storage key from the project URL to avoid hardcoding IDs.
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      localStorage.removeItem(storageKey);
    } catch {
      // Fallback: clear all known Supabase session keys.
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
