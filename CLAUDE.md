# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TasteBuddy is a Next.js 15 recipe sharing platform built with TypeScript, Tailwind CSS, and Prisma ORM. The application uses PostgreSQL for both development and production, and follows a typical Next.js App Router structure with API routes.

## Development Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality
- `npm run db:seed` - Seed the database with sample data using prisma/seed.ts

## Feature Flags

The application includes a feature flag system for enabling/disabling functionality in production:

### Payment Processing Feature Flag
- **Environment Variable**: `NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS`
- **Default**: `false` (disabled by default for safety)
- **Purpose**: Controls whether users can give or receive tips through the payment system

**When disabled (false)**:
- Users cannot send tips with compliments
- Payment setup page shows "disabled" message
- All payment-related API endpoints return "disabled" errors
- Users can still send compliment messages without tips

**When enabled (true)**:
- Full payment functionality is available
- Users can set up Stripe Connect accounts
- Tipping works normally through the compliment system

**Setting in Production**:
```bash
# Via Vercel Dashboard Environment Variables
NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS=true

# Or via Vercel CLI
vercel env add NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS
```

### Adding New Feature Flags
1. Add the flag to `FeatureFlags` interface in `/lib/feature-flags.ts`
2. Set default value in `DEFAULT_FLAGS`
3. Use `useFeatureFlag()` in React components
4. Use `isFeatureEnabled()` in API routes and server-side code

## Database Architecture

The application uses PostgreSQL with Prisma ORM. The schema includes:
- **Users** - User accounts with authentication data, profile info, social links
- **Recipes** - Core recipe data with structured ingredients and multiple images support
- **RecipeImages** - Multiple images per recipe with primary image designation
- **IngredientEntries** - Structured ingredient data with amounts, units, and ingredient names
- **Meals** - Meal memories with photos, tagging, and privacy controls
- **MealImages** - Multiple images per meal with primary image designation
- **MealTags** - Tagging system for TasteBuddies in meal memories
- **Follows** - User following system for social features
- **Favorites** - Many-to-many relationship between users and recipes
- **Ratings** - User ratings for recipes (1-5 stars)
- **Comments** - User comments on recipes and meals
- **Compliments** - Tip/compliment system with optional Stripe integration
- **Achievements** - Gamification system with various achievement types
- **UserAchievements** - Tracking which users have earned which achievements  
- **Notifications** - In-app notification system
- **PaymentAccounts** - Stripe Connect integration for tipping

### Database Relationships
- **User → Recipes**: One-to-many (user can create multiple recipes)
- **User → Meals**: One-to-many (user can create multiple meal memories)
- **Recipe → RecipeImages**: One-to-many (recipe can have multiple images)
- **Meal → MealImages**: One-to-many (meal can have multiple images)
- **Recipe → IngredientEntries**: One-to-many (structured ingredient data)
- **Meal ↔ User**: Many-to-many through MealTags (tagging TasteBuddies)
- **User ↔ User**: Many-to-many through Follows (following system)
- **User ↔ Recipe**: Many-to-many through Favorites table
- **User → Achievements**: Many-to-many through UserAchievements table
- **User → Comments**: One-to-many (users can comment on recipes/meals)
- **User → Compliments**: One-to-many (users can send compliments/tips)
- **User → Notifications**: One-to-many (users receive notifications)

### PostgreSQL Features

- Native array support for tags (String[] type)
- Structured ingredient storage with separate IngredientEntry model
- Multiple images per recipe with RecipeImage model
- Advanced search capabilities with `hasSome`, `hasEvery`, and `contains` operators
- Case-insensitive text search with `mode: 'insensitive'`
- GIN indexes for optimized array and full-text search performance
- Better concurrent access and connection pooling

## Core Architecture

### API Layer (`app/api/`)
- REST API endpoints using Next.js App Router
- Centralized error handling and response formatting
- Prisma integration for PostgreSQL database operations
- Native array handling with PostgreSQL

### Client-Side Data Management
- **API Client** (`lib/api-client.ts`) - Centralized HTTP client with type safety
- **Custom Hooks** (`hooks/use-recipes.ts`) - React hooks for data fetching, loading states, pagination
- **Type Definitions** (`types/recipe.ts`) - TypeScript interfaces for all data structures

