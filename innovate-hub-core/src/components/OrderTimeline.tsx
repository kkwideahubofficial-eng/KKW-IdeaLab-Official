import React from 'react';
import { CheckCircle, Truck, Package, Clock } from 'lucide-react';

interface OrderTimelineProps {
    status: "pending" | "out of delivery" | "delivered" | "shipped" | "processing" | "cancelled";
    createdAt?: Date;
    deliveredAt?: Date;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, deliveredAt }) => {
    
    // Normalize status to lowercase for comparison
    const currentStatus = status.toLowerCase();

    const steps = [
        { 
            id: 'pending', 
            label: 'Order Placed', 
            icon: Package,
            time: createdAt ? new Date(createdAt).toLocaleString() : ''
        },
        { 
            id: 'out of delivery', 
            label: 'Out for Delivery', 
            icon: Truck,
            time: (currentStatus === 'out of delivery' || currentStatus === 'shipped') ? 'In Progress' : ''
        },
        { 
            id: 'delivered', 
            label: 'Delivered', 
            icon: CheckCircle,
            time: deliveredAt ? new Date(deliveredAt).toLocaleString() : ''
        }
    ];

    const getCurrentStepIndex = () => {
        if (currentStatus === 'delivered') return 3;
        if (currentStatus === 'out of delivery' || currentStatus === 'shipped') return 2;
        return 1;
    };

    const currentStep = getCurrentStepIndex();

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                <div 
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index < currentStep;
                    const isCurrent = index === currentStep - 1;

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                isActive || isCurrent
                                    ? 'bg-green-100 border-green-500 text-green-600'
                                    : 'bg-gray-50 border-gray-300 text-gray-400'
                            }`}>
                                <StepIcon size={18} />
                            </div>
                            <p className={`text-xs font-semibold mt-2 ${isActive || isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                                {step.label}
                            </p>
                            {step.time && (
                                <p className="text-[10px] text-gray-500 mt-0.5 max-w-[80px] text-center leading-tight">
                                    {step.time}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTimeline;
