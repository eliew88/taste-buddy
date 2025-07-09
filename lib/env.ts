/**
 * Environment variable validation and defaults
 * Ensures required variables are available during build and runtime
 */

export function getRequiredEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  
  if (!value) {
    if (fallback) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Warning: ${name} not found, using fallback value`);
      }
      return fallback;
    }
    
    // During build time on Vercel, be more lenient
    if (process.env.VERCEL || process.env.CI || process.env.GITHUB_ACTIONS) {
      console.warn(`Warning: ${name} not found in build environment, using empty string`);
      return '';
    }
    
    // In production runtime (not build), require the variable
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    
    console.warn(`Warning: ${name} not found, using empty string`);
    return '';
  }
  
  return value;
}

export const env = {
  DATABASE_URL: getRequiredEnvVar('DATABASE_URL', 'postgresql://user:password@localhost:5432/placeholder'),
  NEXTAUTH_SECRET: getRequiredEnvVar('NEXTAUTH_SECRET', 'fallback-secret-for-build'),
  NEXTAUTH_URL: getRequiredEnvVar('NEXTAUTH_URL', 'http://localhost:3002'),
  NODE_ENV: process.env.NODE_ENV || 'development',
};