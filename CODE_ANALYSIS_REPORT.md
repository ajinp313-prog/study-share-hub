# Study Share Hub - Code Analysis Report

**Date:** February 19, 2026  
**Analyzed by:** Automated Code Review

---

## Overview

This report documents the findings from a comprehensive code analysis of the Study Share Hub project, a study resource sharing platform built with React, TypeScript, Vite, and Supabase.

---

## 🔴 Critical Issues

### 1. Hardcoded Supabase Storage Key in AuthContext

**File:** `src/contexts/AuthContext.tsx` (Line 92)

```typescript
const storageKey = `sb-styrpqafgeexrhlxegkl-auth-token`;
```

**Problem:** Hardcoded project ID in the localStorage key. This will break if the Supabase project changes and exposes internal identifiers.

**Recommended Fix:** Use environment variable or derive from `VITE_SUPABASE_URL`.

---

### 2. Race Condition in AuthContext

**File:** `src/contexts/AuthContext.tsx` (Line 64-72)

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (_event, newSession) => {
    if (isMounted && initialized) {  // Bug: initialized is stale
      setSession(newSession);
      setUser(newSession?.user ?? null);
    }
  }
);
```

**Problem:** The `initialized` variable is captured in the closure but the effect re-runs when `initialized` changes, causing potential duplicate subscriptions.

**Recommended Fix:** Use a ref for `initialized` or restructure the effect.

---

### 3. Inconsistent Points Display

| Location | Points Shown |
|----------|--------------|
| Dashboard.tsx (line 196, 236) | "Share & earn 50 points" |
| NoteUpload.tsx | `POINTS_PER_UPLOAD = 25` |
| PROJECT_OVERVIEW.md | papers=20, notes=25 |

**Problem:** This inconsistency confuses users about the actual reward system.

**Recommended Fix:** Centralize points values in a constants file and use consistently across all components.

---

## 🟠 Performance Issues

### 1. No Pagination on Data Fetching

**Files:** `BrowseNotes.tsx`, `BrowsePapers.tsx`

```typescript
let query = supabase
  .from("notes_public")
  .select("*")  // Fetches all columns
  .order("created_at", { ascending: false });  // No limit!
```

**Impact:** As the database grows, this will become slow and consume excessive bandwidth.

**Recommended Fix:** Add `.limit(20)` and implement infinite scroll or pagination.

---

### 2. Duplicate Subject Data Structures

The `subjectsByLevel` object is duplicated identically in:
- `src/components/BrowseNotes.tsx` (lines 44-164)
- `src/components/NoteUpload.tsx` (lines 30-150)
- `src/components/BrowsePapers.tsx` (similar logic)

**Impact:** 
- Increases bundle size (~3KB duplicated)
- Maintenance burden when updating subjects

**Recommended Fix:** Extract to `src/constants/subjects.ts`.

---

### 3. Multiple Re-renders on Filter Changes

**File:** `src/components/BrowseNotes.tsx` (Line 215-217)

```typescript
useEffect(() => {
  fetchNotes();  // Fetches from DB on every filter change
}, [subjectFilter, levelFilter]);
```

**Problem:** Database fetch on every filter change instead of filtering client-side data.

**Recommended Fix:** Fetch once, then filter with `useMemo` (already done for search, but not for subject/level).

---

### 4. Admin Page Loads All Data at Once

**File:** `src/pages/Admin.tsx` (Lines 138-142)

```typescript
if (data === true) {
  fetchPapers();
  fetchNotes();
  fetchTickets();
}
```

**Problem:** Fetches papers, notes, AND tickets simultaneously without lazy loading.

**Recommended Fix:** Only fetch the active tab's data using conditional loading.

---

## 🟡 Code Quality Issues

### 1. Inconsistent Error Handling

Two different toast patterns are used throughout the codebase:

```typescript
// Pattern 1 - In BrowseNotes.tsx
toast.error("Please sign in to view notes");

