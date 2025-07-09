import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: any = null;
  
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Get follow counts and current user's follow status
    const [followingCount, followersCount, isFollowing] = await Promise.all([
      prisma.follow.count({
        where: { followerId: userId }
      }),
      prisma.follow.count({
        where: { followingId: userId }
      }),
      session.user.id !== userId ? prisma.follow.findFirst({
        where: {
          followerId: session.user.id,
          followingId: userId
        }
      }) : null
    ]);

    return NextResponse.json({
      success: true,
      data: {
        followingCount,
        followersCount,
        isFollowing: !!isFollowing,
        canFollow: session.user.id !== userId
      }
    });
  } catch (error) {
    console.error('Get follow status API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: await params.then(p => p.id).catch(() => 'unknown'),
      sessionUserId: session?.user?.id || 'unauthenticated'
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}