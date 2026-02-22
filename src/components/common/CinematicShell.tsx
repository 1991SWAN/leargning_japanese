'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicShellProps {
    children: React.ReactNode;
    levelColor?: string;
    id?: string;
    showBackdrop?: boolean;
}

/**
 * CinematicShell: Standardized layout with Aurora Glow background.
 * Ported and enhanced from GrammarLesson for global consistency.
 */
const CinematicShell: React.FC<CinematicShellProps> = ({
    children,
    levelColor = '#f472b6',
    id = 'global',
    showBackdrop = true
}) => {
    return (
        <div className="relative w-full h-full min-h-[700px] flex flex-col items-center justify-center overflow-hidden bg-[#0a0812] isolate">
            {/* Background Orbs - Higher performance using CSS gradients + simple motion */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <AnimatePresence>
                    {showBackdrop && (
                        <motion.div
                            key={`glow-${id}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 12,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '120vw',
                                height: '120vh',
                                borderRadius: '50%',
                                background: `radial-gradient(circle at center, ${levelColor} 0%, transparent 60%)`,
                                filter: 'blur(100px)',
                                mixBlendMode: 'plus-lighter',
                                willChange: 'transform, opacity',
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Grid Pattern overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '48px 48px'
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col items-center">
                {children}
            </div>
        </div>
    );
};

export default CinematicShell;
