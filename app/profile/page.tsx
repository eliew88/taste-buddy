/**
 * User Profile Page
 * 
 * Displays user information and their recipes.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Calendar, ChefHat, Heart, Settings, Plus, Loader2, Camera, CreditCard, Instagram, Globe, ExternalLink, Edit2, Shield, Trophy, X, Eye, EyeOff, Users } from 'lucide-react';
import Navigation from '@/components/ui/Navigation';
import RecipeCard from '@/components/ui/recipe-card';
import { useFavorites } from '@/hooks/use-favorites';
import { useFollowing } from '@/hooks/use-following';
import { useUserAchievements, useAchievementEvaluation } from '@/hooks/use-achievements';
import { AchievementGrid } from '@/components/achievement-badge';
import { AchievementNotification, useAchievementNotifications } from '@/components/achievement-notification';
import ComplimentsDisplay from '@/components/compliments-display';
import { IngredientEntry } from '@/types/recipe';
import Avatar from '@/components/ui/avatar';
import ProfilePhotoUpload from '@/components/ui/profile-photo-upload';
import { EmailVisibility } from '@/types/privacy';

interface UserRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: IngredientEntry[];
  instructions: string;
  cookTime?: string;
  servings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  image?: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    favorites: number;
    ratings: number;
    comments: number;
  };
  avgRating?: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { getFollowing, getFollowers } = useFollowing();
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [currentProfilePhoto, setCurrentProfilePhoto] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    instagramUrl: '',
    websiteUrl: ''
  });
  const [formErrors, setFormErrors] = useState({
    instagramUrl: '',
    websiteUrl: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [userSocialLinks, setUserSocialLinks] = useState({
    instagramUrl: null as string | null,
    websiteUrl: null as string | null
  });
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [emailVisibility, setEmailVisibility] = useState<EmailVisibility>('HIDDEN');
  
  // Use the favorites hook for persistent state management
  const { isFavorited, toggleFavorite } = useFavorites();
  
  // Achievement management
  const { achievements, loading: achievementsLoading, evaluateAchievements } = useUserAchievements();
  const { evaluateUserAchievements, evaluating } = useAchievementEvaluation();
  const { notifications, showAchievements, clearNotifications } = useAchievementNotifications();
  
  // Wrapper function to match the expected signature
  const handleFavoriteToggle = async (recipeId: string): Promise<void> => {
    await toggleFavorite(recipeId);
  };

  // Handle achievement evaluation
  const handleEvaluateAchievements = async () => {
    try {
      const result = await evaluateUserAchievements();
      if (result.newAchievements.length > 0) {
        showAchievements(result.newAchievements);
      }
    } catch (error) {
      console.error('Error evaluating achievements:', error);
    }
  };
  
  // Handle profile photo upload success
  const handlePhotoUploaded = (photoUrl: string) => {
    setCurrentProfilePhoto(photoUrl);
    setShowPhotoUpload(false);
    // Update the session data if needed
    if (session) {
      session.user.image = photoUrl;
    }
  };
  
  // Handle photo upload error
  const handlePhotoUploadError = (error: string) => {
    console.error('Photo upload error:', error);
  };

  // Initialize profile photo from session
  useEffect(() => {
    if (session?.user?.image) {
      setCurrentProfilePhoto(session.user.image);
    }
  }, [session]);

  // Fetch user's social links and follow counts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        // Fetch user profile data
        const response = await fetch(`/api/users/${session.user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setUserSocialLinks({
            instagramUrl: data.data.instagramUrl,
            websiteUrl: data.data.websiteUrl
          });
          setEditFormData({
            instagramUrl: data.data.instagramUrl || '',
            websiteUrl: data.data.websiteUrl || ''
          });
        }

        // Fetch followers count
        const followersResponse = await fetch(`/api/users/${session.user.id}/followers`);
        const followersData = await followersResponse.json();
        if (followersData.success) {
          setFollowerCount(followersData.data.length);
        }

        // Fetch following count
        const followingResponse = await fetch(`/api/users/${session.user.id}/following`);
        const followingData = await followingResponse.json();
        if (followingData.success) {
          setFollowingCount(followingData.data.length);
        }

        // Fetch privacy settings
        const privacyResponse = await fetch('/api/users/privacy');
        const privacyData = await privacyResponse.json();
        if (privacyData.success) {
          setEmailVisibility(privacyData.data.emailVisibility);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session]);

  // Fetch followers when modal opens
  useEffect(() => {
    if (showFollowersModal && session?.user?.id) {
      getFollowers(session.user.id).then(setFollowers);
    }
  }, [showFollowersModal, session?.user?.id, getFollowers]);

  // Fetch following when modal opens
  useEffect(() => {
    if (showFollowingModal && session?.user?.id) {
      getFollowing(session.user.id).then(setFollowing);
    }
  }, [showFollowingModal, session?.user?.id, getFollowing]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch user's recipes
  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        // For now, we'll fetch all recipes and filter client-side
        // In a real app, you'd have an API endpoint like /api/users/[id]/recipes
        const response = await fetch('/api/recipes');
        const data = await response.json();
        
        if (data.success) {
          // Filter recipes by current user
          const filtered = data.data.filter((recipe: UserRecipe) => 
            recipe.author.id === session.user.id
          );
          setUserRecipes(filtered);
        }
      } catch (error) {
        console.error('Error fetching user recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, [session]);

  // Social links functions
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    // Validate form before submission
    const instagramValidation = validateUrl(editFormData.instagramUrl, 'instagram');
    const websiteValidation = validateUrl(editFormData.websiteUrl, 'website');
    
    if (!instagramValidation.valid || !websiteValidation.valid) {
      setFormErrors({
        instagramUrl: instagramValidation.error || '',
        websiteUrl: websiteValidation.error || ''
      });
      return;
    }

    setUpdateLoading(true);
    try {
      // Normalize URLs before sending
      const normalizedData = {
        instagramUrl: editFormData.instagramUrl ? normalizeUrl(editFormData.instagramUrl) : '',
        websiteUrl: editFormData.websiteUrl ? normalizeUrl(editFormData.websiteUrl) : ''
      };

      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update local state
      setUserSocialLinks(normalizedData);
      setShowEditModal(false);
      setFormErrors({ instagramUrl: '', websiteUrl: '' });
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const normalizeUrl = (url: string) => {
    if (!url.trim()) return '';
    
    // Remove any whitespace
    url = url.trim();
    
    // For Instagram URLs, normalize to proper format
    if (url.includes('instagram.com') || url.includes('instagr.am')) {
      // Extract username if it's just a username without domain
      if (!url.includes('.com') && !url.includes('.am')) {
        return `https://instagram.com/${url.replace('@', '')}`;
      }
      return url.startsWith('http') ? url : `https://${url}`;
    }
    
    // For other URLs, ensure they start with https:// if not already
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  };

  const validateUrl = (url: string, type: 'instagram' | 'website') => {
    if (!url.trim()) return { valid: true, error: null };
    
    try {
      const normalizedUrl = normalizeUrl(url);
      const urlObj = new URL(normalizedUrl);
      
      if (type === 'instagram') {
        const validInstagramDomains = ['instagram.com', 'www.instagram.com', 'instagr.am', 'www.instagr.am'];
        if (!validInstagramDomains.includes(urlObj.hostname)) {
          return { valid: false, error: 'Please enter a valid Instagram URL' };
        }
      }
      
      return { valid: true, error: null };
    } catch {
      return { valid: false, error: `Please enter a valid ${type} URL` };
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Get email visibility display info
  const getEmailVisibilityInfo = (visibility: EmailVisibility) => {
    switch (visibility) {
      case 'HIDDEN':
        return { icon: EyeOff, label: 'Hidden from others', color: 'text-gray-500' };
      case 'FOLLOWING_ONLY':
        return { icon: Users, label: 'Visible to people you follow', color: 'text-blue-500' };
      case 'PUBLIC':
        return { icon: Eye, label: 'Visible to everyone', color: 'text-green-500' };
      default:
        return { icon: EyeOff, label: 'Hidden', color: 'text-gray-500' };
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-green-700" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar
                  imageUrl={currentProfilePhoto}
                  name={session.user?.name}
                  size="xl"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPhotoUpload(true);
                  }}
                  className="absolute bottom-0 right-0 p-1.5 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors shadow-lg"
                  title="Change profile photo"
                  type="button"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{session.user?.name}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{session.user?.email}</span>
                    <div className="flex items-center space-x-1 ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {(() => {
                        const visibilityInfo = getEmailVisibilityInfo(emailVisibility);
                        const IconComponent = visibilityInfo.icon;
                        return (
                          <>
                            <IconComponent className={`w-3 h-3 ${visibilityInfo.color}`} />
                            <span className={visibilityInfo.color}>{visibilityInfo.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date().getFullYear()}</span>
                  </div>
                </div>
                
                {/* Social Links */}
                {(userSocialLinks.instagramUrl || userSocialLinks.websiteUrl) && (
                  <div className="flex items-center space-x-3 mt-3">
                    {userSocialLinks.instagramUrl && (
                      <a
                        href={userSocialLinks.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 transition-colors"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                        <span className="text-sm">Instagram</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {userSocialLinks.websiteUrl && (
                      <a
                        href={userSocialLinks.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Website"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowEditModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Edit Profile"
              >
                <Settings className="w-5 h-5" />
              </button>
              <Link
                href="/profile/privacy"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Privacy Settings"
              >
                <Shield className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{userRecipes.length}</div>
              <div className="text-sm text-gray-600">Recipes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {userRecipes.reduce((sum, recipe) => sum + recipe._count.favorites, 0)}
              </div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {userRecipes.reduce((sum, recipe) => sum + recipe._count.ratings, 0)}
              </div>
              <div className="text-sm text-gray-600">Ratings</div>
            </div>
            <button
              onClick={() => setShowFollowersModal(true)}
              className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-2xl font-bold text-blue-600">{followerCount}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </button>
            <button
              onClick={() => setShowFollowingModal(true)}
              className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-2xl font-bold text-purple-600">{followingCount}</div>
              <div className="text-sm text-gray-600">Following</div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/recipes/new"
            className="bg-green-700 text-white p-4 rounded-lg hover:bg-green-800 transition-colors flex items-center space-x-3"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Recipe</span>
          </Link>
          <Link
            href="/profile/favorites"
            className="bg-white border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
          >
            <Heart className="w-5 h-5" />
            <span className="font-medium">My Favorites</span>
          </Link>
          <Link
            href="/food-feed"
            className="bg-white border border-gray-200 text-gray-700 p-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
          >
            <ChefHat className="w-5 h-5" />
            <span className="font-medium">Discover Recipes</span>
          </Link>
          <Link
            href="/profile/payment-setup"
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-3"
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Payment Setup</span>
          </Link>
        </div>

        {/* User's Recipes */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Recipes</h2>
            {userRecipes.length > 0 && (
              <span className="text-sm text-gray-600">
                {userRecipes.length} recipe{userRecipes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-700 mx-auto mb-4" />
              <p className="text-gray-600">Loading your recipes...</p>
            </div>
          ) : userRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
              <p className="text-gray-600 mb-6">
                Start sharing your culinary creations with the TasteBuddy community!
              </p>
              <Link
                href="/recipes/new"
                className="inline-flex items-center space-x-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Recipe</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  showFavoriteButton={true}
                  isFavorited={isFavorited(recipe.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Compliments Section */}
        <div className="mb-8">
          <ComplimentsDisplay 
            userId={session.user.id}
            isOwnProfile={true}
          />
        </div>
        
        {/* Achievement Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">My Achievements</h2>
            </div>
            <div className="flex items-center space-x-3">
              {achievements.length > 0 && (
                <span className="text-sm text-gray-600">
                  {achievements.length} earned
                </span>
              )}
              <button
                onClick={handleEvaluateAchievements}
                disabled={evaluating}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {evaluating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trophy className="w-4 h-4" />
                )}
                <span>{evaluating ? 'Checking...' : 'Check for New Achievements'}</span>
              </button>
            </div>
          </div>

          {achievementsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading achievements...</p>
            </div>
          ) : (
            <AchievementGrid 
              achievements={achievements}
              size="md"
              showDates={true}
            />
          )}
        </div>
        
        {/* Profile Photo Upload Modal */}
        {showPhotoUpload && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              // Close modal only if clicking the backdrop
              if (e.target === e.currentTarget) {
                setShowPhotoUpload(false);
              }
            }}
          >
            <div 
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Update Profile Photo</h2>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPhotoUpload(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  type="button"
                >
                  ×
                </button>
              </div>
              
              <ProfilePhotoUpload
                currentPhotoUrl={currentProfilePhoto}
                userName={session.user?.name}
                onPhotoUploaded={handlePhotoUploaded}
                onUploadError={handlePhotoUploadError}
              />
            </div>
          </div>
        )}
        
        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    id="instagramUrl"
                    value={editFormData.instagramUrl}
                    onChange={(e) => handleFormChange('instagramUrl', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formErrors.instagramUrl 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="https://instagram.com/yourusername or just @yourusername"
                  />
                  {formErrors.instagramUrl && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.instagramUrl}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    id="websiteUrl"
                    value={editFormData.websiteUrl}
                    onChange={(e) => handleFormChange('websiteUrl', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      formErrors.websiteUrl 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="https://yourwebsite.com"
                  />
                  {formErrors.websiteUrl && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.websiteUrl}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Achievement Notifications */}
      <AchievementNotification 
        achievements={notifications}
        onClose={clearNotifications}
      />

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Followers</h2>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {followers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No followers yet</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {followers.map((follower) => (
                    <Link
                      key={follower.id}
                      href={`/profile/${follower.id}`}
                      className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      {follower.image ? (
                        <img
                          src={follower.image}
                          alt={follower.name || follower.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            {(follower.name || follower.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {follower.name || follower.email}
                        </p>
                        <p className="text-xs text-gray-500">{follower.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Following</h2>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {following.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Not following anyone yet</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {following.map((followedUser) => (
                    <Link
                      key={followedUser.id}
                      href={`/profile/${followedUser.id}`}
                      className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      {followedUser.image ? (
                        <img
                          src={followedUser.image}
                          alt={followedUser.name || followedUser.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            {(followedUser.name || followedUser.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {followedUser.name || followedUser.email}
                        </p>
                        <p className="text-xs text-gray-500">{followedUser.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}