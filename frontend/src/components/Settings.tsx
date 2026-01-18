import React, { useState, useEffect } from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    Heading,
    Input,
    Button,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Avatar,
    FormControl,
    FormLabel,
    Switch,
    Divider,
    Badge,
    Grid,
    SimpleGrid,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Zap, Bell, Key, LogOut, Check, X } from 'lucide-react';
import api from '../config/api';

// Motion Components
const MotionBox = motion(Box);
const MotionText = motion(Text);

// --- Interfaces ---
interface UserProfile {
    id: number;
    username: string;
    email: string;
    role: string;
    first_name?: string;
    last_name?: string;
}

interface AvatarData {
    avatar_style: string;
    avatar_seed: string;
}

const Settings: React.FC = () => {
    const toast = useToast();
    const bgColor = useColorModeValue('rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.2)');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');

    // --- State ---
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Profile State
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');

    // Avatar State
    const [avatarData, setAvatarData] = useState<AvatarData>({
        avatar_style: 'avataaars',
        avatar_seed: 'felix'
    });

    // Preferences State
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // --- Fetch Data ---
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);

            // 1. Fetch User Profile
            // Djoser endpoint for current user
            const userRes = await api.get('/auth/users/me/');
            setUser(userRes.data);
            setFirstName(userRes.data.first_name || '');
            setLastName(userRes.data.last_name || '');
            setEmail(userRes.data.email || '');

            // 2. Fetch Avatar Config
            // Gamification endpoint
            try {
                const avatarRes = await api.get('/gamification/me/');
                if (avatarRes.data) {
                    setAvatarData({
                        avatar_style: avatarRes.data.avatar_style || 'avataaars',
                        avatar_seed: avatarRes.data.avatar_seed || 'felix'
                    });
                }
            } catch (err) {
                console.warn("Could not fetch gamification profile, using defaults");
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({
                title: 'Error loading settings',
                status: 'error',
                duration: 3000,
            });
            setLoading(false);
        }
    };

    // --- Handlers ---

    const handleUpdateProfile = async () => {
        try {
            setUpdating(true);
            // Note: Updating 'email' might verify a re-login depending on Djoser settings,
            // but 'first_name' and 'last_name' are safe.
            await api.patch('/auth/users/me/', {
                first_name: firstName,
                last_name: lastName,
                // Djoser usually allows email update if configured
                email: email
            });

            toast({ title: 'Profile updated successfully', status: 'success' });
            setUpdating(false);
        } catch (error) {
            console.error("Update failed", error);
            toast({ title: 'Update failed', status: 'error' });
            setUpdating(false);
        }
    };

    const handleUpdateAvatar = async (newStyle?: string, newSeed?: string) => {
        const style = newStyle || avatarData.avatar_style;
        const seed = newSeed || avatarData.avatar_seed;

        // Optimistic UI update
        setAvatarData({ avatar_style: style, avatar_seed: seed });

        try {
            await api.patch('/gamification/avatar/update/', {
                avatar_style: style,
                avatar_seed: seed
            });
            // Trigger global update event for Layout
            window.dispatchEvent(new Event('profileUpdated'));
            // Silent success or optional toast
        } catch (error) {
            console.error("Avatar update failed", error);
            toast({ title: 'Failed to save avatar', status: 'error' });
        }
    };

    const randomizeAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        handleUpdateAvatar(undefined, randomSeed);
    };

    const getAvatarUrl = () => {
        return `https://api.dicebear.com/7.x/${avatarData.avatar_style}/svg?seed=${avatarData.avatar_seed}`;
    };

    // --- Render ---

    if (loading) {
        return (
            <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" color="cyan.400" />
            </Box>
        );
    }

    return (
        <Box
            minH="100vh"
            bgGradient="linear(to-b, #0a0f1a, #000814)"
            color="white"
            p={{ base: 4, md: 8 }}
        >
            <Box maxW="1000px" mx="auto">
                <HStack mb={8} justify="space-between">
                    <Heading
                        bgGradient="linear(to-r, cyan.400, purple.500)"
                        bgClip="text"
                        fontSize={{ base: '2xl', md: '4xl' }}
                        fontWeight="bold"
                    >
                        System Settings
                    </Heading>
                    <Badge colorScheme="cyan" variant="outline" p={2} borderRadius="md" fontSize="0.8em">
                        v2.1.0-Cyber
                    </Badge>
                </HStack>

                <Tabs variant="soft-rounded" colorScheme="cyan" isLazy>
                    <TabList mb={8} bg="whiteAlpha.100" p={2} borderRadius="xl">
                        <Tab _selected={{ bg: 'cyan.500', color: 'black' }}><User size={18} style={{ marginRight: 8 }} /> Profile</Tab>
                        <Tab _selected={{ bg: 'purple.500', color: 'white' }}><Shield size={18} style={{ marginRight: 8 }} /> Avatar</Tab>
                        <Tab _selected={{ bg: 'pink.500', color: 'white' }}><Zap size={18} style={{ marginRight: 8 }} /> Preferences</Tab>
                    </TabList>

                    <TabPanels>
                        {/* --- PANEL 1: PROFILE --- */}
                        <TabPanel>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                                {/* Left: Basic Info */}
                                <MotionBox
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    bg={bgColor}
                                    p={6}
                                    borderRadius="2xl"
                                    border="1px solid"
                                    borderColor={borderColor}
                                >
                                    <Heading size="md" mb={6} display="flex" alignItems="center">
                                        <User size={20} style={{ marginRight: 10 }} /> Personal Information
                                    </Heading>

                                    <VStack spacing={4} align="stretch">
                                        <FormControl>
                                            <FormLabel color="gray.400">Username</FormLabel>
                                            <Input
                                                value={user?.username}
                                                isReadOnly
                                                bg="blackAlpha.400"
                                                border="none"
                                                _disabled={{ opacity: 0.7, color: 'gray.500' }}
                                            />
                                            <Text fontSize="xs" color="gray.500" mt={1}>Usernames cannot be changed.</Text>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel color="gray.400">Role</FormLabel>
                                            <Badge colorScheme={user?.role === 'Teacher' ? 'orange' : 'cyan'}>
                                                {user?.role}
                                            </Badge>
                                        </FormControl>

                                        <Divider borderColor="whiteAlpha.200" my={2} />

                                        <HStack>
                                            <FormControl>
                                                <FormLabel>First Name</FormLabel>
                                                <Input
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    bg="whiteAlpha.100"
                                                    borderColor="whiteAlpha.200"
                                                    _focus={{ borderColor: 'cyan.400' }}
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel>Last Name</FormLabel>
                                                <Input
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    bg="whiteAlpha.100"
                                                    borderColor="whiteAlpha.200"
                                                    _focus={{ borderColor: 'cyan.400' }}
                                                />
                                            </FormControl>
                                        </HStack>

                                        <FormControl>
                                            <FormLabel>Email Address</FormLabel>
                                            <Input
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                bg="whiteAlpha.100"
                                                borderColor="whiteAlpha.200"
                                                _focus={{ borderColor: 'cyan.400' }}
                                            />
                                        </FormControl>

                                        <Button
                                            colorScheme="cyan"
                                            mt={4}
                                            onClick={handleUpdateProfile}
                                            isLoading={updating}
                                            loadingText="Saving..."
                                        >
                                            Save Changes
                                        </Button>
                                    </VStack>
                                </MotionBox>

                                {/* Right: Security */}
                                <MotionBox
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    bg={bgColor}
                                    p={6}
                                    borderRadius="2xl"
                                    border="1px solid"
                                    borderColor={borderColor}
                                >
                                    <Heading size="md" mb={6} display="flex" alignItems="center">
                                        <Key size={20} style={{ marginRight: 10 }} /> Security
                                    </Heading>

                                    <VStack spacing={4} align="stretch">
                                        <Box p={4} bg="whiteAlpha.50" borderRadius="md">
                                            <Text fontWeight="bold" mb={1}>Password</Text>
                                            <Text fontSize="sm" color="gray.400" mb={4}>
                                                Last changed: Never
                                            </Text>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorScheme="red"
                                                onClick={() => window.location.href = '/forgot-password'}
                                            >
                                                Reset Password
                                            </Button>
                                        </Box>

                                        <Box p={4} bg="whiteAlpha.50" borderRadius="md">
                                            <Text fontWeight="bold" mb={1}>Session</Text>
                                            <Text fontSize="sm" color="gray.400" mb={4}>
                                                You are currently logged in on this device.
                                            </Text>
                                            {/* Logout is usually in the sidebar/layout, but adding here for completeness */}
                                            <Button
                                                size="sm"
                                                leftIcon={<LogOut size={16} />}
                                                colorScheme="gray"
                                                onClick={() => {
                                                    localStorage.clear();
                                                    window.location.href = '/';
                                                }}
                                            >
                                                Log Out
                                            </Button>
                                        </Box>
                                    </VStack>
                                </MotionBox>
                            </SimpleGrid>
                        </TabPanel>

                        {/* --- PANEL 2: AVATAR --- */}
                        <TabPanel>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
                                <Box textAlign="center">
                                    <MotionBox
                                        animate={{
                                            y: [0, -10, 0],
                                            filter: [`drop-shadow(0 0 20px cyan)`, `drop-shadow(0 0 40px purple)`, `drop-shadow(0 0 20px cyan)`]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <Avatar
                                            size="2xl"
                                            src={getAvatarUrl()}
                                            border="4px solid"
                                            borderColor="cyan.400"
                                            bg="gray.800"
                                            w="250px"
                                            h="250px"
                                        />
                                    </MotionBox>
                                    <Text mt={6} color="gray.400" fontSize="lg">
                                        {avatarData.avatar_style} / {avatarData.avatar_seed}
                                    </Text>
                                    <Button
                                        mt={6}
                                        leftIcon={<Zap size={18} />}
                                        colorScheme="purple"
                                        size="lg"
                                        onClick={randomizeAvatar}
                                    >
                                        Randomize Avatar
                                    </Button>
                                </Box>

                                <VStack spacing={6} align="stretch">
                                    <Heading size="md">Customize Appearance</Heading>
                                    <Text color="gray.400">
                                        Select a style and seed for your digital identity. Your avatar appears on the leaderboard, chats, and your profile.
                                    </Text>

                                    <FormControl>
                                        <FormLabel>Avatar Style</FormLabel>
                                        <SimpleGrid columns={3} spacing={3}>
                                            {['avataaars', 'bottts', 'identicon', 'jdenticon', 'gridy', 'micah'].map((style) => (
                                                <Button
                                                    key={style}
                                                    variant={avatarData.avatar_style === style ? 'solid' : 'outline'}
                                                    colorScheme={avatarData.avatar_style === style ? 'cyan' : 'gray'}
                                                    onClick={() => handleUpdateAvatar(style, undefined)}
                                                    textTransform="capitalize"
                                                    size="sm"
                                                >
                                                    {style}
                                                </Button>
                                            ))}
                                        </SimpleGrid>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Avatar Seed (ID)</FormLabel>
                                        <Input
                                            value={avatarData.avatar_seed}
                                            onChange={(e) => handleUpdateAvatar(undefined, e.target.value)}
                                            bg="whiteAlpha.100"
                                            placeholder="Enter any text..."
                                        />
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            Typing here instantly changes your avatar's look.
                                        </Text>
                                    </FormControl>
                                </VStack>
                            </SimpleGrid>
                        </TabPanel>

                        {/* --- PANEL 3: PREFERENCES --- */}
                        <TabPanel>
                            <VStack spacing={6} align="stretch" maxW="600px">
                                <Box bg={bgColor} p={6} borderRadius="xl">
                                    <HStack justify="space-between">
                                        <HStack>
                                            <Bell size={24} color="#0BC5EA" />
                                            <Box>
                                                <Text fontWeight="bold">Notifications</Text>
                                                <Text fontSize="sm" color="gray.400">Receive alerts for new assignments and messages.</Text>
                                            </Box>
                                        </HStack>
                                        <Switch
                                            colorScheme="cyan"
                                            isChecked={notifications}
                                            onChange={(e) => setNotifications(e.target.checked)}
                                        />
                                    </HStack>
                                </Box>

                                <Box bg={bgColor} p={6} borderRadius="xl">
                                    <HStack justify="space-between">
                                        <HStack>
                                            <Zap size={24} color="#D53F8C" />
                                            <Box>
                                                <Text fontWeight="bold">Sound Effects</Text>
                                                <Text fontSize="sm" color="gray.400">Play sounds for achievements and interactive elements.</Text>
                                            </Box>
                                        </HStack>
                                        <Switch
                                            colorScheme="pink"
                                            isChecked={soundEnabled}
                                            onChange={(e) => setSoundEnabled(e.target.checked)}
                                        />
                                    </HStack>
                                </Box>

                                <Alert status="info" variant="subtle" borderRadius="md" bg="blue.900" color="blue.100">
                                    <AlertIcon />
                                    More system preferences will be available in the next update.
                                </Alert>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Box>
    );
};

export default Settings;
