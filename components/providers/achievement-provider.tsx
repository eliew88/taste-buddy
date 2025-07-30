'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserAchievement } from '@/hooks/use-achievements';
import { AchievementNotification } from '@/components/achievement-notification';
import { setGlobalAchievementCallback } from '@/lib/achievement-client';

interface AchievementContextType {
  showAchievements: (achievements: UserAchievement[]) => void;
  clearNotifications: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function useGlobalAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useGlobalAchievements must be used within an AchievementProvider');
  }
  return context;
}

interface AchievementProviderProps {
  children: React.ReactNode;
}

export function AchievementProvider({ children }: AchievementProviderProps) {
  const [notifications, setNotifications] = useState<UserAchievement[]>([]);

  const showAchievements = useCallback((achievements: UserAchievement[]) => {
    if (achievements.length > 0) {
      console.log('🏆 Global achievement notification triggered:', achievements.map(a => a.achievement.name));
      setNotifications(achievements);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Register the global callback when the provider mounts
  useEffect(() => {
    setGlobalAchievementCallback(showAchievements);
  }, [showAchievements]);

  return (
    <AchievementContext.Provider value={{ showAchievements, clearNotifications }}>
      {children}
      
      {/* Global Achievement Notifications */}
      <AchievementNotification 
        achievements={notifications}
        onClose={clearNotifications}
      />
    </AchievementContext.Provider>
  );
}