import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { AddressForm } from '@/components/checkout/AddressForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import { LocationPicker } from '@/components/checkout/LocationPicker';

const Checkout = () => {
    const { items, getCartTotal } = useCartStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
    const [pinnedLocation, setPinnedLocation] = useState<{lat: number, lng: number} | undefined>();
    
    // Form State
    const [address, setAddress] = useState({
        fullName: '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        phone: ''
    });

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                <Link to="/ecommerce">
                    <Button>Return to Shop</Button>
                </Link>
            </div>
        );
    }

    const handlePlaceOrder = async () => {
        // Basic Validation
        if (!address.fullName || !address.addressLine1 || !address.city || !address.phone || !address.state || !address.postalCode) {
            toast.error("Please fill in all shipping details");
            return;
        }

        setLoading(true);
        try {
            // 1. Create PENDING Order
            // Calculate totals locally for initial payload, but backend should verify
            const cartTotal = getCartTotal();
            const payload = {
                items: items.map(i => ({ 
                    productId: i.id, 
                    quantity: i.quantity, 
                    price: i.price, 
                    name: i.name,
                    image: i.image 
                })),
                shippingAddress: {
                    ...address,
                    ...(pinnedLocation ? { latitude: pinnedLocation.lat, longitude: pinnedLocation.lng } : {})
                },
                method: deliveryMethod,
                amounts: {
                    subtotal: cartTotal,
                    total: cartTotal * 1.18 // Match OrderSummary component logic
                }
            };

            const { data } = await api.post('/orders/initiate', payload);
            const { order, razorpayOrderId } = data;

            toast.success("Order initiated. Processing payment...");
             
            // 2. Simulate Payment (Mock)
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
             
             // 3. Verify Payment
            const paymentPayload = {
                 orderId: order._id,
                 paymentId: `pay_${new Date().getTime()}`, // Mock Payment ID
                 signature: 'mock_signature'
            };
            
            await api.post('/orders/verify', paymentPayload);
             
            toast.success("Payment Successful!");
            
            // Clear Cart
            useCartStore.getState().clearCart();
            
            // Redirect
            navigate(`/order-confirmation/${order._id}`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate('/ecommerce')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
            </Button>
            
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Shipping Address */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <AddressForm value={address} onChange={setAddress} />
                            
                            <div className="pt-2">
                                <Label className="mb-2 block">Precise Location (Optional but Recommended)</Label>
                                <LocationPicker 
                                    onLocationSelect={(lat, lng) => setPinnedLocation({ lat, lng })}
                                    currentLocation={pinnedLocation}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Payment Placeholder */}
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Delivery Method</h3>
                                <RadioGroup defaultValue="DELIVERY" onValueChange={(val) => setDeliveryMethod(val as any)} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <RadioGroupItem value="DELIVERY" id="delivery" className="peer sr-only" />
                                        <Label
                                            htmlFor="delivery"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <span className="mb-2 text-lg">🚚</span>
                                            Delivery
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="PICKUP" id="pickup" className="peer sr-only" />
                                        <Label
                                            htmlFor="pickup"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <span className="mb-2 text-lg">🏪</span>
                                            Pickup
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                                <div className="p-4 border rounded-md bg-muted/50 text-muted-foreground text-sm">
                                    Secure Payment Gateway (Razorpay) will be integrated in the next step.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <OrderSummary />
                        
                        <Button 
                            className="w-full" 
                            size="lg" 
                            onClick={handlePlaceOrder}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Proceed to Payment
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
