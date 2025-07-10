/**
 * Privacy Settings Types
 * 
 * TypeScript types for user privacy controls
 */

export type EmailVisibility = 'HIDDEN' | 'FOLLOWING_ONLY' | 'PUBLIC';

export interface PrivacySettings {
  emailVisibility: EmailVisibility;
}

export interface UserPrivacyData {
  id: string;
  email: string;
  name: string | null;
  emailVisibility: EmailVisibility;
  // Add other privacy-related fields as needed
}

export const EMAIL_VISIBILITY_OPTIONS = [
  {
    value: 'HIDDEN' as const,
    label: 'Hidden',
    description: 'Your email will not be visible to anyone'
  },
  {
    value: 'FOLLOWING_ONLY' as const,
    label: 'People I Follow',
    description: 'Only people you follow can see your email'
  },
  {
    value: 'PUBLIC' as const,
    label: 'Everyone',
    description: 'Anyone can see your email on your profile'
  }
] as const;