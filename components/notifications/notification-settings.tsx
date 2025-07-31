'use client';

import { useState, useEffect } from 'react';
import { Bell, User, MessageCircle, Gift, ChefHat } from 'lucide-react';

interface NotificationPreferences {
  notifyOnNewFollower: boolean;
  notifyOnRecipeComment: boolean;
  notifyOnCompliment: boolean;
  notifyOnNewRecipeFromFollowing: boolean;
}

interface NotificationSettingsProps {
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

export function NotificationSettings({ onPreferencesChange }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyOnNewFollower: true,
    notifyOnRecipeComment: true,
    notifyOnCompliment: true,
    notifyOnNewRecipeFromFollowing: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current preferences on component mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/notification-preferences');
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
      } else {
        setError('Failed to load notification preferences');
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Optimistically update the UI
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      // Call the callback if provided
      if (onPreferencesChange) {
        onPreferencesChange(newPreferences);
      }

      // Send update to server
      const response = await fetch('/api/users/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await response.json();

      if (!data.success) {
        // Revert optimistic update on failure
        setPreferences(preferences);
        setError(data.error || 'Failed to update preference');
      } else {
        setSuccessMessage('Preferences updated successfully');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating preference:', err);
      // Revert optimistic update on error
      setPreferences(preferences);
      setError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  const notificationSettings = [
    {
      key: 'notifyOnNewFollower' as keyof NotificationPreferences,
      icon: User,
      title: 'New Followers',
      description: 'Get notified when someone starts following you',
      category: 'Social'
    },
    {
      key: 'notifyOnRecipeComment' as keyof NotificationPreferences,
      icon: MessageCircle,
      title: 'Recipe Comments',
      description: 'Get notified when someone comments on your recipes',
      category: 'Recipe Activity'
    },
    {
      key: 'notifyOnCompliment' as keyof NotificationPreferences,
      icon: Gift,
      title: 'Compliments & Tips',
      description: 'Get notified when someone sends you a compliment or tip',
      category: 'Appreciation'
    },
    {
      key: 'notifyOnNewRecipeFromFollowing' as keyof NotificationPreferences,
      icon: ChefHat,
      title: 'New Recipes from Following',
      description: 'Get notified when people you follow post new recipes',
      category: 'Recipe Updates'
    }
  ];


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Bell className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* In-App Notifications */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900">In-App Notifications</h3>
        <p className="text-sm text-gray-600">
          Choose which activities you want to be notified about within TasteBuddy.
        </p>
        
        <div className="space-y-3">
          {notificationSettings.map((setting) => {
            const IconComponent = setting.icon;
            return (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <IconComponent className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {setting.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {setting.description}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                      {setting.category}
                    </span>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[setting.key]}
                    onChange={(e) => updatePreference(setting.key, e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>


      {/* Additional Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-blue-900">
              About Notifications
            </h4>
            <p className="text-xs text-blue-700">
              You can always adjust these preferences later. Notifications will appear in your notification bell 
              when you're using TasteBuddy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}