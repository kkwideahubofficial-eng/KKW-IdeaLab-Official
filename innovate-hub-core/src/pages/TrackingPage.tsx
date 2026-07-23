import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";
import { Phone, User, Package, MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import OrderTimeline from "@/components/OrderTimeline";
import DriverMap from "@/components/DriverMap";

interface Location {
    lat: number;
    lng: number;
}

interface OrderDetails {
    _id: string;
    status: "pending" | "processing" | "out of delivery" | "delivered" | "shipped" | "cancelled";
    shippingAddress: { // Matched AICTE IDEA Lab Backend
        fullName: string;
        addressLine1: string;
        city: string;
        state: string;
        latitude: number;
        longitude: number;
    };
    address?: any; // Fallback
    assignedDeliveryBoy?: {
        _id: string;
        name: string;
        email: string;
        mobile?: string;
    };
    createdAt: Date;
    deliveredAt?: Date; 
    items: any[];
}

export default function TrackingPage() {
    const { id: orderId } = useParams(); // 'id' from App.tsx route
    const navigate = useNavigate();

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [driverLoc, setDriverLoc] = useState<Location | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [loading, setLoading] = useState(true);
    const [eta, setEta] = useState<string | null>(null);

    // Fetch Order Details
    useEffect(() => {
        if (!orderId) return;

        const fetchOrder = async () => {
            try {
                // Use generic 'orders' endpoint or specific 'track' endpoint if created
                // Assuming standard endpoint for now: /api/orders/:id
                const res = await axios.get(`/api/orders/${orderId}`);
                if (res.data) {
                    setOrder(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch order", error);
                toast.error("Failed to load tracking details");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // Geocoding Fallback for Customer View
    useEffect(() => {
        if (!order) return;

        const checkAndFixLocation = async () => {
             const destLat = order.shippingAddress?.latitude || order.address?.latitude || 0;
             const destLng = order.shippingAddress?.longitude || order.address?.longitude || 0;

             if (destLat === 0 && destLng === 0) {
                 console.log("TrackingPage: Invalid coordinates, attempting geocoding...");
                 const shipping = order.shippingAddress || order.address || {};
                 
                 const queries = [
                      `${shipping.addressLine1 || ''}, ${shipping.city || ''}, ${shipping.state || ''}, ${shipping.postalCode || ''}`,
                      `${shipping.city || ''}, ${shipping.state || ''}`,
                      "Pune, Maharashtra, India" 
                 ];

                 let foundLoc = null;
                 for (const q of queries) {
                      if (!q || q.trim().replace(/, /g, '') === "") continue;
                      try {
                          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
                          if(res.data && res.data.length > 0) {
                              foundLoc = { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
                              break;
                          }
                      } catch(e) { /* ignore */ }
                      await new Promise(r => setTimeout(r, 200));
                 }

                 if (foundLoc) {
                     // Update local state partially to reflect fixed location
                     setOrder(prev => prev ? ({
                         ...prev,
                         shippingAddress: { ...prev.shippingAddress, latitude: foundLoc.lat, longitude: foundLoc.lng }
                     }) : null);
                 }
             }
        };
        
        checkAndFixLocation();
    }, [order]); // Dependent on order being set

    // Socket Connection
    useEffect(() => {
        if (!order || !order.assignedDeliveryBoy) return;

        // Connect to Socket
        // Connect to Socket
        const newSocket = io(); // Backend Port
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to tracking socket");
            if (order.assignedDeliveryBoy?._id) {
                newSocket.emit('join-tracking', order.assignedDeliveryBoy._id);
            }
        });

        // Listen for driver location updates
        newSocket.on("driver-location-updated", (data: { lat: number, lng: number }) => {
            if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
                setDriverLoc({ lat: data.lat, lng: data.lng });
                
                // Calculate ETA
                const destLat = order.shippingAddress?.latitude || order.address?.latitude || 0;
                const destLng = order.shippingAddress?.longitude || order.address?.longitude || 0;
                if(destLat && destLng) {
                     calculateEta(data.lat, data.lng, destLat, destLng);
                }
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [order]);

    const calculateEta = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distKm = R * c;
        
        const speedKmph = 30; // Avg speed
        const timeHours = distKm / speedKmph;
        const timeMins = Math.round(timeHours * 60);
        
        if (timeMins < 2) setEta("Arriving Now");
        else setEta(`${timeMins} mins`);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading tracking details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center text-red-500 p-8 bg-white rounded-2xl shadow-sm">
                    <p className="font-bold text-lg">Order Not Found</p>
                    <button onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 hover:underline">Go Back</button>
                </div>
            </div>
        );
    }

    const { status, assignedDeliveryBoy } = order;
    // Handle schema difference (shippingAddress vs address)
    const addressDisplay = order.shippingAddress?.addressLine1 || order.address?.fullAddress || "Unknown Address";
    const nameDisplay = order.shippingAddress?.fullName || order.address?.fullName || "User";
    const destLat = order.shippingAddress?.latitude || order.address?.latitude || 0;
    const destLng = order.shippingAddress?.longitude || order.address?.longitude || 0;

    const isLive = (status === 'out of delivery' || status === 'processing') && assignedDeliveryBoy;
    const isDelivered = status === 'delivered';

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-20"> {/* pt-20 for navbar clearance */}
            {/* Header */}
            <div className="bg-white border-b sticky top-16 z-20 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <Navigation className="w-5 h-5 text-gray-600 rotate-180" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Track Order</h1>
                            <p className="text-xs text-gray-500 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    {isDelivered ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Delivered</span>
                    ) : (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
                            {status === 'out of delivery' ? 'Live Tracking' : 'Processing'}
                        </span>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                
                {/* Status Timeline */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" /> Order Status
                    </h2>
                    <OrderTimeline 
                        status={status} 
                        createdAt={order.createdAt} 
                        deliveredAt={order.deliveredAt} 
                    />
                </div>

                {/* Map Section */}
                {(isLive || isDelivered) && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500" /> 
                                {isDelivered ? 'Delivery Location' : 'Live Delivery Location'}
                            </h2>
                            {isLive && eta && (
                                <span className="text-xs font-bold bg-gray-900 text-white px-2 py-1 rounded">
                                    ETA: {eta}
                                </span>
                            )}
                        </div>
                        
                        <div className="relative h-[400px] w-full bg-gray-100">
                             {driverLoc ? (
                                 <DriverMap 
                                    driverLoc={driverLoc} 
                                    customerLoc={{ lat: destLat, lng: destLng }} 
                                 />
                             ) : (
                                 <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                     {isDelivered ? (
                                         <DriverMap 
                                            driverLoc={{ lat: destLat, lng: destLng }} // Show static at dest
                                            customerLoc={{ lat: destLat, lng: destLng }} 
                                            onDriverMove={undefined}
                                         /> 
                                     ) : (
                                         <div className="flex flex-col items-center">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                                            <p className="text-sm font-medium">Waiting for driver signal...</p>
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                    </motion.div>
                )}

                {/* Driver Details Card */}
                {assignedDeliveryBoy && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <User className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Delivery Partner</p>
                                <h3 className="text-lg font-bold text-gray-900">{assignedDeliveryBoy.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Verified Pilot
                                </div>
                            </div>
                        </div>
                        <a 
                            href={`tel:${assignedDeliveryBoy.mobile || ''}`} 
                            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors"
                        >
                            <Phone className="w-5 h-5" />
                        </a>
                    </div>
                )}
                
                {/* Shipping Address Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-2">Delivery Address</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{addressDisplay}</p>
                    <p className="text-gray-900 font-medium text-sm mt-1">{nameDisplay}</p>
                </div>

            </div>
        </div>
    );
}
