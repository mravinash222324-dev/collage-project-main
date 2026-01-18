import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Avatar,
    SimpleGrid,
    Badge,
    Spinner,
    Flex,
    Icon,
    useToast,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";

const {
    User,
    Mail,
    Briefcase,
    Shield,
    Award
} = Lucide;

const MotionBox = motion(Box);

interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
}

interface TeacherStats {
    total_students?: number;
    active_projects?: number;
    total_assignments?: number;
}

const TeacherProfile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<TeacherStats>({});
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState('');
    const toast = useToast();

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            // 1. Fetch User Details
            const userRes = await axios.get('http://127.0.0.1:8000/auth/users/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(userRes.data);

            // Set default avatar
            let style = 'avataaars';
            let seed = userRes.data.username;

            // 2. Fetch Gamification for Avatar (if enabled for teachers)
            try {
                const xpRes = await axios.get('http://127.0.0.1:8000/gamification/me/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (xpRes.data) {
                    style = xpRes.data.avatar_style || 'avataaars';
                    seed = xpRes.data.avatar_seed || seed;
                }
            } catch (e) {
                // Ignore if not found
            }
            setAvatarUrl(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`);


            // 3. Fetch Teacher Stats
            try {
                const statsRes = await axios.get('http://127.0.0.1:8000/teacher/stats/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats({
                    active_projects: statsRes.data.active_projects,
                    total_assignments: statsRes.data.active_assignments,
                });
            } catch (e) {
                console.warn("Failed to fetch stats for profile", e);
            }

        } catch (err) {
            console.error("Failed to fetch profile", err);
            toast({ title: 'Failed to load profile', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Flex h="50vh" align="center" justify="center">
            <Spinner size="xl" color="blue.500" thickness="4px" />
        </Flex>
    );

    if (!profile) return null;

    return (
        <VStack spacing={8} align="stretch">
            {/* Header Card */}
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                p={8}
                position="relative"
                overflow="hidden"
                bg="rgba(255, 255, 255, 0.03)"
                border="1px solid rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
            >
                <Box position="absolute" top="-50px" right="-50px" opacity={0.1}>
                    <User size={300} color="white" />
                </Box>

                <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={8}>
                    <Avatar
                        size="2xl"
                        name={`${profile.first_name} ${profile.last_name}`}
                        src={avatarUrl}
                        border="4px solid"
                        borderColor="blue.400"
                        bg="blue.500"
                    />
                    <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
                        <Heading size="2xl" bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text">
                            {profile.first_name} {profile.last_name}
                        </Heading>
                        <Text fontSize="xl" color="gray.400">@{profile.username}</Text>
                        <HStack>
                            <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="full">
                                Professor
                            </Badge>
                            <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full">
                                ID: #{profile.id}
                            </Badge>
                        </HStack>
                    </VStack>
                </Flex>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Contact Info */}
                <MotionBox
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    p={6}
                    bg="rgba(255, 255, 255, 0.03)"
                    border="1px solid rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(10px)"
                    borderRadius="2xl"
                >
                    <HStack mb={6}>
                        <Icon as={Shield} color="purple.400" boxSize={6} />
                        <Heading size="md" color="gray.200">Account Details</Heading>
                    </HStack>

                    <VStack align="start" spacing={4}>
                        <Box>
                            <Text color="gray.500" fontSize="sm">Email Address</Text>
                            <HStack mt={1}>
                                <Mail size={16} color="#A0AEC0" />
                                <Text color="white" fontSize="lg">{profile.email}</Text>
                            </HStack>
                        </Box>
                        <Box>
                            <Text color="gray.500" fontSize="sm">Role</Text>
                            <HStack mt={1}>
                                <Briefcase size={16} color="#A0AEC0" />
                                <Text color="white" fontSize="lg">Faculty Member</Text>
                            </HStack>
                        </Box>
                    </VStack>
                </MotionBox>

                {/* Stats / Impact */}
                <MotionBox
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    p={6}
                    bg="rgba(255, 255, 255, 0.03)"
                    border="1px solid rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(10px)"
                    borderRadius="2xl"
                >
                    <HStack mb={6}>
                        <Icon as={Award} color="orange.400" boxSize={6} />
                        <Heading size="md" color="gray.200">Impact & Stats</Heading>
                    </HStack>

                    <SimpleGrid columns={2} spacing={4}>
                        <Stat>
                            <StatLabel color="gray.400">Active Projects</StatLabel>
                            <StatNumber color="blue.400" fontSize="3xl">{stats.active_projects || 0}</StatNumber>
                            <StatHelpText color="gray.500">Currently mentoring</StatHelpText>
                        </Stat>
                        <Stat>
                            <StatLabel color="gray.400">Assignments</StatLabel>
                            <StatNumber color="purple.400" fontSize="3xl">{stats.total_assignments || 0}</StatNumber>
                            <StatHelpText color="gray.500">Created this term</StatHelpText>
                        </Stat>
                    </SimpleGrid>
                </MotionBox>
            </SimpleGrid>
        </VStack>
    );
};

export default TeacherProfile;
