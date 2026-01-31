import { motion } from 'framer-motion';

interface CircularProgressProps {
    value: number;
    max: number;
    size?: number;
    color?: string;
    label?: string;
    showPercentage?: boolean;
}

export default function CircularProgress({
    value,
    max,
    size = 48,
    color = 'var(--accent)',
    showPercentage = true
}: CircularProgressProps) {
    const percentage = Math.min(100, (value / max) * 100);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <path
                    className="text-gray-700/30"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                {/* Progress path */}
                <motion.path
                    style={{ color: color, filter: `drop-shadow(0 0 6px ${color}80)` }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${percentage}, 100` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                />
            </svg>
            {showPercentage && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: color }}>
                    {Math.round(percentage)}%
                </div>
            )}
        </div>
    );
}