### Component Structure
- **UI Components** (`components/ui/`) - Reusable UI elements
- **Form Components** (`components/recipe-form.tsx`) - Recipe creation/editing
- **Error Boundaries** (`components/error-boundary.tsx`) - Error handling wrapper

## Key Implementation Details

### Recipe Data Flow
1. Frontend forms collect recipe data including multiple images
2. API routes validate and structure data (ingredients → IngredientEntry objects)
3. Prisma stores data in PostgreSQL with proper relationships
4. Images are stored as RecipeImage objects with primary designation
5. Custom hooks manage loading states and pagination

### Search Implementation
- Text search across title, description, ingredients, and tags
- Difficulty filtering (easy/medium/hard)
- Pagination with configurable page size
- Debounced search input (300ms delay)

### Multiple Images System
**Status: ✅ IMPLEMENTED**

Complete multiple images functionality with primary image designation:

#### Features
- **Multiple Image Upload** - Users can upload up to 5 images per recipe
- **Primary Image Designation** - One image can be marked as primary for recipe cards
- **Drag & Drop Reordering** - Images can be reordered with drag and drop
- **Deferred Upload Strategy** - Images only upload to B2 when recipe is saved
- **Image Gallery** - Recipe detail pages show all images in a responsive gallery
- **Image Modal** - Full-size image viewing with navigation

#### Implementation
```typescript
// Recipe with multiple images
const recipe = {
  title: "Recipe Title",
  images: [
    {
      id: "img_123",
      url: "https://...",
      isPrimary: true,
      displayOrder: 0,
      alt: "Recipe image",
      caption: "Optional caption"
    }
  ]
};

// Getting primary image for recipe cards
const primaryImage = recipe.images?.find(img => img.isPrimary) || recipe.images?.[0];
```

#### Key Files
- `/components/ui/multiple-image-upload.tsx` - Image upload component with drag & drop
- `/components/ui/recipe-image-gallery.tsx` - Recipe detail image gallery
- `/components/ui/recipe-card.tsx` - Uses primary image for recipe cards
- `/lib/image-client-utils.ts` - Image optimization and B2 URL handling

### Structured Ingredients System
**Status: ✅ IMPLEMENTED**

Ingredients are stored as structured data with amounts, units, and ingredient names:

#### Features
- **Structured Storage** - Each ingredient has amount, unit, and ingredient name
- **Flexible Amounts** - Supports fractional amounts, decimals, or no amount ("to taste")
- **Recipe Scaling** - Ingredients can be scaled up/down for different serving sizes
- **Search Integration** - Ingredients are searchable across the platform

#### Implementation
```typescript
// Structured ingredient data
const ingredient = {
  id: "ing_123",
  amount: 2.5,          // Optional numeric amount
  unit: "cups",         // Optional unit (cups, tbsp, etc.)
  ingredient: "flour",  // Required ingredient name
  recipeId: "recipe_123"
};

// Recipe scaling
const scaledIngredients = scaleIngredients(recipe.ingredients, 2.0); // 2x scale
```

#### Key Files
- `/lib/recipe-scaling.ts` - Recipe scaling utilities and fraction formatting
- `/components/ui/recipe-scale-slider.tsx` - Interactive scaling component
- `/components/ingredient-input.tsx` - Structured ingredient input form

### Legacy System Migration
**Status: ✅ COMPLETED (2025-01-27)**

The application has been fully migrated from legacy single-image and string-based ingredients to modern structured systems:

#### What Was Removed
- Legacy `image` field from Recipe model (removed from database schema)
- String-based ingredients array (migrated to structured IngredientEntry model)
- All fallback logic for legacy image handling in components
- Legacy image upload and management code

#### Migration Process
1. **Database Schema Update** - Added RecipeImage and IngredientEntry models
2. **Data Migration** - Migrated all existing legacy images to new RecipeImage system
3. **Code Cleanup** - Removed all legacy image references from codebase
4. **Production Deployment** - Safely applied changes to production database
5. **Legacy Column Removal** - Dropped legacy image column from production

#### Current State
- All recipes use RecipeImage model exclusively
- All ingredients use structured IngredientEntry model
- No legacy dependencies remain in codebase
- Clean, maintainable image and ingredient systems

## Authentication System
**Status: ✅ IMPLEMENTED**

