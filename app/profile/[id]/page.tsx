'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFollowing } from '@/hooks/use-following';
import { FollowButton } from '@/components/ui/follow-button';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  followedAt?: Date;
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
              </div>
            </div>
            {!isOwnProfile && (
              <FollowButton userId={user.id} />
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
    </div>
  );
}