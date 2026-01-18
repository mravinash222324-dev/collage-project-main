import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    GridItem,
    VStack,
    HStack,
    Badge,
    Progress,
    Icon,
    Button,
    useToast,
    Avatar,
    Input,
    Spinner,
    SimpleGrid,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Tooltip,
    AvatarGroup
} from '@chakra-ui/react';

import api from '../config/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';
import NotificationBell from './NotificationBell';
import ProjectGraph from './ProjectGraph';
import AIBossBattle from './AIBossBattle';
import ProjectTimeCapsule from './ProjectTimeCapsule';

import TeamManagement from './TeamManagement'; // Imported TeamManagement

const {
    Plus,
    ArrowRight,
    Bot,
    LayoutTemplate,
    Trophy,
    Activity,
    Target,
    MessageSquare,
    CheckCircle,
    Bell,
    Search,
    Network,
    Skull,
    History,
    Users,
    Zap,
    GitBranch,
    Github
} = Lucide;

const MotionBox = motion(Box);
const MotionGridItem = motion(GridItem);

// --- Interfaces ---
interface TeamMember {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface Project {
    id: number;
    project_id: number;
    title: string;
    abstract: string;
    status: 'In Progress' | 'Completed' | 'Pending' | 'Approved' | 'Rejected';
    progress: number;
    ai_suggestions?: string;
    innovation_score?: number;
    feasibility_score?: number;
    relevance_score?: number;
    team_members?: TeamMember[]; // Added team_members
    github_repo_link?: string; // Added for GitHub widget
}

interface Task {
    id: number;
    title: string;
    status: 'To Do' | 'In Progress' | 'Done';
    due_date?: string;
}

interface TimedAssignment {
    id: number;
    title: string;
    description: string;
    assignment_type: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    is_active: boolean;
    is_submitted?: boolean;
}

interface ActivityItem {
    id: string;
    type: 'submission' | 'message' | 'assignment';
    text: string;
    time: string;
}

interface XPStats {
    level: number;
    total_xp: number;
    rank: number;
}

const getProjectId = (p: Project) => p.project_id || p.id;

const StudentDashboard: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [assignments, setAssignments] = useState<TimedAssignment[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();
    const [displayName, setDisplayName] = useState(localStorage.getItem('fullName') || localStorage.getItem('username') || 'Student');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'neural'>('grid');
    const [showBossBattle, setShowBossBattle] = useState(false);
    const [xpStats, setXpStats] = useState<XPStats | null>(null);
    const { isOpen: isTimeCapsuleOpen, onOpen: onTimeCapsuleOpen, onClose: onTimeCapsuleClose } = useDisclosure();

    // Team Management Modal State
    const { isOpen: isTeamModalOpen, onOpen: onTeamModalOpen, onClose: onTeamModalClose } = useDisclosure();
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    // Derived state for the modal: ensures it always reflects the latest 'projects' data
    const selectedProjectForModal = selectedProjectId
        ? projects.find(p => getProjectId(p) === selectedProjectId)
        : null;


    useEffect(() => {
        fetchDashboardData();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/auth/users/me/');
            if (res.data.first_name) {
                const fullName = `${res.data.first_name} ${res.data.last_name || ''}`.trim();
                setDisplayName(fullName);
                localStorage.setItem('fullName', fullName);
            }
        } catch (e) {
            console.error("Failed to fetch user profile", e);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel fetch for independent data
            const [projRes, assignRes, actRes, xpRes] = await Promise.allSettled([
                api.get('/student/submissions/'),
                api.get('/assignments/list/'),
                api.get('/student/activity/'),
                api.get('/gamification/me/')
            ]);

            // 1. Handle Projects
            if (projRes.status === 'fulfilled') {
                const fetchedProjects = projRes.value.data;
                setProjects(fetchedProjects);

                // Filter for Active & Completed Projects (Exclude Rejected/Pending for tasks fetch if desired, or keep them? Usually tasks are for active projects)
                // User wants to see Completed projects too.
                const activeProjects = fetchedProjects.filter((p: Project) =>
                    p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed'
                );

                // Fetch Tasks for all active projects
                if (activeProjects.length > 0) {
                    try {
                        const taskPromises = activeProjects.map((project: Project) =>
                            api.get(`/projects/${project.project_id || project.id}/tasks/`)
                        );
                        const results = await Promise.all(taskPromises);
                        const allTasks = results.flatMap(res =>
                            Array.isArray(res.data) ? res.data : (res.data.tasks || [])
                        );
                        setTasks(allTasks);
                    } catch (taskErr) {
                        console.warn("Failed to fetch tasks", taskErr);
                        setTasks([]);
                    }
                } else {
                    setTasks([]);
                }
            }

            // 2. Handle Assignments
            if (assignRes.status === 'fulfilled') {
                setAssignments(assignRes.value.data);
            }

            // 3. Handle Activities
            if (actRes.status === 'fulfilled') {
                setActivities(actRes.value.data);
            }

            // 4. Handle XP Stats
            if (xpRes.status === 'fulfilled') {
                setXpStats(xpRes.value.data);
            }

        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to load dashboard', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const openTeamManagement = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation(); // Prevent card click
        setSelectedProjectId(getProjectId(project));
        onTeamModalOpen();
    };

    const handleTeamMemberUpdated = () => {
        fetchDashboardData();
        // The modal will automatically update because 'selectedProjectForModal' is derived from 'projects'
    };

    const handleEnterFocusMode = () => {
        // Find the most urgent active assignment
        const urgentAssignment = assignments.find(a => a.is_active && !a.is_submitted);
        if (urgentAssignment) {
            navigate(`/student/assignments/${urgentAssignment.id}`);
        } else {
            toast({
                title: "Clear Sailing! ⛵",
                description: "You have no pending assignments due immediately. Great job!",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleViewRepo = () => {
        const activeProject = filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed');
        if (activeProject && activeProject.github_repo_link) {
            window.open(activeProject.github_repo_link, '_blank');
        } else if (activeProject) {
            toast({
                title: "No Repo Linked",
                description: "This project doesn't have a GitHub repository linked yet. Go to Project Details to add one.",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });
            // Optional: navigate to project details
            navigate(`/student/project-view/${getProjectId(activeProject)}`);
        } else {
            toast({
                title: "No Active Project",
                description: "You don't have an active project to view.",
                status: "error",
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'green';
            case 'In Progress': return 'blue';
            case 'Completed': return 'teal';
            case 'Pending': return 'yellow';
            case 'Rejected': return 'red';
            default: return 'gray';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const isFuture = diffInSeconds < 0;
        const seconds = Math.abs(diffInSeconds);

        if (seconds < 60) return isFuture ? 'Just now' : 'Just now';

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return isFuture ? `${minutes}m left` : `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return isFuture ? `${hours}h left` : `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return isFuture ? `${days}d left` : `${days}d ago`;
    };

    // Filtered Data
    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.abstract.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredAssignments = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <Layout userRole="Student">
            <Flex h="80vh" align="center" justify="center">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
        </Layout>
    );

    return (
        <Layout userRole="Student">
            <Box maxW="1400px" mx="auto">

                {/* --- Welcome Section --- */}
                <Flex justify="space-between" align="center" mb={8} direction={{ base: 'column', xl: 'row' }} gap={4}>
                    <Box w={{ base: 'full', xl: 'auto' }}>
                        <Heading size="2xl" fontWeight="800" letterSpacing="-0.02em" bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text">
                            Hello, {displayName} 👋
                        </Heading>
                        <Text color="gray.400" fontSize="lg" mt={2}>Here's what's happening with your projects today.</Text>
                    </Box>
                    <Flex wrap="wrap" gap={4} justify={{ base: 'flex-start', xl: 'flex-end' }} w={{ base: 'full', xl: 'auto' }} align="center">
                        <Box position="relative">
                            <Input
                                placeholder="Search..."
                                bg="whiteAlpha.100"
                                border="none"
                                borderRadius="full"
                                pl={10}
                                color="white"
                                _focus={{ bg: 'whiteAlpha.200', boxShadow: 'none' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                width={{ base: '150px', md: '200px' }}
                            />
                            <Icon as={Search} position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" size={18} />
                        </Box>

                        {/* XP Widget */}
                        {xpStats && (
                            <HStack
                                spacing={3}
                                bg="whiteAlpha.100"
                                p={2}
                                borderRadius="full"
                                border="1px solid"
                                borderColor="purple.500"
                                cursor="pointer"
                                onClick={() => navigate('/leaderboard')}
                                _hover={{ bg: 'whiteAlpha.200' }}
                            >
                                <Badge colorScheme="purple" borderRadius="full" px={2}>Lvl {xpStats.level}</Badge>
                                <Text fontSize="sm" fontWeight="bold" color="yellow.300">{xpStats.total_xp} XP</Text>
                                <Icon as={Trophy} size={16} color="#ECC94B" />
                            </HStack>
                        )}

                        <NotificationBell />

                        <Button
                            leftIcon={<Plus size={20} />}
                            className="btn-primary"
                            size="md"
                            onClick={() => navigate('/submit')}
                        >
                            New Project
                        </Button>
                        <Button
                            leftIcon={<Network size={20} />}
                            colorScheme={viewMode === 'neural' ? 'purple' : 'gray'}
                            variant={viewMode === 'neural' ? 'solid' : 'outline'}
                            size="md"
                            onClick={() => setViewMode(viewMode === 'grid' ? 'neural' : 'grid')}
                        >
                            {viewMode === 'neural' ? 'Grid' : 'Nexus'}
                        </Button>
                        <Button
                            leftIcon={<Skull size={20} />}
                            colorScheme="red"
                            variant="outline"
                            size="md"
                            onClick={() => {
                                const activeAvailable = filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed');
                                if (activeAvailable.length > 0) {
                                    setShowBossBattle(true);
                                } else {
                                    toast({
                                        title: "No active projects found for the Arena.",
                                        status: "error",
                                        duration: 3000,
                                        isClosable: true,
                                    });
                                }
                            }}
                            _hover={{ bg: 'red.900', borderColor: 'red.500' }}
                        >
                            Arena
                        </Button>
                        <Button
                            leftIcon={<History size={20} />}
                            className="btn-primary"
                            variant="ghost"
                            size="md"
                            onClick={onTimeCapsuleOpen}
                            _hover={{ bg: 'whiteAlpha.200' }}
                        >
                            Time Capsule
                        </Button>
                    </Flex>
                </Flex>

                {/* Team Management Modal */}
                <Modal isOpen={isTeamModalOpen} onClose={onTeamModalClose} size="xl">
                    <ModalOverlay backdropFilter="blur(5px)" />
                    <ModalContent bg="gray.900" border="1px solid" borderColor="cyan.500">
                        <ModalHeader color="white">
                            Manage Team: {selectedProjectForModal?.title}
                        </ModalHeader>
                        <ModalCloseButton color="white" />
                        <ModalBody pb={6}>
                            {selectedProjectForModal && ( // Use derived state
                                <TeamManagement
                                    projectId={getProjectId(selectedProjectForModal)}
                                    currentMembers={selectedProjectForModal.team_members || []}
                                    isLeader={true} // Logic maintained as per context
                                    onMemberUpdated={handleTeamMemberUpdated}
                                />
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>

                {/* Time Capsule Modal */}
                <Modal isOpen={isTimeCapsuleOpen} onClose={onTimeCapsuleClose} size="xl" scrollBehavior="inside">
                    <ModalOverlay backdropFilter="blur(10px)" />
                    <ModalContent bg="gray.900" border="1px solid" borderColor="purple.500">
                        <ModalHeader color="white">Your Project Journey</ModalHeader>
                        <ModalCloseButton color="white" />
                        <ModalBody>
                            <ProjectTimeCapsule />
                        </ModalBody>
                    </ModalContent>
                </Modal>

                {/* Render Boss Battle Overlay */}
                {
                    showBossBattle && filteredProjects.length > 0 && (
                        <AIBossBattle
                            project={filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed') || filteredProjects[0]}
                            onClose={() => setShowBossBattle(false)}
                        />
                    )
                }

                {
                    viewMode === 'neural' ? (
                        <Box
                            position="fixed"
                            top="0"
                            left="0"
                            w="100vw"
                            h="100vh"
                            bg="black"
                            zIndex={2000}
                            overflow="hidden"
                        >
                            {filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed').length > 0 ? (
                                <ProjectGraph
                                    project={filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')[0]}
                                    tasks={tasks}
                                    onClose={() => setViewMode('grid')}
                                />
                            ) : (
                                <Flex justify="center" align="center" h="full" direction="column">
                                    <Text color="gray.400" fontSize="xl" mb={4}>No active project to visualize.</Text>
                                    <Button onClick={() => setViewMode('grid')}>Return to Dashboard</Button>
                                </Flex>
                            )}
                        </Box>
                    ) : (
                        /* --- Bento Grid Layout --- */
                        <SimpleGrid
                            templateColumns={{ base: "1fr", lg: "repeat(4, 1fr)" }}
                            templateRows={{ base: "auto", lg: "repeat(2, 1fr)" }}
                            gap={6}
                        >

                            {/* 1. Main Stats Card (Large) */}
                            <MotionGridItem
                                colSpan={{ base: 1, lg: 2 }}
                                rowSpan={{ base: 1, lg: 2 }}
                                className="glass-card"
                                p={8}
                                position="relative"
                                overflow="hidden"
                                whileHover={{ scale: 1.01 }}
                                cursor="pointer"
                                onClick={() => {
                                    const active = filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed');
                                    if (active) navigate(`/student/project-view/${getProjectId(active)}`);
                                }}
                            >
                                <Box position="absolute" top="-20px" right="-20px" opacity={0.1}>
                                    <Trophy size={200} />
                                </Box>

                                <VStack align="start" spacing={6} h="full" justify="space-between">
                                    <Box w="full">
                                        <Flex justify="space-between" align="start">
                                            <Badge colorScheme="blue" px={3} py={1} borderRadius="full" mb={4}>Overview</Badge>

                                            {/* Team Members Avatar Group + Manage Button */}
                                            {(filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.team_members?.length || 0) > 0 && (
                                                <HStack>
                                                    <AvatarGroup size="sm" max={3}>
                                                        {filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.team_members?.map(m => (
                                                            <Avatar key={m.id} name={m.username} />
                                                        ))}
                                                    </AvatarGroup>
                                                    <Tooltip label="Manage Team">
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            colorScheme="cyan"
                                                            onClick={(e) => {
                                                                const active = filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed');
                                                                if (active) openTeamManagement(e, active);
                                                            }}
                                                        >
                                                            <Users size={14} />
                                                        </Button>
                                                    </Tooltip>
                                                </HStack>
                                            )}
                                        </Flex>

                                        <Heading size="3xl" fontWeight="800" color="blue.600">
                                            {filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed').length}
                                        </Heading>
                                        <Text fontSize="xl" fontWeight="600" color="gray.600">Total Projects</Text>
                                    </Box>

                                    <Box w="full">
                                        <Text mb={2} fontWeight="600" color="gray.500">Overall Progress</Text>
                                        <Progress
                                            value={filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.progress || 0}
                                            size="lg"
                                            colorScheme="blue"
                                            borderRadius="full"
                                            bg="blue.100"
                                        />
                                        <Text mt={2} fontSize="sm" color="gray.400" textAlign="right">
                                            {filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.progress || 0}% Completed
                                        </Text>
                                    </Box>

                                    <HStack spacing={4} w="full">
                                        <Box flex={1} p={4} bg="blue.900" borderRadius="xl" border="1px solid" borderColor="blue.700">
                                            <Activity size={24} color="#63B3ED" />
                                            <Text fontWeight="bold" fontSize="2xl" mt={2} color="white">
                                                {filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.innovation_score || 0}/10
                                            </Text>
                                            <Text fontSize="sm" color="blue.200">Innovation</Text>
                                        </Box>
                                        <Box flex={1} p={4} bg="purple.900" borderRadius="xl" border="1px solid" borderColor="purple.700">
                                            <Trophy size={24} color="#D6BCFA" />
                                            <Text fontWeight="bold" fontSize="2xl" mt={2} color="white">
                                                {filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.feasibility_score || 0}/10
                                            </Text>
                                            <Text fontSize="sm" color="purple.200">Feasibility</Text>
                                        </Box>
                                        <Box flex={1} p={4} bg="green.900" borderRadius="xl" border="1px solid" borderColor="green.700">
                                            <Target size={24} color="#68D391" />
                                            <Text fontWeight="bold" fontSize="2xl" mt={2} color="white">
                                                {filteredProjects.find(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')?.relevance_score || 0}/10
                                            </Text>
                                            <Text fontSize="sm" color="green.200">Relevance</Text>
                                        </Box>
                                    </HStack>
                                </VStack>
                            </MotionGridItem>

                            {/* 2. AI Insights Widget (Medium) */}
                            <MotionGridItem
                                colSpan={{ base: 1, lg: 2 }}
                                className="glass-card"
                                p={6}
                                bgGradient="linear(to-br, rgba(128, 90, 213, 0.2), rgba(0, 0, 0, 0))"
                                border="1px solid rgba(128, 90, 213, 0.3)"
                            >
                                <HStack mb={4}>
                                    <Box p={2} bg="purple.900" borderRadius="lg">
                                        <Bot size={20} color="#D6BCFA" />
                                    </Box>
                                    <Heading size="md" color="gray.200">AI Assistant Insights</Heading>
                                </HStack>
                                <Text color="gray.300" fontSize="md" lineHeight="1.6" noOfLines={3}>
                                    {filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed').length > 0 && filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')[0].ai_suggestions
                                        ? filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed')[0].ai_suggestions
                                        : "Submit a project to get AI-powered insights and suggestions for improvement."}
                                </Text>
                                {filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress' || p.status === 'Completed').length > 0 && (
                                    <Button
                                        mt={4}
                                        size="sm"
                                        variant="outline"
                                        colorScheme="purple"
                                        rightIcon={<ArrowRight size={16} />}
                                        onClick={() => navigate(`/student/project-view/${getProjectId(filteredProjects.filter(p => p.status === 'Approved' || p.status === 'In Progress')[0])}`)}
                                    >
                                        View Full Report
                                    </Button>
                                )}
                            </MotionGridItem>

                            {/* 3. Recent Projects List (Medium) */}
                            <MotionGridItem
                                colSpan={{ base: 1, lg: 2 }}
                                className="glass-card"
                                p={6}
                                overflowY="auto"
                                maxH="300px"
                            >
                                <Flex justify="space-between" align="center" mb={4}>
                                    <Heading size="md" color="gray.200">Recent Projects</Heading>
                                    <Icon as={LayoutTemplate} color="gray.400" />
                                </Flex>

                                <VStack align="stretch" spacing={3}>
                                    {filteredProjects.length === 0 ? (
                                        <Text color="gray.400">No projects match your search.</Text>
                                    ) : (
                                        filteredProjects.slice(0, 3).map(project => (
                                            <HStack
                                                key={project.id}
                                                p={3}
                                                bg="rgba(255, 255, 255, 0.05)"
                                                borderRadius="xl"
                                                justify="space-between"
                                                cursor="pointer"
                                                transition="all 0.2s"
                                                _hover={{ transform: 'translateX(5px)', bg: 'rgba(255, 255, 255, 0.1)' }}
                                                onClick={() => navigate(`/student/project-view/${getProjectId(project)}`)}
                                            >
                                                <HStack>
                                                    <Avatar size="sm" name={project.title} bg={getStatusColor(project.status) + '.500'} />
                                                    <Box>
                                                        <Text fontWeight="bold" fontSize="sm" color="gray.200">{project.title}</Text>
                                                        <Text fontSize="xs" color="gray.400">{project.status}</Text>
                                                    </Box>
                                                </HStack>
                                                <ArrowRight size={16} color="#CBD5E0" />
                                            </HStack>
                                        ))
                                    )}
                                </VStack>
                            </MotionGridItem>

                            {/* 4. Recent Activity Feed (New) */}
                            <MotionGridItem
                                colSpan={{ base: 1, lg: 2 }}
                                className="glass-card"
                                p={6}
                                maxH="300px"
                                overflowY="auto"
                                css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#4A5568' } }}
                            >
                                <Heading size="md" mb={4} color="gray.200" display="flex" alignItems="center" gap={2}>
                                    <Icon as={Activity} color="orange.400" /> Recent Activity
                                </Heading>
                                <VStack align="stretch" spacing={3}>
                                    {activities.length === 0 ? (
                                        <Text color="gray.500" fontSize="sm">No recent activity.</Text>
                                    ) : (
                                        activities.map((activity) => (
                                            <HStack key={activity.id} spacing={3} p={2} borderRadius="lg" _hover={{ bg: "whiteAlpha.50" }}>
                                                <Box p={2} bg="whiteAlpha.100" borderRadius="full">
                                                    <Icon
                                                        as={activity.type === 'message' ? MessageSquare : activity.type === 'assignment' ? Bell : CheckCircle}
                                                        size={16}
                                                        color={activity.type === 'message' ? "blue.300" : activity.type === 'assignment' ? "yellow.300" : "green.300"}
                                                    />
                                                </Box>
                                                <Box>
                                                    <Text fontSize="sm" color="gray.300" noOfLines={2}>{activity.text}</Text>
                                                    <Text fontSize="xs" color="gray.500">{formatTimeAgo(activity.time)}</Text>
                                                </Box>
                                            </HStack>
                                        ))
                                    )}
                                </VStack>
                            </MotionGridItem>

                            {/* 5. Focus Mode Widget (New) */}
                            <MotionGridItem
                                colSpan={{ base: 1, lg: 1 }}
                                className="glass-card"
                                p={6}
                                bgGradient="linear(to-br, rgba(236, 201, 75, 0.1), rgba(0,0,0,0))"
                                border="1px solid rgba(236, 201, 75, 0.2)"
                            >
                                <VStack align="start" justify="space-between" h="full">
                                    <HStack>
                                        <Box p={2} bg="yellow.900" borderRadius="lg">
                                            <Zap size={20} color="#F6E05E" />
                                        </Box>
                                        <Heading size="sm" color="yellow.200">Focus Mode</Heading>
                                    </HStack>
                                    <Box>
                                        <Text fontSize="xs" color="gray.400" mb={1}>Next Deadline</Text>
                                        <Text fontSize="xl" fontWeight="bold" color="white">
                                            {assignments.find(a => a.is_active && !a.is_submitted)?.end_time
                                                ? formatTimeAgo(assignments.find(a => a.is_active && !a.is_submitted)!.end_time)
                                                : "No Deadlines"}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            {assignments.find(a => a.is_active && !a.is_submitted)?.title || "Clear Sailing"}
                                        </Text>
                                    </Box>
                                    <Button size="sm" colorScheme="yellow" variant="solid" w="full" onClick={handleEnterFocusMode}>
                                        Enter Zone
                                    </Button>
                                </VStack>
                            </MotionGridItem>

                            {/* 6. GitHub Connectivity (New) */}
                            <MotionGridItem
                                colSpan={{ base: 1, lg: 1 }}
                                className="glass-card"
                                p={6}
                                bgGradient="linear(to-br, rgba(23, 25, 35, 0.8), rgba(0,0,0,0))"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <VStack align="start" justify="space-between" h="full">
                                    <HStack justify="space-between" w="full">
                                        <HStack>
                                            <Github size={20} color="white" />
                                            <Heading size="sm" color="gray.200">GitHub</Heading>
                                        </HStack>
                                        <Badge colorScheme="green" variant="subtle" fontSize="xs">Connected</Badge>
                                    </HStack>

                                    <Box w="full">
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontSize="xs" color="gray.500">Last Commit</Text>
                                            <Text fontSize="xs" color="gray.300">2h ago</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text fontSize="xs" color="gray.500">Branch</Text>
                                            <HStack spacing={1}>
                                                <GitBranch size={12} color="#718096" />
                                                <Text fontSize="xs" color="blue.300">main</Text>
                                            </HStack>
                                        </HStack>
                                    </Box>

                                    <Button size="sm" variant="outline" colorScheme="gray" w="full" _hover={{ bg: 'whiteAlpha.200' }} onClick={handleViewRepo}>
                                        View Repo
                                    </Button>
                                </VStack>
                            </MotionGridItem>

                        </SimpleGrid>
                    )}

                {/* --- Tasks Section (Below Grid) --- */}
                <Box mt={8}>
                    <Heading size="lg" mb={6} color="gray.700">Upcoming Tasks</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        {filteredTasks.map((task, idx) => {
                            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';
                            return (
                                <MotionBox
                                    key={task.id}
                                    className="glass-card"
                                    p={5}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    bg={isOverdue ? "rgba(245, 101, 101, 0.1)" : "whiteAlpha.100"}
                                    border="1px solid"
                                    borderColor={isOverdue ? "red.500" : "whiteAlpha.200"}
                                    _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                    <Flex justify="space-between" mb={3}>
                                        <Badge
                                            colorScheme={task.status === 'Done' ? 'green' : isOverdue ? 'red' : task.status === 'In Progress' ? 'blue' : 'yellow'}
                                            borderRadius="full"
                                            px={2}
                                        >
                                            {isOverdue ? 'Overdue' : task.status}
                                        </Badge>
                                        <Text fontSize="xs" color={isOverdue ? "red.300" : "gray.300"}>{task.due_date}</Text>
                                    </Flex>
                                    <Heading size="sm" color="white" mb={2}>{task.title}</Heading>
                                    <Progress
                                        value={task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0}
                                        size="xs"
                                        colorScheme={task.status === 'Done' ? 'green' : 'blue'}
                                        borderRadius="full"
                                        mt={4}
                                        bg="whiteAlpha.300"
                                    />
                                </MotionBox>
                            )
                        })}
                    </SimpleGrid>
                </Box>

                {/* --- Assignments Section --- */}
                <Box mt={8} mb={10}>
                    <Heading size="lg" mb={6} color="gray.700">Active Assignments</Heading>
                    {filteredAssignments.length === 0 ? (
                        <Text color="gray.500">No active assignments match your search.</Text>
                    ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {filteredAssignments.map((assignment) => (
                                <MotionBox
                                    key={assignment.id}
                                    className="glass-card"
                                    p={6}
                                    whileHover={{ y: -5 }}
                                    borderLeft="4px solid"
                                    borderColor={assignment.is_submitted ? "blue.400" : assignment.is_active ? "green.400" : "red.400"}
                                >
                                    <HStack justify="space-between" mb={2}>
                                        <Badge colorScheme={assignment.is_submitted ? "blue" : assignment.is_active ? "green" : "red"}>
                                            {assignment.is_submitted ? "Submitted" : assignment.is_active ? "Active" : "Expired"}
                                        </Badge>
                                        <Text fontSize="xs" color="gray.400">
                                            {new Date(assignment.end_time).toLocaleDateString()}
                                        </Text>
                                    </HStack>
                                    <Heading size="md" mb={2} color="gray.200">{assignment.title}</Heading>
                                    <Text fontSize="sm" color="gray.400" mb={4} noOfLines={2}>
                                        {assignment.description}
                                    </Text>
                                    <Button
                                        size="sm"
                                        colorScheme="blue"
                                        variant="outline"
                                        width="full"
                                        isDisabled={!assignment.is_active && !assignment.is_submitted}
                                        onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                                    >
                                        {assignment.is_submitted ? "View Submission" : assignment.is_active ? "Start Assignment" : "View Details"}
                                    </Button>
                                </MotionBox>
                            ))}
                        </SimpleGrid>
                    )}
                </Box>

                {/* --- Project Mentor Chat --- */}


            </Box >
        </Layout >
    );
};

export default StudentDashboard;