The application now includes a complete authentication system:

### NextAuth.js Integration
- **Provider**: Credentials provider for email/password authentication
- **Session Strategy**: JWT-based sessions for scalability
- **Security**: Secure password hashing with bcrypt
- **Demo Users**: Pre-configured demo accounts for testing

### Authentication Flow
1. User registration creates new account with hashed password
2. Sign-in validates credentials and creates JWT session
3. Session persists across page loads and browser sessions
4. Protected routes check authentication status
5. API routes validate session for user-specific operations

### Demo Accounts
- **Sarah Chen** (sarah@example.com) - Password: demo
- **Mike Rodriguez** (mike@example.com) - Password: demo  
- **David Kim** (david@example.com) - Password: demo

### Key Files
- `/lib/auth.ts` - NextAuth configuration and utilities
- `/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `/app/auth/signin/page.tsx` - Sign-in page with demo user shortcuts
- `/app/auth/signup/page.tsx` - User registration page
- `/components/providers/session-provider.tsx` - Session context provider

## Development Patterns

### Custom Hooks Usage
- Use `useRecipes()` for general recipe fetching
- Use `useRecipeSearch()` for search pages with filters
- Use `useFavorites()` for favorites management
- Use `useMeals()` and `useMealSearch()` for meal memory management
- Use `useFollowing()` for social following features
- Use `useUserAchievements()` for gamification system
- Use `useTasteBuddies()` for mutual follows (TasteBuddies)

### Favorites System
**Status: ✅ IMPLEMENTED**

Complete favorites functionality with persistent storage:

#### Features
- **Toggle Favorites** - Add/remove recipes from favorites with heart icon
- **Favorites Page** - Dedicated page to view saved recipes (`/profile/favorites`)
- **Real-time Updates** - Instant UI feedback when favoriting/unfavoriting
- **Cross-page Consistency** - Favorites status syncs across home, search, and detail pages

#### Implementation
- **API Routes**: `/api/recipes/favorites` (POST) and `/api/users/favorites` (GET)
- **Custom Hook**: `useFavorites()` for centralized state management
- **Database**: Many-to-many relationship between Users and Recipes via Favorites table
- **UI Integration**: RecipeCard component with favorite toggle functionality

#### Key Files
- `/hooks/use-favorites.ts` - Custom hook for favorites state management
- `/app/api/recipes/favorites/route.ts` - API for toggling favorites
- `/app/api/users/favorites/route.ts` - API for fetching user's favorites
- `/app/profile/favorites/page.tsx` - Favorites page component
- `/components/ui/recipe-card.tsx` - Updated with favorites functionality

## Meal Memory System
**Status: ✅ IMPLEMENTED**

Complete meal memory system for users to share their culinary experiences:

### Features
- **Photo Upload** - Upload multiple photos per meal memory
- **TasteBuddy Tagging** - Tag mutual follows (TasteBuddies) in meal memories
- **Privacy Controls** - Mark meals as public or private
- **Meal Journal** - Personal meal memory journal at `/profile/meals`
- **Filtering** - Filter by created meals, tagged meals, or all meals
- **Rich Metadata** - Date, description, and location information

### Privacy System
- **Public Meals** - Visible to all users, appear in Food Feed and social sharing
- **Private Meals** - Only visible to the meal author
- **Tagged User Access** - Tagged TasteBuddies can see meals they're tagged in
- **Profile Display** - Only public meals appear on user profiles

### TasteBuddy Tagging
- **Mutual Follow Requirement** - Only mutual follows can be tagged
- **Tag Validation** - Server-side validation prevents unauthorized tagging
- **Notification System** - Users get notified when tagged in meals
- **Tagged User Display** - Shows tagged users on meal detail pages

### Implementation
```typescript
// Creating a meal with tags and privacy
const meal = {
  name: "Sunday Brunch",
  description: "Amazing brunch with friends",
  isPublic: true,
  taggedUserIds: ["user1", "user2"], // Only TasteBuddies
  images: [...] // Multiple images supported
};
```

### Key Files
- `/app/meals/` - Meal creation, editing, and detail pages
- `/app/profile/meals/page.tsx` - Personal meal journal
- `/components/meal-form.tsx` - Meal creation/editing form
- `/components/ui/meal-card.tsx` - Meal display component
- `/hooks/use-meals.ts` - Meal data management hooks
- `/api/meals/` - Meal API endpoints with privacy controls

## Social Features System
**Status: ✅ IMPLEMENTED**

Comprehensive social features for community interaction:

### Following System
- **Follow/Unfollow** - Users can follow other users
- **TasteBuddies** - Mutual follows create "TasteBuddy" relationships
- **Follow Button** - Consistent follow/unfollow UI across the platform
- **Following/Followers Lists** - View who users follow and who follows them

### Social Discovery
- **Food Feed** - Browse all public recipes and meals at `/food-feed`
- **User Profiles** - View other users' public content at `/profile/[id]`
- **Social Stats** - Follower/following counts on profiles
- **TasteBuddy-Only Features** - Some features require mutual following

### User Profiles
- **Public Profiles** - Showcase user's public recipes and meals
- **Profile Customization** - Bio, Instagram/website links, profile photos
- **Social Links** - Instagram and website URL integration
- **Achievement Display** - Show earned achievements on profiles

### Implementation
```typescript
// Following/unfollowing users
const { isFollowing, followUser, unfollowUser } = useFollowing();

