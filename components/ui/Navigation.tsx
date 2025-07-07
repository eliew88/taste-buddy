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
import { Heart, Plus, Menu, X, Search, User, Home, ChefHat, Sparkles } from 'lucide-react';

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
    const activeClasses = 'text-blue-600 bg-blue-50';
    const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
    
    return `${baseClasses} ${isActiveLink(href) ? activeClasses : inactiveClasses}`;
  };

  /**
   * Closes mobile menu (used when link is clicked)
   */
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50" role="navigation">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            aria-label="TasteBuddy Home"
          >
            <div className="flex items-center space-x-2">
              <ChefHat className="w-8 h-8" />
              <span>TasteBuddy</span>
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
            
            <Link 
              href="/profile/favorites" 
              className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/profile/favorites')}`}
              aria-current={isActiveLink('/profile/favorites') ? 'page' : undefined}
            >
              <Heart className="w-4 h-4 mr-1" />
              Favorites
            </Link>
            
            {/* Primary CTA Button */}
            <Link 
              href="/recipes/new" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Recipe
            </Link>
            
            {/* User Profile */}
            <Link 
              href="/profile" 
              className={`p-2 rounded-md ${getLinkClasses('/profile')}`}
              aria-label="User Profile"
            >
              <User className="w-5 h-5" />
            </Link>
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
          <div className="md:hidden border-t bg-white py-4" role="menu">
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
              
              <Link
                href="/profile/favorites"
                className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/profile/favorites')}`}
                onClick={closeMobileMenu}
                role="menuitem"
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorites
              </Link>
              
              <Link
                href="/profile"
                className={`px-3 py-2 rounded-md flex items-center ${getLinkClasses('/profile')}`}
                onClick={closeMobileMenu}
                role="menuitem"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              
              {/* Mobile CTA Button */}
              <Link
                href="/recipes/new"
                className="mx-3 mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                onClick={closeMobileMenu}
                role="menuitem"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}