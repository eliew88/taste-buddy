/**
 * Comments Section Component
 * 
 * Displays all comments for a recipe with proper visibility indicators
 * 
 * Features:
 * - Displays comments in chronological order (newest first)
 * - Shows visibility indicators for each comment
 * - Responsive design
 * - Loading states
 * - Empty state handling
 * - User avatars and timestamps
 * - Proper visibility filtering based on user permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MessageSquare, 
  Lock, 
  Users, 
  Globe, 
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Avatar from '@/components/ui/avatar';

interface Comment {
  id: string;
  content: string;
  visibility: 'private' | 'author_only' | 'public';
  createdAt: string;
  updatedAt: string;
  userId: string;
  recipeId: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface CommentsSectionProps {
  recipeId: string;
  recipeAuthorId: string;
  onRefresh?: () => void;
  newComment?: Comment | null;
}

export default function CommentsSection({ 
  recipeId, 
  recipeAuthorId, 
  onRefresh,
  newComment 
}: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/comments?recipeId=${recipeId}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [recipeId]);

  // Handle new comment from parent component
  useEffect(() => {
    if (newComment) {
      setComments(prev => [newComment, ...prev]);
    }
  }, [newComment]);

  const handleNewComment = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
  };

  const getVisibilityIndicator = (comment: Comment) => {
    // Only show visibility indicator if user is the comment author or recipe author
    const canSeeVisibility = session?.user?.id === comment.userId || session?.user?.id === recipeAuthorId;
    
    if (!canSeeVisibility) {
      return null;
    }

    const indicators = {
      private: {
        icon: Lock,
        label: 'Private',
        color: 'text-red-600 bg-red-50 border-red-200',
        tooltip: 'Only you can see this comment'
      },
      author_only: {
        icon: Users,
        label: 'Author Only',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        tooltip: 'Only you and the recipe author can see this comment'
      },
      public: {
        icon: Globe,
        label: 'Public',
        color: 'text-green-600 bg-green-50 border-green-200',
        tooltip: 'Everyone can see this comment'
      }
    };

    const indicator = indicators[comment.visibility];
    const Icon = indicator.icon;

    return (
      <div 
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${indicator.color}`}
        title={indicator.tooltip}
      >
        <Icon className="w-3 h-3 mr-1" />
        {indicator.label}
      </div>
    );
  };

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

  const getCommentCountText = () => {
    const count = comments.length;
    if (count === 0) return 'No comments yet';
    if (count === 1) return '1 comment';
    return `${count} comments`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
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
          <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={fetchComments}
            className="mt-2 flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
        </div>
        <span className="text-sm text-gray-500">{getCommentCountText()}</span>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start space-x-3">
                {/* User Avatar */}
                <Avatar
                  imageUrl={comment.user.image}
                  name={comment.user.name}
                  size="sm"
                  className="flex-shrink-0"
                />

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  {/* Comment Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {comment.user.name || 'Anonymous'}
                      </span>
                      {comment.userId === recipeAuthorId && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Author
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getVisibilityIndicator(comment)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

}