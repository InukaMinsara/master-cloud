import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterDocsPresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentHtml: string;
}

export function MasterDocsPresentationMode({
  isOpen,
  onClose,
  title,
  contentHtml,
}: MasterDocsPresentationModeProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  if (!isOpen) return null;

  // Split content by H1 or H2 or HR to create slides
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentHtml;

  // Extract sections
  const slides: string[] = [];
  let currentSlide = '';

  Array.from(tempDiv.children).forEach((child) => {
    if (child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'HR') {
      if (currentSlide.trim()) {
        slides.push(currentSlide);
      }
      currentSlide = child.outerHTML;
    } else {
      currentSlide += child.outerHTML;
    }
  });
  if (currentSlide.trim()) slides.push(currentSlide);

  const activeSlideHtml = slides[slideIndex] || contentHtml;

  const nextSlide = () => setSlideIndex((i) => Math.min(slides.length - 1, i + 1));
  const prevSlide = () => setSlideIndex((i) => Math.max(0, i - 1));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8 select-none">
      {/* Top Slide Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-bold tracking-wider uppercase text-primary">{title}</span>
        <div className="flex items-center gap-4">
          <span>
            Slide {slideIndex + 1} of {Math.max(1, slides.length)}
          </span>
          <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl text-xs gap-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" /> Exit
          </Button>
        </div>
      </div>

      {/* Slide Body */}
      <div className="flex-1 flex items-center justify-center p-8 max-w-5xl mx-auto w-full">
        <div
          className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-12 shadow-2xl text-xl leading-relaxed font-sans min-h-[420px] flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200"
          dangerouslySetInnerHTML={{ __html: activeSlideHtml }}
        />
      </div>

      {/* Slide Navigation Footer */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={slideIndex === 0}
          onClick={prevSlide}
          className="rounded-xl text-xs bg-slate-900 border-slate-800 text-white hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === slideIndex ? 'w-6 bg-primary' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={slideIndex === slides.length - 1}
          onClick={nextSlide}
          className="rounded-xl text-xs bg-slate-900 border-slate-800 text-white hover:bg-slate-800 disabled:opacity-30"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
