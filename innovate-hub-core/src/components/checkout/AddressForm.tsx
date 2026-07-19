import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressAppData {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
}

interface AddressFormProps {
    value: AddressAppData;
    onChange: (data: AddressAppData) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ value, onChange }) => {
    
    const handleChange = (field: keyof AddressAppData, text: string) => {
        onChange({ ...value, [field]: text });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Address</h3>
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                        id="fullName" 
                        value={value.fullName} 
                        onChange={(e) => handleChange('fullName', e.target.value)} 
                        required 
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="addressLine1">Address</Label>
                    <Input 
                        id="addressLine1" 
                        value={value.addressLine1} 
                        onChange={(e) => handleChange('addressLine1', e.target.value)} 
                        placeholder="Street address" 
                        required 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input 
                            id="city" 
                            value={value.city} 
                            onChange={(e) => handleChange('city', e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Input 
                            id="state" 
                            value={value.state} 
                            onChange={(e) => handleChange('state', e.target.value)} 
                            required 
                        />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="postalCode">ZIP / Postal Code</Label>
                        <Input 
                            id="postalCode" 
                            value={value.postalCode} 
                            onChange={(e) => handleChange('postalCode', e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                            id="phone" 
                            value={value.phone} 
                            onChange={(e) => handleChange('phone', e.target.value)} 
                            required 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
