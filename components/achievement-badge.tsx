'use client';

import React from 'react';
import { Achievement, UserAchievement } from '@/hooks/use-achievements';
import { Calendar } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: UserAchievement;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
  onClick?: () => void;
}

export function AchievementBadge({ 
  achievement, 
  size = 'md', 
  showDate = false,
  onClick 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className={`relative group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      title={achievement.achievement.description}
    >
      {/* Badge Circle */}
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex items-center justify-center 
          shadow-lg 
          transition-transform duration-200 
          group-hover:scale-110
          border-4 border-white
        `}
        style={{ backgroundColor: achievement.achievement.color }}
      >
        <span className="text-white drop-shadow-lg">
          {achievement.achievement.icon}
        </span>
      </div>

      {/* Achievement Info Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-center min-w-max max-w-xs">
          <div className={`font-semibold ${textSizes[size]}`}>
            {achievement.achievement.name}
          </div>
          <div className={`text-gray-300 mt-1 ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
            {achievement.achievement.description}
          </div>
          {showDate && (
            <div className={`text-gray-400 mt-1 flex items-center justify-center ${size === 'sm' ? 'text-xs' : 'text-xs'}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </div>
          )}
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

interface AchievementGridProps {
  achievements: UserAchievement[];
  size?: 'sm' | 'md' | 'lg';
  showDates?: boolean;
  maxDisplay?: number;
  onAchievementClick?: (achievement: UserAchievement) => void;
}

export function AchievementGrid({ 
  achievements, 
  size = 'md', 
  showDates = false,
  maxDisplay,
  onAchievementClick 
}: AchievementGridProps) {
  const shouldScroll = maxDisplay && achievements.length > maxDisplay;
  const displayAchievements = shouldScroll ? achievements : achievements;

  if (achievements.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl text-gray-400">🏆</span>
        </div>
        <p className="text-gray-500 text-sm">No achievements yet</p>
        <p className="text-gray-400 text-xs mt-1">Keep cooking to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shouldScroll ? (
        <div className="relative">
          {/* Gradient fade on edges for visual indication of scroll */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable container */}
          <div 
            className="overflow-x-auto pb-2"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#e5e7eb #f3f4f6'
            }}
          >
            <div className="flex gap-3 px-4">
              {displayAchievements.map((achievement) => (
                <div key={achievement.id} className="flex-shrink-0">
                  <AchievementBadge
                    achievement={achievement}
                    size={size}
                    showDate={showDates}
                    onClick={() => onAchievementClick?.(achievement)}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Scroll hint */}
          <p className="text-center text-gray-400 text-xs mt-2">
            Scroll to see all achievements →
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 justify-center">
          {displayAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size={size}
              showDate={showDates}
              onClick={() => onAchievementClick?.(achievement)}
            />
          ))}
        </div>
      )}
      
      {achievements.length > 0 && (
        <p className="text-center text-gray-600 text-sm">
          {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} earned
        </p>
      )}
    </div>
  );
}