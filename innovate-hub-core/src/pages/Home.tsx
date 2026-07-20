import HomeHero from "@/components/home/HomeHero";
import TrustBar from "@/components/home/TrustBar";
import FacilitiesPreview from "@/components/home/FacilitiesPreview";
import AboutIdeaLab from "@/components/home/AboutIdeaLab";
import HomeStats from "@/components/home/HomeStats";
import AchievementsSection from "@/components/home/AchievementsSection";
import WhyChooseIdeaLab from "@/components/home/WhyChooseIdeaLab";
import LabFacilitiesDetail from "@/components/home/LabFacilitiesDetail";
import InnovationJourney from "@/components/home/InnovationJourney";
import UpcomingEventsPreview from "@/components/home/UpcomingEventsPreview";
import LeadershipPreview from "@/components/home/LeadershipPreview";
import HomeGallery from "@/components/home/HomeGallery";
import PartnerEcosystem from "@/components/home/PartnerEcosystem";
import CtaBanner from "@/components/home/CtaBanner";

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* 1. Hero Banner with Quick Stats Overlay */}
      <HomeHero />

      {/* 2. Trust & Accreditation Bar */}
      <TrustBar />

      {/* 3. Facilities Preview (Explore IDEA Lab) */}
      <FacilitiesPreview />

      {/* 4. About AICTE IDEA Lab */}
      <AboutIdeaLab />

      {/* 5. Statistics Row */}
      <HomeStats />

      {/* 6 & 7. Featured Achievement & Success Stories */}
      <AchievementsSection />

      {/* 8. Why Choose IDEA Lab */}
      <WhyChooseIdeaLab />

      {/* 9. Lab Facilities Detail Grid */}
      <LabFacilitiesDetail />

      {/* 10. Innovation Journey Timeline */}
      <InnovationJourney />

      {/* 11. Upcoming Events Preview */}
      <UpcomingEventsPreview />

      {/* 12. Leadership Team Cards Preview */}
      <LeadershipPreview />

      {/* 13. Gallery ("Inside IDEA Lab") */}
      <HomeGallery />

      {/* 14. Industry & Academic Ecosystem Partners */}
      <PartnerEcosystem />

      {/* 15. Final CTA ("Have an Idea?") */}
      <CtaBanner />
    </div>
  );
};

export default Home;
