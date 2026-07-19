import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Clock } from "lucide-react";
import api from "@/lib/axios";

interface EventItem {
  _id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  status: string;
}

const mockEvents: EventItem[] = [
  {
    _id: "mock-ev1",
    title: "Innovation Workshop: Rapid Prototyping",
    category: "Workshop",
    description: "Hands-on bootcamp on turning 3D design files into physical ABS parts using our industrial FDM printers.",
    date: "2026-07-12",
    startTime: "10:00 AM",
    endTime: "02:00 PM",
    venue: "3D Printing Zone, IDEA Lab",
    status: "Registration Open",
  },
  {
    _id: "mock-ev2",
    title: "AICTE National Hackathon 2026",
    category: "Hackathon",
    description: "48-hour hardware and software integration sprint targeting smart city infrastructure and clean energy.",
    date: "2026-08-05",
    startTime: "09:00 AM",
    endTime: "06:00 PM",
    venue: "Main Exhibition Hall, KKWIEER",
    status: "Upcoming",
  },
  {
    _id: "mock-ev3",
    title: "Annual Student Project Exposition",
    category: "Project Expo",
    description: "Annual showcase highlighting the best machinery and electronic engineering designs from senior cohorts.",
    date: "2026-09-10",
    startTime: "10:00 AM",
    endTime: "04:30 PM",
    venue: "Central Courtyard, KKWIEER",
    status: "Upcoming",
  },
  {
    _id: "mock-ev4",
    title: "Patent Filing & IP Protection Seminar",
    category: "Seminar",
    description: "Learn how to safeguard your prototypes, register utility models, and navigate Indian Patent law.",
    date: "2026-09-28",
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    venue: "Seminar Hall, Administration Bldg",
    status: "Registration Open",
  },
];

const UpcomingEventsPreview = () => {
  const [events, setEvents] = useState<EventItem[]>(mockEvents);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const res = await api.get("/events");
        if (res.data && res.data.length > 0) {
          const upcoming = res.data.filter(
            (e: any) =>
              e.status?.toLowerCase() === "upcoming" ||
              e.status?.toLowerCase() === "registration open"
          );
          if (upcoming.length > 0) {
            setEvents(upcoming.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn("Unable to fetch live events, rendering fallbacks.");
      }
    };
    fetchUpcomingEvents();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return dateString;
    }
  };

  return (
    <section className="py-20 bg-white border-b border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Upcoming Events & Workshops
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-slate-500 text-sm sm:text-base">
            Participate in upcoming technical bootcamps, hackathons, and seminars. Reserve your seat ahead of time.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {events.map((event) => (
            <div 
              key={event._id}
              className="flex flex-col justify-between p-4 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
                    {event.category}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {event.status}
                  </span>
                </div>

                {/* Event Details */}
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-primary transition-colors min-h-[44px] line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                    {event.description}
                  </p>
                </div>

                {/* Logistics */}
                <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-200/60">
                <Link 
                  to={event._id.startsWith("mock") ? "/events" : `/events/${event._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:underline"
                >
                  Register
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default UpcomingEventsPreview;
