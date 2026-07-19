import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import axios from "@/lib/axios";
import { Loader2 } from "lucide-react";

interface HeroImage {
  _id: string;
  secure_url: string;
  order: number;
}

const HeroSlider = () => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // Custom Autoplay implementation to avoid extra dependency
  useEffect(() => {
    if (!emblaApi) return;
    
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(autoplay);
  }, [emblaApi]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get('/hero'); // Public route, returns active only
        setImages(res.data);
      } catch (error) {
        console.error("Error fetching hero images:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (images.length === 0) {
     // Fallback if no images are uploaded yet, or return null to show nothing
     // Returning null might break layout if text depends on it being background.
     // I will return a default placeholder background or null if the parent handles it.
     // For now, I'll return a default static background style to match the original if no images.
     return (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10 -z-10" />
     );
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="embla h-full w-full" ref={emblaRef}>
          <div className="embla__container h-full w-full flex">
            {images.map((img) => (
              <div key={img._id} className="embla__slide flex-[0_0_100%] min-w-0 relative h-full w-full">
                <img
                  src={img.secure_url}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};

export default HeroSlider;
