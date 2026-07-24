import { Mail, Phone, MapPin } from "lucide-react";

const ContactDetails = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* Header Banner */}
      <section className="relative w-full py-16 lg:py-20 bg-gradient-to-r from-primary to-blue-700 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
              <Mail className="w-4 h-4 text-amber-300" />
              Connect With Us
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Contact Details
            </h1>
            <p className="text-base sm:text-lg text-indigo-100 max-w-3xl leading-relaxed">
              Have questions about registrations, machinery scheduling, or industry collaboration? Reach out to the lab coordinator.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Left Side: Info Cards */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 flex flex-col justify-between h-full">
            <h2 className="text-2xl font-black text-slate-800 border-b pb-3">Lab Coordinates</h2>
            
            <div className="space-y-6">
              {/* Physical Address */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Lab Location</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    AICTE – IDEA Lab (Ground Floor),<br />
                    K. K. Wagh Institute of Engineering Education and Research,<br />
                    Hirabai Haridas Vidya Nagari, Amrutdham, Panchavati,<br />
                    Nashik, Maharashtra - 422003
                  </p>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Email Enquiries</h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    <a href="mailto:idealab@kkwagh.edu.in" className="hover:text-primary hover:underline block">
                      idealab@kkwagh.edu.in
                    </a>
                    <a href="mailto:kkwieer@kkwagh.edu.in" className="hover:text-primary hover:underline block text-xs text-slate-400 mt-0.5">
                      kkwieer@kkwagh.edu.in
                    </a>
                  </p>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Phone Assistance</h3>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    <a href="tel:+912532512876" className="hover:text-primary hover:underline block">
                      +91-253-2512876 (Ext. 450)
                    </a>
                    <span className="block text-xs text-slate-400 font-light mt-0.5">
                      Lab Coordinator Direct: Ext. 452
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Map Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800">Find Us on Google Maps</h3>
                <p className="text-xs text-slate-500 mt-1">Visit our campus located at Hirabai Haridas Vidyanagari, Nashik</p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  ★ 4.2 Rating
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold border border-blue-200">
                  2,334 Reviews
                </span>
              </div>
            </div>
            <div className="w-full flex-grow min-h-[300px] overflow-hidden rounded-2xl border border-slate-100">
              <iframe
                src="https://maps.google.com/maps?q=K.K.%20Wagh%20Institute%20Of%20Engineering%20Education%20and%20Research,%20Nashik&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="K.K. Wagh Institute Of Engineering Education and Research Location Map"
              ></iframe>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ContactDetails;
