/**
 * Client-side Achievement Utilities
 * 
 * Provides functions to handle achievement notifications on the client side
 * after API calls that may trigger achievements.
 */

import { UserAchievement } from '@/hooks/use-achievements';

// Define the notification callback type
let globalNotificationCallback: ((achievements: UserAchievement[]) => void) | null = null;

// Store the notification callback (called by the provider)
export function setGlobalAchievementCallback(callback: (achievements: UserAchievement[]) => void) {
  globalNotificationCallback = callback;
}

// Function to check for and display new achievements after an action
export async function checkAndNotifyAchievements(userId: string): Promise<void> {
  try {
    console.log('🔍 Checking for new achievements for user:', userId);
    
    const response = await fetch(`/api/users/${userId}/achievements`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success && data.data.newAchievements.length > 0) {
      console.log('🏆 New achievements found:', data.data.newAchievements.map((a: UserAchievement) => a.achievement.name));
      
      // Trigger global notification if callback is available
      if (globalNotificationCallback) {
        globalNotificationCallback(data.data.newAchievements);
      }
    } else {
      console.log('✓ No new achievements at this time');
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
    // Don't throw - achievement checking should be non-blocking
  }
}

// Enhanced API wrapper that automatically checks for achievements
export async function apiCallWithAchievements<T>(
  apiCall: () => Promise<T>,
  userId: string,
  shouldCheck: boolean = true
): Promise<T> {
  const result = await apiCall();
  
  if (shouldCheck) {
    // Check for achievements after successful API call (non-blocking)
    checkAndNotifyAchievements(userId).catch(error => {
      console.error('Achievement check failed:', error);
    });
  }
  
  return result;
}