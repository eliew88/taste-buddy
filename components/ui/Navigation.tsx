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
import { Heart, Plus, Menu, X, User, Home, Sparkles, LogOut, LogIn, BookOpen, Calendar } from 'lucide-react';
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
    if (href === '/profile') {
      return pathname === '/profile' || pathname === '/profile/' || 
             (pathname.startsWith('/profile/') && !pathname.startsWith('/profile/recipe-book') && !pathname.startsWith('/profile/meals'));
    }
    return pathname.startsWith(href);
  };

  /**
   * Gets CSS classes for navigation links
   * @param href - The link href
   * @returns CSS class string
   */
  const getLinkProps = (href: string) => {
    const baseClasses = 'transition-colors duration-200';
    const activeClasses = 'text-white';
    const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
    
    const isActive = isActiveLink(href);
    return {
      className: `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`,
      style: isActive ? { backgroundColor: '#B370B0' } : {}
    };
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
    <nav className="shadow-sm border-b sticky top-0 z-50" style={{ backgroundColor: '#CFE8EF' }} role="navigation">
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
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/food-feed" 
              className={`px-3 py-2 rounded-md flex items-center whitespace-nowrap ${getLinkProps('/food-feed').className}`}
              style={getLinkProps('/food-feed').style}
              aria-current={isActiveLink('/food-feed') ? 'page' : undefined}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Food Feed
            </Link>
            
            {session ? (
              <>
                {/* Add Meal Memory Button */}
                <Link 
                  href="/meals/new" 
                  className="text-white px-4 py-2 rounded-lg transition-colors flex items-center font-medium whitespace-nowrap"
                  style={{ backgroundColor: '#1768AC' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#135285'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#1768AC'}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Memory
                </Link>
                
                {/* Memories Link */}
                <Link 
                  href="/profile/meals" 
                  className={`px-3 py-2 rounded-md flex items-center whitespace-nowrap ${getLinkProps('/profile/meals').className}`}
                  style={getLinkProps('/profile/meals').style}
                  aria-current={isActiveLink('/profile/meals') ? 'page' : undefined}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Memory Journal
                </Link>
                
                {/* Primary CTA Button */}
                <Link 
                  href="/recipes/new" 
                  className="text-white px-4 py-2 rounded-lg transition-colors flex items-center font-medium whitespace-nowrap"
                  style={{ backgroundColor: '#1B998B' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#177A6E'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#1B998B'}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Recipe
                </Link>
                
                <Link 
                  href="/profile/recipe-book" 
                  className={`px-3 py-2 rounded-md flex items-center whitespace-nowrap ${getLinkProps('/profile/recipe-book').className}`}
                  style={getLinkProps('/profile/recipe-book').style}
                  aria-current={isActiveLink('/profile/recipe-book') ? 'page' : undefined}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Recipe Book
                </Link>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Profile Dropdown */}
                <div className="relative">
                  <Link 
                    href="/profile" 
                    className={`p-2 rounded-md ${getLinkProps('/profile').className} flex items-center space-x-2`}
                    style={getLinkProps('/profile').style}
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
                <div className="relative group">
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    aria-label="Sign Out"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 text-xs font-medium text-white bg-black rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[9999]">
                    Sign out
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Sign In/Up Buttons for non-authenticated users */}
                <Link 
                  href="/auth/signin" 
                  className="px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                
                <Link 
                  href="/auth/signup" 
                  className="text-white px-4 py-2 rounded-lg transition-colors flex items-center font-medium whitespace-nowrap"
                  style={{ backgroundColor: '#1B998B' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#177A6E'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#1B998B'}
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
          <div className="md:hidden border-t py-4" style={{ backgroundColor: '#CFE8EF' }} role="menu">
            <div className="flex flex-col space-y-2">
              <Link
                href="/food-feed"
                className={`px-3 py-2 rounded-md flex items-center ${getLinkProps('/food-feed').className}`}
                style={getLinkProps('/food-feed').style}
                onClick={closeMobileMenu}
                role="menuitem"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Food Feed
              </Link>
              
              {session ? (
                <>
                  {/* Mobile Add Meal Button */}
                  <Link
                    href="/meals/new"
                    className="mx-3 mt-2 text-white py-2 px-4 rounded-lg text-center font-medium transition-colors flex items-center justify-center"
                    style={{ backgroundColor: '#1768AC' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#135285'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#1768AC'}
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Memory
                  </Link>
                  
                  <Link
                    href="/profile/meals"
                    className={`px-3 py-2 rounded-md flex items-center ${getLinkProps('/profile/meals').className}`}
                    style={getLinkProps('/profile/meals').style}
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Memory Journal
                  </Link>
                  
                  {/* Mobile CTA Button */}
                  <Link
                    href="/recipes/new"
                    className="mx-3 mt-2 text-white py-2 px-4 rounded-lg text-center font-medium transition-colors flex items-center justify-center"
                    style={{ backgroundColor: '#1B998B' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#177A6E'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#1B998B'}
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipe
                  </Link>
                  
                  <Link
                    href="/profile/recipe-book"
                    className={`px-3 py-2 rounded-md flex items-center ${getLinkProps('/profile/recipe-book').className}`}
                    style={getLinkProps('/profile/recipe-book').style}
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Recipe Book
                  </Link>
                  
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-md flex items-center ${getLinkProps('/profile').className}`}
                    style={getLinkProps('/profile').style}
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
                    className="mx-3 mt-2 text-white py-2 px-4 rounded-lg text-center font-medium transition-colors flex items-center justify-center"
                    style={{ backgroundColor: '#1B998B' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#177A6E'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#1B998B'}
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