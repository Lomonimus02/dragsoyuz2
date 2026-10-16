"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;

export function ImageModal({ isOpen, onClose, imageUrl, alt }: ImageModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  // Сброс при закрытии
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Закрытие по Escape
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Блокируем скролл body и все события когда модалка открыта
  useEffect(() => {
    if (isOpen) {
      // Блокируем скролл
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.addEventListener("keydown", handleEscape);
      
      // Блокируем колесико мыши на уровне документа
      const preventScroll = (e: WheelEvent) => {
        e.preventDefault();
      };
      
      // Блокируем тач-события на уровне документа
      const preventTouch = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      document.addEventListener("wheel", preventScroll, { passive: false });
      document.addEventListener("touchmove", preventTouch, { passive: false });

      return () => {
        document.body.style.overflow = "";
        document.body.style.touchAction = "";
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("wheel", preventScroll);
        document.removeEventListener("touchmove", preventTouch);
      };
    }
  }, [isOpen, handleEscape]);

  // Зум колесиком мыши
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((prev) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      // Если уменьшаем до 1x, сбрасываем позицию
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // Touch events для pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch начало
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistanceRef.current = distance;
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      // Драг начало (только если увеличено)
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
      // Pinch zoom
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleChange = distance / initialPinchDistanceRef.current;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, initialScaleRef.current * scaleChange));
      setScale(newScale);
      // Если уменьшаем до 1x, сбрасываем позицию
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Драг
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleTouchEnd = useCallback(() => {
    initialPinchDistanceRef.current = null;
    setIsDragging(false);
  }, []);

  // Mouse drag для перемещения увеличенного изображения
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Предотвращаем нативный drag файла
    e.preventDefault();
    
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Кнопки зума
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(MIN_SCALE, prev - ZOOM_STEP);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center touch-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Просмотр изображения: ${alt}`}
    >
      {/* Затемнённый фон */}
      <div className="absolute inset-0 bg-black/95" onClick={() => scale === 1 && onClose()} />

      {/* Панель управления */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
        <button
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Уменьшить"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm font-medium min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Увеличить"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-white/30 mx-1" />
        <button
          onClick={resetZoom}
          disabled={scale === 1}
          className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Сбросить"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Кнопка закрытия */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors shadow-lg"
        aria-label="Закрыть"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Изображение */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div
          className="relative w-full h-full max-w-[90vw] max-h-[90vh]"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center',
            willChange: isDragging ? 'transform' : 'auto',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain pointer-events-none select-none"
            sizes="90vw"
            priority
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
