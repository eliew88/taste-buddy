/**
 * Navigation Component
 * 
 * Main navigation bar for the TasteBuddy application.
 * Provides access to all major sections and user actions.
 * Updated to include FoodFeed link to advanced search functionality.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Heart, Plus, Menu, X, User, Home, Sparkles, LogOut, LogIn, BookOpen } from 'lucide-react';
import { NotificationBell } from './notification-bell';
import Avatar from '@/components/ui/avatar';

/**
 * Navigation Component
 * 
 * Features:
 * - Responsive design (desktop/mobile)
 * - Active link highlighting
 * - Mobile hamburger menu
 * - Brand logo/name
 * - Quick action buttons
 * - User profile access
 * - FoodFeed link to advanced search
 */
export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  /**
   * Checks if a link is currently active
   * @param href - The link href to check
   * @returns Boolean indicating if link is active
   */
  const isActiveLink = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  /**
   * Gets CSS classes for navigation links
   * @param href - The link href
   * @returns CSS class string
   */
  const getLinkClasses = (href: string): string => {
    const baseClasses = 'transition-colors duration-200';
    const activeClasses = 'text-purple-700 bg-purple-100';
    const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
    
    return `${baseClasses} ${isActiveLink(href) ? activeClasses : inactiveClasses}`;
  };

  /**
   * Closes mobile menu (used when link is clicked)
   */
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  /**
   * Handles user sign out
   */
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-blue-100 shadow-sm border-b sticky top-0 z-50" role="navigation">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="font-bold text-gray-800 hover:text-gray-900 transition-colors"
            aria-label="TasteBuddy Home"
          >
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍲</span>
              <span style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: '1.875rem' }}>TasteBuddy</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/')}`}
              aria-current={isActiveLink('/') ? 'page' : undefined}
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            
            <Link 
              href="/food-feed" 
              className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/food-feed')}`}
              aria-current={isActiveLink('/food-feed') ? 'page' : undefined}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              FoodFeed
            </Link>
            
            {session ? (
              <>
                <Link 
                  href="/profile/recipe-book" 
                  className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/profile/recipe-book')}`}
                  aria-current={isActiveLink('/profile/recipe-book') ? 'page' : undefined}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  My Recipe Book
                </Link>
                
                {/* Add Meal Memory Button */}
                <Link 
                  href="/meals/new" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Meal Memory
                </Link>
                
                {/* Primary CTA Button */}
                <Link 
                  href="/recipes/new" 
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors flex items-center font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Recipe
                </Link>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Profile Dropdown */}
                <div className="relative">
                  <Link 
                    href="/profile" 
                    className={`p-2 rounded-md ${getLinkClasses('/profile')} flex items-center space-x-2`}
                    aria-label="User Profile"
                  >
                    <Avatar
                      imageUrl={session.user?.image}
                      name={session.user?.name}
                      size="sm"
                    />
                    <span className="hidden lg:block text-sm font-medium">{session.user?.name}</span>
                  </Link>
                </div>
                
                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                {/* Sign In/Up Buttons for non-authenticated users */}
                <Link 
                  href="/auth/signin" 
                  className="px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                
                <Link 
                  href="/auth/signup" 
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors flex items-center font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-blue-100 py-4" role="menu">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/')}`}
                onClick={closeMobileMenu}
                role="menuitem"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              
              <Link
                href="/food-feed"
                className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/food-feed')}`}
                onClick={closeMobileMenu}
                role="menuitem"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                FoodFeed
              </Link>
              
              {session ? (
                <>
                  <Link
                    href="/profile/recipe-book"
                    className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/profile/recipe-book')}`}
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    My Recipe Book
                  </Link>
                  
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/profile')}`}
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Avatar
                      imageUrl={session.user?.image}
                      name={session.user?.name}
                      size="sm"
                      className="mr-2"
                    />
                    Profile ({session.user?.name})
                  </Link>
                  
                  {/* Mobile Add Meal Button */}
                  <Link
                    href="/meals/new"
                    className="mx-3 mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Meal Memory
                  </Link>
                  
                  {/* Mobile CTA Button */}
                  <Link
                    href="/recipes/new"
                    className="mx-3 mt-2 bg-green-700 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-green-800 transition-colors flex items-center justify-center"
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipe
                  </Link>
                  
                  {/* Mobile Sign Out Button */}
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMobileMenu();
                    }}
                    className="mx-3 mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {/* Mobile Sign In/Up Buttons */}
                  <Link
                    href="/auth/signin"
                    className="mx-3 mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                  
                  <Link
                    href="/auth/signup"
                    className="mx-3 mt-2 bg-green-700 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-green-800 transition-colors flex items-center justify-center"
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}