// Getting TasteBuddies (mutual follows)
const { tastebuddies } = useTasteBuddies();

// Checking follow status
const followStatus = await getFollowStatus(userId);
```

### Key Files
- `/app/profile/[id]/page.tsx` - Public user profiles
- `/components/ui/follow-button.tsx` - Follow/unfollow functionality
- `/hooks/use-following.ts` - Following state management
- `/hooks/use-tastebuddies.ts` - TasteBuddy relationship management
- `/api/users/follow/route.ts` - Follow/unfollow API
- `/api/users/tastebuddies/route.ts` - TasteBuddy relationship API

## Enhanced Sharing System
**Status: ✅ IMPLEMENTED**

Rich sharing capabilities with social media integration:

### Share Button Features
- **Copy Link** - One-click URL copying with visual feedback
- **Native Sharing** - Uses device's native share menu when available
- **Dropdown Interface** - Clean dropdown with multiple share options
- **Error Handling** - Graceful fallback for older browsers

### Open Graph Integration
- **Rich Previews** - Recipe and meal links show rich previews on social media
- **Dynamic Meta Tags** - Server-generated metadata for each recipe/meal
- **Image Optimization** - Automatically optimized images for social sharing (1200x630)
- **Privacy Aware** - Only public content shows rich previews

### Social Media Support
- **Facebook** - Rich link previews with recipe images and details
- **WhatsApp** - Recipe/meal previews in chat conversations
- **Slack** - Professional-looking link previews in workspace chats
- **Twitter** - Clean link previews (basic Open Graph support)

### Implementation
```typescript
// Using the share button component
<ShareButton
  title={recipe.title}
  text={`Check out this ${recipe.title} recipe!`}
  url={window.location.href}
/>

// Open Graph metadata (server-side)
export async function generateMetadata({ params }) {
  const recipe = await getRecipe(params.id);
  return {
    title: recipe.title,
    openGraph: {
      images: [recipe.primaryImage.url],
      description: recipe.description
    }
  };
}
```

### Key Files
- `/components/ui/share-button.tsx` - Reusable share button component
- `/app/recipes/[id]/page.tsx` - Recipe metadata generation
- `/app/meals/[id]/page.tsx` - Meal metadata generation
- `/app/test-og/page.tsx` - Open Graph testing utilities

## Delete Functionality
**Status: ✅ IMPLEMENTED**

Safe deletion system for recipes and meals:

### Features
- **Authorization** - Only content owners can delete their own content
- **Confirmation Dialog** - Clear warning about permanent deletion
- **Visual Design** - Red trash icon in top-right of edit pages
- **Cascade Deletion** - Properly removes related images, comments, etc.
- **Proper Redirects** - Users redirected to appropriate pages after deletion

### Safety Measures
- **Double Confirmation** - Dialog requires explicit user confirmation
- **Warning Message** - Clear warning that deletion cannot be undone
- **Loading States** - Visual feedback during deletion process
- **Error Handling** - Proper error messages if deletion fails

### Implementation
```typescript
// Confirmation dialog usage
<ConfirmationDialog
  isOpen={showDeleteDialog}
  onConfirm={handleDelete}
  title="Delete Recipe"
  message="Are you sure? This cannot be undone."
  variant="danger"
