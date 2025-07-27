/**
 * Recipe Image Gallery Component
 * 
 * Displays multiple recipe images in a responsive grid layout with:
 * - Primary photo emphasis
 * - Lightbox/modal for full-size viewing
 * - Responsive design
 * - Fallback for legacy single images
 */

'use client';

import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Image as ImageIcon,
  ChefHat
} from 'lucide-react';
import { RecipeImage } from '@/types/recipe';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';

interface RecipeImageGalleryProps {
  /** Array of recipe images */
  images?: RecipeImage[];
  /** Recipe title for alt text */
  recipeTitle: string;
  /** Legacy single image URL (fallback) */
  legacyImage?: string;
  /** Optional CSS class */
  className?: string;
}

interface ImageModalProps {
  images: (RecipeImage | { url: string; caption?: string; alt?: string })[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  recipeTitle: string;
}

/**
 * Full-screen image modal with navigation
 */
const ImageModal: React.FC<ImageModalProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
  recipeTitle
}) => {
  const currentImage = images[currentIndex];
  
  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  };
  
  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        aria-label="Close image gallery"
      >
        <X className="w-8 h-8" />
      </button>
      
      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}
      
      {/* Image */}
      <div 
        className="max-w-6xl max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getOptimizedImageUrl(currentImage.url) || currentImage.url}
          alt={currentImage.alt || `${recipeTitle} - Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Image Info */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-white">
        {currentImage.caption && (
          <p className="text-lg mb-2">{currentImage.caption}</p>
        )}
        {images.length > 1 && (
          <p className="text-sm text-gray-300">
            {currentIndex + 1} of {images.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default function RecipeImageGallery({
  images = [],
  recipeTitle,
  legacyImage,
  className = ''
}: RecipeImageGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Prepare images array with fallback to legacy image
  const displayImages = React.useMemo(() => {
    if (images && images.length > 0) {
      // Sort images by display order and primary status
      return [...images].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
    } else if (legacyImage) {
      // Fallback to legacy single image
      return [{
        url: legacyImage,
        alt: `${recipeTitle} recipe image`,
        caption: undefined
      }];
    }
    return [];
  }, [images, legacyImage, recipeTitle]);

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const navigateToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Don't render if no images
  if (displayImages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No images to display</p>
        <p className="text-sm">Images: {JSON.stringify(images?.map(i => i.url) || [])}</p>
        <p className="text-sm">Legacy: {legacyImage}</p>
      </div>
    );
  }


  // Single image layout
  if (displayImages.length === 1) {
    const image = displayImages[0];
    const imageSrc = getOptimizedImageUrl(image.url) || image.url;
    
    return (
      <div className={`space-y-4 ${className}`}>
        <div 
          className="bg-gray-200 relative group cursor-pointer rounded-lg flex items-center justify-center" 
          onClick={() => openModal(0)}
          style={{ minHeight: '300px' }}
        >
          <img 
            src={imageSrc} 
            alt={image.alt || `${recipeTitle} recipe image`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
        
        {image.caption && (
          <p className="text-gray-600 text-sm italic text-center">{image.caption}</p>
        )}
        
        {modalOpen && (
          <ImageModal
            images={displayImages}
            currentIndex={currentImageIndex}
            onClose={closeModal}
            onNavigate={navigateToImage}
            recipeTitle={recipeTitle}
          />
        )}
      </div>
    );
  }

  // Multiple images layout
  const primaryImage = displayImages[0];
  const secondaryImages = displayImages.slice(1);
  const primaryImageSrc = getOptimizedImageUrl(primaryImage.url) || primaryImage.url;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Image */}
      <div 
        className="bg-gray-200 relative group rounded-lg cursor-pointer flex items-center justify-center"
        onClick={() => openModal(0)}
        style={{ minHeight: '400px' }}
      >
        <img 
          src={primaryImageSrc} 
          alt={primaryImage.alt || `${recipeTitle} - Primary image`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
      
      {primaryImage.caption && (
        <p className="text-gray-600 text-sm italic text-center">{primaryImage.caption}</p>
      )}
      
      {/* Secondary Images Grid */}
      {secondaryImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {secondaryImages.slice(0, 6).map((image, index) => {
            const actualIndex = index + 1; // +1 because primary is index 0
            const isLast = index === 5 && secondaryImages.length > 6;
            const remainingCount = secondaryImages.length - 6;
            
            return (
              <div key={actualIndex} className="space-y-2">
                <div
                  className="relative cursor-pointer group aspect-square overflow-hidden rounded-md"
                  onClick={() => openModal(actualIndex)}
                >
                  <img
                    src={getOptimizedImageUrl(image.url) || image.url}
                    alt={image.alt || `${recipeTitle} - Image ${actualIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {image.caption && (
                  <p className="text-gray-600 text-xs italic text-center leading-relaxed">
                    {image.caption}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Modal */}
      {modalOpen && (
        <ImageModal
          images={displayImages}
          currentIndex={currentImageIndex}
          onClose={closeModal}
          onNavigate={navigateToImage}
          recipeTitle={recipeTitle}
        />
      )}
    </div>
  );
}