/**
 * CommentForm Component
 * 
 * Form for creating and editing comments on recipes with visibility controls.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, Eye, EyeOff, Users, Loader2 } from 'lucide-react';
import { CreateCommentData } from '@/types/recipe';

interface CommentFormProps {
  /** Recipe ID to comment on */
  recipeId: string;
  
  /** Recipe author ID for determining visibility options */
  recipeAuthorId: string;
  
  /** Callback when comment is successfully created */
  onCommentCreated?: (comment: any) => void;
  
  /** Optional placeholder text */
  placeholder?: string;
  
  /** Whether to show the form in compact mode */
  compact?: boolean;
}

/**
 * CommentForm Component
 * 
 * Features:
 * - Rich text input for comment content
 * - Visibility selector with clear icons and descriptions
 * - Real-time character count
 * - Loading states and error handling
 * - Authentication check
 */
export default function CommentForm({ 
  recipeId, 
  recipeAuthorId, 
  onCommentCreated, 
  placeholder = "Share your thoughts about this recipe...",
  compact = false 
}: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'author_only' | 'public'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentUserRecipeAuthor = session?.user?.id === recipeAuthorId;

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError('Please sign in to comment');
      return;
    }

    if (!content.trim()) {
      setError('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const commentData: CreateCommentData = {
        content: content.trim(),
        visibility,
        recipeId,
      };

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      const result = await response.json();

      if (result.success) {
        setContent('');
        setVisibility('public');
        onCommentCreated?.(result.data);
      } else {
        setError(result.error || 'Failed to create comment');
      }
    } catch (err) {
      setError('Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get visibility option details
   */
  const getVisibilityDetails = (vis: 'private' | 'author_only' | 'public') => {
    switch (vis) {
      case 'private':
        return {
          icon: <EyeOff className="w-4 h-4" />,
          label: 'Only me',
          description: 'Only you can see this comment',
          color: 'text-gray-600 bg-gray-50'
        };
      case 'author_only':
        return {
          icon: <Users className="w-4 h-4" />,
          label: isCurrentUserRecipeAuthor ? 'Only me' : 'Me + recipe author',
          description: isCurrentUserRecipeAuthor 
            ? 'Only you can see this comment' 
            : 'Only you and the recipe author can see this comment',
          color: 'text-blue-600 bg-blue-50'
        };
      case 'public':
        return {
          icon: <Eye className="w-4 h-4" />,
          label: 'Everyone',
          description: 'Anyone can see this comment',
          color: 'text-green-600 bg-green-50'
        };
    }
  };

  // Don't show form if user is not signed in
  if (!session?.user) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-gray-50 border border-gray-200 rounded-lg text-center`}>
        <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-4">Sign in to share your thoughts about this recipe</p>
        <button className="text-green-700 hover:text-green-800 font-medium">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
      {/* Comment Input */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 3 : 4}
          maxLength={1000}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 resize-none ${
            compact ? 'text-sm' : ''
          }`}
          disabled={isSubmitting}
        />
        
        {/* Character Count */}
        <div className="flex justify-between items-center mt-2">
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {content.length}/1000 characters
          </span>
          
          {content.length > 900 && (
            <span className={`text-amber-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {1000 - content.length} characters remaining
            </span>
          )}
        </div>
      </div>

      {/* Visibility Selector */}
      <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
        <label className={`block font-medium text-gray-700 ${compact ? 'text-sm' : ''}`}>
          Who can see this comment?
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['private', 'author_only', 'public'] as const).map((vis) => {
            const details = getVisibilityDetails(vis);
            return (
              <button
                key={vis}
                type="button"
                onClick={() => setVisibility(vis)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  visibility === vis
                    ? `border-green-500 ${details.color}`
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                } ${compact ? 'p-2' : 'p-3'}`}
              >
                <div className="flex items-center space-x-2">
                  {details.icon}
                  <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
                    {details.label}
                  </span>
                </div>
                <p className={`text-gray-600 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {details.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className={`flex items-center space-x-2 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 focus:ring-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            compact ? 'text-sm px-4 py-2' : 'px-6 py-2'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Post Comment</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}