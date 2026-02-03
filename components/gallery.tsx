'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FragranceGalleryClient({
  images,
  fragranceName,
}: {
  images?: { url: string; author?: string }[];
  fragranceName: string;
}) {
  const [activeImage, setActiveImage] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    if (activeImage !== null && activeImage > 0) {
      setActiveImage(activeImage - 1);
    }
  };

  const handleNext = () => {
    if (activeImage !== null && activeImage < images.length - 1) {
      setActiveImage(activeImage + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setActiveImage(null);
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <div className="mt-6">
      <h2 className="text-base lg:text-lg font-semibold mb-4">Fragrance Photo Gallery</h2>

      {/* Thumbnails */}
      <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(idx)}
            className="relative w-32 h-40 sm:w-40 sm:h-52 lg:w-48 lg:h-64 flex-shrink-0 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
          >
            <Image
              unoptimized
              src={img.url}
              alt={fragranceName}
              fill
              sizes="(max-width: 640px) 128px, 192px"
              className="object-cover rounded-lg shadow-md"
            />
          </button>
        ))}
      </div>

      {/* Modal viewer */}
      {activeImage !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors z-10"
            onClick={() => setActiveImage(null)}
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>

          <div className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto px-4 flex items-center justify-center">
            <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
              <Image
                unoptimized
                src={images[activeImage].url}
                alt={`Fragrance photo ${activeImage + 1}`}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 1024px) 90vw, 1280px"
              />
            </div>

            {/* Left arrow */}
            {activeImage > 0 && (
              <button
                className="absolute left-2 lg:left-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                onClick={handlePrevious}
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Right arrow */}
            {activeImage < images.length - 1 && (
              <button
                className="absolute right-2 lg:right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white text-sm bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            {activeImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}