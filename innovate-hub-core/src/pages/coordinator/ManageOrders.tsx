import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Loader2, Package, Search, Filter, ShoppingBag, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, User, Phone, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import OrderTimeline from '@/components/OrderTimeline';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  _id: string;
  userId: string;
  items: {
    productId: {
        name: string;
        image: string;
    };
    name: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: { fullName: string; city: string; fullAddress: string };
  amounts: { total: number };
  status: string;
  createdAt: string;
}

const ManageOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [driverDetails, setDriverDetails] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const toggleExpand = async (orderId: string) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setDriverDetails(null);
        } else {
            setExpandedOrderId(orderId);
            setDriverDetails(null);
            
            // Only fetch driver details if status warrants it
            const currentOrder = orders.find(o => o._id === orderId);
            if(currentOrder && ['PROCESSING', 'SHIPPED', 'out of delivery', 'processing', 'OUT_OF_DELIVERY'].includes(currentOrder.status)) {
                 try {
                   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                   // We need an endpoint to get assignment details for an order.
                   // Ideally, getOrderById should return 'assignment' populated.
                   // But let's assume we can query current-order or a status endpoint.
                   // For now, let's just use the order's populated data if available, or fetch fresh order.
                   const res = await api.get(`/orders/${orderId}`);
                   if(res.data && res.data.assignedDeliveryBoy) {
                     setDriverDetails({ assignedDriver: res.data.assignedDeliveryBoy });
                   }
                } catch(e) {
                    console.log("No driver attached or fetch failed");
                }
            }
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/admin/all'); 
            setOrders(res.data);
        } catch (error) {
            console.error("Failed to fetch orders");
            // toast.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (orderId: string, newStatus: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row collapse
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'SHIPPED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PROCESSING': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status.toUpperCase()) {
            case 'DELIVERED': return <CheckCircle size={14} className="mr-1" />;
            case 'SHIPPED': return <Truck size={14} className="mr-1" />;
            case 'PROCESSING': return <Clock size={14} className="mr-1" />;
            case 'CANCELLED': return <XCircle size={14} className="mr-1" />;
            default: return <Package size={14} className="mr-1" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              order.shippingAddress?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = statusFilter === "ALL" || order.status === statusFilter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground animate-pulse">Loading orders...</p>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Manage Orders</h1>
                    <p className="text-muted-foreground mt-1">Track and manage customer orders efficiently.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border shadow-xs">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search orders..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-transparent outline-none text-sm w-[180px] md:w-[250px] placeholder:text-gray-400"
                        />
                    </div>
                    <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 w-[140px] h-9 focus:ring-0 gap-2">
                             <Filter className="w-4 h-4 text-gray-500" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50/50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-2">Order ID</div>
                    <div className="col-span-3">Customer</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="divide-y divide-gray-100">
                    <AnimatePresence initial={false}>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <React.Fragment key={order._id}>
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`grid grid-cols-12 gap-4 p-5 items-center text-sm hover:bg-slate-50 cursor-pointer transition-colors duration-200 group ${expandedOrderId === order._id ? 'bg-slate-50' : 'bg-white'}`}
                                        onClick={() => toggleExpand(order._id)}
                                    >
                                        <div className="col-span-2 font-mono flex items-center gap-3 font-medium text-primary">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                                <ShoppingBag size={14} />
                                            </div>
                                            #{order._id.slice(-6).toUpperCase()}
                                        </div>
                                        
                                        <div className="col-span-3">
                                            <div className="font-semibold text-gray-900">{order.shippingAddress?.fullName || 'Guest User'}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate pr-2">
                                                <MapPin size={10} /> {order.shippingAddress?.city}
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-gray-600 flex items-center gap-2">
                                            <Calendar size={13} className="text-gray-400" />
                                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                        </div>

                                        <div className="col-span-2 text-right font-bold text-gray-900">
                                            ₹{order.amounts.total.toLocaleString('en-IN')}
                                        </div>

                                        <div className="col-span-2 flex justify-center">
                                            <Badge variant="outline" className={`${getStatusColor(order.status)} px-2.5 py-0.5 shadow-xs font-medium border`}>
                                                <StatusIcon status={order.status} /> {order.status}
                                            </Badge>
                                        </div>

                                        <div className="col-span-1 flex justify-center">
                                             <div className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${expandedOrderId === order._id ? 'bg-gray-200 rotate-180 text-gray-900' : 'text-gray-400'}`}>
                                                <ChevronDown size={16} />
                                             </div>
                                        </div>
                                    </motion.div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {expandedOrderId === order._id && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: "auto", opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }}
                                                className="col-span-12 overflow-hidden bg-slate-50/50"
                                            >
                                                <div className="p-6 border-t border-b grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    
                                                    {/* Left Column: Items & Address */}
                                                    <div className="space-y-6">
                                                        <div className="bg-white rounded-xl border p-5 shadow-xs">
                                                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package size={16} className="text-primary"/> Order Items ({order.items?.length || 0})</h4>
                                                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {order.items?.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-dashed last:border-0 hover:bg-gray-50 p-2 rounded-lg transition">
                                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                                                                             {item.productId?.image ? (
                                                                                 <img src={item.productId.image} alt="product" className="w-full h-full object-cover" />
                                                                             ): (
                                                                                 <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={20}/></div>
                                                                             )}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productId?.name || item.name || "Product Name"}</p>
                                                                            <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                                                                        </div>
                                                                        <div className="font-semibold text-sm">₹{item.quantity * item.price}</div>
                                                                    </div>
                                                                ))}
                                                                {(!order.items || order.items.length === 0) && (
                                                                    <p className="text-sm text-gray-400 italic text-center py-4">No item details available.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Timeline & Driver */}
                                                    <div className="space-y-6">
                                                         {/* Actions */}
                                                        <div className="bg-white rounded-xl border p-5 shadow-xs flex justify-between items-center">
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-800">Update Status</h4>
                                                                <p className="text-xs text-gray-500">Change the progress of this order</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                                                                    <button 
                                                                        key={st}
                                                                        onClick={(e) => handleStatusUpdate(order._id, st, e)}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                                            order.status === st 
                                                                            ? getStatusColor(st) + ' ring-2 ring-offset-1 ring-gray-200' 
                                                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        {st.charAt(0) + st.slice(1).toLowerCase()}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Driver Info */}
                                                        <div className="bg-white rounded-xl border p-5 shadow-xs relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-50 to-transparent rounded-bl-full -mr-4 -mt-4"></div>
                                                            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><Truck size={16} className="text-primary"/> Delivery Info</h4>
                                                            
                                                             {driverDetails && driverDetails.assignedDriver ? (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 shadow-sm">
                                                                                <User size={20} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Delivery Partner</p>
                                                                                <p className="font-bold text-gray-800 text-base">{driverDetails.assignedDriver.name}</p>
                                                                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                                                                    <Phone size={12}/> {driverDetails.assignedDriver.mobile || 'No contact'}
                                                                                </p>
                                                                            </div>
                                                                    </div>
                                                                    <Button size="sm" variant="outline" className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200" onClick={()=>window.open(`tel:${driverDetails.assignedDriver.mobile}`)}>
                                                                        Call Partner
                                                                    </Button>
                                                                </div>
                                                             ) : (
                                                                 <div className="text-center py-6 bg-gray-50/50 rounded-lg border border-dashed flex flex-col items-center gap-3">
                                                                     {['PROCESSING', 'SHIPPED', 'out of delivery'].includes(order.status) ? (
                                                                          <>
                                                                             <p className="text-sm text-gray-500">No driver assigned.</p>
                                                                             <Button 
                                                                                size="sm" 
                                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                                                                                        const res = await axios.post(`${API_BASE_URL}/api/delivery/create-assignment`, { orderId: order._id });
                                                                                        toast.success(`Broadcasted to ${res.data.count} drivers!`);
                                                                                        toggleExpand(order._id); // Refresh
                                                                                    } catch (err: any) {
                                                                                        toast.error(err.response?.data?.message || "Failed to assign");
                                                                                    }
                                                                                }}
                                                                             >
                                                                                <Truck size={14} /> Assign Delivery
                                                                             </Button>
                                                                          </>
                                                                     ) : order.status === 'DELIVERED' ? (
                                                                         <div className="flex flex-col items-center">
                                                                            <CheckCircle className="w-8 h-8 text-green-500 mb-2 opacity-80" />
                                                                            <p className="text-sm text-gray-600 font-medium">Order Delivered</p>
                                                                         </div>
                                                                     ) : (
                                                                         <p className="text-sm text-gray-400">Driver assignment pending or not required.</p>
                                                                     )}
                                                                 </div>
                                                             )}
                                                        </div>

                                                        {/* Simple Timeline Status */}
                                                        <div>
                                                           <OrderTimeline status={order.status.toLowerCase() as any} createdAt={new Date(order.createdAt)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))
                        ) : (
                            <div className="p-16 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
                                <p className="text-muted-foreground mt-1 text-sm max-w-xs mx-auto">
                                    We couldn't find any orders matching your search or filters.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="mt-6"
                                    onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-400">
                Showing {filteredOrders.length} orders
            </div>
        </div>
    );
};

export default ManageOrders;
