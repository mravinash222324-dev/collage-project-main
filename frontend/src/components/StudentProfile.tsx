import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Removed in favor of centralized api config
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
    Container,
    Icon,
    useToast,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Select,
    IconButton
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';
import api from '../config/api';
import ErrorState from './ErrorState';

const {
    Mail,
    Users,
    Briefcase,
    Shield,
    Edit2,
    RefreshCw,
    Save,
    Trophy
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

interface XPStats {
    level: number;
    total_xp: number;
    rank: number;
    avatar_style: string;
    avatar_seed: string;
    badges: any[];
    viva_xp?: number;
    assignment_xp?: number;
    boss_battle_xp?: number;
}

interface GroupMember {
    id: number;
    username: string;
    email: string;
}

const AVATAR_STYLES = [
    { value: 'avataaars', label: 'Cartoon' },
    { value: 'bottts', label: 'Robot' },
    { value: 'adventurer', label: 'Adventurer' },
    { value: 'micah', label: 'Sketch' },
    { value: 'notionists', label: 'Notion Style' },
    { value: 'lorelei', label: 'Realistic Art' }
];

const StudentProfile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [xpStats, setXpStats] = useState<XPStats | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Avatar Editor State
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedStyle, setSelectedStyle] = useState('avataaars');
    const [selectedSeed, setSelectedSeed] = useState('');
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [error, setError] = useState(false);



    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // Parallel data fetching for performance
            const [userRes, xpRes, projRes] = await Promise.allSettled([
                api.get('/auth/users/me/'),
                api.get('/gamification/me/'),
                api.get('/student/submissions/')
            ]);

            // 1. Handle User Details
            if (userRes.status === 'fulfilled') {
                setProfile(userRes.value.data);
            } else {
                throw new Error('Failed to load user profile');
            }

            // 2. Handle XP Stats
            if (xpRes.status === 'fulfilled') {
                const xpData = xpRes.value.data;
                setXpStats(xpData);
                setSelectedStyle(xpData.avatar_style || 'avataaars');
                setSelectedSeed(xpData.avatar_seed || (userRes.status === 'fulfilled' ? userRes.value.data.username : ''));
            } else {
                console.warn("XP Stats not found or failed to load");
            }

            // 3. Handle Project Team
            if (projRes.status === 'fulfilled') {
                const activeProject = projRes.value.data.find((p: any) =>
                    p.status === 'Approved' || p.status === 'In Progress'
                );
                if (activeProject && activeProject.team_members) {
                    setGroupMembers(activeProject.team_members);
                }
            }

        } catch (err) {
            console.error("Failed to fetch profile", err);
            setError(true);
            toast({
                title: 'Error loading profile',
                description: 'Some data could not be retrieved. Please try again later.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAvatar = async () => {
        setSavingAvatar(true);
        try {
            await api.patch('/gamification/avatar/update/', {
                avatar_style: selectedStyle,
                avatar_seed: selectedSeed
            });

            setXpStats(prev => prev ? { ...prev, avatar_style: selectedStyle, avatar_seed: selectedSeed } : null);
            toast({ title: 'Avatar Updated', status: 'success' });
            onClose();
        } catch (error) {
            toast({ title: 'Failed to update avatar', status: 'error' });
        } finally {
            setSavingAvatar(false);
        }
    };

    const randomizeSeed = () => {
        setSelectedSeed(Math.random().toString(36).substring(7));
    };





    if (loading) return (
        <Layout userRole="Student">
            <Flex h="80vh" align="center" justify="center">
                <Spinner size="xl" color="cyan.500" thickness="4px" />
            </Flex>
        </Layout>
    );

    if (error || !profile) return (
        <Layout userRole="Student">
            <Container maxW="container.xl" py={10}>
                <ErrorState
                    title="Profile Not Found"
                    message="We couldn't load your profile data. This might be a network issue."
                    onRetry={fetchProfileData}
                />
            </Container>
        </Layout>
    );

    const avatarUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${selectedSeed}`;
    const displayAvatarUrl = xpStats
        ? `https://api.dicebear.com/7.x/${xpStats.avatar_style}/svg?seed=${xpStats.avatar_seed}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;

    return (
        <Layout userRole="Student">
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="stretch">

                    {/* --- Hero Section --- */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        p={0}
                        overflow="hidden"
                        position="relative"
                        bgGradient="linear(to-br, gray.900, black)"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                    >
                        {/* Background Pattern */}
                        <Box
                            position="absolute"
                            top={0}
                            left={0}
                            w="full"
                            h="150px"
                            bgGradient="linear(to-r, cyan.900, purple.900)"
                            opacity={0.6}
                        />

                        <Flex direction={{ base: 'column', md: 'row' }} align="end" p={8} pt={20} gap={6}>
                            <Box position="relative">
                                <Avatar
                                    size="2xl"
                                    src={displayAvatarUrl}
                                    border="4px solid"
                                    borderColor="black"
                                    bg="gray.700"
                                    boxShadow="0 0 20px rgba(0, 255, 255, 0.5)"
                                />
                                <IconButton
                                    aria-label="Edit Avatar"
                                    icon={<Edit2 size={16} />}
                                    size="sm"
                                    colorScheme="cyan"
                                    position="absolute"
                                    bottom={2}
                                    right={2}
                                    onClick={() => {
                                        setSelectedStyle(xpStats?.avatar_style || 'avataaars');
                                        setSelectedSeed(xpStats?.avatar_seed || profile.username);
                                        onOpen();
                                    }}
                                    borderRadius="full"
                                />
                            </Box>

                            <VStack align="start" spacing={1} flex={1} mb={2}>
                                <Heading size="2xl" color="white">
                                    {profile.first_name} {profile.last_name}
                                </Heading>
                                <Text fontSize="lg" color="cyan.300" fontFamily="monospace">@{profile.username}</Text>
                                <HStack mt={2}>
                                    <Badge colorScheme="purple" variant="solid" px={3} py={1} borderRadius="full">
                                        Level {xpStats?.level || 1}
                                    </Badge>
                                    <Badge colorScheme="cyan" variant="outline" px={3} py={1} borderRadius="full">
                                        Student
                                    </Badge>
                                </HStack>
                            </VStack>

                            {/* Quick Stats */}
                            <HStack spacing={8} mb={4} display={{ base: 'none', md: 'flex' }}>
                                <VStack>
                                    <Text color="gray.400" fontSize="xs" textTransform="uppercase">Total XP</Text>
                                    <Text fontSize="2xl" fontWeight="bold" color="yellow.400">{xpStats?.total_xp || 0}</Text>
                                </VStack>
                                <VStack>
                                    <Text color="gray.400" fontSize="xs" textTransform="uppercase">Rank</Text>
                                    <Text fontSize="2xl" fontWeight="bold" color="white">#{xpStats?.rank || '-'}</Text>
                                </VStack>
                            </HStack>
                        </Flex>
                    </MotionBox>

                    <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>

                        {/* --- Identity Card --- */}
                        <MotionBox
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card"
                            p={6}
                            gridColumn={{ lg: "span 1" }}
                        >
                            <HStack mb={6}>
                                <Icon as={Shield} color="cyan.400" boxSize={6} />
                                <Heading size="md" color="gray.200">Identity Matrix</Heading>
                            </HStack>

                            <VStack align="start" spacing={5}>
                                <Box w="full">
                                    <Text color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Email Address</Text>
                                    <HStack bg="whiteAlpha.100" p={3} borderRadius="md">
                                        <Mail size={18} color="#A0AEC0" />
                                        <Text color="white" fontSize="md">{profile.email}</Text>
                                    </HStack>
                                </Box>
                                <Box w="full">
                                    <Text color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>User ID</Text>
                                    <HStack bg="whiteAlpha.100" p={3} borderRadius="md">
                                        <Text color="white" fontSize="md" fontFamily="monospace">UID-{profile.id.toString().padStart(4, '0')}</Text>
                                    </HStack>
                                </Box>
                            </VStack>
                        </MotionBox>

                        {/* --- Gamification Stats --- */}
                        <MotionBox
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card"
                            p={6}
                            gridColumn={{ lg: "span 1" }}
                        >
                            <HStack mb={6}>
                                <Icon as={Trophy} color="yellow.400" boxSize={6} />
                                <Heading size="md" color="gray.200">Achievements</Heading>
                            </HStack>

                            <SimpleGrid columns={2} spacing={4}>
                                <Box bg="whiteAlpha.100" p={4} borderRadius="lg" textAlign="center">
                                    <Text fontSize="3xl" fontWeight="bold" color="purple.300">{xpStats?.viva_xp || 0}</Text>
                                    <Text fontSize="xs" color="gray.400">Viva XP</Text>
                                </Box>
                                <Box bg="whiteAlpha.100" p={4} borderRadius="lg" textAlign="center">
                                    <Text fontSize="3xl" fontWeight="bold" color="blue.300">{xpStats?.assignment_xp || 0}</Text>
                                    <Text fontSize="xs" color="gray.400">Assignment XP</Text>
                                </Box>
                                <Box bg="whiteAlpha.100" p={4} borderRadius="lg" textAlign="center">
                                    <Text fontSize="3xl" fontWeight="bold" color="red.300">{xpStats?.boss_battle_xp || 0}</Text>
                                    <Text fontSize="xs" color="gray.400">Battle XP</Text>
                                </Box>
                                <Box bg="whiteAlpha.100" p={4} borderRadius="lg" textAlign="center">
                                    <Text fontSize="3xl" fontWeight="bold" color="green.300">{xpStats?.badges?.length || 0}</Text>
                                    <Text fontSize="xs" color="gray.400">Badges</Text>
                                </Box>
                            </SimpleGrid>
                        </MotionBox>

                        {/* --- Team Members --- */}
                        <MotionBox
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card"
                            p={6}
                            gridColumn={{ lg: "span 1" }}
                        >
                            <HStack mb={6}>
                                <Icon as={Users} color="green.400" boxSize={6} />
                                <Heading size="md" color="gray.200">Squad</Heading>
                            </HStack>

                            {groupMembers.length > 0 ? (
                                <VStack align="stretch" spacing={3}>
                                    {groupMembers.map((member) => (
                                        <HStack key={member.id} p={3} bg="whiteAlpha.100" borderRadius="lg" _hover={{ bg: 'whiteAlpha.200' }}>
                                            <Avatar size="sm" name={member.username} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} />
                                            <Box>
                                                <Text fontWeight="bold" fontSize="sm" color="white">{member.username}</Text>
                                                <Text fontSize="xs" color="gray.400">{member.email}</Text>
                                            </Box>
                                        </HStack>
                                    ))}
                                </VStack>
                            ) : (
                                <Flex direction="column" align="center" justify="center" h="150px" textAlign="center">
                                    <Briefcase size={40} color="#4A5568" />
                                    <Text color="gray.500" mt={4}>No active squad found.</Text>
                                </Flex>
                            )}
                        </MotionBox>

                    </SimpleGrid>

                </VStack>

                {/* --- Avatar Editor Modal --- */}
                <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent bg="gray.900" border="1px solid" borderColor="cyan.500">
                        <ModalHeader color="white">Customize Avatar</ModalHeader>
                        <ModalCloseButton color="white" />
                        <ModalBody pb={6}>
                            <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="center">
                                {/* Preview */}
                                <Box
                                    p={4}
                                    bg="whiteAlpha.100"
                                    borderRadius="full"
                                    border="2px dashed"
                                    borderColor="cyan.500"
                                >
                                    <Avatar
                                        size="2xl"
                                        src={avatarUrl}
                                        bg="transparent"
                                    />
                                </Box>

                                {/* Controls */}
                                <VStack align="stretch" flex={1} spacing={4} w="full">
                                    <Box>
                                        <Text color="gray.400" mb={2} fontSize="sm">Style</Text>
                                        <Select
                                            value={selectedStyle}
                                            onChange={(e) => setSelectedStyle(e.target.value)}
                                            bg="gray.800"
                                            color="white"
                                            borderColor="gray.600"
                                        >
                                            {AVATAR_STYLES.map(style => (
                                                <option key={style.value} value={style.value} style={{ color: 'black' }}>
                                                    {style.label}
                                                </option>
                                            ))}
                                        </Select>
                                    </Box>

                                    <Box>
                                        <Text color="gray.400" mb={2} fontSize="sm">Seed (Randomize for new look)</Text>
                                        <HStack>
                                            <Button
                                                leftIcon={<RefreshCw size={16} />}
                                                onClick={randomizeSeed}
                                                flex={1}
                                                colorScheme="gray"
                                                variant="outline"
                                                _hover={{ bg: 'whiteAlpha.200' }}
                                                color="white"
                                            >
                                                Randomize
                                            </Button>
                                        </HStack>
                                    </Box>

                                    <Button
                                        leftIcon={<Save size={18} />}
                                        colorScheme="cyan"
                                        onClick={handleSaveAvatar}
                                        isLoading={savingAvatar}
                                        mt={4}
                                        w="full"
                                    >
                                        Save New Look
                                    </Button>
                                </VStack>
                            </Flex>
                        </ModalBody>
                    </ModalContent>
                </Modal>

            </Container>
        </Layout>
    );
};

export default StudentProfile;
