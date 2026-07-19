import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/axios";

interface HeroImage {
  _id: string;
  secure_url: string;
}

const HomeHero = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const res = await api.get("/hero");
        if (res.data && res.data.length > 0) {
          const urls = res.data.map((img: HeroImage) => img.secure_url);
          setImages(urls);
        }
      } catch (err) {
        console.warn("Unable to fetch backend hero images.");
      }
    };
    fetchHeroImages();
  }, []);

  const nextSlide = useCallback(() => {
    if (images.length === 0) return;
    setCurrent((val) => (val === images.length - 1 ? 0 : val + 1));
  }, [images.length]);

  const prevSlide = useCallback(() => {
    if (images.length === 0) return;
    setCurrent((val) => (val === 0 ? images.length - 1 : val - 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, images.length]);

  return (
    <section className="relative h-[650px] w-full bg-slate-950 overflow-hidden flex items-end">
      {/* Background Gradient (shown when no uploaded hero images exist) */}
      {images.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0,transparent_70%)]" />
        </div>
      )}

      {/* Background Slider (shown when uploaded hero images exist) */}
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? "opacity-85 z-0" : "opacity-0 -z-10"
          }`}
        >
          <img
            src={src}
            alt="AICTE IDEA Lab background slide"
            className="w-full h-full object-cover"
            loading={idx === 0 ? "eager" : "lazy"}
          />
          {/* Subtle Bottom Vignette Overlay to ensure CTA buttons are readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Main Content (CTA buttons only) */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-wrap gap-4 pt-2">
          <Link to="/book-slots">
            <Button size="lg" className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-6 py-4 shadow-lg">
              Book a Slot <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/aicte-idea-lab">
            <Button size="lg" variant="outline" className="border-slate-100 text-white hover:bg-white hover:text-slate-900 font-bold rounded-xl px-6 py-4 bg-black/20 backdrop-blur-xs">
              Explore Facilities
            </Button>
          </Link>
        </div>
      </div>

      {/* Manual Slider Navigation Arrows (only displayed when multiple photos exist) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/40 text-white/70 hover:text-white hover:bg-slate-900/80 transition-all focus:outline-none"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-900/40 text-white/70 hover:text-white hover:bg-slate-900/80 transition-all focus:outline-none"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  );
};

export default HomeHero;
