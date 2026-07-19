import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/axios";
import { motion } from "framer-motion";

interface Achievement {
    _id: string;
    title: string;
    imageUrl: string;
}

const AchievementShowcase = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const response = await api.get('/achievements');
                // Ensure we have enough items for a smooth loop by duplicating if few
                const data = response.data;
                // If fewer than 5 items, duplicate them a few times to fill width
                let displayData = data;
                if (data.length > 0 && data.length < 5) {
                    displayData = [...data, ...data, ...data];
                }
                setAchievements(displayData);
            } catch (error) {
                console.error("Failed to fetch achievements", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAchievements();
    }, []);

    if (isLoading || achievements.length === 0) {
        return null;
    }

    return (
        <section className="py-20 bg-background overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
                        Student Achievements
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-base">
                        Celebrating the breakthrough innovations and success stories from our community.
                    </p>
                </div>
            </div>

            {/* Infinity Pool Effect Container */}
            <div className="relative w-full">
                {/* Gradient Masks for "Pool" Depth Effect */}
                <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                <div className="flex overflow-hidden">
                    <motion.div
                        className="flex gap-6 px-4"
                        animate={{
                            x: ["0%", "-50%"],
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 30, // Adjust speed here, slower is more "pool" like
                                ease: "linear",
                            },
                        }}
                        style={{ width: "max-content" }}
                    >
                        {/* Render items twice to create seamless loop. 
                            The animation moves to -50% (halfway), at which point
                            the second half perfectly replaces the first half, creating the illusion.
                        */}
                        {[...achievements, ...achievements].map((item, index) => (
                            <div
                                key={`${item._id}-${index}`}
                                className="w-[280px] sm:w-[350px] flex-shrink-0"
                            >
                                <Link to="/achievements">
                                    <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out border border-white/10 dark:border-white/5 bg-muted">
                                        <img
                                            src={item.imageUrl || '/placeholder-achievement.png'}
                                            alt={item.title}
                                            className="w-full h-full object-cover object-top transform transition-transform duration-700 ease-out group-hover:scale-110"
                                        />
                                        {/* Glassmorphism Title Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end opacity-100 transition-opacity duration-300">
                                            <h3 className="text-white text-lg font-bold leading-tight transform translate-y-0 transition-transform duration-300">
                                                {item.title}
                                            </h3>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AchievementShowcase;
