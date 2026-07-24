import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowUp, ArrowDown, Upload, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import ImageCropper from "@/components/ImageCropper";

interface HeroImage {
  _id: string;
  secure_url: string;
  public_id: string;
  order: number;
  isActive: boolean;
}

const ManageHero = () => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
    // Cleanup preview URL
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/hero/all'); // Protected route for all images
      setImages(res.data);
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("Failed to load hero images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { 
        toast.error("File size must be less than 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
          setImageToCrop(reader.result as string);
          setShowCropper(true);
      });
      reader.readAsDataURL(file);
      
      e.target.value = '';
    }
  };
  
  const handleCropComplete = (croppedBlob: Blob) => {
      // Create a File from Blob
      const file = new File([croppedBlob], "hero-image-cropped.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      
      // Update preview
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
  
        const res = await axios.post('/hero/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  
        setImages([...images, res.data]);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        
        toast.success("Image uploaded successfully");
        fetchImages(); 
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(`/hero/${id}`);
      setImages(images.filter(img => img._id !== id));
      toast.success("Image deleted");
    } catch (error) {
        console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await axios.patch(`/hero/${id}/status`, { isActive: !currentStatus });
      setImages(images.map(img => img._id === id ? { ...img, isActive: res.data.isActive } : img));
      toast.success(`Image ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
    }
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    } else {
        return;
    }
    
    setImages(newImages);
    
    // Save new order
    try {
        const orderedIds = newImages.map(img => img._id);
        await axios.put('/hero/reorder', { orderedIds });
    } catch (error) {
        console.error("Error reordering:", error);
        toast.error("Failed to save new order");
        fetchImages(); 
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Hero Section</h1>
        <p className="text-muted-foreground">Upload and manage images for the home page slider.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Section */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Upload New Image</CardTitle>
            <CardDescription>
              Upload an image to start. The editor will help you crop it to 16:9.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="hero-upload">Select Image</Label>
              <Input 
                id="hero-upload" 
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange} 
                disabled={uploading}
              />
            </div>
            
            {previewUrl && (
                <div className="space-y-2">
                    <Label>Preview (16:9)</Label>
                    <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted">
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowCropper(true)} className="w-full">
                        Adjust Crop
                    </Button>
                </div>
            )}
            
            <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading} 
                className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* List Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Images</CardTitle>
            <CardDescription>
              Manage active status and display order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="flex justify-center py-8">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
            ) : images.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No images found. Upload one to get started.
                </div>
            ) : (
                <div className="space-y-4">
                    {images.map((img, index) => (
                        <div key={img._id} className="flex items-center gap-4 border p-3 rounded-lg bg-card hover:bg-accent/5 transition-colors">
                            {/* Drag Handle Replacement (Arrows) */}
                            <div className="flex flex-col gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    disabled={index === 0}
                                    onClick={() => moveImage(index, 'up')}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    disabled={index === images.length - 1}
                                    onClick={() => moveImage(index, 'down')}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Thumbnail */}
                            <div className="h-20 w-36 flex-shrink-0 bg-muted rounded overflow-hidden border relative">
                                <img src={img.secure_url} alt="Hero" className="h-full w-full object-cover" />
                                {!img.isActive && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold uppercase">Inactive</span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-medium truncate" title={img.public_id}>ID: <span className="text-muted-foreground">{img.public_id.split('/').pop()}</span></p>
                                <p className="text-xs text-muted-foreground">Order: {img.order}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch 
                                        id={`status-${img._id}`} 
                                        checked={img.isActive}
                                        onCheckedChange={() => handleToggleStatus(img._id, img.isActive)}
                                    />
                                </div>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => handleDelete(img._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ImageCropper 
        open={showCropper} 
        onClose={() => setShowCropper(false)} 
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default ManageHero;
