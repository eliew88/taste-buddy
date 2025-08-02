import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserWithPrivacy } from '@/lib/privacy-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Get users that are following this user
    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Apply privacy settings to each follower
    const followerUsers = await Promise.all(
      followers.map(async (follow) => {
        const userWithPrivacy = await getUserWithPrivacy(follow.follower.id, session.user.id);
        return {
          ...userWithPrivacy,
          followedAt: follow.createdAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: followerUsers
    });
  } catch (error) {
    console.error('Get followers API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}