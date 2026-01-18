import React, { useEffect, useState } from 'react';
import { Box, Text, VStack, HStack, Badge, Spinner, useColorModeValue, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Rocket, Flag, CheckCircle, Trophy, Calendar } from 'lucide-react';
import api from '../config/api';

interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'START' | 'CHECKPOINT' | 'TASK' | 'ACHIEVEMENT';
    icon: string;
}

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const ProjectTimeCapsule: React.FC = () => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const accentColor = 'cyan.400';

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const response = await api.get('/gamification/time-capsule/');
                setEvents(response.data.events);
            } catch (err) {
                console.error("Failed to fetch timeline", err);
                setError("Could not load your journey.");
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, []);

    if (loading) return <Flex justify="center" p={10}><Spinner size="xl" color={accentColor} /></Flex>;
    if (error) return <Text color="red.400" textAlign="center">{error}</Text>;
    if (events.length === 0) return <Text color="gray.500" textAlign="center">No journey recorded yet. Start working!</Text>;

    const getIcon = (type: string) => {
        switch (type) {
            case 'START': return <Rocket size={20} />;
            case 'CHECKPOINT': return <Flag size={20} />;
            case 'TASK': return <CheckCircle size={20} />;
            case 'ACHIEVEMENT': return <Trophy size={20} />;
            default: return <Calendar size={20} />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'START': return 'purple.400';
            case 'CHECKPOINT': return 'cyan.400';
            case 'TASK': return 'green.400';
            case 'ACHIEVEMENT': return 'yellow.400';
            default: return 'gray.400';
        }
    };

    return (
        <VStack spacing={0} align="stretch" position="relative" pb={10}>
            {/* Vertical Line */}
            <Box
                position="absolute"
                left="20px"
                top="0"
                bottom="0"
                width="2px"
                bgGradient={`linear(to-b, ${accentColor}, purple.500)`}
                zIndex={0}
            />

            {events.map((event, index) => (
                <MotionFlex
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    mb={8}
                    align="flex-start"
                    position="relative"
                    zIndex={1}
                >
                    {/* Icon Bubble */}
                    <Flex
                        align="center"
                        justify="center"
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        bg={useColorModeValue('white', 'gray.900')}
                        border="2px solid"
                        borderColor={getColor(event.type)}
                        color={getColor(event.type)}
                        boxShadow={`0 0 10px ${getColor(event.type)}`}
                        mr={4}
                        flexShrink={0}
                    >
                        {getIcon(event.type)}
                    </Flex>

                    {/* Content Card */}
                    <MotionBox
                        p={4}
                        bg={cardBg}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={borderColor}
                        boxShadow="lg"
                        flex="1"
                        whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)" }}
                        backdropFilter="blur(10px)"
                        bgAlpha={0.8}
                    >
                        <HStack justify="space-between" mb={2}>
                            <Badge colorScheme={getColor(event.type).split('.')[0]}>{event.type}</Badge>
                            <Text fontSize="xs" color="gray.500">
                                {new Date(event.date).toLocaleDateString()}
                            </Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('gray.800', 'white')}>
                            {event.title}
                        </Text>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                            {event.description}
                        </Text>
                    </MotionBox>
                </MotionFlex>
            ))}
        </VStack>
    );
};

export default ProjectTimeCapsule;
