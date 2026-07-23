import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Use the main backend auth
        const res = await axios.post("/api/auth/login", {
            email,
            password
        });
        
        if (res.data && res.data.user) {
            // Check if user is actually a driver/delivery_boy
            // Assuming role check or just allowing for demo
            localStorage.setItem("driver_id", res.data.user._id);
            if (res.data.token) localStorage.setItem("token", res.data.token);
            toast.success("Welcome back, Pilot!");
            navigate("/driver/dashboard");
        } else {
            toast.error("Login failed");
        }
    } catch (error: any) {
        // Fallback for demo if backend auth fails or mock user
        if (email === "driver@ideahub.com" && password === "demo") {
             // Mock ID matching a valid ObjectId format
             localStorage.setItem("driver_id", "65a1234567890abcdef12345"); 
             toast.success("Demo Login Success");
             navigate("/driver/dashboard");
        } else {
             toast.error(error.response?.data?.message || "Invalid credentials");
        }
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
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Driver Portal</h2>
        <p className="text-center text-gray-500 mb-8">Login to manage deliveries</p>

        <form onSubmit={handleLogin} className="space-y-4">
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
                {loading ? "Authenticating..." : "Start Engine"}
            </button>
        </form>
        
            <div className="mt-6 text-center text-xs text-gray-400">
                For Demo: driver@ideahub.com / demo
            </div>
             <div className="mt-4 text-center text-xs text-gray-400">
                New Pilot? <Link to="/driver/signup" className="text-blue-600 hover:underline">Register Here</Link>
            </div>
      </div>
    </div>
  );
}
