import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string; // product._id
  name: string;
  price: number;
  image?: string;
  quantity: number;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getCartTotal: () => number;
  getItemsCount: () => number;
  syncCartWithBackend: (token: string) => Promise<void>; 
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === newItem.id);

        if (existingItem) {
          const updatedItems = items.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
          set({ items: updatedItems, isOpen: true }); // Auto-open cart on add
        } else {
          set({ items: [...items, newItem], isOpen: true });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        const items = get().items;
        if (quantity < 1) {
           // Create a new array excluding the item if quantity < 1
           set({ items: items.filter((item) => item.id !== id) });
           return;
        }
        set({
          items: items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      setIsOpen: (isOpen) => set({ isOpen }),

      getCartTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemsCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      
      syncCartWithBackend: async (token) => {
          // Placeholder for Phase 2b - Sync Logic
          console.log("Syncing cart with backend...", token);
      }
    }),
    {
      name: 'cart-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
);
