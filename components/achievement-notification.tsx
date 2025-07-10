'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { UserAchievement } from '@/hooks/use-achievements';

interface AchievementNotificationProps {
  achievements: UserAchievement[];
  onClose: () => void;
}

export function AchievementNotification({ achievements, onClose }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievements.length > 0) {
      setVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievements]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (achievements.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden max-w-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <h3 className="font-semibold">
                Achievement{achievements.length !== 1 ? 's' : ''} Unlocked!
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Achievement List */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md border-2 border-white"
                style={{ backgroundColor: achievement.achievement.color }}
              >
                <span className="text-white drop-shadow">
                  {achievement.achievement.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm">
                  {achievement.achievement.name}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {achievement.achievement.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-600 text-center">
            Keep cooking to unlock more achievements!
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for managing achievement notifications
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<UserAchievement[]>([]);

  const showAchievements = (achievements: UserAchievement[]) => {
    if (achievements.length > 0) {
      setNotifications(achievements);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showAchievements,
    clearNotifications
  };
}