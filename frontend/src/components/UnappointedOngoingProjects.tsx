import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import {
    Box,
    Flex,
    Heading,
    Text,
    SimpleGrid,
    Badge,
    Spinner,
    Icon,
    Button,
    Progress,
    VStack,
    HStack,
    Alert,
    AlertIcon,
    Center,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ExternalLink,
    Bookmark as BookmarkIcon
} from 'lucide-react';

const MotionBox = motion(Box);

interface Project {
    id: number;
    title: string;
    student_name: string;
    status: string;
    progress_percentage: number;
    category: string;
    submission_id: number;
    abstract_text: string;
    group_name?: string;
    teachers: string[];
}

const UnappointedOngoingProjects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/teacher/unappointed-ongoing/');
            setProjects(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Failed to fetch unappointed ongoing projects.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    if (loading) {
        return (
            <Flex direction="column" align="center" justify="center" minH="400px">
                <Spinner size="xl" color="cyan.400" thickness="4px" speed="0.65s" emptyColor="gray.800" mb={4} />
                <Text color="gray.400" className="animate-pulse">Scanning system for unmanaged projects...</Text>
            </Flex>
        );
    }

    return (
        <VStack spacing={8} align="stretch">
            <Box>
                <Heading
                    size="2xl"
                    bgGradient="linear(to-r, #00d2ff, #3a7bd5)"
                    bgClip="text"
                    mb={2}
                >
                    Global Project Monitor
                </Heading>
                <Text color="gray.400" fontSize="lg">
                    Monitor progress of projects managed by other teachers or currently unassigned.
                </Text>
            </Box>

            {error && (
                <Alert status="error" variant="subtle" borderRadius="xl">
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {projects.length === 0 ? (
                <Center
                    py={24}
                    bg="rgba(15, 23, 42, 0.5)"
                    borderRadius="3xl"
                    border="2px dashed"
                    borderColor="whiteAlpha.100"
                >
                    <VStack spacing={6}>
                        <Box p={6} bg="whiteAlpha.50" borderRadius="full">
                            <Icon as={BookmarkIcon} boxSize={10} color="gray.600" />
                        </Box>
                        <VStack spacing={2}>
                            <Heading size="md" color="whiteAlpha.800">No Other Projects</Heading>
                            <Text color="gray.500" maxW="md" textAlign="center">
                                There are no other ongoing projects in the system right now.
                            </Text>
                        </VStack>
                    </VStack>
                </Center>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                    <AnimatePresence>
                        {projects.map((project) => (
                            <MotionBox
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                p={8}
                                borderRadius="3xl"
                                bg="rgba(15, 23, 42, 1)"
                                border="1px solid"
                                borderColor="whiteAlpha.100"
                                transition="all 0.3s"
                                _hover={{
                                    borderColor: "cyan.400",
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 0 30px rgba(0, 210, 255, 0.1)"
                                }}
                            >
                                <Flex justify="space-between" align="start" mb={6}>
                                    <HStack spacing={4}>
                                        <Center
                                            w={12}
                                            h={12}
                                            borderRadius="2xl"
                                            bg="cyan.400"
                                            color="white"
                                            fontWeight="bold"
                                            fontSize="xl"
                                            boxShadow="0 0 20px rgba(0, 210, 255, 0.3)"
                                        >
                                            {project.title.charAt(0)}
                                        </Center>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="white" noOfLines={1}>
                                                {project.title}
                                            </Heading>
                                            <HStack spacing={2} divider={<Text color="gray.600">•</Text>}>
                                                <Text fontSize="sm" color="cyan.300" fontWeight="bold">
                                                    {project.group_name || 'No Group'}
                                                </Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    By {project.student_name}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </HStack>
                                    {project.teachers && project.teachers.length > 0 ? (
                                        <Badge
                                            colorScheme="purple"
                                            variant="subtle"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                            fontSize="xs"
                                            textTransform="uppercase"
                                            letterSpacing="wider"
                                        >
                                            Mentored by {project.teachers[0]} {project.teachers.length > 1 && `+${project.teachers.length - 1}`}
                                        </Badge>
                                    ) : (
                                        <Badge
                                            colorScheme="orange"
                                            variant="subtle"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                            fontSize="xs"
                                            textTransform="uppercase"
                                            letterSpacing="wider"
                                        >
                                            Unassigned
                                        </Badge>
                                    )}
                                </Flex>

                                <Box mb={8}>
                                    <Text color="gray.400" fontSize="sm" noOfLines={3} lineHeight="relaxed">
                                        {project.abstract_text}
                                    </Text>
                                </Box>

                                <VStack spacing={4} align="stretch">
                                    <Flex justify="space-between" align="center">
                                        <Text color="gray.500" fontSize="sm" fontWeight="medium">Development Progress</Text>
                                        <Text color="cyan.400" fontWeight="bold" fontSize="sm">{project.progress_percentage}%</Text>
                                    </Flex>
                                    <Progress
                                        value={project.progress_percentage}
                                        height="8px"
                                        borderRadius="full"
                                        bg="whiteAlpha.100"
                                        colorScheme="cyan"
                                        hasStripe
                                        isAnimated
                                    />
                                </VStack>

                                <Flex mt={8} pt={6} borderTop="1px solid" borderColor="whiteAlpha.100" justify="space-between" align="center">
                                    <Badge colorScheme="cyan" variant="solid" px={2} py={1} borderRadius="md" fontSize="2xs">
                                        {project.category}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        color="gray.400"
                                        size="sm"
                                        rightIcon={<Icon as={ExternalLink} />}
                                        _hover={{ color: "white", bg: "whiteAlpha.100" }}
                                        onClick={() => navigate(`/teacher/submissions/${project.submission_id}`)}
                                    >
                                        View Details
                                    </Button>
                                </Flex>
                            </MotionBox>
                        ))}
                    </AnimatePresence>
                </SimpleGrid>
            )
            }
        </VStack >
    );
};

export default UnappointedOngoingProjects;
