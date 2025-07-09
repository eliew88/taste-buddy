'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { DollarSign, Heart } from 'lucide-react';
import TipModal from './tip-modal';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  recipeId?: string;
  recipeTitle?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function TipButton({
  recipientId,
  recipientName,
  recipeId,
  recipeTitle,
  className = '',
  variant = 'default'
}: TipButtonProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  if (!session?.user?.id || session.user.id === recipientId) {
    return null; // Don't show tip button to non-logged in users or to self
  }

  const baseClasses = "font-medium transition-colors";
  const sizeClasses = variant === 'compact' 
    ? "px-3 py-1 text-sm"
    : "px-4 py-2";
  
  const variantClasses = "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700";

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} rounded-lg flex items-center space-x-2 ${className}`}
      >
        <DollarSign className="w-4 h-4" />
        <span>Send Tip</span>
      </button>

      <TipModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        recipientId={recipientId}
        recipientName={recipientName}
        recipeId={recipeId}
        recipeTitle={recipeTitle}
      />
    </>
  );
}