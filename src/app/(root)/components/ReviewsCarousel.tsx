"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

export type ReviewDisplay = {
  id: string;
  name: string;
  text: string;
};

function ReviewCard({ review }: { review: ReviewDisplay }) {
  return (
    <article
      className="group relative h-full bg-white rounded-2xl border border-[var(--gray-200)] p-6 shadow-sm hover:shadow-lg hover:border-[var(--accent-400)] transition-all duration-300"
    >
      <div className="absolute top-5 right-5 opacity-20 group-hover:opacity-40 transition-opacity">
        <Quote className="w-8 h-8 text-amber-500" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-amber-500/20">
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-[var(--gray-900)]">{review.name}</h3>
        </div>
      </div>

      <p className="text-[var(--gray-700)] leading-relaxed text-sm md:text-base">
        {review.text}
      </p>

      <div className="mt-4 pt-4 border-t border-[var(--gray-100)] flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
    </article>
  );
}

function getSlidesPerView(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export function ReviewsCarousel({ reviews }: { reviews: ReviewDisplay[] }) {
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const updateSlidesPerView = () => {
      setSlidesPerView(getSlidesPerView(window.innerWidth));
    };

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(0, reviews.length - slidesPerView);
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [slidesPerView, reviews.length, currentIndex]);

  const maxIndex = Math.max(0, reviews.length - slidesPerView);
  const needsCarousel = reviews.length > slidesPerView;

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  if (!needsCarousel) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative px-8 md:px-12">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${(currentIndex * 100) / slidesPerView}%)`,
          }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="shrink-0 px-2.5"
              style={{ width: `${100 / slidesPerView}%` }}
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-3 z-10 w-10 h-10 rounded-full bg-white border border-[var(--gray-200)] shadow-md flex items-center justify-center text-[var(--gray-700)] hover:text-[var(--accent-400)] hover:border-[var(--accent-400)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        aria-label="Предыдущий отзыв"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={goNext}
        disabled={currentIndex >= maxIndex}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-3 z-10 w-10 h-10 rounded-full bg-white border border-[var(--gray-200)] shadow-md flex items-center justify-center text-[var(--gray-700)] hover:text-[var(--accent-400)] hover:border-[var(--accent-400)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        aria-label="Следующий отзыв"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              index === currentIndex
                ? "w-6 bg-[var(--accent-500)]"
                : "w-2 bg-[var(--gray-300)] hover:bg-[var(--accent-400)]"
            }`}
            aria-label={`Слайд ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
