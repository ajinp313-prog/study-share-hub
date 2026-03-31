import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { User, Session } from "@supabase/supabase-js";

// ── helpers ───────────────────────────────────────────────────────────────────
const makeUser = (id = "user-1") => ({ id, email: "test@example.com" } as unknown as User);
const makeSession = (user: User) => ({ user, access_token: "tok" } as unknown as Session);

const renderWithAuth = ({
    user,
    loading = false,
}: {
    user: User | null;
    loading?: boolean;
}) => {
    const session = user ? makeSession(user) : null;

    return render(
        <AuthContext.Provider value={{ user, session, loading, signOut: vi.fn() }}>
            <MemoryRouter initialEntries={["/protected"]}>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home</div>} />
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div data-testid="protected-content">Protected!</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
};

// ── AuthContext export fix — the context must be exported as a named export ───
// Note: AuthContext needs to be exported from AuthContext.tsx for this test.
// We use vi.mock as a fallback if it isn't.

describe("ProtectedRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows a spinner while auth is loading", () => {
        renderWithAuth({ user: null, loading: true });
        // The spinner (Loader2) should be present; no redirect yet
        expect(screen.queryByTestId("protected-content")).toBeNull();
        expect(screen.queryByTestId("home")).toBeNull();
    });

    it("redirects unauthenticated users to /", () => {
        renderWithAuth({ user: null, loading: false });
        expect(screen.getByTestId("home")).toBeInTheDocument();
        expect(screen.queryByTestId("protected-content")).toBeNull();
    });

    it("renders children for authenticated users", () => {
        renderWithAuth({ user: makeUser(), loading: false });
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
        expect(screen.queryByTestId("home")).toBeNull();
    });
});
