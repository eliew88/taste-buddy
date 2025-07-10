import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNewFollowerNotification } from '@/lib/notification-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or action' },
        { status: 400 }
      );
    }

    if (action !== 'follow' && action !== 'unfollow') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "follow" or "unfollow"' },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists and get current user info
    const [targetUser, currentUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true }
      })
    ]);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Current user not found' },
        { status: 404 }
      );
    }

    if (action === 'follow') {
      // Create follow relationship
      const follow = await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId
          }
        },
        update: {}, // Do nothing if already following
        create: {
          followerId: session.user.id,
          followingId: userId
        }
      });

      // Create notification for new follower
      const followerName = currentUser.name || currentUser.email;
      try {
        await createNewFollowerNotification(
          session.user.id,
          userId,
          followerName
        );
      } catch (error) {
        console.error('Failed to create follow notification:', error);
        // Don't fail the follow action if notification fails
      }
    } else {
      // Remove follow relationship
      await prisma.follow.deleteMany({
        where: {
          followerId: session.user.id,
          followingId: userId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}