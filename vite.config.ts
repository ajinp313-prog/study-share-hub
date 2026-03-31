import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // ── Security headers ───────────────────────────────────────────────────
    // These apply during development so every local test runs with the same
    // headers that should be configured on the production host (Vercel/Netlify).
    // For production, add these in your hosting provider's config file.
    headers: {
      // Deny embedding in iframes (clickjacking protection).
      "X-Frame-Options": "DENY",
      // Prevent MIME-type sniffing.
      "X-Content-Type-Options": "nosniff",
      // Only send origin in the Referer header when navigating to HTTPS.
      "Referrer-Policy": "strict-origin-when-cross-origin",
      // Restrict powerful browser features.
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      // Basic Content-Security-Policy.
      // Update the connect-src directive to match your Supabase project URL.
      "Content-Security-Policy": [
        "default-src 'self'",
        // React + Vite HMR need 'unsafe-eval' in dev; remove in prod.
        mode === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        // Allow connections to Supabase and Google OAuth.
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
