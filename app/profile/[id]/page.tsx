'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFollowing } from '@/hooks/use-following';
import { FollowButton } from '@/components/ui/follow-button';
import ComplimentForm from '@/components/compliment-form';
import { Instagram, Globe, ExternalLink, Edit2, Coins } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComplimentModal, setShowComplimentModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    instagramUrl: '',
    websiteUrl: ''
  });
  const [formErrors, setFormErrors] = useState({
    instagramUrl: '',
    websiteUrl: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);

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
          instagramUrl: userData.data.instagramUrl || '',
          websiteUrl: userData.data.websiteUrl || ''
        });
        
        // Reset form errors
        setFormErrors({
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    );
  }

  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || user.email}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {(user.name || user.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || user.email}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    {followStatus?.followingCount || 0} following
                  </span>
                  <span className="text-sm text-gray-500">
                    {followStatus?.followersCount || 0} followers
                  </span>
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('following')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Following ({following.length})
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'followers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Followers ({followers.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'following' ? (
              <div className="space-y-4">
                {following.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {isOwnProfile ? "You're not following anyone yet." : "Not following anyone yet."}
                  </p>
                ) : (
                  following.map((followingUser) => (
                    <div key={followingUser.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {followingUser.image ? (
                          <img
                            src={followingUser.image}
                            alt={followingUser.name || followingUser.email}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(followingUser.name || followingUser.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {followingUser.name || followingUser.email}
                          </p>
                          <p className="text-sm text-gray-500">{followingUser.email}</p>
                        </div>
                      </div>
                      <FollowButton userId={followingUser.id} variant="compact" />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {followers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {isOwnProfile ? "You don't have any followers yet." : "No followers yet."}
                  </p>
                ) : (
                  followers.map((follower) => (
                    <div key={follower.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {follower.image ? (
                          <img
                            src={follower.image}
                            alt={follower.name || follower.email}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(follower.name || follower.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {follower.name || follower.email}
                          </p>
                          <p className="text-sm text-gray-500">{follower.email}</p>
                        </div>
                      </div>
                      <FollowButton userId={follower.id} variant="compact" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}