/**
 * Feature Flags Configuration
 * 
 * Centralized system for enabling/disabling features in production.
 * Environment variables override default values.
 */

export interface FeatureFlags {
  /** Enable payment processing and tipping functionality */
  enablePayments: boolean;
  /** Enable other future features */
  enableBetaFeatures: boolean;
}

/**
 * Default feature flag values
 * These can be overridden by environment variables
 */
const DEFAULT_FLAGS: FeatureFlags = {
  enablePayments: false, // Disabled by default for safety
  enableBetaFeatures: false,
};

/**
 * Get feature flag value with environment variable override
 */
function getFeatureFlag(flagName: keyof FeatureFlags, defaultValue: boolean): boolean {
  const envVarName = `NEXT_PUBLIC_FEATURE_${flagName.toUpperCase()}`;
  const envValue = process.env[envVarName];
  
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true';
  }
  
  return defaultValue;
}

/**
 * Current feature flags configuration
 * Checks environment variables first, falls back to defaults
 */
export const featureFlags: FeatureFlags = {
  enablePayments: getFeatureFlag('enablePayments', DEFAULT_FLAGS.enablePayments),
  enableBetaFeatures: getFeatureFlag('enableBetaFeatures', DEFAULT_FLAGS.enableBetaFeatures),
};

/**
 * Hook for React components to check feature flags
 */
export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
  return featureFlags[flagName];
}

/**
 * Server-side feature flag check
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  return featureFlags[flagName];
}

/**
 * Development helper to log current feature flags
 */
if (process.env.NODE_ENV === 'development') {
  console.log('🏁 Feature Flags:', featureFlags);
}