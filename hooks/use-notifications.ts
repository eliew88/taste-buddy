import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  id: string;
  type: 'NEW_FOLLOWER' | 'RECIPE_COMMENT' | 'COMPLIMENT_RECEIVED' | 'NEW_RECIPE_FROM_FOLLOWING';
  title: string;
  message: string;
  userId: string;
  fromUserId?: string;
  relatedRecipeId?: string;
  relatedCommentId?: string;
  relatedComplimentId?: string;
  relatedUserId?: string;
  read: boolean;
  createdAt: Date;
  fromUser?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  relatedRecipe?: {
    id: string;
    title: string;
    image: string | null;
  };
  relatedComment?: {
    id: string;
    content: string;
  };
  relatedCompliment?: {
    id: string;
    message: string;
    tipAmount: number | null;
    type: string;
  };
}

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications || []);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        return true;
      } else {
        throw new Error(data.error || 'Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [session?.user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        return true;
      } else {
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [session?.user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    isAuthenticated: !!session?.user?.id
  };
}

// Helper function to create notifications (used by server-side code)
export const createNotification = async (
  type: Notification['type'],
  recipientId: string,
  data: {
    title: string;
    message: string;
    fromUserId?: string;
    relatedRecipeId?: string;
    relatedCommentId?: string;
    relatedComplimentId?: string;
    relatedUserId?: string;
  }
) => {
  // This function is primarily used by the notification-utils.ts file
  // for server-side notification creation
  console.log('Notification created:', {
    type,
    recipientId,
    ...data
  });
};