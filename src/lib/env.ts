/**
 * Environment variable validation
 * Validates required environment variables on app startup
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

function validateEnv(): EnvConfig {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ] as const;

  const missing: string[] = [];
  const env: Partial<EnvConfig> = {};

  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    if (!value || value === 'undefined' || value === '') {
      missing.push(varName);
    } else {
      env[varName] = value;
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`;
    console.error('🚨 Environment Configuration Error:', errorMessage);
    
    // In development, throw to make the error visible
    if (import.meta.env.DEV) {
      throw new Error(errorMessage);
    }
  }

  return env as EnvConfig;
}

export const env = validateEnv();