/>
```

### Key Files
- `/components/ui/confirmation-dialog.tsx` - Reusable confirmation dialog
- `/app/recipes/[id]/edit/page.tsx` - Recipe deletion interface
- `/app/meals/[id]/edit/page.tsx` - Meal deletion interface
- `/api/recipes/[id]/route.ts` - Recipe deletion API (DELETE method)
- `/api/meals/[id]/route.ts` - Meal deletion API (DELETE method)

## Gamification System
**Status: ✅ IMPLEMENTED**

Comprehensive achievement system to encourage user engagement:

### Achievement Types
- **RECIPE_COUNT** - Based on number of recipes posted (First Recipe, Recipe Master, etc.)
- **MEAL_COUNT** - Based on number of meals posted (First Meal, Meal Explorer, etc.)
- **PHOTO_COUNT** - Based on photos uploaded (First Shot, Photographer, etc.)
- **FAVORITES_COUNT** - Based on total favorites received
- **FOLLOWERS_COUNT** - Based on number of followers
- **RATINGS_COUNT** - Based on total ratings received
- **SPECIAL** - One-time special achievements

### Achievement System
- **Automatic Triggering** - Achievements unlock automatically when conditions are met
- **Real-time Updates** - Achievement progress updates immediately
- **Badge Display** - Visual achievement badges on user profiles
- **Achievement Grid** - Organized display of earned achievements
- **Progress Tracking** - Shows progress toward next achievements

### User Experience
- **Profile Integration** - Achievements prominently displayed on user profiles
- **Social Recognition** - Achievements visible to other users
- **Motivation System** - Encourages continued platform engagement
- **Fair Distribution** - Achievements for different types of users (creators, browsers, social users)

### Implementation
```typescript
// Achievement definitions
const achievement = {
  type: 'RECIPE_COUNT',
  name: 'Recipe Master',
  description: 'Post 25 amazing recipes',
  icon: '👨‍🍳',
  color: '#3B82F6',
  threshold: 25
};

