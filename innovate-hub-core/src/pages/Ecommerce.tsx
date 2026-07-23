import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";

interface ProductItem {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  category?: string;
  stock?: number;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('idea_hub_user');
    const token = localStorage.getItem('idea_hub_token');
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Extracted ProductCard component
const ProductTile = ({ product, isCoordinator, onDelete, onEdit }: { product: ProductItem; isCoordinator: boolean; onDelete: (id: string) => void; onEdit: (product: ProductItem) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const showReadMore = product.description && product.description.length > 80;
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      id: product._id,
      name: product.title,
      price: product.price,
      image: product.imageUrl,
      quantity: 1,
      maxStock: product.stock
    });
    toast.success("Added to cart");
  };

  return (
    <div className="group relative flex flex-col h-full bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-secondary/5 overflow-hidden">
        {/* Image - Reduced padding, centered, drop shadow for grounding */}
        <div className="absolute inset-0 p-4 flex items-center justify-center">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 drop-shadow-sm" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50">
               <span className="text-sm font-medium">No Image</span>
            </div>
          )}
        </div>

        {/* Stock Status Indicator - Smaller, moved inward */}
        {product.stock !== undefined && (
          <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border shadow-sm text-[9px] font-bold uppercase tracking-wider ${
            product.stock > 0 ? 'text-emerald-700 border-emerald-500/20' : 'text-red-700 border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {product.stock > 0 ? 'In Stock' : 'Out'}
          </div>
        )}

        {/* Slide-up CTA Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent pt-10">
            <Button 
              className="w-full shadow-lg font-semibold bg-white text-black hover:bg-white/90 border-0" 
              size="sm"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
        </div>

        {/* Coordinator Actions */}
        {isCoordinator && (
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={() => onEdit(product)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-sm" onClick={() => onDelete(product._id)}>
              <span className="sr-only">Delete</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </Button>
          </div>
        )}
      </div>

      {/* Info Section - Balanced Hierarchy */}
      <div className="flex flex-col p-4 gap-1.5 flex-grow">
        {/* Title - Primary focus */}
        <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors" title={product.title}>
          {product.title}
        </h3>

        {/* Description - Read More Toggle */}
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p className={`${isExpanded ? '' : 'line-clamp-2'}`} title={!isExpanded ? product.description : ''}>
            {product.description}
          </p>
          {showReadMore && (
            <button 
              onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
              className="text-[10px] font-bold text-primary hover:underline mt-1 focus:outline-none"
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          )}
        </div>
        
        {/* Price - Stronger emphasis */}
        <div className="text-xl font-bold text-foreground tracking-tight pt-1">₹{product.price.toFixed(2)}</div>
        
        {/* Category Pill - Bottom, Muted */}
        <div className="mt-auto pt-3">
           <span className="inline-flex items-center rounded-full bg-secondary/40 px-2 py-0.5 text-[10px] uppercase font-medium text-muted-foreground/80 tracking-wide">
             {product.category || 'General'}
           </span>
        </div>
      </div>
    </div>
  );
};

const Ecommerce = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
  const user = useMemo(getCurrentUser, []);
  const isCoordinator = user?.role === 'coordinator';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a plain object for JSON submission if no file is selected, or use FormData if file is selected if your backend supports both.
      // Assuming your backend handles updates with FormData or JSON. If it's multipart/form-data for update too:
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', String(parseFloat(form.price)));
      if (form.category) formData.append('category', form.category);
      if (form.stock) formData.append('stock', String(parseInt(form.stock)));
      if (form.imageUrl) formData.append('imageUrl', form.imageUrl);
      
      const fileInput = document.getElementById('product-image') as HTMLInputElement | null;
      if (fileInput?.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      // If it is an update
      if (editingId) {
        // Update product using multipart/form-data
        const res = await api.put(`/products/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setProducts(products.map(p => p._id === editingId ? res.data : p));
        toast.success('Product updated');
      } else {
        const res = await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setProducts([res.data, ...products]);
        toast.success('Product created');
      }
      
      setOpen(false);
      resetForm();
    } catch {
      toast.error(editingId ? 'Failed to update product' : 'Failed to create product');
    }
  };
  
  const resetForm = () => {
    setForm({ title: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
    setEditingId(null);
  };

  const startEdit = (product: ProductItem) => {
    setEditingId(product._id);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      category: product.category || '',
      stock: String(product.stock || 0),
      imageUrl: product.imageUrl || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter((x) => x._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Section Header */}
      <div className="mb-12 flex items-end justify-between border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">E-commerce Store</h1>
          <p className="text-lg text-muted-foreground">Premium tools, materials, and components for your projects.</p>
        </div>
        {isCoordinator && (
          <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); setOpen(val); }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
                <CardDescription>Fill in the details below to {editingId ? 'update the' : 'add a new'} product.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-image">Upload Image (optional)</Label>
                    <Input id="product-image" type="file" accept="image/*" />
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">Or Image URL</Label>
                    <Input id="imageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">No products yet. {isCoordinator ? 'Create the first one.' : 'Check back later.'}</p>
      ) : (


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <ProductTile 
              key={p._id} 
              product={p} 
              isCoordinator={isCoordinator} 
              onDelete={handleDelete}
              onEdit={startEdit}
            />
          ))}
        </div>
      )}

    </div>
    </div>
  );
};

export default Ecommerce;
