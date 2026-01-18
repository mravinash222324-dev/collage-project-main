import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface BearAvatarProps {
    isPasswordFocused: boolean;
    textLength: number;
}

const BearAvatar: React.FC<BearAvatarProps> = ({ isPasswordFocused, textLength }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            // Get window dimensions
            const { innerWidth, innerHeight } = window;

            // Calculate normalized position (-1 to 1)
            const x = (event.clientX / innerWidth) * 2 - 1;
            const y = (event.clientY / innerHeight) * 2 - 1;

            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Calculate movements
    // Head moves slightly
    const headX = mousePos.x * 5;
    const headY = mousePos.y * 5;

    // Face features move a bit more to create depth
    const faceX = mousePos.x * 10;
    const faceY = mousePos.y * 10;

    // Eyes move the most (unless password focused)
    // If typing username (textLength > 0), prioritize that over mouse for eyes
    const eyeOffsetX = textLength > 0 ? Math.min(Math.max(textLength * 2 - 10, -15), 15) : mousePos.x * 15;
    const eyeOffsetY = textLength > 0 ? 0 : mousePos.y * 10;

    return (
        <Box position="relative" w="120px" h="120px" mx="auto" mb={-4} zIndex={10}>
            <svg
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                {/* Head Group - Moves slightly */}
                <motion.g
                    animate={{ x: headX, y: headY }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                    {/* Head Shape */}
                    <path
                        d="M60 110C87.6142 110 110 87.6142 110 60C110 32.3858 87.6142 10 60 10C32.3858 10 10 32.3858 10 60C10 87.6142 32.3858 110 60 110Z"
                        fill="#D6BCFA"
                        stroke="#805AD5"
                        strokeWidth="3"
                    />

                    {/* Ears */}
                    <path d="M10 30C5 20 20 5 30 15" fill="#D6BCFA" stroke="#805AD5" strokeWidth="3" />
                    <path d="M110 30C115 20 100 5 90 15" fill="#D6BCFA" stroke="#805AD5" strokeWidth="3" />

                    {/* Inner Face Features Group - Moves more for parallax effect */}
                    <motion.g
                        animate={{ x: faceX * 0.5, y: faceY * 0.5 }} // Relative to head
                        transition={{ type: "spring", stiffness: 150, damping: 20 }}
                    >
                        {/* Muzzle */}
                        <ellipse cx="60" cy="75" rx="20" ry="14" fill="#E9D8FD" />
                        <path d="M55 72Q60 78 65 72" stroke="#553C9A" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="60" cy="68" r="3" fill="#553C9A" />

                        {/* Eyes Group */}
                        <motion.g
                            animate={isPasswordFocused ? { y: -10, opacity: 0 } : { y: 0, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Left Eye Background */}
                            <circle cx="40" cy="50" r="8" fill="white" />
                            {/* Right Eye Background */}
                            <circle cx="80" cy="50" r="8" fill="white" />

                            {/* Pupils */}
                            <motion.circle
                                cx="40"
                                cy="50"
                                r="3"
                                fill="#2D3748"
                                animate={{ x: eyeOffsetX, y: eyeOffsetY }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            />
                            <motion.circle
                                cx="80"
                                cy="50"
                                r="3"
                                fill="#2D3748"
                                animate={{ x: eyeOffsetX, y: eyeOffsetY }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            />
                        </motion.g>
                    </motion.g>
                </motion.g>

                {/* Hands (Covering Eyes) - Independent of head movement to ensure coverage */}
                <motion.g
                    initial={{ y: 100, opacity: 0 }}
                    animate={isPasswordFocused ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                    {/* Left Hand */}
                    <path
                        d="M20 100 C20 60, 50 40, 50 50 C50 60, 30 80, 30 110"
                        fill="#D6BCFA"
                        stroke="#805AD5"
                        strokeWidth="3"
                    />
                    {/* Right Hand */}
                    <path
                        d="M100 100 C100 60, 70 40, 70 50 C70 60, 90 80, 90 110"
                        fill="#D6BCFA"
                        stroke="#805AD5"
                        strokeWidth="3"
                    />
                </motion.g>
            </svg>
        </Box>
    );
};

export default BearAvatar;
