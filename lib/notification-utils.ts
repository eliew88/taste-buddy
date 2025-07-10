import { NotificationType } from '@prisma/client';

/**
 * Utility function to create notifications
 * This function makes an internal API call to create notifications
 */
export async function createNotification({
  type,
  title,
  message,
  userId,
  fromUserId,
  relatedRecipeId,
  relatedCommentId,
  relatedComplimentId,
  relatedUserId,
}: {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  fromUserId?: string;
  relatedRecipeId?: string;
  relatedCommentId?: string;
  relatedComplimentId?: string;
  relatedUserId?: string;
}) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title,
        message,
        userId,
        fromUserId,
        relatedRecipeId,
        relatedCommentId,
        relatedComplimentId,
        relatedUserId,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('Failed to create notification:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Helper functions to create specific types of notifications
 */

export async function createNewFollowerNotification(
  followerId: string,
  followingId: string,
  followerName: string
) {
  return createNotification({
    type: NotificationType.NEW_FOLLOWER,
    title: 'New Follower!',
    message: `${followerName} started following you`,
    userId: followingId,
    fromUserId: followerId,
    relatedUserId: followerId,
  });
}

export async function createRecipeCommentNotification(
  commenterId: string,
  recipeAuthorId: string,
  recipeId: string,
  recipeTitle: string,
  commenterName: string,
  commentId: string
) {
  // Don't notify if commenting on own recipe
  if (commenterId === recipeAuthorId) {
    return { success: true, message: 'No notification needed for self-comment' };
  }

  return createNotification({
    type: NotificationType.RECIPE_COMMENT,
    title: 'New Comment',
    message: `${commenterName} commented on your recipe "${recipeTitle}"`,
    userId: recipeAuthorId,
    fromUserId: commenterId,
    relatedRecipeId: recipeId,
    relatedCommentId: commentId,
  });
}

export async function createComplimentNotification(
  fromUserId: string,
  toUserId: string,
  complimentId: string,
  fromUserName: string,
  tipAmount?: number,
  recipeTitle?: string
) {
  // Don't notify if sending compliment to self
  if (fromUserId === toUserId) {
    return { success: true, message: 'No notification needed for self-compliment' };
  }

  const isTip = tipAmount && tipAmount > 0;
  const title = isTip ? 'New Tip Received!' : 'New Compliment!';
  
  let message = '';
  if (isTip && recipeTitle) {
    message = `${fromUserName} sent you a $${tipAmount} tip for your recipe "${recipeTitle}"`;
  } else if (isTip) {
    message = `${fromUserName} sent you a $${tipAmount} tip`;
  } else if (recipeTitle) {
    message = `${fromUserName} sent you a compliment for your recipe "${recipeTitle}"`;
  } else {
    message = `${fromUserName} sent you a compliment`;
  }

  return createNotification({
    type: NotificationType.COMPLIMENT_RECEIVED,
    title,
    message,
    userId: toUserId,
    fromUserId,
    relatedComplimentId: complimentId,
  });
}

export async function createNewRecipeNotification(
  authorId: string,
  recipeId: string,
  recipeTitle: string,
  authorName: string,
  followerIds: string[]
) {
  // Create notifications for all followers
  const notifications = followerIds.map(followerId =>
    createNotification({
      type: NotificationType.NEW_RECIPE_FROM_FOLLOWING,
      title: 'New Recipe!',
      message: `${authorName} posted a new recipe: "${recipeTitle}"`,
      userId: followerId,
      fromUserId: authorId,
      relatedRecipeId: recipeId,
    })
  );

  // Execute all notifications in parallel
  const results = await Promise.allSettled(notifications);
  
  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  console.log(`Created ${successful}/${followerIds.length} new recipe notifications`);
  
  return { success: true, notificationsSent: successful };
}