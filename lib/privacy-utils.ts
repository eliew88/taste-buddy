/**
 * Privacy Utility Functions
 * 
 * Helper functions for handling user privacy settings
 */

import { EmailVisibility } from '@/types/privacy';
import { prisma } from '@/lib/db';

export interface EmailVisibilityCheck {
  profileUserId: string;
  viewerUserId?: string | null;
  emailVisibility: EmailVisibility;
}

/**
 * Determines if a user's email should be visible to another user
 */
export async function shouldShowEmail({
  profileUserId,
  viewerUserId,
  emailVisibility
}: EmailVisibilityCheck): Promise<boolean> {
  // If no viewer (anonymous), only show if public
  if (!viewerUserId) {
    return emailVisibility === 'PUBLIC';
  }

  // If viewing own profile, always show
  if (profileUserId === viewerUserId) {
    return true;
  }

  // Check visibility setting
  switch (emailVisibility) {
    case 'HIDDEN':
      return false;
    
    case 'PUBLIC':
      return true;
    
    case 'FOLLOWING_ONLY':
      // Check if the profile owner follows the viewer
      const followRelation = await prisma.follow.findFirst({
        where: {
          followerId: profileUserId, // Profile owner
          followingId: viewerUserId,  // Person viewing the profile
        },
      });
      return !!followRelation;
    
    default:
      return false;
  }
}

/**
 * Get user data with email visibility applied
 */
export async function getUserWithPrivacy(
  userId: string,
  viewerUserId?: string | null
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
      instagramUrl: true,
      websiteUrl: true,
      emailVisibility: true,
      paymentAccount: {
        select: {
          accountStatus: true,
          onboardingComplete: true,
          payoutsEnabled: true,
          acceptsTips: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  // Check if email should be visible
  const emailVisible = await shouldShowEmail({
    profileUserId: user.id,
    viewerUserId,
    emailVisibility: user.emailVisibility
  });

  // Return user data with email conditionally included
  return {
    ...user,
    email: emailVisible ? user.email : null,
    emailVisibility: undefined, // Don't expose the setting to other users
  };
}