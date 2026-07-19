import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";

const resources = [
    {
        image: "/images/resources/arduino-kit.png",
        title: "Arduino Starter Kit",
        description: "Complete prototyping bundle for microcontroller projects.",
        availability: "Available",
        category: "Prototyping"
    },
    {
        image: "/images/resources/iot-sensor-kit.png",
        title: "IoT Sensor Pack",
        description: "Comprehensive sensor module set for smart systems.",
        availability: "Limited Stock",
        category: "Sensors"
    },
    {
        image: "/images/resources/robotics-kit.png",
        title: "Robotics Chassis Kit",
        description: "Modular robotics platform with DC motors and wheels.",
        availability: "Available",
        category: "Robotics"
    },
    {
        image: "/images/resources/microcontroller-board.png",
        title: "Advanced MCU Board",
        description: "High-performance microcontroller for heavy compute tasks.",
        availability: "Available",
        category: "Electronics"
    },
    {
        image: "/images/resources/electronics-tools.png",
        title: "Precision Tool Set",
        description: "Professional soldering and diagnostic equipment.",
        availability: "Available",
        category: "Tools"
    }
];

const ResourceShowcase = () => {
    const [startIndex, setStartIndex] = useState(0);
    const [visibleItems, setVisibleItems] = useState(4);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setVisibleItems(1);
            else if (window.innerWidth < 1024) setVisibleItems(2);
            else setVisibleItems(4);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => {
        if (startIndex + visibleItems < resources.length) {
            setStartIndex(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (startIndex > 0) {
            setStartIndex(prev => prev - 1);
        }
    };

    return (
        <section className="py-20 bg-muted/30 border-y border-border/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
                            Lab Resources
                        </h2>
                        <p className="text-muted-foreground max-w-xl text-base">
                            Professional-grade equipment available for student projects and research use.
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={prevSlide}
                            disabled={startIndex === 0}
                            className="rounded-full w-10 h-10 border-border/60 hover:border-primary/50 hover:bg-background disabled:opacity-30 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={nextSlide}
                            disabled={startIndex + visibleItems >= resources.length}
                            className="rounded-full w-10 h-10 border-border/60 hover:border-primary/50 hover:bg-background disabled:opacity-30 transition-all"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative overflow-hidden" ref={containerRef}>
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${startIndex * (100 / visibleItems)}%)` }}
                    >
                        {resources.map((item, index) => (
                            <div
                                key={index}
                                className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0 px-3"
                                style={{ flexBasis: `${100 / visibleItems}%` }}
                            >
                                {/* ProductCard style from Ecommerce.tsx */}
                                <Card className="flex flex-col h-full hover:shadow-lg transition-transform duration-300 hover:-translate-y-1">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="line-clamp-1 text-lg" title={item.title}>{item.title}</CardTitle>
                                        <CardDescription className="line-clamp-1">{item.category}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col gap-4">
                                        <div className="relative w-full pt-[56.25%] overflow-hidden rounded-md bg-muted">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Replaced Price with Availability Badge logic */}
                                            <span className={`text-xs px-2 py-1 rounded-full ${item.availability === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' // Using red/amber for limited as per ecommerce logic mostly uses green/red
                                                }`}>
                                                {item.availability === 'Available' ? 'In Stock' : item.availability}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-h-[3rem]">
                                            <p className="text-sm text-muted-foreground break-words line-clamp-3" title={item.description}>
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 mt-auto pt-4 border-t">
                                            <Link to="/lab-info" className="flex-1">
                                                <Button className="w-full" variant="secondary">Check Details</Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResourceShowcase;
