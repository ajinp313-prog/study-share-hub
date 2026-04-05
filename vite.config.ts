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
        mode === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net" : "script-src 'self' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        // Allow connections to Supabase (storage + auth), Google OAuth, and blob: URLs (PDF.js uses them internally).
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com blob:",
        // Allow blob: frames so PDFFilePreview iframe and PDF.js can render.
        "frame-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
          ],
          "vendor-misc": ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