// Using achievements in components
const { achievements, loading } = useUserAchievements(userId);
```

### Key Files
- `/lib/achievement-utils.ts` - Achievement logic and triggering
- `/hooks/use-achievements.ts` - Achievement data management
- `/components/achievement-badge.tsx` - Achievement display components
- `/api/users/[id]/achievements/route.ts` - Achievement API endpoints
- Database: `Achievement` and `UserAchievement` models

## Notification System
**Status: ✅ IMPLEMENTED**

Real-time notification system for user engagement:

### Notification Types
- **NEW_FOLLOWER** - When someone starts following you
- **RECIPE_COMMENT** - Comments on your recipes
- **COMPLIMENT_RECEIVED** - Tips/compliments received
- **NEW_RECIPE_FROM_FOLLOWING** - New recipes from people you follow
- **MEAL_TAG** - When tagged in meal memories

### Features
- **Real-time Updates** - Notifications appear immediately
- **Notification Bell** - Visual indicator with unread count
- **Mark as Read** - Individual and bulk read management
- **Notification Preferences** - Users can customize notification types
- **In-app Display** - Clean notification list interface

### Key Files
- `/components/ui/notification-bell.tsx` - Notification bell component
- `/lib/notification-utils.ts` - Notification creation utilities
- `/api/notifications/` - Notification management APIs
- `/app/profile/privacy/page.tsx` - Notification preferences

## Comments and Compliments System
**Status: ✅ IMPLEMENTED**

User interaction features for community engagement:

### Comments System
- **Recipe Comments** - Users can comment on recipes
- **Threaded Discussions** - Organized comment threads
- **Author Interactions** - Recipe authors can respond to comments
- **Comment Management** - Edit/delete your own comments

### Compliments System
- **Tip Integration** - Send compliments with optional Stripe tips
- **Text Messages** - Send appreciative messages to recipe/meal authors
- **Payment Processing** - Secure Stripe integration for monetary tips
- **Feature Flag Control** - Payment features can be enabled/disabled

### Key Files
- `/components/comment-form.tsx` - Comment creation interface
- `/components/compliment-form.tsx` - Compliment/tip interface
- `/api/comments/` - Comment management APIs
- `/api/compliments/` - Compliment and tipping APIs

## Page Structure and Navigation

### Core Pages
- **Homepage (`/`)** - Featured recipes with search and filtering
- **Food Feed (`/food-feed`)** - Browse all public recipes and meals
- **Recipe Pages** - Create (`/recipes/new`), view (`/recipes/[id]`), edit (`/recipes/[id]/edit`)
- **Meal Pages** - Create (`/meals/new`), view (`/meals/[id]`), edit (`/meals/[id]/edit`)

### Profile Pages
- **Personal Profile (`/profile`)** - User's own profile and content management
- **Public Profiles (`/profile/[id]`)** - View other users' public content
- **Favorites (`/profile/favorites`)** - User's favorited recipes
- **Meal Journal (`/profile/meals`)** - Personal meal memory journal
- **Privacy Settings (`/profile/privacy`)** - Notification and privacy preferences
- **Payment Setup (`/profile/payment-setup`)** - Stripe Connect integration

### Authentication Pages
- **Sign In (`/auth/signin`)** - Login with demo account shortcuts
- **Sign Up (`/auth/signup`)** - User registration

### Development/Testing Pages
- **Open Graph Test (`/test-og`)** - Test social media link previews

## UI Component Architecture

### Core UI Components
- **ShareButton** - Social sharing with copy link and native share
- **ConfirmationDialog** - Reusable confirmation dialogs
- **FollowButton** - Follow/unfollow functionality
- **NotificationBell** - Real-time notification indicator
- **Avatar** - User profile image display
- **Loading Components** - Consistent loading states throughout app

### Form Components
- **RecipeForm** - Recipe creation/editing with image upload
- **MealForm** - Meal memory creation with tagging and privacy
- **CommentForm** - Comment creation interface
- **ComplimentForm** - Tip/compliment interface
- **IngredientInput** - Structured ingredient input

### Display Components
- **RecipeCard** - Recipe preview cards with favorites
- **MealCard** - Meal memory cards
- **RecipeImageGallery** - Multiple image display with modal
- **RecipeScaleSlider** - Interactive recipe scaling
- **AchievementBadge** - Achievement display components

## Development Environment

### Environment Differences
- **Development** - Uses local PostgreSQL, shows all recipes in Featured section
- **Production** - Uses Neon PostgreSQL, Featured recipes require images
- **Feature Flags** - Payment system disabled by default for safety

### Image Storage
- **Backblaze B2** - Production image storage with CDN
- **Image Optimization** - Automatic resizing and optimization
- **Multiple Formats** - Support for various image formats and sizes

### Error Handling
- API routes return structured `{ success: boolean, data?: T, error?: string }` responses
- Custom hooks handle loading states and error management
- Error boundaries catch React component errors
- Confirmation dialogs prevent accidental destructive actions

### Database Operations
- Always use the singleton `prisma` instance from `lib/db.ts`
- Include related data with `include` option for complete objects
- Use `_count` for social feature statistics
- Proper cascade deletion for data integrity

### ⚠️ CRITICAL DATABASE SAFETY GUIDELINES ⚠️

**ALWAYS check with the user before running ANY database commands that could:**
- Delete or modify production data
- Run migrations on production
- Execute `npx prisma db push` 
- Execute `npx prisma migrate deploy`
- Drop tables or columns
- Reset databases
- Seed databases with existing data

**Before running database commands:**
1. **VERIFY** which database you're targeting by checking the DATABASE_URL
2. **ASK THE USER** for explicit permission before proceeding
3. **CONFIRM** whether it's development or production environment
4. **NEVER ASSUME** - always ask first!

**Safe commands that don't require permission:**
- `npx prisma generate` (only generates client code)
- `npx prisma studio` (read-only database browser)
- Read-only queries for inspection

**Example of checking first:**
```
Before I run `npx prisma db push`, I need to confirm:
- This will apply schema changes to your database
- Current DATABASE_URL points to: [show environment]
- Should I proceed with this database operation?
```

This prevents accidental data loss and ensures all database operations are intentional.

## File Structure Conventions

- `/app` - Next.js App Router pages and API routes
- `/components` - React components organized by feature
- `/lib` - Utility functions and shared services
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations