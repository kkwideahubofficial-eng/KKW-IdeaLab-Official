import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { toast } from "sonner";
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BookSlots from "./pages/BookSlots";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import Achievements from "./pages/Achievements";
import AchievementDetail from "./pages/AchievementDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Kkwieer from "./pages/Kkwieer";
import AicteIdeaLab from "./pages/AicteIdeaLab";
import StudentClubs from "./pages/StudentClubs";
import LeadershipTeam from "./pages/LeadershipTeam";
import DevelopmentTeam from "./pages/DevelopmentTeam";
import ContactDetails from "./pages/ContactDetails";
import Ecommerce from "./pages/Ecommerce";
import NotFound from "./pages/NotFound";
import MyBookings from "./pages/MyBookings";
import ManageEvents from "./pages/ManageEvents";
import ManageAchievements from "./pages/ManageAchievements";
import ManageRooms from "./pages/ManageRooms";
import ManageHero from "./pages/coordinator/ManageHero";
import ManageClubs from "./pages/coordinator/ManageClubs";
import ManageSpecialRooms from "./pages/coordinator/ManageSpecialRooms";
import Records from "./pages/Records";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import ManageOrders from "./pages/coordinator/ManageOrders";
import MyOrders from "./pages/MyOrders";
import TrackingPage from "./pages/TrackingPage";

import ManageMachinery from "./pages/head/ManageMachinery";
import MachineryRequests from "./pages/head/MachineryRequests";
import HeadDashboard from "./pages/head/HeadDashboard";
import EcommerceStats from "./pages/head/EcommerceStats";
import RecordStats from "./pages/head/RecordStats";
import MachineryList from "./pages/machinery/MachineryList";
import MachineryRequestForm from "./pages/machinery/MachineryRequestForm";
import SpecialRoomPermission from "./pages/SpecialRoomPermission";
import ManageRoomPermissions from "./pages/coordinator/ManageRoomPermissions";
import HeadRoomPermissions from "./pages/head/HeadRoomPermissions";
import VerifyRoomPermission from "./pages/VerifyRoomPermission";
import VerifyRequest from "./pages/VerifyRequest";
import FacultyVerification from "./pages/FacultyVerification";



import Profile from "./pages/Profile";
import InstallPWA from "./components/InstallPWA";

const queryClient = new QueryClient();

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('idea_hub_user');
    const token = localStorage.getItem('idea_hub_token');
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ForbiddenRedirect({ message }: { message: string }) {
  useEffect(() => {
    toast.error(message);
  }, [message]);
  return <Navigate to="/" replace />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireInternal({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType !== 'INTERNAL') {
    return <ForbiddenRedirect message="Access Restricted. This feature is available only for KK Wagh students." />;
  }
  return <>{children}</>;
}

function RequireCoordinator({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType !== 'INTERNAL') {
    return <ForbiddenRedirect message="Access Restricted. This page is available only for KK Wagh staff members." />;
  }
  if (!['coordinator', 'head', 'admin'].includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireHead({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType !== 'INTERNAL') {
    return <ForbiddenRedirect message="Access Restricted. This page is available only for KK Wagh staff members." />;
  }
  if (user.role !== 'head' && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.userType !== 'INTERNAL' || user.role !== 'admin') {
    return <ForbiddenRedirect message="Access Restricted. This page is available only for Administrators." />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route
                path="/book-slots"
                element={
                  <RequireAuth>
                    <RequireInternal>
                      <BookSlots />
                    </RequireInternal>
                  </RequireAuth>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <RequireAuth>
                    <RequireInternal>
                      <MyBookings />
                    </RequireInternal>
                  </RequireAuth>
                }
              />
              <Route
                path="/my-orders"
                element={
                  <RequireAuth>
                    <MyOrders />
                  </RequireAuth>
                }
              />
              <Route
                path="/manage-clubs"
                element={
                  <RequireCoordinator>
                    <ManageClubs />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/manage-events"
                element={
                  <RequireCoordinator>
                    <ManageEvents />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/manage-achievements"
                element={
                  <RequireCoordinator>
                    <ManageAchievements />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/manage-rooms"
                element={
                  <RequireCoordinator>
                    <ManageRooms />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/coordinator/manage-special-rooms"
                element={
                  <RequireCoordinator>
                    <ManageSpecialRooms />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/coordinator-dashboard"
                element={
                  <RequireCoordinator>
                    <CoordinatorDashboard />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/records"
                element={
                  <RequireCoordinator>
                    <Records />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/manage-orders"
                element={
                  <RequireCoordinator>
                    <ManageOrders />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/manage-hero"
                element={
                  <RequireCoordinator>
                    <ManageHero />
                  </RequireCoordinator>
                }
              />
              {/* Head Routes */}
              <Route
                path="/head-dashboard"
                element={
                  <RequireHead>
                    <HeadDashboard />
                  </RequireHead>
                }
              />
              <Route
                path="/manage-machinery"
                element={
                  <RequireCoordinator>
                    <ManageMachinery />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/head/requests"
                element={
                  <RequireHead>
                    <MachineryRequests />
                  </RequireHead>
                }
              />
                <Route
                path="/head/ecommerce-stats"
                element={
                  <RequireHead>
                    <EcommerceStats />
                  </RequireHead>
                }
              />
              <Route
                path="/head/records"
                element={
                  <RequireHead>
                    <RecordStats />
                  </RequireHead>
                }
              />
              
              {/* Student Machinery Routes */}
              <Route
                path="/machinery"
                element={
                  <RequireAuth>
                    <MachineryList />
                  </RequireAuth>
                }
              />
              <Route
                path="/machinery/request/:id"
                element={<MachineryRequestForm />}
              />
              {/* Room Permission Routes */}
              <Route
                path="/room-permission"
                element={
                  <RequireAuth>
                    <RequireInternal>
                      <SpecialRoomPermission />
                    </RequireInternal>
                  </RequireAuth>
                }
              />
              <Route
                path="/coordinator/room-permissions"
                element={
                  <RequireCoordinator>
                    <ManageRoomPermissions />
                  </RequireCoordinator>
                }
              />
              <Route
                path="/head/room-permissions"
                element={
                  <RequireHead>
                    <HeadRoomPermissions />
                  </RequireHead>
                }
              />
              <Route path="/verify-room-permission/:requestId" element={<VerifyRoomPermission />} />
              <Route path="/verify-request/:requestId" element={<VerifyRequest />} />
              <Route path="/verify-faculty/:requestId" element={<FacultyVerification />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/achievements/:id" element={<AchievementDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/kkwieer" element={<Kkwieer />} />
              <Route path="/aicte-idea-lab" element={<AicteIdeaLab />} />
              <Route path="/student-clubs" element={<StudentClubs />} />
              <Route path="/lab-info" element={<Navigate to="/aicte-idea-lab" replace />} />
              <Route path="/leadership-team" element={<LeadershipTeam />} />
              <Route path="/development-team" element={<DevelopmentTeam />} />
              <Route path="/about-us" element={<DevelopmentTeam />} />
              <Route path="/contact-details" element={<ContactDetails />} />
              <Route path="/ecommerce" element={<Ecommerce />} />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                }
              />
               <Route
                path="/order-confirmation/:id"
                element={
                  <RequireAuth>
                    <OrderSuccess />
                  </RequireAuth>
                }
              />
              <Route
                path="/track-order/:id"
                element={
                  <RequireAuth>
                    <TrackingPage />
                  </RequireAuth>
                }
              />



              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <InstallPWA />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
