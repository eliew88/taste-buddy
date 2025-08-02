import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserWithPrivacy } from '@/lib/privacy-utils';

/**
 * GET /api/users/tastebuddies
 * Fetch the current user's TasteBuddies (mutual follows)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get users that the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true }
    });
    
    const followingIds = following.map(f => f.followingId);

    // Get users that follow the current user AND whom the current user follows (mutual follows)
    const tasteBuddyUsers = await prisma.user.findMany({
      where: {
        id: { in: followingIds },
        following: {
          some: {
            followingId: session.user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Apply privacy settings to each TasteBuddy
    const tastebuddies = await Promise.all(
      tasteBuddyUsers.map(async (user) => {
        return await getUserWithPrivacy(user.id, session.user.id);
      })
    );

    return NextResponse.json({
      success: true,
      data: tastebuddies
    });
  } catch (error) {
    console.error('Error fetching tastebuddies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tastebuddies' },
      { status: 500 }
    );
  }
}