/**
 * Compliments Display Component
 * 
 * Shows compliments received by a user on their profile page
 * 
 * Features:
 * - Displays all compliments received by the user
 * - Shows message and tip compliments differently
 * - Handles anonymous compliments
 * - Shows recipe context when available
 * - Responsive design
 * - Loading states and empty states
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Heart, 
  DollarSign, 
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  Gift,
  EyeOff,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Compliment } from '@/types/recipe';

interface ComplimentsDisplayProps {
  /** ID of the user whose compliments to display */
  userId: string;
  /** Whether this is the current user's own profile */
  isOwnProfile: boolean;
}

export default function ComplimentsDisplay({ userId, isOwnProfile }: ComplimentsDisplayProps) {
  const { data: session } = useSession();
  const [compliments, setCompliments] = useState<Compliment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompliments = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch(`/api/compliments?toUserId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setCompliments(data.data);
      } else {
        setError(data.error || 'Failed to load compliments');
      }
    } catch (err) {
      setError('Failed to load compliments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authenticated and viewing their own profile
    if (session?.user?.id && isOwnProfile && session.user.id === userId) {
      fetchCompliments();
    } else {
      setLoading(false);
    }
  }, [userId, isOwnProfile, session?.user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getComplimentStats = () => {
    const messageCount = compliments.filter(c => c.type === 'message').length;
    const tipCount = compliments.filter(c => c.type === 'tip').length;
    
    // Calculate total tips with extra safety
    let totalTips = 0;
    try {
      totalTips = compliments
        .filter(c => c.type === 'tip' && c.tipAmount !== null && c.tipAmount !== undefined)
        .reduce((sum, c) => {
          const amount = typeof c.tipAmount === 'number' ? c.tipAmount : parseFloat(String(c.tipAmount));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    } catch (error) {
      console.error('Error calculating total tips:', error);
      totalTips = 0;
    }
    
    return { 
      messageCount, 
      tipCount, 
      totalTips: typeof totalTips === 'number' && !isNaN(totalTips) ? totalTips : 0 
    };
  };

  // Don't show compliments to other users (privacy)
  if (!isOwnProfile) {
    return null;
  }

  // Don't show if not authenticated
  if (!session?.user?.id) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-pink-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Compliments Received</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-pink-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Compliments Received</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={fetchCompliments}
            className="mt-2 flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = getComplimentStats();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Heart className="w-5 h-5 text-pink-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Compliments Received</h3>
        </div>
        <span className="text-sm text-gray-500">
          {compliments.length} total
        </span>
      </div>

      {/* Stats Summary */}
      {compliments.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
            <div className="flex items-center">
              <Heart className="w-4 h-4 text-pink-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-pink-800">{stats.messageCount}</p>
                <p className="text-xs text-pink-600">Messages</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {stats.tipCount} ({(() => {
                    const total = stats.totalTips;
                    if (typeof total === 'number' && !isNaN(total) && total > 0) {
                      return `$${total.toFixed(2)}`;
                    }
                    return '$0';
                  })()})
                </p>
                <p className="text-xs text-green-600">Tips</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliments List */}
      {compliments.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No compliments yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            When people appreciate your recipes, their compliments will appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {compliments.map((compliment) => (
            <div key={compliment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  compliment.type === 'tip' ? 'bg-green-100' : 'bg-pink-100'
                }`}>
                  {compliment.type === 'tip' ? (
                    <DollarSign className="w-5 h-5 text-green-600" />
                  ) : (
                    <Heart className="w-5 h-5 text-pink-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {compliment.fromUser.name}
                      </span>
                      {compliment.isAnonymous && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Anonymous
                        </span>
                      )}
                      {compliment.type === 'tip' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {compliment.tipAmount && typeof compliment.tipAmount === 'number' ? `$${compliment.tipAmount.toFixed(2)}` : 'Tip'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(compliment.createdAt.toString())}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 leading-relaxed mb-3">
                    {compliment.message}
                  </p>

                  {/* Recipe Context */}
                  {compliment.recipe && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">About recipe:</span>
                          <span className="font-medium text-gray-900">
                            {compliment.recipe.title}
                          </span>
                        </div>
                        <Link
                          href={`/recipes/${compliment.recipe.id}`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                        >
                          View Recipe
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Tip Status */}
                  {compliment.type === 'tip' && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        compliment.paymentStatus === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : compliment.paymentStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {compliment.paymentStatus === 'completed' && '✓ Processed'}
                        {compliment.paymentStatus === 'failed' && '✗ Failed'}
                        {compliment.paymentStatus === 'pending' && '⏳ Payment Coming Soon'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}