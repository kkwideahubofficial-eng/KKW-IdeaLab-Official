import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/cropImage";
import { Loader2, RotateCcw, Check, ZoomIn, ZoomOut, Move, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ImageCropperProps {
  imageSrc: string | null;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

const ASPECT_RATIO = 16 / 9;

export default function ImageCropper({ imageSrc, open, onClose, onCropComplete }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  // Reset state when image changes
  useEffect(() => {
    if (open) {
        setZoom(1);
        setOpacity(1);
        setPosition({ x: 0, y: 0 });
    }
  }, [imageSrc, open]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Calculate delta
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    setPosition({
      x: positionStartRef.current.x + deltaX,
      y: positionStartRef.current.y + deltaY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleSave = async () => {
    if (!imageRef.current || !containerRef.current || !imageSrc) return;

    try {
      setProcessing(true);
      
      // Calculate crop area relative to image
      // 1. Get definitions
      const image = imageRef.current;
      const container = containerRef.current;
      
      // Get the Frame dimensions (The transparent hole in the middle)
      // We know the structure: Container > Overlay > Hole
      // Actually simpler: we can calculate the center of the container.
      const containerRect = container.getBoundingClientRect();
      
      // The hole is 16:9 and takes up e.g. 90% width or height, defined by CSS. 
      // Let's assume the UI implementation below defines the frame size clearly.
      // Based on the CSS below: w-full max-w-3xl aspect-video.
      // But inside that is the container. 
      // Let's find the "Frame" element.
      const frameElement = container.querySelector('[data-crop-frame]');
      if (!frameElement) throw new Error("Frame not found");
      
      const frameRect = frameElement.getBoundingClientRect();
      
      // Image current rendered rect (including zoom and translate)
      // However, image.getBoundingClientRect() gives the transformed rect on screen.
      const imageRect = image.getBoundingClientRect();
      
      // We need the crop rect relative to the image
      const cropXToken = frameRect.left - imageRect.left;
      const cropYToken = frameRect.top - imageRect.top;
      
      // Now, convert these screen pixels to intrinsic image pixels.
      // The image is displayed at `imageRect.width` x `imageRect.height`.
      // The intrinsic size is `image.naturalWidth` x `image.naturalHeight`.
      const scaleX = image.naturalWidth / imageRect.width;
      const scaleY = image.naturalHeight / imageRect.height;
      
      const pixelCrop = {
          x: cropXToken * scaleX,
          y: cropYToken * scaleY,
          width: frameRect.width * scaleX,
          height: frameRect.height * scaleY
      };

      const blob = await getCroppedImg(imageSrc, pixelCrop, 0, undefined, opacity);
      if (blob) {
        onCropComplete(blob);
        onClose();
      }
    } catch (error) {
        console.error("Failed to crop", error);
    } finally {
        setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        {/* Cropper Workspace */}
        <div className="relative w-full h-[60vh] bg-black overflow-hidden flex items-center justify-center select-none"
             ref={containerRef}
        >
            {/* The Image */}
             {imageSrc && (
                <img 
                    ref={imageRef}
                    src={imageSrc} 
                    alt="Crop target"
                    className="absolute max-w-none origin-center cursor-move touch-none"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        opacity: opacity,
                        // Initial sizing: we want it to cover the frame at scale 1 if possible, or fit? 
                        // User wants "Image can be dragged and zoomed *behind* the frame".
                        // Usually fit to container width or height.
                        height: "100%", 
                        objectFit: "contain"
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    draggable={false}
                />
             )}

            {/* The Overlay (Dimmed Area) */}
            {/* We use a massive box shadow on the frame to create the dimming effect */}
            <div 
                data-crop-frame
                className="absolute pointer-events-none z-10 border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                style={{
                    aspectRatio: "16/9",
                    width: "min(80%, 80vh * 1.77)", // Responsive 16:9
                    height: "auto" // defined by ratio
                }}
            >
                {/* Grid lines (optional) */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                    <div className="border-r border-b border-primary/50"></div>
                    <div className="border-r border-b border-primary/50"></div>
                    <div className="border-b border-primary/50"></div>
                    <div className="border-r border-b border-primary/50"></div>
                    <div className="border-r border-b border-primary/50"></div>
                    <div className="border-b border-primary/50"></div>
                    <div className="border-r border-primary/50"></div>
                    <div className="border-r border-primary/50"></div>
                    <div></div>
                </div>
            </div>
            
            <div className="absolute top-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs z-20 pointer-events-none flex items-center gap-2">
                <Move className="w-3 h-3" />
                Drag to Reposition
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-[10px] z-20 pointer-events-none">
                Opacity is now applied to final image.
            </div>
        </div>

        {/* Controls */}
        <DialogFooter className="p-4 bg-muted/20 border-t flex-col sm:flex-row gap-6 items-center">
            
            {/* Zoom Control */}
            <div className="flex-1 w-full flex items-center gap-4">
                <span className="text-xs font-medium w-12 text-muted-foreground">Zoom</span>
                <ZoomOut className="w-4 h-4 text-muted-foreground" />
                <Slider 
                    value={[zoom]} 
                    min={0.5} 
                    max={3} 
                    step={0.01} 
                    onValueChange={(val) => setZoom(val[0])}
                    className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-8 text-right">{(zoom * 100).toFixed(0)}%</span>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-8" />
            
             {/* Opacity Control */}
             <div className="flex-1 w-full flex items-center gap-4">
                <span className="text-xs font-medium w-16 text-muted-foreground">Opacity</span>
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <Slider 
                    value={[opacity]} 
                    min={0} 
                    max={1} 
                    step={0.01} 
                    onValueChange={(val) => setOpacity(val[0])}
                    className="flex-1"
                />
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-8 text-right">{(opacity * 100).toFixed(0)}%</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <Button variant="outline" onClick={() => { setZoom(1); setOpacity(1); setPosition({x:0, y:0}); }}>
                   <RotateCcw className="w-4 h-4 mr-2" />
                   Reset
                </Button>
                <Button onClick={handleSave} disabled={processing}>
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Confirm Crop
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
