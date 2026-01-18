import React, { useState, useEffect } from 'react';
import api from '../config/api';
import {
    Box,
    Button,
    Flex,
    Heading,
    VStack,
    Text,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    useDisclosure,
    Badge,
    HStack,
    Spinner,
    SimpleGrid,
    Icon,
    Container,
    Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";

// --- Icons ---
const {
    Plus,
    Clock,
    FileText,
    Code,
    Image: ImageIcon,
    Users,
    ChevronRight,
} = Lucide;

// --- Motion Components ---
const MotionBox = motion(Box);

// --- Interfaces ---
interface Group {
    id: number;
    name: string;
}

interface Assignment {
    id: number;
    title: string;
    description: string;
    assignment_type: 'Code' | 'Diagram' | 'Report' | 'Other';
    duration_minutes: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    assigned_groups: number[];
}

interface Submission {
    id: number;
    submitted_by_username: string;
    submitted_at: string;
    file: string | null;
    text_content: string;
    ai_feedback: string | null;
    ai_score: number;
    ai_verified: boolean;
}

const TeacherAssignmentManager: React.FC = () => {
    // --- State ---
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Create Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'Code' | 'Diagram' | 'Report' | 'Other'>('Other');
    const [duration, setDuration] = useState(60);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    // Submissions State
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const {
        isOpen: isSubmissionsOpen,
        onOpen: onSubmissionsOpen,
        onClose: onSubmissionsClose,
    } = useDisclosure();
    const [selectedAssignmentTitle, setSelectedAssignmentTitle] = useState('');

    // --- Effects ---
    useEffect(() => {
        fetchData();
    }, []);

    // --- API Calls ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [assignRes, groupsRes] = await Promise.all([
                api.get('/assignments/list/'),
                api.get('/teacher/groups/'),
            ]);
            setAssignments(assignRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to load data', status: 'error', isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title || !description || selectedGroups.length === 0) {
            toast({ title: 'Please fill all fields', status: 'warning', isClosable: true });
            return;
        }
        setCreating(true);
        try {
            await api.post('/assignments/create/', {
                title,
                description,
                assignment_type: type,
                duration_minutes: duration,
                assigned_groups: selectedGroups.map(Number),
            });
            toast({ title: 'Assignment Created', status: 'success', isClosable: true });
            onClose();
            fetchData();
            // Reset Form
            setTitle('');
            setDescription('');
            setDuration(60);
            setSelectedGroups([]);
        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to create assignment', status: 'error', isClosable: true });
        } finally {
            setCreating(false);
        }
    };

    const viewSubmissions = async (assignmentId: number, assignmentTitle: string) => {
        setLoadingSubmissions(true);
        setSelectedAssignmentTitle(assignmentTitle);
        onSubmissionsOpen();
        try {
            const res = await api.get(`/assignments/${assignmentId}/submissions/`);
            setSubmissions(res.data);
        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to load submissions', status: 'error', isClosable: true });
        } finally {
            setLoadingSubmissions(false);
        }
    };

    // --- Helpers ---
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Code': return Code;
            case 'Diagram': return ImageIcon;
            case 'Report': return FileText;
            default: return Clock;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Code': return 'cyan.400';
            case 'Diagram': return 'purple.400';
            case 'Report': return 'orange.400';
            default: return 'gray.400';
        }
    };

    // --- Animation Variants ---
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <Box
            minH="100vh"
            bgGradient="linear(to-br, gray.900, #0f172a, #1e1b4b)"
            color="white"
            fontFamily="monospace"
            p={6}
        >
            <Container maxW="container.xl">
                {/* Header */}
                <Flex justify="space-between" align="center" mb={10}>
                    <VStack align="start" spacing={1}>
                        <Heading
                            size="xl"
                            bgGradient="linear(to-r, cyan.400, purple.400)"
                            bgClip="text"
                            letterSpacing="tight"
                        >
                            Assignment Command Center
                        </Heading>
                        <Text color="gray.400" fontSize="sm">
                            Manage timed tasks and review AI-verified submissions
                        </Text>
                    </VStack>
                    <Button
                        leftIcon={<Plus size={18} />}
                        colorScheme="cyan"
                        variant="solid"
                        size="lg"
                        onClick={onOpen}
                        boxShadow="0 0 15px rgba(0, 255, 255, 0.3)"
                        _hover={{ transform: 'scale(1.05)', boxShadow: '0 0 25px rgba(0, 255, 255, 0.5)' }}
                    >
                        New Assignment
                    </Button>
                </Flex>

                {/* Content */}
                {loading ? (
                    <Flex justify="center" align="center" h="50vh">
                        <Spinner size="xl" color="cyan.400" thickness="4px" speed="0.65s" emptyColor="gray.800" />
                    </Flex>
                ) : (
                    <MotionBox
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {assignments.length === 0 ? (
                            <Flex
                                direction="column"
                                align="center"
                                justify="center"
                                h="40vh"
                                bg="rgba(255,255,255,0.02)"
                                borderRadius="xl"
                                border="1px dashed"
                                borderColor="gray.700"
                            >
                                <Icon as={FileText} boxSize={12} color="gray.600" mb={4} />
                                <Text color="gray.500" fontSize="lg">No assignments deployed yet.</Text>
                                <Button mt={4} variant="link" color="cyan.400" onClick={onOpen}>Create your first one</Button>
                            </Flex>
                        ) : (
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                {assignments.map((assignment) => (
                                    <MotionBox
                                        key={assignment.id}
                                        variants={itemVariants}
                                        whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                                        bg="rgba(255, 255, 255, 0.03)"
                                        backdropFilter="blur(10px)"
                                        border="1px solid"
                                        borderColor="rgba(255, 255, 255, 0.08)"
                                        borderRadius="xl"
                                        overflow="hidden"
                                        position="relative"
                                    >
                                        {/* Status Strip */}
                                        <Box
                                            position="absolute"
                                            top={0}
                                            left={0}
                                            right={0}
                                            h="4px"
                                            bgGradient={assignment.is_active ? "linear(to-r, green.400, cyan.400)" : "linear(to-r, red.500, orange.500)"}
                                        />

                                        <Box p={6}>
                                            <Flex justify="space-between" align="start" mb={4}>
                                                <HStack spacing={3}>
                                                    <Flex
                                                        align="center"
                                                        justify="center"
                                                        w={10}
                                                        h={10}
                                                        borderRadius="lg"
                                                        bg={`${getTypeColor(assignment.assignment_type)}20`}
                                                        color={getTypeColor(assignment.assignment_type)}
                                                    >
                                                        <Icon as={getTypeIcon(assignment.assignment_type)} boxSize={5} />
                                                    </Flex>
                                                    <Box>
                                                        <Heading size="sm" color="white" noOfLines={1}>{assignment.title}</Heading>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {new Date(assignment.start_time).toLocaleDateString()}
                                                        </Text>
                                                    </Box>
                                                </HStack>
                                                <Badge
                                                    colorScheme={assignment.is_active ? 'green' : 'red'}
                                                    variant="subtle"
                                                    fontSize="0.6em"
                                                    px={2}
                                                    py={1}
                                                    borderRadius="full"
                                                >
                                                    {assignment.is_active ? 'ACTIVE' : 'EXPIRED'}
                                                </Badge>
                                            </Flex>

                                            <Text color="gray.400" fontSize="sm" noOfLines={3} mb={6} minH="4.5em">
                                                {assignment.description}
                                            </Text>

                                            <Divider borderColor="whiteAlpha.100" mb={4} />

                                            <Flex justify="space-between" align="center" fontSize="xs" color="gray.500" mb={4}>
                                                <HStack>
                                                    <Icon as={Clock} />
                                                    <Text>{assignment.duration_minutes}m</Text>
                                                </HStack>
                                                <HStack>
                                                    <Icon as={Users} />
                                                    <Text>{assignment.assigned_groups.length} Groups</Text>
                                                </HStack>
                                            </Flex>

                                            <Button
                                                w="full"
                                                size="sm"
                                                variant="outline"
                                                colorScheme="cyan"
                                                rightIcon={<ChevronRight size={14} />}
                                                onClick={() => viewSubmissions(assignment.id, assignment.title)}
                                                _hover={{ bg: 'cyan.400', color: 'gray.900', borderColor: 'cyan.400' }}
                                            >
                                                View Submissions
                                            </Button>
                                        </Box>
                                    </MotionBox>
                                ))}
                            </SimpleGrid>
                        )}
                    </MotionBox>
                )}

                {/* Create Assignment Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
                    <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
                    <ModalContent
                        bg="#1A202C"
                        borderColor="rgba(255,255,255,0.1)"
                        borderWidth="1px"
                        color="white"
                        boxShadow="0 0 40px rgba(0,0,0,0.8)"
                    >
                        <ModalHeader bgGradient="linear(to-r, gray.800, gray.900)" borderBottomWidth="1px" borderColor="whiteAlpha.100">
                            <HStack>
                                <Icon as={Plus} color="cyan.400" />
                                <Text>Deploy New Assignment</Text>
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={6}>
                            <VStack spacing={5}>
                                <FormControl isRequired>
                                    <FormLabel color="gray.400" fontSize="sm">Assignment Title</FormLabel>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., System Architecture Diagram"
                                        bg="blackAlpha.400"
                                        border="none"
                                        _focus={{ ring: 2, ringColor: 'cyan.400', bg: 'blackAlpha.600' }}
                                    />
                                </FormControl>

                                <HStack w="full" spacing={4}>
                                    <FormControl isRequired>
                                        <FormLabel color="gray.400" fontSize="sm">Type</FormLabel>
                                        <Select
                                            value={type}
                                            onChange={(e) => setType(e.target.value as any)}
                                            bg="blackAlpha.400"
                                            border="none"
                                            _focus={{ ring: 2, ringColor: 'cyan.400' }}
                                        >
                                            <option value="Code" style={{ color: 'black' }}>Code</option>
                                            <option value="Diagram" style={{ color: 'black' }}>Diagram</option>
                                            <option value="Report" style={{ color: 'black' }}>Report</option>
                                            <option value="Other" style={{ color: 'black' }}>Other</option>
                                        </Select>
                                    </FormControl>
                                    <FormControl isRequired>
                                        <FormLabel color="gray.400" fontSize="sm">Duration (Minutes)</FormLabel>
                                        <Input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            bg="blackAlpha.400"
                                            border="none"
                                            _focus={{ ring: 2, ringColor: 'cyan.400' }}
                                        />
                                    </FormControl>
                                </HStack>

                                <FormControl isRequired>
                                    <FormLabel color="gray.400" fontSize="sm">Instructions</FormLabel>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Detailed instructions for the students..."
                                        bg="blackAlpha.400"
                                        border="none"
                                        rows={4}
                                        _focus={{ ring: 2, ringColor: 'cyan.400', bg: 'blackAlpha.600' }}
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel color="gray.400" fontSize="sm">Target Groups (Hold Ctrl/Cmd to select multiple)</FormLabel>
                                    <Select
                                        multiple
                                        height="120px"
                                        value={selectedGroups}
                                        onChange={(e) => {
                                            const opts = Array.from(e.target.selectedOptions, (o) => o.value);
                                            setSelectedGroups(opts);
                                        }}
                                        bg="blackAlpha.400"
                                        border="none"
                                        _focus={{ ring: 2, ringColor: 'cyan.400' }}
                                    >
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id.toString()} style={{ color: 'black' }}>{g.name}</option>
                                        ))}
                                    </Select>
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        {selectedGroups.length} groups selected
                                    </Text>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter bg="blackAlpha.300">
                            <Button variant="ghost" mr={3} onClick={onClose} color="gray.400" _hover={{ color: 'white' }}>Cancel</Button>
                            <Button
                                colorScheme="cyan"
                                onClick={handleCreate}
                                isLoading={creating}
                                loadingText="Deploying..."
                                bgGradient="linear(to-r, cyan.500, blue.500)"
                                _hover={{ bgGradient: "linear(to-r, cyan.400, blue.400)" }}
                            >
                                Create & Notify Students
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Submissions Modal */}
                <Modal isOpen={isSubmissionsOpen} onClose={onSubmissionsClose} size="6xl" scrollBehavior="inside">
                    <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.800" />
                    <ModalContent
                        bg="#0f172a"
                        borderColor="rgba(255,255,255,0.1)"
                        borderWidth="1px"
                        color="white"
                        h="90vh"
                    >
                        <ModalHeader bg="gray.900" borderBottomWidth="1px" borderColor="whiteAlpha.100">
                            <Flex justify="space-between" align="center">
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" color="cyan.400" textTransform="uppercase" letterSpacing="wider">Submissions For</Text>
                                    <Heading size="md">{selectedAssignmentTitle}</Heading>
                                </VStack>
                                <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="md">
                                    {submissions.length} Submissions
                                </Badge>
                            </Flex>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody p={0} bg="blackAlpha.500">
                            {loadingSubmissions ? (
                                <Flex justify="center" align="center" h="full">
                                    <Spinner size="xl" color="cyan.400" />
                                </Flex>
                            ) : submissions.length === 0 ? (
                                <Flex direction="column" align="center" justify="center" h="full" color="gray.500">
                                    <Icon as={FileText} boxSize={16} mb={4} opacity={0.3} />
                                    <Text fontSize="xl">No submissions received yet.</Text>
                                </Flex>
                            ) : (
                                <Flex h="full">
                                    {/* List of Submissions (Left Panel) */}
                                    <Box w="350px" borderRight="1px solid" borderColor="whiteAlpha.100" overflowY="auto">
                                        {submissions.map((sub, idx) => (
                                            <Box
                                                key={idx}
                                                p={4}
                                                borderBottom="1px solid"
                                                borderColor="whiteAlpha.100"
                                                _hover={{ bg: 'whiteAlpha.50' }}
                                                cursor="pointer"
                                            >
                                                <Flex justify="space-between" mb={1}>
                                                    <Text fontWeight="bold" color="white">{sub.submitted_by_username}</Text>
                                                    <Text fontSize="xs" color="gray.500">{new Date(sub.submitted_at).toLocaleTimeString()}</Text>
                                                </Flex>
                                                <HStack spacing={2} mb={2}>
                                                    <Badge
                                                        colorScheme={sub.ai_verified ? 'green' : 'yellow'}
                                                        variant="outline"
                                                        fontSize="xs"
                                                    >
                                                        {sub.ai_verified ? 'VERIFIED' : 'PENDING'}
                                                    </Badge>
                                                    <Badge colorScheme="blue" variant="solid" fontSize="xs">
                                                        Score: {sub.ai_score}/10
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="xs" color="gray.400" noOfLines={1}>
                                                    {sub.file ? '📎 File Attached' : '📝 Text Submission'}
                                                </Text>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Detailed View (Right Panel - Grid) */}
                                    <Box flex={1} p={6} overflowY="auto">
                                        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
                                            {submissions.map((sub, idx) => (
                                                <MotionBox
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    bg="gray.800"
                                                    borderRadius="xl"
                                                    overflow="hidden"
                                                    border="1px solid"
                                                    borderColor="whiteAlpha.100"
                                                >
                                                    <Box p={4} bg="whiteAlpha.50" borderBottom="1px solid" borderColor="whiteAlpha.100">
                                                        <Flex justify="space-between" align="center">
                                                            <HStack>
                                                                <Icon as={Users} color="cyan.400" />
                                                                <Text fontWeight="bold">{sub.submitted_by_username}</Text>
                                                            </HStack>
                                                            <Text fontSize="xs" color="gray.400">
                                                                {new Date(sub.submitted_at).toLocaleString()}
                                                            </Text>
                                                        </Flex>
                                                    </Box>

                                                    <Box p={5}>
                                                        {/* Content Preview */}
                                                        <Box mb={4}>
                                                            <Text fontSize="xs" color="gray.500" mb={2} textTransform="uppercase">Submission Content</Text>
                                                            <Box
                                                                p={3}
                                                                bg="blackAlpha.400"
                                                                borderRadius="md"
                                                                maxH="150px"
                                                                overflowY="auto"
                                                                fontSize="sm"
                                                                fontFamily="monospace"
                                                            >
                                                                {sub.text_content || (
                                                                    <Text color="gray.500" fontStyle="italic">No text content provided.</Text>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* File Attachment */}
                                                        {sub.file && (
                                                            <Button
                                                                as="a"
                                                                href={sub.file.startsWith('http') ? sub.file : `http://127.0.0.1:8000${sub.file}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                                size="sm"
                                                                colorScheme="cyan"
                                                                variant="outline"
                                                                leftIcon={<Icon as={FileText} />}
                                                                w="full"
                                                                mb={4}
                                                            >
                                                                Download Attachment: {sub.file.split('/').pop()}
                                                            </Button>
                                                        )}

                                                        <Divider borderColor="whiteAlpha.100" mb={4} />

                                                        {/* AI Feedback Section */}
                                                        <Box>
                                                            <Flex align="center" mb={2}>
                                                                <Icon as={Code} color="purple.400" mr={2} />
                                                                <Text fontSize="sm" fontWeight="bold" color="purple.300">AI Analysis</Text>
                                                            </Flex>

                                                            <Box
                                                                p={4}
                                                                bg="rgba(128, 90, 213, 0.1)"
                                                                borderRadius="md"
                                                                borderLeft="3px solid"
                                                                borderColor="purple.400"
                                                            >
                                                                <HStack mb={2} spacing={4}>
                                                                    <VStack align="start" spacing={0}>
                                                                        <Text fontSize="xs" color="gray.400">Score</Text>
                                                                        <Text fontSize="lg" fontWeight="bold" color="white">{sub.ai_score}/10</Text>
                                                                    </VStack>
                                                                    <VStack align="start" spacing={0}>
                                                                        <Text fontSize="xs" color="gray.400">Status</Text>
                                                                        <Badge colorScheme={sub.ai_verified ? 'green' : 'red'}>
                                                                            {sub.ai_verified ? 'APPROVED' : 'NEEDS REVIEW'}
                                                                        </Badge>
                                                                    </VStack>
                                                                </HStack>
                                                                <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                                                                    {sub.ai_feedback || "No AI feedback available."}
                                                                </Text>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </MotionBox>
                                            ))}
                                        </SimpleGrid>
                                    </Box>
                                </Flex>
                            )}
                        </ModalBody>
                        <ModalFooter bg="gray.900" borderTopWidth="1px" borderColor="whiteAlpha.100">
                            <Button onClick={onSubmissionsClose} variant="ghost" color="gray.400">Close Manager</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Container>
        </Box>
    );
};

export default TeacherAssignmentManager;
