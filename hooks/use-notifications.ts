import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  id: string;
  type: 'new_recipe' | 'new_follower' | 'recipe_liked' | 'recipe_commented';
  title: string;
  message: string;
  userId: string;
  relatedId?: string; // Recipe ID, User ID, etc.
  read: boolean;
  createdAt: Date;
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
      // TODO: Implement API endpoint for fetching notifications
      // const response = await fetch('/api/notifications');
      // const data = await response.json();
      // if (data.success) {
      //   setNotifications(data.data);
      // }
      
      // For now, return empty array as placeholder
      setNotifications([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return false;

    try {
      // TODO: Implement API endpoint for marking notifications as read
      // const response = await fetch(`/api/notifications/${notificationId}/read`, {
      //   method: 'POST',
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setNotifications(prev =>
      //     prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      //   );
      //   return true;
      // }
      
      // Placeholder implementation
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [session?.user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return false;

    try {
      // TODO: Implement API endpoint for marking all notifications as read
      // const response = await fetch('/api/notifications/read-all', {
      //   method: 'POST',
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      //   return true;
      // }
      
      // Placeholder implementation
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      return true;
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

// Helper function to create notifications (placeholder for future implementation)
export const createNotification = async (
  type: Notification['type'],
  recipientId: string,
  data: {
    title: string;
    message: string;
    relatedId?: string;
  }
) => {
  // TODO: Implement API call to create notification
  // This would be called when:
  // - A user posts a new recipe (notify followers)
  // - Someone follows a user (notify the user)
  // - Someone likes/comments on a recipe (notify recipe author)
  
  console.log('Notification would be created:', {
    type,
    recipientId,
    ...data
  });
};