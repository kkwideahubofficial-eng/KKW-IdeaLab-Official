import { useEffect, useState, useRef } from "react";

const stats = [
    { value: 500, label: "Active Projects", suffix: "+" },
    { value: 1000, label: "Members", suffix: "+" },
    { value: 50, label: "Events Hosted", suffix: "+" },
    { value: "24/7", label: "Lab Access", suffix: "", isStatic: true },
];

const Counter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [hasAnimated]);

    useEffect(() => {
        if (hasAnimated) {
            let startTime: number;
            let animationFrame: number;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                const percentage = Math.min(progress / duration, 1);

                // Ease out quart
                const easeOutQuart = 1 - Math.pow(1 - percentage, 4);

                setCount(Math.floor(easeOutQuart * value));

                if (percentage < 1) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };

            animationFrame = requestAnimationFrame(animate);

            return () => cancelAnimationFrame(animationFrame);
        }
    }, [hasAnimated, value, duration]);

    return <span ref={ref}>{count}</span>;
};

const StatsSection = () => {
    return (
        <section className="bg-primary py-20 text-primary-foreground">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-primary-foreground/20">
                    {stats.map((stat, index) => (
                        <div key={index} className="px-4">
                            <div className="text-4xl sm:text-5xl font-bold mb-2 tracking-tight">
                                {stat.isStatic ? (
                                    <span>{stat.value}</span>
                                ) : (
                                    <>
                                        <Counter value={stat.value as number} />
                                        {stat.suffix}
                                    </>
                                )}
                            </div>
                            <div className="text-primary-foreground/80 font-medium text-sm sm:text-base uppercase tracking-wider">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
