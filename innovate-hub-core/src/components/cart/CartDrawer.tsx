import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { CartItemRow } from "./CartItemRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

export const CartDrawer = () => {
  const { items, isOpen, setIsOpen, getCartTotal, getItemsCount } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
      setIsOpen(false);
      navigate('/checkout');
  };

  const handleMyOrders = () => {
      setIsOpen(false);
      navigate('/my-orders');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {getItemsCount() > 0 && (
             <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {getItemsCount()}
             </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>My Cart ({getItemsCount()} items)</SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4">
                <ShoppingCart className="h-16 w-16 text-gray-300" />
                <p className="text-muted-foreground text-center">Your cart is empty.</p>
                <div className="flex flex-col gap-2 w-full px-8">
                    <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>Continue Shopping</Button>
                    <Button variant="ghost" className="w-full" onClick={handleMyOrders}>View My Orders</Button>
                </div>
            </div>
        ) : (
             <>
                <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <CartItemRow key={item.id} item={item} />
                        ))}
                    </div>
                </ScrollArea>
                
                <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-base font-medium">
                        <p>Subtotal</p>
                        <p>₹{getCartTotal().toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
                    <div className="grid gap-2">
                        <Button className="w-full" size="lg" onClick={handleCheckout}>
                            Checkout
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                            Continue Shopping
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={handleMyOrders}>
                            My Orders
                        </Button>
                    </div>
                </div>
             </>
        )}
      </SheetContent>
    </Sheet>
  );
};
