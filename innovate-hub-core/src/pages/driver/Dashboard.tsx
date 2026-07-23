import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { MapPin, Navigation, Package, Power, Clock, CheckCircle, ChevronRight, AlertCircle, Locate } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import DriverMap from "@/components/DriverMap";

// Types
interface Task {
    assignmentId?: string; // Mapped from assignment._id
    orderId: string;
    customerName: string;
    address: string;
    status: 'PENDING' | 'ACCEPTED' | 'DELIVERED';
    location?: { lat: number, lng: number }; 
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDriving, setIsDriving] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number, lng: number } | null>(null);
  const [history, setHistory] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'history' | 'manual_loc'>('available');
  const [geoError, setGeoError] = useState<string | null>(null);
  
  // Geolocation Tracking
  const watchIdRef = useRef<number | null>(null);
  const [useSimulation, setUseSimulation] = useState(false);
  
  // Simulation Refs
  const routeIndex = useRef(0);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [manualAddress, setManualAddress] = useState({
      houseNo: '',
      street: '',
      landmark: '',
      city: '',
      district: '',
      state: '',
      zip: '',
  });
  
  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
    }
    
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const newLoc = { lat: latitude, lng: longitude };
            setCurrentLoc(newLoc);
            
            // Reverse geocode to fill fields
            try {
                 const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                 if(res.data && res.data.address) {
                     const addr = res.data.address;
                     setManualAddress({
                         houseNo: addr.house_number || '',
                         street: addr.road || addr.suburb || '',
                         landmark: addr.neighbourhood || '',
                         city: addr.city || addr.town || addr.village || '',
                         district: addr.state_district || '',
                         state: addr.state || '',
                         zip: addr.postcode || ''
                     });
                 }
            } catch(e) {
                console.error("Reverse geocoding failed", e);
            }

             // Notify server immediately
            const userId = localStorage.getItem("driver_id");
            if(socket && userId) {
                socket.emit("update-location", {
                    userId,
                    latitude,
                    longitude
                });
            }
        },
        (error) => {
            console.error(error);
            setGeoError("Unable to retrieve your location. Check GPS settings or allow permission.");
        }
    );
  };

  // Dynamic Route Generation
  const [mockRoute, setMockRoute] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
      if (activeTask && activeTask.location && activeTask.location.lat !== 0) {
          // Generate a route starting 2km away from customer
          const startLat = activeTask.location.lat - 0.02; // Roughly 2km south
          const startLng = activeTask.location.lng - 0.02; // Roughly 2km west
          const endLat = activeTask.location.lat;
          const endLng = activeTask.location.lng;
          
          const steps = 20;
          const route = [];
          
          for (let i = 0; i <= steps; i++) {
              route.push({
                  lat: startLat + (endLat - startLat) * (i / steps),
                  lng: startLng + (endLng - startLng) * (i / steps)
              });
          }
          setMockRoute(route);
          
          // Set initial driver loc to start of route if not set OR if currently 0,0 (fix stale state)
          if (!currentLoc || (currentLoc.lat === 0 && currentLoc.lng === 0)) {
              if (route.length > 0) {
                  setCurrentLoc(route[0]);
              } else {
                  // Fallback: If no route, start at customer location (better than 0,0)
                  setCurrentLoc(activeTask.location);
              }
          }
      }
  }, [activeTask, currentLoc]);

  // Load state from local storage on mount
  useEffect(() => {
      const savedTask = localStorage.getItem("active_delivery_task");
      if (savedTask) {
          try {
            const task = JSON.parse(savedTask);
            if (task && task.assignmentId) {
                setActiveTask(task);
            } else {
                localStorage.removeItem("active_delivery_task");
                setActiveTask(null);
            }
          } catch(e) {
            localStorage.removeItem("active_delivery_task"); 
          }
      }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // 0. Get User Identity
            let userId = localStorage.getItem("driver_id");
            const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(userId); 

            if (!isValidId) {
                 // Try to recover from auth session via backend if cookie exists or token
                 try {
                     const token = localStorage.getItem("token");
                     const meRes = await axios.get('/api/auth/me', {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                     });
                     if (meRes.data && meRes.data.user && meRes.data.user._id) {
                         userId = meRes.data.user._id;
                         localStorage.setItem("driver_id", userId!);
                     } else {
                         navigate("/driver/login");
                         return;
                     }
                 } catch (e) {
                     navigate("/driver/login");
                     return;
                 }
            }

            // 1. Check for Active Order
            try {
                const activeOrderRes = await axios.get('/api/delivery/current-order', {
                    headers: { 'x-driver-id': userId } 
                });
                if (activeOrderRes.data.active && activeOrderRes.data.assignment) {
                    const assignment = activeOrderRes.data.assignment;
                    
                    if (assignment && assignment.order) {
                        const shipping = assignment.order.shippingAddress || {};
                        // Construct a more descriptive address for display
                        const displayAddress = [
                            shipping.addressLine1, 
                            shipping.city, 
                            shipping.state, 
                            shipping.postalCode
                        ].filter(Boolean).join(", ") || "Unknown Address";

                        const recoverTask: Task = {
                            assignmentId: assignment._id,
                            orderId: assignment.order._id,
                            customerName: shipping.fullName || assignment.order.address?.fullName || "Unknown Customer",
                            address: displayAddress,
                            status: 'ACCEPTED',
                            location: { 
                                lat: shipping.latitude || assignment.order.address?.latitude || 0, 
                                lng: shipping.longitude || assignment.order.address?.longitude || 0 
                            }
                        };

                        // Fix: If location is 0,0 try to geocode with detailed hierarchy
                        const hasValidLocation = recoverTask.location && 
                                               recoverTask.location.lat !== 0 && 
                                               recoverTask.location.lng !== 0 &&
                                               !isNaN(recoverTask.location.lat) &&
                                               !isNaN(recoverTask.location.lng);

                        if(!hasValidLocation) {
                             console.log("Invalid location detected, attempting geocoding fix...");
                             try {
                                 let geoRes = null;
                                 
                                 // Strategy 1: Full Address with Zip
                                 const queries = [
                                     `${shipping.addressLine1}, ${shipping.city}, ${shipping.state}, ${shipping.postalCode}`,
                                     `${shipping.city}, ${shipping.state}, ${shipping.postalCode}`,
                                     `${shipping.city}, ${shipping.state}`,
                                     "Nashik, Maharashtra, India" // Default fallback
                                 ];

                                 for (const q of queries) {
                                     if(!q || q.trim() === "") continue;
                                     try {
                                         const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
                                         if(res.data && res.data.length > 0) {
                                             geoRes = res.data[0];
                                             break; // Found it!
                                         }
                                     } catch(e) {
                                         console.warn("Geocoding failed for:", q);
                                     }
                                     await new Promise(r => setTimeout(r, 200)); 
                                 }

                                 if(geoRes) {
                                     recoverTask.location = {
                                         lat: parseFloat(geoRes.lat),
                                         lng: parseFloat(geoRes.lon)
                                     };
                                 } else {
                                     console.warn("All geocoding attempts failed. Using default Nashik coordinates.");
                                     // FALLBACK TO NASHIK if everything fails
                                     recoverTask.location = { lat: 19.9975, lng: 73.7898 };
                                 }
                             } catch(e) {
                                 console.error("Critical geocoding error", e);
                                 // Fallback on error too
                                 recoverTask.location = { lat: 19.9975, lng: 73.7898 };
                             }
                        }

                        setActiveTask(recoverTask);
                        localStorage.setItem("active_delivery_task", JSON.stringify(recoverTask));
                    }
                } else {
                     // Sync: If backend says no active order, clear local state
                     if (activeTask || localStorage.getItem("active_delivery_task")) {
                         console.log("Syncing: Clearing stale active task");
                         setActiveTask(null);
                         localStorage.removeItem("active_delivery_task");
                     }
                }
            } catch (e: any) {
                console.error("Failed active order check");
            }

            // 2. Get available tasks
            const assignmentsRes = await axios.get('/api/delivery/get-assignments', {
                headers: { 'x-driver-id': userId }
            });
            
            const assignmentsData = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
            const newTasks = assignmentsData
                .filter((assignment: any) => assignment.order)
                .map((assignment: any) => ({
                    assignmentId: assignment._id,
                    orderId: assignment.order._id,
                    customerName: assignment.order.shippingAddress?.fullName || assignment.order.address?.fullName || "Unknown",
                    address: assignment.order.shippingAddress?.addressLine1 || assignment.order.address?.fullAddress || "Unknown Address",
                    status: 'PENDING' as const,
                    location: { 
                        lat: assignment.order.shippingAddress?.latitude || assignment.order.address?.latitude || 19.9975, 
                        lng: assignment.order.shippingAddress?.longitude || assignment.order.address?.longitude || 73.7898 
                    }
                }));
            
            setTasks(newTasks);

             // Connect Socket
            if (!socket) {
                const newSocket = io(); // Standard Backend Port (auto-detects origin)
                setSocket(newSocket);

                newSocket.on("connect", () => {
                    console.log("Connected to Socket");
                    newSocket.emit("identity", userId);
                });

                newSocket.on("new-delivery-task", (task: Task) => {
                    // Sanitize location immediately
                    if (!task.location || (task.location.lat === 0 && task.location.lng === 0)) {
                         task.location = { lat: 19.9975, lng: 73.7898 };
                    }
                    setTasks(prev => {
                        if (prev.some(t => t.orderId === task.orderId)) return prev;
                        return [...prev, task];
                    });
                    toast.info("New Delivery Request!");
                });
            }

        } catch (e: any) {
            console.error("Failed data fetch", e.message);
        }
    };
    fetchData();

    return () => {
        if (socket) socket.disconnect();
        if(watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        if(simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [navigate]);

  const handleAccept = async (task: Task) => {
      try {
          if(task.assignmentId) {
             const userId = localStorage.getItem("driver_id");
             await axios.post(`/api/delivery/assignment/${task.assignmentId}/accept-assignment`, {}, {
                 headers: { 'x-driver-id': userId }
             });
          }
          
          const acceptedTask = { ...task, status: 'ACCEPTED' as const };
          setActiveTask(acceptedTask);
          setTasks(prev => prev.filter(t => t.orderId !== task.orderId));
          localStorage.setItem("active_delivery_task", JSON.stringify(acceptedTask));
          toast.success("Delivery Accepted!");

      } catch(e) {
          toast.error("Failed to accept task.");
      }
  };

  const toggleDriving = () => {
      if(!socket || !activeTask) return;

      if(isDriving) {
          setIsDriving(false);
          if(watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
          }
          if(simIntervalRef.current) {
              clearInterval(simIntervalRef.current);
              simIntervalRef.current = null;
          }
      } else {
          setIsDriving(true);
          setGeoError(null);
          const userId = localStorage.getItem("driver_id");
          if(!userId) {
              toast.error("User ID missing");
              return;
          }

          if (useSimulation) {
              simIntervalRef.current = setInterval(() => {
                  const loc = mockRoute[routeIndex.current % mockRoute.length];
                  routeIndex.current++;
                  
                  socket.emit("update-location", {
                      userId,
                      latitude: loc.lat,
                      longitude: loc.lng
                  });
                  
                  setCurrentLoc(loc); 
              }, 3000); 

          } else {
              if (!navigator.geolocation) {
                  setGeoError("No Geolocation");
                  setIsDriving(false);
                  return;
              }

              watchIdRef.current = navigator.geolocation.watchPosition((position) => {
                  const { latitude, longitude } = position.coords;
                  const loc = { lat: latitude, lng: longitude };
                  socket.emit("update-location", { userId, latitude, longitude });
                  setCurrentLoc(loc); 
              }, (err) => {
                  toast.error("GPS Error: " + err.message);
                  setGeoError(err.message);
                  setIsDriving(false);
              }, { enableHighAccuracy: true });
          }
      }
  };

  const handleComplete = async () => {
      if(!activeTask) return;
      try {
          if(activeTask.assignmentId) {
             const userId = localStorage.getItem("driver_id");
             await axios.post(`/api/delivery/assignment/${activeTask.assignmentId}/complete-assignment`, {}, {
                 headers: { 'x-driver-id': userId }
             });
          }
          
          
          setActiveTask(null);
          setIsDriving(false);
          localStorage.removeItem("active_delivery_task");
          if(simIntervalRef.current) clearInterval(simIntervalRef.current);
          
          toast.success("Delivery Completed! Ready for next task.");
          setActiveTab('available'); // Go to available to pick next task

      } catch(e) {
          toast.error("Failed to complete task");
      }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                 <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20">
                    <Navigation className="w-6 h-6" />
                 </div>
                 <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Driver Dashboard</h1>
                    <p className="text-xs text-gray-500 font-medium">Ready to deliver • {socket ? <span className="text-green-600">Online</span> : <span className="text-amber-500">Connecting...</span>}</p>
                 </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end"> 
                <div className="bg-gray-100/50 p-1 rounded-xl flex shadow-inner">
                    {['available', 'history'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all z-10 ${
                                activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/50"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
                
                <button onClick={() => { localStorage.removeItem("driver_id"); navigate('/driver/login'); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Power className="w-5 h-5" />
                </button>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
                {activeTask && (
                     <div className="mb-6 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{activeTask.customerName}</h3>
                                <p className="text-gray-500">{activeTask.address}</p>
                            </div>
                            <button onClick={handleComplete} className="text-sm font-semibold text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 shadow-md transition-all flex items-center gap-2">
                                <CheckCircle size={16} /> Complete & End Task
                            </button>
                        </div>
                        
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100 h-[320px] mb-4 relative">
                            {activeTask.location && currentLoc ? (
                                <DriverMap driverLoc={currentLoc} customerLoc={activeTask.location} address={activeTask.address} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                                    <p>Waiting for GPS...</p>
                                </div>
                            )}
                        </div>

                     <div className="grid md:grid-cols-2 gap-4">
                            <button 
                                onClick={toggleDriving}
                                className={`py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                                    isDriving ? "bg-red-50 text-red-600 border-2 border-red-100" : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                {isDriving ? "Stop Sharing" : "Start Live Sharing"}
                            </button>
                             <div className="flex items-center justify-between px-5 bg-gray-50 rounded-xl border border-gray-100">
                                  <span className="text-sm font-medium text-gray-600">Mock Route (Demo)</span>
                                  <input type="checkbox" checked={useSimulation} onChange={(e) => setUseSimulation(e.target.checked)} className="w-5 h-5" />
                            </div>
                        </div>

                         {/* Manual Location Input - Fallback for Laptop/No GPS */}
                         <div className="mt-6 pt-6 border-t border-gray-100">
                             <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setActiveTab(activeTab === 'manual_loc' ? 'available' : 'manual_loc')}>
                                 <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                     <MapPin className="w-4 h-4 text-gray-500" /> Manual Location Update
                                 </h4>
                                 <ChevronRight className="w-4 h-4 text-gray-400" />
                             </div>
                             
                             <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                 <div className="col-span-2 lg:col-span-1">
                                     <input 
                                         placeholder="State (e.g. Maharashtra)" 
                                         className="w-full p-2 border rounded-lg text-sm"
                                         value={manualAddress.state}
                                         onChange={e => setManualAddress({...manualAddress, state: e.target.value})}
                                     />
                                 </div>
                                 <div className="col-span-2 lg:col-span-1">
                                     <input 
                                         placeholder="City/District" 
                                         className="w-full p-2 border rounded-lg text-sm"
                                         value={manualAddress.city}
                                         onChange={e => setManualAddress({...manualAddress, city: e.target.value})}
                                     />
                                 </div>
                                 <div className="col-span-1">
                                      <input 
                                         placeholder="Area/Street" 
                                         className="w-full p-2 border rounded-lg text-sm"
                                         value={manualAddress.street}
                                         onChange={e => setManualAddress({...manualAddress, street: e.target.value})}
                                     />
                                 </div>
                                 <div className="col-span-1">
                                     <input 
                                         placeholder="Pincode" 
                                         className="w-full p-2 border rounded-lg text-sm"
                                         value={manualAddress.zip}
                                         onChange={e => setManualAddress({...manualAddress, zip: e.target.value})}
                                     />
                                 </div>

                                 <button 
                                     onClick={async () => {
                                         // Build query with more detail
                                         const queryParts = [];
                                         if(manualAddress.street) queryParts.push(manualAddress.street);
                                         if(manualAddress.city) queryParts.push(manualAddress.city);
                                         if(manualAddress.state) queryParts.push(manualAddress.state);
                                         if(manualAddress.zip) queryParts.push(manualAddress.zip);
                                         
                                         const query = queryParts.join(", ");

                                         try {
                                             toast.loading("Locating...");
                                             const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                                             if (res.data && res.data.length > 0) {
                                                 const { lat, lon } = res.data[0];
                                                 const newLoc = { lat: parseFloat(lat), lng: parseFloat(lon) };
                                                 setCurrentLoc(newLoc);
                                                 
                                                 const userId = localStorage.getItem("driver_id");
                                                 if (socket && userId) {
                                                     socket.emit("update-location", {
                                                         userId,
                                                         latitude: newLoc.lat,
                                                         longitude: newLoc.lng
                                                     });
                                                 }
                                                 toast.dismiss();
                                                 toast.success("Location Updated Manually");
                                             } else {
                                                 toast.dismiss();
                                                 toast.error("Address not found on map. Try checking the State/City.");
                                             }
                                         } catch(e) {
                                             toast.dismiss();
                                             toast.error("Geocoding failed");
                                         }
                                     }}
                                     className="col-span-2 lg:col-span-1 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center h-[38px]"
                                 >
                                     <MapPin className="w-3 h-3 mr-2" /> Set Location
                                 </button>
                             </div>
                             <p className="text-xs text-gray-400 mt-2">* Providing Pincode and State helps accuracy.</p>
                         </div>
                     </div>
                )}
                
                {activeTab === 'available' && !activeTask && (
                    <div className="space-y-4">
                         <h2 className="text-lg font-bold">New Requests</h2>
                         {tasks.length === 0 ? (
                             <div className="text-center py-10 text-gray-400 border-dashed border-2 rounded-xl">No tasks available</div>
                         ) : (
                            tasks.map(task => (
                                <div key={task.orderId} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{task.customerName}</h3>
                                        <p className="text-gray-500 text-sm">{task.address}</p>
                                    </div>
                                    <button onClick={() => handleAccept(task)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600">
                                        Accept
                                    </button>
                                </div>
                            ))
                         )}
                    </div>
                )}

                {activeTab === 'history' && (
                     <div className="text-center py-10 text-gray-400">History feature coming soon (Backend Ready)</div>
                )}
            </div>
        </main>
    </div>
  );
}
