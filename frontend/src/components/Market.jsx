import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const Market = () => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Load images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages = [];
            const imageCount = 40; // We have 40 frames

            for (let i = 1; i <= imageCount; i++) {
                const img = new Image();
                // Pad with zeros: 1 -> 001, 10 -> 010
                const paddedIndex = i.toString().padStart(3, '0');
                img.src = `/sequence/ezgif-frame-${paddedIndex}.jpg`;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    // Continue even if error to avoid hanging
                    img.onerror = resolve;
                });
                loadedImages.push(img);
            }
            setImages(loadedImages);
            setIsLoading(false);
        };

        loadImages();
    }, []);

    // Draw to canvas based on scroll
    const renderFrame = (index) => {
        if (!canvasRef.current || images.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = images[index];

        if (img) {
            // High DPI Scaling
            const dpr = window.devicePixelRatio || 1;
            // Ensure internal resolution matches display size * pixel ratio
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Only set dimensions if they changed to avoid flickering/clearing
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                // Scale context to match
                ctx.scale(dpr, dpr);
            }

            // Drawing logic (same as before but using CSS-based width/height for calc)
            // We draw into the logical size (rect.width, rect.height) because of ctx.scale
            const scale = Math.max(width / img.width, height / img.height);
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (height / 2) - (img.height / 2) * scale;

            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
    };

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const frameIndex = Math.min(
            images.length - 1,
            Math.floor(latest * images.length)
        );
        requestAnimationFrame(() => renderFrame(frameIndex));
    });

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            // Re-render current frame on resize
            if (images.length > 0) {
                // Slight delay to allow layout to settle
                requestAnimationFrame(() => renderFrame(0)); // Or current frame if we tracked it
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [images]);

    // Initial draw
    useEffect(() => {
        if (!isLoading && images.length > 0) {
            renderFrame(0);
        }
    }, [isLoading, images]);


    // Text Opacity Transforms
    const opacity1 = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const opacity2 = useTransform(scrollYProgress, [0.15, 0.3, 0.45], [0, 1, 0]);
    const opacity3 = useTransform(scrollYProgress, [0.45, 0.6, 0.75], [0, 1, 0]);
    const opacity4 = useTransform(scrollYProgress, [0.75, 0.9, 1], [0, 1, 1]);

    return (
        <div ref={containerRef} className="relative h-[400vh] bg-primary">
            <div className="sticky top-0 left-0 h-screen w-full overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-text-dim z-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover custom-cursor-none"
                    style={{ width: '100%', height: '100%' }}
                />



                {/* Overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-center px-4 sm:px-6">

                    {/* 0% - Title */}
                    <motion.div
                        style={{ opacity: opacity1 }}
                        className="absolute inset-0 flex items-center justify-center px-4"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-text-main text-center">
                            Markets. <br /> In Motion.
                        </h1>
                    </motion.div>

                    {/* 30% - Left */}
                    <motion.div
                        style={{ opacity: opacity2 }}
                        className="absolute inset-0 flex items-center container mx-auto px-4 sm:px-6 lg:px-10"
                    >
                        <div className="max-w-xl drop-shadow-2xl">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-medium tracking-tight text-text-main mb-2 sm:mb-4">
                                Liquidity Tells a Story.
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-text-muted font-medium">
                                Watch the dynamics of the market unfold in real-time.
                            </p>
                        </div>
                    </motion.div>

                    {/* 60% - Right */}
                    <motion.div
                        style={{ opacity: opacity3 }}
                        className="absolute inset-0 flex items-center justify-end container mx-auto px-4 sm:px-6 lg:px-10"
                    >
                        <div className="max-w-xl text-right glass-card backdrop-blur-md p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-card-hover">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-medium tracking-tight text-text-main mb-2 sm:mb-4">
                                Volatility Is the <br className="hidden sm:block" /> Price of Freedom.
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-text-muted font-medium">
                                Embrace the chaos. Master the movement.
                            </p>
                        </div>
                    </motion.div>

                    {/* 90% - Center CTA */}
                    <motion.div
                        style={{ opacity: opacity4 }}
                        className="absolute inset-0 flex items-center justify-center flex-col px-4"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-text-main mb-4 sm:mb-6 lg:mb-8 text-center">
                            Trade Without Borders.
                        </h2>
                        <button className="btn-primary px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg pointer-events-auto hover:-translate-y-1 transform">
                            Get Started
                        </button>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default Market;
