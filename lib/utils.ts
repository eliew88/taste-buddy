/**
 * Utility functions for the TasteBuddy application
 * 
 * This file contains reusable utility functions for common operations
 * like styling, formatting, and data manipulation.
 */

 import { type ClassValue, clsx } from 'clsx';
 import { twMerge } from 'tailwind-merge';
 
 /**
  * Combines CSS classes intelligently
  * Merges Tailwind classes and resolves conflicts
  * 
  * @param inputs - Array of class names or conditional class objects
  * @returns Merged and optimized class string
  * 
  * @example
  * cn('text-red-500', 'text-blue-500') // Returns 'text-blue-500' (blue wins)
  * cn('p-4', someCondition && 'bg-red-500') // Conditional classes
  */
 export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
 }
 
 /**
  * Formats a date for display
  * 
  * @param date - Date object or ISO string
  * @returns Formatted date string (e.g., "January 15, 2024")
  */
 export function formatDate(date: Date | string): string {
   return new Date(date).toLocaleDateString('en-US', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
   });
 }
 
 /**
  * Formats cooking time from minutes to readable format
  * 
  * @param minutes - Number of minutes
  * @returns Formatted time string (e.g., "30 mins", "1h 30m")
  */
 export function formatCookTime(minutes: number): string {
   if (minutes < 60) {
     return `${minutes} mins`;
   }
   const hours = Math.floor(minutes / 60);
   const remainingMinutes = minutes % 60;
   return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
 }
 
 /**
  * Truncates text to specified length with ellipsis
  * 
  * @param text - Text to truncate
  * @param maxLength - Maximum length before truncation
  * @returns Truncated text with ellipsis if needed
  */
 export function truncateText(text: string, maxLength: number): string {
   if (text.length <= maxLength) return text;
   return text.substring(0, maxLength).trim() + '...';
 }
 
 /**
  * Capitalizes the first letter of a string
  * 
  * @param str - String to capitalize
  * @returns String with first letter capitalized
  */
 export function capitalize(str: string): string {
   return str.charAt(0).toUpperCase() + str.slice(1);
 }
 
 // ===== components/ui/StarRating.tsx =====
 /**
  * Star Rating Component
  * 
  * A reusable component for displaying and interacting with star ratings.
  * Supports both read-only display and interactive rating input.
  */
 
 'use client';
 
 import { Star } from 'lucide-react';
 import { useState } from 'react';
 
 interface StarRatingProps {
   /** Current rating value (0-5) */
   rating: number;
   
   /** Callback function when user clicks a star (optional) */
   onRate?: (rating: number) => void;
   
   /** Whether the rating is interactive (default: true) */
   interactive?: boolean;
   
   /** Size variant for the stars */
   size?: 'sm' | 'md' | 'lg';
   
   /** Additional CSS classes */
   className?: string;
 }
 
 /**
  * StarRating Component
  * 
  * Features:
  * - Displays 1-5 star rating
  * - Interactive mode for user input
  * - Hover effects for better UX
  * - Multiple size variants
  * - Accessible with keyboard navigation
  */
 export default function StarRating({ 
   rating, 
   onRate, 
   interactive = true,
   size = 'md',
   className = ''
 }: StarRatingProps) {
   // Track hovered star for preview effect
   const [hoveredRating, setHoveredRating] = useState(0);
   
   // Size mappings for different star sizes
   const sizeClasses = {
     sm: 'w-3 h-3',
     md: 'w-4 h-4',
     lg: 'w-5 h-5'
   };
 
   // Use hovered rating for preview, fall back to actual rating
   const currentRating = interactive ? (hoveredRating || rating) : rating;
 
   /**
    * Handles star click events
    * @param starValue - The value of the clicked star (1-5)
    */
   const handleStarClick = (starValue: number) => {
     if (interactive && onRate) {
       onRate(starValue);
     }
   };
 
   /**
    * Handles keyboard navigation for accessibility
    * @param event - Keyboard event
    * @param starValue - The value of the focused star
    */
   const handleKeyDown = (event: React.KeyboardEvent, starValue: number) => {
     if (event.key === 'Enter' || event.key === ' ') {
       event.preventDefault();
       handleStarClick(starValue);
     }
   };
 
   return (
     <div className={`flex space-x-1 ${className}`} role="radiogroup" aria-label="Rating">
       {[1, 2, 3, 4, 5].map(star => (
         <Star
           key={star}
           className={`${sizeClasses[size]} transition-colors ${
             star <= currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
           } ${interactive ? 'cursor-pointer hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1' : ''}`}
           onClick={() => handleStarClick(star)}
           onMouseEnter={() => interactive && setHoveredRating(star)}
           onMouseLeave={() => interactive && setHoveredRating(0)}
           onKeyDown={(e) => handleKeyDown(e, star)}
           tabIndex={interactive ? 0 : -1}
           role="radio"
           aria-checked={star <= rating}
           aria-label={`${star} star${star !== 1 ? 's' : ''}`}
         />
       ))}
     </div>
   );
 }