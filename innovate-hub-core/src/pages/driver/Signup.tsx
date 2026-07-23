import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

export default function DriverSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Using main auth endpoint, enforcing role 'delivery_boy' (if backend allows generic signup with role)
        // Or if backend hardcodes role, we might need a specific endpoint. 
        // Assuming standard signup permits role selection or we default it here.
        // If backend /auth/signup doesn't take role, user might be created as 'user'. 
        // For now, I'll try to send role.
        const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
            name,
            email,
            password,
            mobile: phone, // Assuming backend uses 'mobile' or 'phone'
            role: "delivery_boy" 
        });
        
        if (res.data) {
            toast.success("Registration Successful! Please Login.");
            navigate("/driver/login");
        }
    } catch (error: any) {
         toast.error(error.response?.data?.message || "Registration failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg shadow-blue-200">
                <Truck className="w-8 h-8 text-white" />
            </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Join as Pilot</h2>
        <p className="text-center text-gray-500 mb-8">Deliver happiness, earn respect.</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
            <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="driver@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
                type="tel" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? "Registering..." : "Submit Application"}
            </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
             Already a Pilot? <Link to="/driver/login" className="text-blue-600 font-bold hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
