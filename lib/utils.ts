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
 
 