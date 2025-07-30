'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFollowing } from '@/hooks/use-following';
import { FollowButton } from '@/components/ui/follow-button';
import ComplimentForm from '@/components/compliment-form';
import Navigation from '@/components/ui/Navigation';
import RecipeCard from '@/components/ui/recipe-card';
import MealCard from '@/components/ui/meal-card';
import { useFavorites } from '@/hooks/use-favorites';
import { useUserAchievements } from '@/hooks/use-achievements';
import { AchievementGrid } from '@/components/achievement-badge';
import { Recipe } from '@/types/recipe';
import { Meal } from '@/types/meal';
import { Instagram, Globe, ExternalLink, Edit2, Coins, X, ChefHat, Loader2, Trophy, Utensils } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio?: string | null;
  createdAt: Date;
  followedAt?: Date;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
}

interface FollowStatus {
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
  canFollow: boolean;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const { getFollowStatus, getFollowing, getFollowers } = useFollowing();
  const { isFavorited, toggleFavorite } = useFavorites();
  const [user, setUser] = useState<User | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [userMeals, setUserMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { achievements: userAchievements, loading: achievementsLoading } = useUserAchievements(userId);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bio: '',
    instagramUrl: '',
    websiteUrl: ''
  });
  const [formErrors, setFormErrors] = useState({
    bio: '',
    instagramUrl: '',
    websiteUrl: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Handle favorite toggle for recipe cards
  const handleFavoriteToggle = async (recipeId: string): Promise<void> => {
    await toggleFavorite(recipeId);
  };

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        // Fetch user info (we'll need to create this API endpoint)
        const userResponse = await fetch(`/api/users/${userId}`);
        const userData = await userResponse.json();

        if (!userData.success) {
          throw new Error(userData.error || 'Failed to fetch user data');
        }

        setUser(userData.data);
        
        // Pre-fill edit form with current data
        setEditFormData({
          bio: userData.data.bio || '',
          instagramUrl: userData.data.instagramUrl || '',
          websiteUrl: userData.data.websiteUrl || ''
        });
        
        // Reset form errors
        setFormErrors({
          bio: '',
          instagramUrl: '',
          websiteUrl: ''
        });

        // Fetch follow status
        const status = await getFollowStatus(userId);
        if (status) {
          setFollowStatus(status);
        }

        // Fetch following and followers lists
        const [followingData, followersData] = await Promise.all([
          getFollowing(userId),
          getFollowers(userId)
        ]);

        setFollowing(followingData);
        setFollowers(followersData);

        // Fetch user's recipes and meals in parallel
        const fetchUserContent = async () => {
          // Fetch recipes
          setRecipesLoading(true);
          try {
            const recipesResponse = await fetch(`/api/users/${userId}/recipes`);
            const recipesData = await recipesResponse.json();
            
            if (recipesData.success) {
              setUserRecipes(recipesData.data);
            }
          } catch (recipesErr) {
            console.error('Error fetching user recipes:', recipesErr);
          } finally {
            setRecipesLoading(false);
          }

          // Fetch meals
          setMealsLoading(true);
          try {
            const mealsResponse = await fetch(`/api/users/${userId}/meals`);
            const mealsData = await mealsResponse.json();
            
            if (mealsData.success) {
              setUserMeals(mealsData.data);
            }
          } catch (mealsErr) {
            console.error('Error fetching user meals:', mealsErr);
          } finally {
            setMealsLoading(false);
          }
        };

        fetchUserContent();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserData();
    }
  }, [userId, session, getFollowStatus, getFollowing, getFollowers]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Validate form before submission
    const instagramValidation = validateUrl(editFormData.instagramUrl, 'instagram');
    const websiteValidation = validateUrl(editFormData.websiteUrl, 'website');
    
    // Validate bio length
    if (editFormData.bio && editFormData.bio.length > 500) {
      setFormErrors({
        bio: 'Bio must be 500 characters or less',
        instagramUrl: '',
        websiteUrl: ''
      });
      return;
    }
    
    if (!instagramValidation.valid || !websiteValidation.valid) {
      setFormErrors({
        bio: '',
        instagramUrl: instagramValidation.error || '',
        websiteUrl: websiteValidation.error || ''
      });
      return;
    }

    setUpdateLoading(true);
    try {
      // Normalize URLs before sending
      const normalizedData = {
        bio: editFormData.bio || '',
        instagramUrl: editFormData.instagramUrl ? normalizeUrl(editFormData.instagramUrl) : '',
        websiteUrl: editFormData.websiteUrl ? normalizeUrl(editFormData.websiteUrl) : ''
      };

      const response = await fetch(`/api/users/${userId}`, {
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

      // Update local user state
      setUser(prevUser => prevUser ? { ...prevUser, ...normalizedData } : null);
      setShowEditModal(false);
      setFormErrors({ bio: '', instagramUrl: '', websiteUrl: '' });
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'User not found'}</p>
            <button
              onClick={() => window.history.back()}
              className="text-blue-500 hover:text-blue-700"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || user.email}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-600">
                    {(user.name || user.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || user.email}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                {user.bio && (
                  <p className="text-gray-700 mt-2 text-sm max-w-md">{user.bio}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <span className="font-semibold">{followStatus?.followingCount || 0}</span> following
                  </button>
                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <span className="font-semibold">{followStatus?.followersCount || 0}</span> followers
                  </button>
                </div>
                
                {/* Social Links */}
                {(user.instagramUrl || user.websiteUrl) && (
                  <div className="flex items-center space-x-3 mt-3">
                    {user.instagramUrl && (
                      <a
                        href={user.instagramUrl}
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
                    {user.websiteUrl && (
                      <a
                        href={user.websiteUrl}
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
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowComplimentModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  title="Compliments to the Chef"
                >
                  <Coins className="w-4 h-4" />
                  <span className="font-serif italic">Compliments to the chef</span>
                </button>
                <FollowButton userId={user.id} />
              </div>
            )}
          </div>
        </div>

        {/* User's Recipes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isOwnProfile ? 'My Recipes' : `${user.name || user.email}'s Recipes`}
            </h2>
            {userRecipes.length > 0 && (
              <span className="text-sm text-gray-600">
                {userRecipes.length} recipe{userRecipes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {recipesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-700 mx-auto mb-4" />
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          ) : userRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isOwnProfile ? 'No recipes yet' : 'No recipes shared yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isOwnProfile 
                  ? 'Start sharing your culinary creations with the TasteBuddy community!'
                  : `${user.name || user.email} hasn't shared any recipes yet.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRecipes.map((recipe) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe}
                  showFavoriteButton={!isOwnProfile}
                  isFavorited={isFavorited(recipe.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* User's Meal Memories */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Utensils className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {isOwnProfile ? 'My Meal Memories' : `${user.name || user.email}'s Meal Memories`}
              </h2>
            </div>
            {userMeals.length > 0 && (
              <span className="text-sm text-gray-600">
                {userMeals.length} meal{userMeals.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {mealsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading meal memories...</p>
            </div>
          ) : userMeals.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isOwnProfile ? 'No meal memories yet' : 'No public meal memories'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isOwnProfile 
                  ? 'Start capturing your memorable meals with photos and stories!'
                  : `${user.name || user.email} hasn't shared any public meal memories yet.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userMeals.map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Achievement Badges */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">
                {isOwnProfile ? 'My Achievements' : 'Achievements'}
              </h2>
            </div>
            {userAchievements.length > 0 && (
              <span className="text-sm text-gray-600">
                {userAchievements.length} earned
              </span>
            )}
          </div>

          {achievementsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading achievements...</p>
            </div>
          ) : (
            <AchievementGrid 
              achievements={userAchievements}
              size="md"
              showDates={isOwnProfile}
              maxDisplay={isOwnProfile ? undefined : 6}
            />
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={editFormData.bio}
                  onChange={(e) => handleFormChange('bio', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none ${
                    formErrors.bio 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Tell people a little about yourself..."
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.bio ? (
                    <p className="text-sm text-red-600">{formErrors.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Optional</p>
                  )}
                  <p className="text-sm text-gray-400">{editFormData.bio.length}/500</p>
                </div>
              </div>

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
      
      {/* Compliment Modal */}
      <ComplimentForm
        isOpen={showComplimentModal}
        onClose={() => setShowComplimentModal(false)}
        toUserId={user.id}
        toUserName={user.name || user.email}
        onComplimentSent={() => {
          console.log('Compliment sent successfully!');
        }}
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
                    <div key={follower.id} className="flex items-center space-x-3">
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
                    </div>
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
                    <div key={followedUser.id} className="flex items-center space-x-3">
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
                    </div>
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