import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
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
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // stable deps — runs once

  const signOut = async () => {
    setSession(null);
    setUser(null);
    
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn("Sign out error (session may already be expired):", error);
    }
    
    // Fallback: clear auth token using derived key
    localStorage.removeItem(getStorageKey());
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
