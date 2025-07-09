/**
 * Comment Form Component
 * 
 * Allows users to create comments on recipes with visibility settings
 * 
 * Features:
 * - Textarea for comment content
 * - Dropdown for visibility selection (private, author_only, public)
 * - Clear visual indication of visibility levels
 * - Form validation and submission
 * - Loading states
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Lock, 
  Users, 
  Globe, 
  MessageSquare, 
  Send,
  AlertCircle 
} from 'lucide-react';

interface CommentFormProps {
  recipeId: string;
  onCommentCreated?: (comment: any) => void;
}

export default function CommentForm({ recipeId, onCommentCreated }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'author_only' | 'public'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show form if user is not authenticated
  if (!session?.user?.id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
        <p className="text-yellow-800">Please sign in to leave a comment</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          visibility,
          recipeId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContent('');
        setVisibility('public');
        onCommentCreated?.(data.data);
      } else {
        setError(data.error || 'Failed to create comment');
      }
    } catch (err) {
      setError('Failed to create comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVisibilityInfo = (visibilityLevel: string) => {
    switch (visibilityLevel) {
      case 'private':
        return {
          icon: Lock,
          label: 'Private',
          description: 'Only you can see this comment',
          color: 'text-red-600 bg-red-50'
        };
      case 'author_only':
        return {
          icon: Users,
          label: 'Author Only',
          description: 'Only you and the recipe author can see this comment',
          color: 'text-yellow-600 bg-yellow-50'
        };
      case 'public':
        return {
          icon: Globe,
          label: 'Public',
          description: 'Everyone can see this comment',
          color: 'text-green-600 bg-green-50'
        };
      default:
        return {
          icon: Globe,
          label: 'Public',
          description: 'Everyone can see this comment',
          color: 'text-green-600 bg-green-50'
        };
    }
  };

  const visibilityInfo = getVisibilityInfo(visibility);
  const Icon = visibilityInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-4">
        <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Leave a Comment</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Comment Content */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            id="comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            rows={4}
            placeholder="Share your thoughts about this recipe..."
            disabled={isSubmitting}
          />
        </div>

        {/* Visibility Selection */}
        <div>
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
            Who can see this comment?
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'private' | 'author_only' | 'public')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={isSubmitting}
          >
            <option value="public">🌍 Public - Everyone can see</option>
            <option value="author_only">👥 Author Only - You and recipe author</option>
            <option value="private">🔒 Private - Only you can see</option>
          </select>
          
          {/* Visibility Info */}
          <div className={`mt-2 p-2 rounded-lg ${visibilityInfo.color}`}>
            <div className="flex items-center text-sm">
              <Icon className="w-4 h-4 mr-2" />
              <span className="font-medium">{visibilityInfo.label}:</span>
              <span className="ml-1">{visibilityInfo.description}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubmitting || !content.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-700 text-white hover:bg-green-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}