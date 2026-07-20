import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Building, 
  Award, 
  Layers, 
  Calendar, 
  Cpu, 
  Activity, 
  Wrench, 
  Scissors, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Atom,
  Briefcase,
  Compass,
  GraduationCap,
  Lightbulb,
  FileCheck2,
  Users2,
  ChevronRight
} from "lucide-react";

const AicteIdeaLab = () => {
  // Stats cards data
  const stats = [
    { value: "₹1.1 Crore", label: "Grant Support", desc: "Co-funded 50:50 by AICTE & KKWIEER" },
    { value: "49", label: "Selected Institutes", desc: "One of the few chosen across India" },
    { value: "3000 Sq. Ft", label: "Lab Space", desc: "State-of-the-art dedicated facility" },
    { value: "2021", label: "Establishment", desc: "Launched under national scheme" },
  ];

  // Importance Cards
  const importanceCards = [
    {
      title: "21st Century Skills",
      desc: "Training on critical thinking, complex problem solving, creativity, and multidisciplinary collaboration.",
      icon: Atom,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      title: "Research Training",
      desc: "Empowering teachers and students in advanced teaching-learning processes, research methodologies, and development projects.",
      icon: GraduationCap,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      title: "Industrial Exposure",
      desc: "Providing students actual industrial exposure by working on hands-on projects using real-world manufacturing facilities.",
      icon: Briefcase,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Project Development",
      desc: "Supporting student and faculty ideas through complete prototyping support and online learning resources.",
      icon: Lightbulb,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Innovation Culture",
      desc: "Encouraging a campus-wide ecosystem of creative exploration, imagination, and transformation of ideas into physical prototypes.",
      icon: Compass,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    },
    {
      title: "Internship Opportunities",
      desc: "Facilitating joint R&D projects and specialized internships by utilizing advanced equipment alongside industry mentors.",
      icon: Users2,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    }
  ];

  // Facilities list
  const facilities = [
    { name: "3-D Printer", icon: Cpu, desc: "Additive manufacturing for physical prototype models" },
    { name: "3-D Scanner", icon: Activity, desc: "High-precision physical object digitizer for CAD analysis" },
    { name: "CNC Router", icon: Wrench, desc: "Computer-controlled cutting tool for various sheet materials" },
    { name: "Laser Cutter", icon: Scissors, desc: "High-power laser cutter for cutting and engraving materials" },
    { name: "Lathe Cum Milling Machine", icon: Layers, desc: "Dual rotary and cutting tool machine for metal components" },
    { name: "PCB Milling Machine", icon: ShieldCheck, desc: "Precision electrical board circuit prototyping tool" },
    { name: "Soldering & De-soldering Stations", icon: Atom, desc: "Advanced workstations for electronic components assembly" },
    { name: "Power Tools", icon: Wrench, desc: "Complete set of power-assisted handheld tools for fabrication" },
    { name: "Electrical Tools", icon: Activity, desc: "Specialized tools and meters for electrical connections & safety" },
    { name: "Mechanical Tools", icon: Wrench, desc: "Comprehensive hand tools for structural and physical building" },
    { name: "Network Tools", icon: Cpu, desc: "Testing and routing tools for IoT and hardware connectivity" },
    { name: "And more...", icon: TrendingUp, desc: "Constantly expanding set of devices under one collaborative roof" }
  ];

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased overflow-x-hidden">
      
      {/* 1. Redesigned Hero Banner */}
      <section 
        className="relative w-full h-[500px] sm:h-[400px] lg:h-[500px] min-h-[500px] sm:min-h-[400px] lg:min-h-[500px] text-white flex flex-col justify-between py-6 sm:py-10"
        style={{
          backgroundImage: `linear-gradient(rgba(5, 10, 25, 0.8), rgba(5, 10, 25, 0.8)), url('/images/idea-lab.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 w-full flex-grow flex flex-col justify-center">
          <div className="max-w-3xl space-y-4 text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider text-blue-400 backdrop-blur-sm"
            >
              <Award className="w-3.5 h-3.5" />
              AICTE Flagship Initiative
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
            >
              AICTE – IDEA Lab
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed"
            >
              Idea Development, Evaluation and Application Laboratory
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xs sm:text-sm text-slate-400 leading-relaxed"
            >
              Transforming ideas into prototypes through innovation, research and entrepreneurship.
            </motion.p>

            {/* Taglines */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm font-semibold text-blue-400"
            >
              <span>Innovation</span>
              <span className="text-slate-600">•</span>
              <span>Prototype</span>
              <span className="text-slate-600">•</span>
              <span>Research</span>
              <span className="text-slate-600">•</span>
              <span>Startup</span>
            </motion.div>
          </div>
        </div>

        {/* Statistics Row at the bottom of Hero Banner */}
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 w-full pb-4 sm:pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: "49+", label: "Selected Institutes" },
              { value: "₹1.1 Cr", label: "Grant Support" },
              { value: "3000+", label: "Sq. Ft. Lab" },
              { value: "2021", label: "Established" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 text-center shadow-md flex flex-col justify-center group hover:bg-white/10 transition-colors"
              >
                <div className="text-base sm:text-lg md:text-xl font-black text-amber-300">
                  {stat.value}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Container for content sections with alternating background */}
      <div className="w-full">

        {/* 2. AICTE IDEA Lab Overview */}
        <section className="py-16 sm:py-24 bg-slate-100/60 border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="space-y-12">
              
              <div className="max-w-3xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  AICTE IDEA Lab Overview
                </h2>
                <div className="mt-4 h-1 w-20 bg-primary rounded" />
              </div>

              {/* Main Content Paragraph Blocks */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-7 space-y-6 text-slate-600 text-base sm:text-lg leading-relaxed">
                  <p className="font-medium text-slate-800">
                    A scheme of IDEA (Idea Development, Evaluation and Application) Lab was announced by AICTE in January 2021. As mentioned in the scheme document, the total grant to be awarded to the selected institution is around Rs. 1.1 Crore, in which, the institute has to raise 50% of the funds (either from industry or by own) and AICTE will contribute the remaining 50%.
                  </p>
                  
                  <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-primary">
                      <FileCheck2 className="w-5 h-5" />
                      Criteria for AICTE-IDEA Lab Eligibility:
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                      {[
                        "10 years of existence of the institute",
                        "At least one course is NBA accredited",
                        "Readiness to contribute 50% for funds either from Industry or from the institute",
                        "Availability of 3000 sq. ft. space for establishing a lab"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-50 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p>
                    Around 204 institutions, across India, submitted the proposals under this scheme to AICTE. Out of these, 190 institutions are screened and later 152 institute applications are shortlisted for the online interaction.
                  </p>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Selection Committee Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider text-primary">
                      Online Interaction Focus Points
                    </h4>
                    <p className="text-xs text-slate-500">
                      AICTE-IDEA Lab Steering Committee members interacted with the host institute Principal and IDEA Lab coordinator, based on:
                    </p>
                    <div className="space-y-3">
                      {[
                        "Vision and Mission for AICTE-IDEA Lab",
                        "Plan of integration of the AICTE-IDEA Lab with other departments promoting multidisciplinary education/research",
                        "Plan for the sustenance of AICTE-IDEA Lab beyond 2 years"
                      ].map((point, idx) => (
                        <div key={idx} className="flex gap-3 items-start text-sm text-slate-700">
                          <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Result/Achievement Box */}
                  <div className="bg-gradient-to-tr from-primary to-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <Building className="w-32 h-32 transform translate-x-8 translate-y-8" />
                    </div>
                    <p className="text-sm font-light leading-relaxed">
                      Based on this interaction, 49 institutions are selected for the award of AICTE-IDEA Lab across India in June 2021 for 2020-21.
                    </p>
                    <p className="mt-3 text-base font-bold text-amber-300">
                      K. K. Wagh Institute of Engineering Education and Research (KKWIEER) is one of them.
                    </p>
                    <p className="mt-2 text-xs text-indigo-100 leading-relaxed border-t border-white/20 pt-2">
                      KKWIEER is the only institute from Savitribai Phule Pune University, Pune to be selected for the AICTE-IDEA lab scheme. The lab is named as AICTE-IDEA Lab.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. Significance */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="space-y-12">
              
              <div className="max-w-3xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  Significance
                </h2>
                <div className="mt-4 h-1 w-20 bg-primary rounded" />
              </div>

              {/* Grid Layout converting long paragraphs into content blocks */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                
                {/* Block 1 */}
                <div className="flex flex-col h-full bg-slate-50/50 p-4 sm:p-8 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">All Facilities Under One Roof</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The purpose of a AICTE-IDEA lab of K. K. Wagh Institute of Engineering Education and Research is to provide all facilities under one roof for the conversion of an idea into a prototype. With this facility on the campus students and faculty members will be encouraged to take creative work and in the progress, get training on critical thinking problem-solving, collaboration, etc. which conventional labs are not able to.
                  </p>
                </div>

                {/* Block 2 */}
                <div className="flex flex-col h-full bg-slate-50/50 p-4 sm:p-8 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Transforming Engineering Education</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The focus will be on training students so that they become imaginative and creative. The whole idea is to transfer engineering education with such a lab in all colleges. All the students will be exposed to the AICTE-IDEA lab by organizing training sessions for interested students as well as supporting projects and by providing online learning.
                  </p>
                </div>

                {/* Block 3 */}
                <div className="flex flex-col h-full bg-slate-50/50 p-4 sm:p-8 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group col-span-2 lg:col-span-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Users2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Empowering Faculty & Research</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Teachers will also be trained in these labs to know their scope and opportunities in teaching-learning processes as well as research and development projects. Students will also be encouraged to work with faculties on R&D projects and internships which involve the utilization of AICTE-IDEA lab facilities.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* 4. Importance */}
        <section className="py-16 sm:py-24 bg-slate-100/60 border-y border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="space-y-12">
              
              <div className="max-w-3xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  Importance
                </h2>
                <div className="mt-4 h-1 w-20 bg-primary rounded" />
              </div>

              {/* Exact Text Content Section */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 max-w-4xl">
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                  Under this initiative students will be trained on 21st Century skills, teachers will be trained in the teaching-learning process, research, and projects, and students will be encouraged for projects and internships.
                </p>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                  Students will get actual industrial exposure by working on the projects using the facilities available in the AICTE-IDEA Lab.
                </p>
              </div>

              {/* 6 Feature Benefit Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {importanceCards.map((card, idx) => (
                  <div 
                    key={idx}
                    className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 group"
                  >
                    <div className={`p-3 rounded-xl ${card.color} shrink-0`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* 5. Facilities */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="space-y-12">
              
              <div className="max-w-3xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  Facilities
                </h2>
                <div className="mt-4 h-1 w-20 bg-primary rounded" />
              </div>

              {/* Introductory Paragraph with exact text */}
              <div className="text-base sm:text-lg text-slate-600 max-w-4xl leading-relaxed">
                AICTE-IDEA Lab includes all the facilities needed for converting a project idea into a workable prototype. The major equipment are the:
              </div>

              {/* Responsive Grid representing facilities
                  - 4 columns on desktop
                  - 2 columns on mobile/tablet */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {facilities.map((fac, index) => (
                  <div 
                    key={index}
                    className="p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                        <fac.icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">
                        {fac.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {fac.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* 6. Operation & Utilization */}
        <section className="py-16 sm:py-24 bg-slate-100/60 border-t border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="space-y-12">
              
              <div className="max-w-3xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                  Operation and Utilization
                </h2>
                <div className="mt-4 h-1 w-20 bg-primary rounded" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* TIMING INFO CARD */}
                <div className="lg:col-span-5 flex">
                  <div className="w-full bg-gradient-to-tr from-primary to-blue-600 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-6 -translate-y-6">
                      <Clock className="w-48 h-48" />
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        Operation Hours
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl font-black text-amber-300">
                          9:00 AM – 6:00 PM
                        </div>
                        <div className="text-sm text-indigo-100 font-medium">
                          Open depending on project urgency
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/20 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-indigo-200 uppercase tracking-widest font-bold">Requirement</div>
                        <div className="text-base font-bold text-white mt-0.5">Prior Registration Required</div>
                      </div>
                      <Link to="/signup">
                        <Button className="bg-amber-400 hover:bg-amber-500 text-slate-900 border-none font-bold rounded-xl px-5 py-2.5 transition-all shadow-md hover:shadow-lg">
                          Register Now
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* DETAILED CONTENT CARD */}
                <div className="lg:col-span-7 flex">
                  <div className="w-full bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md flex flex-col justify-center space-y-6">
                    <div className="text-slate-600 text-base sm:text-lg leading-relaxed space-y-4">
                      <p>
                        Although the AICTE-IDEA Lab is open from 9.00 am to 6.00 pm, it can be made available depending upon the requirement of users and project urgency. For that, you need to get in touch with the lab coordinator.
                      </p>
                      <p className="font-semibold text-slate-800 border-l-4 border-primary pl-4">
                        Also, it is open for all but prior registration is needed. Refer to the registration page.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-4">
                      <Link to="/signup">
                        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md px-6 py-3 font-semibold transition-all">
                          Go to Registration Page
                        </Button>
                      </Link>
                      <Link to="/contact-details">
                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl px-6 py-3 font-semibold text-slate-700">
                          Contact Coordinator
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

      </div>

    </div>
  );
};

export default AicteIdeaLab;
