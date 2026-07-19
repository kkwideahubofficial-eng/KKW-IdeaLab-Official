import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/store/useCartStore";

interface CartItemProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {/* Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3 className="line-clamp-1">{item.name}</h3>
            <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
          </div>
          {/* <p className="mt-1 text-sm text-gray-500">{item.brand}</p> */}
        </div>
        
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center gap-2 border rounded-md p-1">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
             >
                <Minus className="h-3 w-3" />
             </Button>
             <span className="w-4 text-center">{item.quantity}</span>
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
             >
                <Plus className="h-3 w-3" />
             </Button>
          </div>

          <div className="flex">
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="font-medium text-red-600 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
