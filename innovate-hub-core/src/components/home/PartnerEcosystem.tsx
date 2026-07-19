const partners = [
  { 
    name: "Savitribai Phule Pune University", 
    acronym: "SPPU",
    colorClass: "group-hover:text-red-700 group-hover:border-red-200",
    bgAccent: "group-hover:bg-red-50/20",
    badge: "Affiliating University"
  },
  { 
    name: "All India Council for Technical Education", 
    acronym: "AICTE",
    colorClass: "group-hover:text-blue-600 group-hover:border-blue-200",
    bgAccent: "group-hover:bg-blue-50/30",
    badge: "Government Sponsor"
  },
  { 
    name: "Texas Instruments", 
    acronym: "TI",
    colorClass: "group-hover:text-rose-600 group-hover:border-rose-200",
    bgAccent: "group-hover:bg-rose-50/20",
    badge: "Technology Partner"
  },
  { 
    name: "Emerson Electric Co.", 
    acronym: "Emerson",
    colorClass: "group-hover:text-cyan-700 group-hover:border-cyan-200",
    bgAccent: "group-hover:bg-cyan-50/20",
    badge: "Industry Mentor"
  },
  { 
    name: "Ministry of Education's Innovation Cell", 
    acronym: "MIC",
    colorClass: "group-hover:text-amber-600 group-hover:border-amber-200",
    bgAccent: "group-hover:bg-amber-50/30",
    badge: "Innovation Cell"
  }
];

const PartnerEcosystem = () => {
  return (
    <section className="py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            Collaborative Ecosystem
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Academic & Industry Partners
          </h2>
          <p className="text-slate-500 text-sm sm:text-base">
            Driving engineering excellence and student innovation alongside national statutory bodies and tech sponsors.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {partners.map((partner, idx) => (
            <div 
              key={idx}
              className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center h-full select-none transition-all duration-300 group hover:shadow-md ${partner.colorClass} ${partner.bgAccent} ${
                idx === partners.length - 1 ? "col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Logo / Acronym */}
              <div className="flex flex-col items-center">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-800 group-hover:scale-105 transition-transform duration-300 block">
                  {partner.acronym}
                </span>
                
                {/* Category Badge */}
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-sm mt-2.5 sm:mt-3">
                  {partner.badge}
                </span>
              </div>

              {/* Full Description */}
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold leading-relaxed mt-3 sm:mt-4">
                {partner.name}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default PartnerEcosystem;
