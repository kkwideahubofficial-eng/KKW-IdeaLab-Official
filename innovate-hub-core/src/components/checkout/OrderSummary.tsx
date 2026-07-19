import React from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const OrderSummary = () => {
    const { items, getCartTotal } = useCartStore();
    const subtotal = getCartTotal();
    const tax = subtotal * 0.18; // Example 18% GST
    const total = subtotal + tax;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
