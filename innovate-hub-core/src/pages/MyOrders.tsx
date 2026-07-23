import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Package, ExternalLink, Loader2 } from 'lucide-react';

interface Order {
  _id: string;
  items: any[];
  shippingAddress: { fullName: string; city: string; };
  amounts: { total: number };
  status: string;
  createdAt: string;
  method: string;
}

const MyOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders');
                setOrders(res.data);
            } catch (error) {
                console.error("Failed to fetch orders");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'PAID': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'PROCESSING': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'SHIPPED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'DELIVERED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Orders</h1>
                <Link to="/ecommerce">
                    <Button variant="outline">Continue Shopping</Button>
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                    <Link to="/ecommerce">
                        <Button>Browse Store</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order._id} className="overflow-hidden">
                            <CardHeader className="bg-muted/40 py-3 flex flex-row items-center justify-between">
                                <div className="flex gap-4 items-center">
                                    <span className="font-mono font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                                    <span className="text-muted-foreground text-sm">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold">₹{order.amounts.total.toFixed(2)}</span>
                                    <Badge variant="outline" className={`${getStatusColor(order.status)} border`}>
                                        {order.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex justify-between items-center">
                                     <div className="space-y-1">
                                         {order.items.slice(0, 2).map((item, idx) => (
                                             <div key={idx} className="text-sm">
                                                 {item.quantity} x {item.name}
                                             </div>
                                         ))}
                                         {order.items.length > 2 && (
                                             <div className="text-xs text-muted-foreground">
                                                 + {order.items.length - 2} more items
                                             </div>
                                         )}
                                     </div>
                                     <div className="flex gap-2">
                                         <Button variant="ghost" size="sm" className="gap-2">
                                             View Details <ExternalLink className="w-3 h-3" />
                                         </Button>
                                     </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;