// Pattern 2 - In AuthModal.tsx  
toast({ title: "Login failed", description: error.message, variant: "destructive" });
```

**Recommended Fix:** Standardize on one pattern across the entire codebase.

---

### 2. Missing TypeScript Strictness

Uses `any` type in multiple places:

**File:** `src/hooks/useFileUpload.ts` (Line 85)

```typescript
} catch (error: any) {
  setState({
    error: error.message || "Upload failed",
```

**Recommended Fix:** Use proper error typing with type guards or `unknown`.

---

### 3. Unused Variable in AuthContext

**File:** `src/contexts/AuthContext.tsx` (Line 35)

```typescript
const [initialized, setInitialized] = useState(false);
```

The `initialized` state is set but used inconsistently in the auth state listener.

---

### 4. No Input Sanitization Before Database

**File:** `src/components/NoteUpload.tsx` (Line 211)

```typescript
const filePath = `${user.id}/${Date.now()}_${file.name}`;  // file.name not sanitized
```

**Problem:** File uploads accept user-provided filenames without sanitization.

**Recommended Fix:** Sanitize filename to remove special characters.

---

### 5. Missing Loading States Cleanup

**File:** `src/components/BrowsePapers.tsx` (Lines 170-176)

```typescript
toast.success("Download started!");
} catch (error) {
  console.error("Download error:", error);
  toast.error("Failed to download paper");
}

setDownloading(null);  // Should be in finally block
```

**Recommended Fix:** Move state cleanup to `finally` block to ensure it always runs.

---

### 6. Component Size - Admin.tsx

**File:** `src/pages/Admin.tsx`

**Lines:** 1083 lines - significantly too large for a single component.

**Recommended Fix:** Split into smaller components:
- `AdminPapersTab.tsx`
- `AdminNotesTab.tsx`
- `AdminTicketsTab.tsx`
- `AdminStats.tsx`

---

### 7. Missing Dependency in useCallback

**File:** `src/pages/Dashboard.tsx` (Lines 52-96)

```typescript
const fetchUserData = useCallback(async () => {
  // Uses profileChecked but it's not in dependency array
}, [user]);  // Missing profileChecked dependency
```

**Recommended Fix:** Add `profileChecked` to the dependency array.

---

## 🔵 Improvement Suggestions

### 1. Leverage React Query Properly

The project has `@tanstack/react-query` installed but doesn't use it effectively. Replace manual fetching:

```typescript
const { data: notes, isLoading } = useQuery({
  queryKey: ['notes', filters],
  queryFn: () => fetchNotes(filters),
  staleTime: 5 * 60 * 1000,
});
```

---

### 2. Add Error Boundaries

No error boundaries exist. A crash in any component takes down the whole app.

```typescript
// Create src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Implement error boundary logic
}
```

---

### 3. Add Skeleton Loaders

Currently shows only a spinner. Skeleton loaders provide better UX for content-heavy pages.

---

### 4. Add Proper Route Protection

Protected routes rely on redirects inside components instead of a proper wrapper:

```typescript
// Create src/components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;
  return children;
};
```

---

### 5. Extract Business Logic into Custom Hooks

Create dedicated hooks to encapsulate data fetching logic:
- `useNotes()` - notes fetching and filtering
- `usePapers()` - papers fetching and filtering  
- `useDownload()` - download logic with tracking
- `useAdmin()` - admin-specific data management

---

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| Critical Issues | 3 | High |
| Performance Issues | 4 | Medium-High |
| Code Quality Issues | 7 | Medium |
| Improvement Suggestions | 5 | Low |

---

## Priority Action Items

1. **Immediate:** Fix the hardcoded Supabase key
2. **Short-term:** Add pagination to prevent future scaling issues
3. **Short-term:** Extract duplicate data structures to constants
4. **Medium-term:** Split the Admin component into smaller pieces
5. **Medium-term:** Standardize error handling patterns
6. **Long-term:** Implement React Query for all data fetching

---

## Files Analyzed

- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useFileUpload.ts`
- `src/hooks/useSignedUrl.ts`
- `src/components/BrowseNotes.tsx`
- `src/components/BrowsePapers.tsx`
- `src/components/NoteUpload.tsx`
- `src/components/Header.tsx`
- `src/components/AuthModal.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Admin.tsx`
- `src/integrations/supabase/client.ts`
- `src/lib/signedFile.ts`
- `supabase/functions/get-signed-url/index.ts`
- `package.json`
- `PROJECT_OVERVIEW.md`
