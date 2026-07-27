import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Monitor } from 'lucide-react';

interface TeachingSlidesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  rpmHtml: string;
  topic: string;
}

export default function TeachingSlidesViewer({ isOpen, onClose, rpmHtml, topic }: TeachingSlidesViewerProps) {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError('');
      setCurrentSlide(0);
      fetch('/api/teaching-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: rpmHtml, topic }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) { setError(data.error); return; }
          const slideDivs = data.slidesHtml.match(/<div class="slide">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g)
            || data.slidesHtml.match(/<div class="slide">[\s\S]*?<\/div>\s*<\/div>/g)
            || [data.slidesHtml];
          setSlides(slideDivs);
          setIsLoading(false);
        })
        .catch(e => { setError(e.message); setIsLoading(false); });
    }
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) setCurrentSlide(s => s + 1);
  }, [currentSlide, slides.length]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(s => s - 1);
  }, [currentSlide]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') { if (isFullscreen) document.exitFullscreen(); else onClose(); }
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, isFullscreen]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  if (!isOpen) return null;

  const sanitize = (h: string) => h.replace(/on\w+=["'][^"']*["']/gi, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col ${isFullscreen ? '' : 'bg-black/90'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white/80 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-primary/20 text-primary-light px-2 py-0.5 rounded">Slide Pembelajaran</span>
          <span className="text-xs text-white/50">{topic}</span>
        </div>
        <div className="flex items-center gap-2">
          {slides.length > 0 && (
            <span className="text-xs text-white/50">{currentSlide + 1} / {slides.length}</span>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Fullscreen (F)">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Tutup (Esc)">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Menyusun slide pembelajaran...</p>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm bg-red-900/20 px-6 py-4 rounded-lg">{error}</div>
        ) : slides.length === 0 ? (
          <p className="text-white/40">Tidak ada slide yang dihasilkan</p>
        ) : (
          <>
            {/* Navigation arrows */}
            {currentSlide > 0 && (
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/70 hover:text-white z-10">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {currentSlide < slides.length - 1 && (
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/70 hover:text-white z-10">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* The slide */}
            <div
              className="teaching-slide-viewer max-w-[1100px] w-full mx-8 md:mx-16 animate-in fade-in duration-300"
              dangerouslySetInnerHTML={{ __html: sanitize(slides[currentSlide] || '') }}
            />

            {/* Bottom indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Controls help */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-gray-900 text-white/30 text-[10px] shrink-0">
        <span>← → Navigasi</span>
        <span>F Fullscreen</span>
        <span>Esc Tutup</span>
        <span>Space Next</span>
      </div>
    </div>
  );
}