import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'team' | 'head' | 'delivery_boy' | 'admin';
  userType?: 'INTERNAL' | 'EXTERNAL';
  teamName?: string;
}

interface NavItem {
  name: string;
  path?: string;
  dropdownItems?: { name: string; path: string; isExternal?: boolean }[];
}

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("idea_hub_user");
      const token = localStorage.getItem("idea_hub_token");

      if (raw && token) {
        const parsed = JSON.parse(raw);
        setUser({
          id: parsed._id || parsed.id,
          name: parsed.name,
          email: parsed.email,
          role: parsed.role,
          userType: parsed.userType,
          teamName: parsed.teamName
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("idea_hub_token");
    localStorage.removeItem("idea_hub_user");
    setUser(null);
    toast.success("Successfully logged out");
    navigate("/");
    setMobileMenuOpen(false);
  };

  /* 
     Requested Order: 
     1. Home
     2. Book Slot (Team only)
     3. My Bookings (Team only)
     4. Achievements
     5. Events
     6. E-commerce
     7. Lab Info
     8. Coordinator Links (if applicable)
  */
  const getNavLinks = () => {
    // Head Role - Exclusive Navigation
    if (user?.role === 'head') {
      return [
        { name: "Dashboard", path: "/head-dashboard" },
        { name: "Requests", path: "/head/requests" },
        { name: "Room Permissions", path: "/head/room-permissions" },
        { name: "Manage Machinery", path: "/manage-machinery" },
        { name: "Manage Orders", path: "/manage-orders" },
        { name: "Records & Attendance", path: "/head/records" },
        { name: "E-commerce Stats", path: "/head/ecommerce-stats" }
      ];
    }

    const links: NavItem[] = [
      { name: "Home", path: "/" },
    ];

    if (user?.role === 'team') {
      if (user.userType === 'INTERNAL') {
        links.push({ name: "Book Slots", path: "/book-slots" });
        links.push({ name: "My Bookings", path: "/my-bookings" });
      }
      links.push({ name: "Machinery Permission", path: "/machinery" });
      if (user.userType === 'INTERNAL') {
        links.push({ name: "Room Permission", path: "/room-permission" });
      }
      links.push({ name: "Profile", path: "/profile" });
    }

    links.push(
      { name: "Achievements", path: "/achievements" }
    );

    if (user?.role !== 'coordinator') {
      links.push({ name: "Events", path: "/events" });
    }

    links.push(
      { name: "E-commerce", path: "/ecommerce" },
      {
        name: "About Us",
        dropdownItems: [
          { name: "KKWIEER", path: "/kkwieer" },
          { name: "Official College Website", path: "https://www.kkwagh.edu.in/engineering", isExternal: true },
          { name: "AICTE – IDEA Lab", path: "/aicte-idea-lab" },
          { name: "Student Clubs", path: "/student-clubs" },
          { name: "Leadership Team", path: "/leadership-team" },
          { name: "Development Team", path: "/development-team" },
          { name: "Contact Details", path: "/contact-details" }
        ]
      }
    );

    if (user?.role === 'coordinator') {
      links.push(
        { name: "Dashboard", path: "/coordinator-dashboard" },
        { name: "Room Permissions", path: "/coordinator/room-permissions" },
        { name: "Manage Clubs", path: "/manage-clubs" },
        { name: "Manage Events", path: "/manage-events" },
        { name: "Manage Orders", path: "/manage-orders" },
        { name: "Manage Hero", path: "/manage-hero" },
        { name: "Manage Rooms", path: "/manage-rooms" },
        { name: "Manage Machinery", path: "/manage-machinery" },
        { name: "Records", path: "/records" },
        { name: "Profile", path: "/profile" }
      );
    }

    return links;
  };

  const navLinks = getNavLinks();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile menu (Left Drawer) */}
            <div className="md:hidden mr-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  >
                    <span className="sr-only">Open main menu</span>
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] flex flex-col h-full">
                  <SheetHeader className="shrink-0">
                    <div className="flex items-center space-x-2 pb-4 border-b">
                      <img src="/logo.svg" alt="AICTE IDEA Lab Logo" className="w-12 h-12 object-contain" />
                      <SheetTitle className="text-lg font-bold">AICTE IDEA Lab</SheetTitle>
                    </div>
                  </SheetHeader>
                  <div className="flex flex-col space-y-3 mt-6 overflow-y-auto flex-1 pr-1 pb-6">
                    {navLinks.map((link) => {
                      if (link.dropdownItems) {
                        return (
                          <div key={link.name} className="space-y-1.5 pl-1">
                            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {link.name}
                            </div>
                            <div className="flex flex-col space-y-1 pl-2 border-l border-primary/20">
                              {link.dropdownItems.map((sub) => 
                                sub.isExternal ? (
                                  <a
                                    key={sub.path}
                                    href={sub.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-accent text-accent-foreground/90 hover:text-accent-foreground flex items-center justify-between group"
                                  >
                                    <span>{sub.name}</span>
                                    <span className="text-xs opacity-60">↗</span>
                                  </a>
                                ) : (
                                  <Link
                                    key={sub.path}
                                    to={sub.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-accent text-accent-foreground/90 hover:text-accent-foreground"
                                  >
                                    {sub.name}
                                  </Link>
                                )
                              )}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={link.path}
                          to={link.path!}
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-accent text-accent-foreground hover:bg-accent/80"
                        >
                          {link.name}
                        </Link>
                      );
                    })}

                    <div className="my-4 border-t border-border" />

                    {user?.role ? (
                      <div className="space-y-3">
                        <div className="px-3 text-sm font-medium text-muted-foreground">
                          Welcome, {user.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start">Login</Button>
                        </Link>
                        <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                          <Button size="sm" className="w-full justify-start">Sign Up</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="AICTE IDEA Lab Logo" className="w-16 h-16 object-contain" />
              <span className="text-xl font-semibold text-foreground">AICTE IDEA Lab</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              if (link.dropdownItems) {
                return (
                  <DropdownMenu key={link.name}>
                    <DropdownMenuTrigger asChild>
                      <button className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-accent text-accent-foreground hover:bg-accent/80 flex items-center gap-1.5 outline-none">
                        {link.name}
                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-[100]">
                      {link.dropdownItems.map((sub) => (
                        <DropdownMenuItem key={sub.path} asChild>
                          {sub.isExternal ? (
                            <a
                              href={sub.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-[#7C3AED] transition-colors flex items-center justify-between group outline-none"
                            >
                              <span>{sub.name}</span>
                              <span className="opacity-60 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-400 group-hover:text-[#7C3AED]">↗</span>
                            </a>
                          ) : (
                            <Link
                              to={sub.path}
                              className="w-full px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-[#7C3AED] transition-colors flex items-center justify-between group outline-none"
                            >
                              <span>{sub.name}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-[#7C3AED]">&rarr;</span>
                            </Link>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
                <Link
                  key={link.path}
                  to={link.path!}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors bg-accent text-accent-foreground hover:bg-accent/80"
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {user?.role ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
