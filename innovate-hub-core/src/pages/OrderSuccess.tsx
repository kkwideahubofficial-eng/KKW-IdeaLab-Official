import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Package } from 'lucide-react';
import api from '@/lib/axios';

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (error) {
        console.error("Failed to fetch order", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading order details...</div>;

  if (!order) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold mb-4">Order not found</h2>
      <Link to="/"><Button>Return Home</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
            <p className="text-gray-500 mt-2">Thank you for your purchase.</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-left text-sm space-y-2">
            <div className="flex justify-between">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono font-medium">{order._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-green-600">{order.status}</span>
            </div>
            <div className="flex justify-between pt-2 border-t mt-2">
                <span className="font-bold">Total Amount</span>
                <span className="font-bold">₹{order.amounts.total.toFixed(2)}</span>
            </div>
        </div>

        <p className="text-sm text-gray-500">
            We have sent a confirmation email to <strong>{order.shippingAddress.fullName}</strong>.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
            <Link to="/ecommerce">
                <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Shop More
                </Button>
            </Link>
             <Link to="/my-bookings">
                <Button className="w-full">
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
