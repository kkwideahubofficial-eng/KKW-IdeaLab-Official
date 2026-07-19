import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const AboutPlatform = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.2, // Trigger when 20% of content is visible
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const features = [
        "Digital slot booking and scheduling",
        "Real-time equipment availability tracking",
        "Centralized event and achievement records",
        "Secure role-based access for staff and students"
    ];

    return (
        <section className="py-20 bg-background border-b border-border/40">
            <div ref={sectionRef} className={`container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Visual Side */}
                    <div className="relative order-1 lg:order-1">
                        <div className="relative rounded-xl overflow-hidden shadow-xl border border-border/50 bg-muted aspect-[4/3]">
                            <img
                                src="/images/about-platform.png"
                                alt="Students and faculty collaborating in the innovation lab"
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            {/* Subtle overlay to unify tone */}
                            <div className="absolute inset-0 bg-primary/5 mix-blend-multiply" />
                        </div>
                        {/* Decorative background element - subtle */}
                        <div className="absolute -z-10 top-6 -right-6 w-full h-full bg-accent/20 rounded-xl hidden lg:block" />
                    </div>

                    {/* Content Side */}
                    <div className="order-2 lg:order-2">
                        <div className="space-y-6">
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
                                Empowering Innovation Lab Management
                            </h2>

                            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                                This platform is designed to help students and faculty efficiently manage lab access, equipment usage, and academic activities through a single, unified system.
                            </p>

                            <ul className="space-y-4 pt-2">
                                {features.map((item, index) => (
                                    <li key={index} className="flex items-start space-x-3 text-foreground/90">
                                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-6">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-primary/20 hover:border-primary/50 hover:bg-primary/5 font-semibold px-8"
                                    onClick={() => {
                                        const featureSection = document.getElementById('features-section');
                                        featureSection?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    Explore Platform Features
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutPlatform;
