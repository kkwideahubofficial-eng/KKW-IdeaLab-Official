import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroSliderProps {
  slides: Slide[];
  className?: string;
}

const HeroSlider = ({ slides, className }: HeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((val) => (val === slides.length - 1 ? 0 : val + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((val) => (val === 0 ? slides.length - 1 : val - 1));
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Premium cubic-bezier ease function
  // cubic-bezier(0.22, 1, 0.36, 1)
  const transitionStyle = {
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDuration: "1500ms",
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-black group ${className || 'h-[600px]'}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero Slider"
    >
      {slides.map((slide, index) => {
        // Calculate relative position in circular buffer
        // 0 = active
        // 1 = next (right)
        // -1 = prev (left)
        // Everything else is hidden/parked
        let offset = index - current;

        // Handle wrapping to find shortest path
        // For 3 slides: current 0. index 2 needs to be -1, not 2.
        if (offset > slides.length / 2) offset -= slides.length;
        if (offset < -slides.length / 2) offset += slides.length;

        // Determine Z-index and visibility
        let zIndex = 0;
        let opacity = 0;
        let transform = "translateX(100%)"; // Default park right

        if (offset === 0) {
          transform = "translateX(0)";
          opacity = 1;
          zIndex = 20;
        } else if (offset === 1) {
          transform = "translateX(100%)";
          opacity = 0;
          zIndex = 10;
        } else if (offset === -1) {
          transform = "translateX(-100%)";
          opacity = 0;
          zIndex = 10;
        } else {
          // Far parking for >3 slides case, keeps them out of the way
          transform = "translateX(100%)";
        }

        return (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full bg-black transition-transform transition-opacity`}
            style={{
              ...transitionStyle,
              transform,
              opacity,
              zIndex
            }}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover opacity-60"
                style={{
                  // No scaling animation as requested
                  transform: "scale(1)"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
              <div className="max-w-2xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-xl drop-shadow-md">
                  {slide.description}
                </p>
                <Link to={slide.ctaLink}>
                  <Button size="lg" className="text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform">
                    {slide.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 text-white hover:bg-black/60 transition-all opacity-50 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 text-white hover:bg-black/60 transition-all opacity-50 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === current ? "bg-primary w-8" : "bg-white/50 hover:bg-white"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
