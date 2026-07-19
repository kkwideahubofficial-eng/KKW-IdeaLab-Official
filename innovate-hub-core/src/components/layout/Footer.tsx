import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Linkedin, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] border-t border-slate-800 text-slate-400 text-sm mt-8 md:mt-16">
      
      {/* Upper Footer Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          
          {/* Column 1: AICTE IDEA Lab Overview */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 group outline-none">
              <img src="/logo.svg" alt="AICTE IDEA Lab Logo" className="w-12 h-12 object-contain bg-white rounded p-1" />
              <span className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                AICTE IDEA Lab
              </span>
            </Link>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Innovation • Research • Prototyping • Entrepreneurship
            </p>
            <p className="text-slate-400 leading-relaxed text-xs">
              Empowering students with state-of-the-art facilities, machine access, innovation support, events and project development opportunities.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2 sm:gap-x-0 sm:gap-y-0 sm:space-y-2">
              {[
                { label: "Book Room", path: "/book-slots" },
                { label: "Machine Permission", path: "/machinery" },
                { label: "Events", path: "/events" },
                { label: "Achievements", path: "/achievements" },
                { label: "E-Commerce", path: "/ecommerce" },
                { label: "Lab Information", path: "/aicte-idea-lab" }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path}
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5 group text-xs sm:text-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: About Us */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              About Us
            </h3>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2 sm:gap-x-0 sm:gap-y-0 sm:space-y-2">
              {[
                { label: "KKWIEER", path: "/kkwieer" },
                { label: "Official College Website", path: "https://www.kkwagh.edu.in/engineering", isExternal: true },
                { label: "AICTE IDEA Lab", path: "/aicte-idea-lab" },
                { label: "Leadership Team", path: "/leadership-team" },
                { label: "Development Team", path: "/development-team" },
                { label: "Contact Details", path: "/contact-details" }
              ].map((link, idx) => (
                <li key={idx}>
                  {link.isExternal ? (
                    <a 
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors flex items-center gap-1.5 group text-xs sm:text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors shrink-0" />
                      {link.label}
                      <span className="text-[10px] opacity-60">↗</span>
                    </a>
                  ) : (
                    <Link 
                      to={link.path}
                      className="hover:text-blue-400 transition-colors flex items-center gap-1.5 group text-xs sm:text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors shrink-0" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-base tracking-wide uppercase">
              Contact Us
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex gap-2.5 items-start">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>AICTE IDEA Lab</strong><br />
                  K. K. Wagh Institute of Engineering Education and Research<br />
                  Hirabai Haridas Vidyanagari, Amrutdham, Nashik - 422003
                </span>
              </div>
              <div className="flex gap-2.5 items-center">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:kkwieer-idea-lab@kkwagh.edu.in" className="hover:text-blue-400 transition-colors">
                  kkwieer-idea-lab@kkwagh.edu.in
                </a>
              </div>
              <div className="flex gap-2.5 items-center">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+912532221211" className="hover:text-blue-400 transition-colors">
                  +91 253 2221211
                </a>
              </div>
            </div>

            {/* Social Icons with Hover Effects */}
            <div className="pt-2 flex gap-3">
              {[
                { icon: Linkedin, url: "https://linkedin.com", label: "LinkedIn" },
                { icon: Instagram, url: "https://instagram.com", label: "Instagram" },
                { icon: Youtube, url: "https://youtube.com", label: "YouTube" },
                { icon: Facebook, url: "https://facebook.com", label: "Facebook" }
              ].map((soc, idx) => (
                <a 
                  key={idx}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-400 hover:text-white hover:bg-blue-600 flex items-center justify-center transition-all duration-300 shadow-sm"
                  aria-label={soc.label}
                >
                  <soc.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Divider and Bottom Copyright Bar */}
      <div className="border-t border-slate-800 py-6 bg-slate-950/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div>
            © 2026 AICTE IDEA Lab | KKWIEER
          </div>
          <div>
            Developed by AICTE IDEA Lab Development Team
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
