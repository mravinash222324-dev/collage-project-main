import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    VStack,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    Container,
    Button,
    Divider,
    Flex,
    HStack,
    Badge,
    Progress,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Code,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    SimpleGrid,
    Tooltip,
    Icon,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    BarChart,
    Shield,
    CheckCircle,
    AlertTriangle,
    Code as CodeIcon,
    Map,
    Activity,
    Terminal,
    Zap
} from "lucide-react";
import CheckpointList, { type Checkpoint } from './CheckpointList';
import ReactMarkdown from 'react-markdown';

// --- Motion Components ---
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 12 }
    },
    hover: {
        y: -5,
        boxShadow: "0px 10px 30px rgba(0, 255, 255, 0.2)",
        borderColor: "rgba(0, 255, 255, 0.5)",
        transition: { duration: 0.3 }
    }
};

// --- Interfaces ---
interface ProgressUpdate {
    id: number;
    author_username: string;
    update_text: string;
    ai_suggested_percentage: number;
    created_at: string;
    sentiment: "Positive" | "Negative" | "Neutral" | null;
    status: 'Pending' | 'Approved' | 'Rejected';
    ai_analysis_result: any;
}

// Checkpoint imported from CheckpointList

interface CodeReview {
    id: number;
    file_name: string;
    code_content: string;
    uploaded_at: string;
    security_score: number;
    quality_score: number;
    security_issues: string[];
    optimization_tips: string[];
    ai_feedback: string;
    student_username: string;
}

const getSentimentIcon = (sentiment: ProgressUpdate['sentiment']) => {
    if (sentiment === "Positive") return "😃";
    if (sentiment === "Negative") return "😕";
    if (sentiment === "Neutral") return "😐";
    return "";
};

const getScoreColor = (score: number) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'yellow';
    return 'red';
};

const TeacherProgressLog: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [logs, setLogs] = useState<ProgressUpdate[]>([]);
    const [codeReviews, setCodeReviews] = useState<CodeReview[]>([]);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const navigate = useNavigate();
    const topRef = React.useRef<HTMLDivElement>(null);

    const handleDecision = async (updateId: number, action: 'approve' | 'reject') => {
        setProcessingId(updateId);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `http://127.0.0.1:8000/progress-updates/${updateId}/decision/`,
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state to reflect change instantly
            setLogs(logs.map(log =>
                log.id === updateId ? { ...log, status: action === 'approve' ? 'Approved' : 'Rejected' as 'Approved' | 'Rejected' } : log
            ));
        } catch (e) {
            console.error("Decision failed", e);
            alert("Failed to process decision.");
        } finally {
            setProcessingId(null);
        }
    };

    // Theme Colors
    const bgGradient = "linear(to-br, gray.900, #0f172a, #1e1b4b)";
    const glassBg = "rgba(255, 255, 255, 0.03)";
    const glassBorder = "1px solid rgba(255, 255, 255, 0.08)";
    const accentColor = "cyan.400";
    const secondaryAccent = "purple.400";

    const [isReportOpen, setIsReportOpen] = useState(false);
    const [deepReport, setDeepReport] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

    const handleDeepDive = async () => {
        setGeneratingReport(true);
        try {
            const response = await axios.post('http://127.0.0.1:8001/generate-deep-report', {
                student_name: logs[0]?.author_username || "Student",
                project_title: "Project " + projectId,
                logs: logs.map(l => l.update_text),
                code_reviews: codeReviews,
                viva_history: []
            });
            setDeepReport(response.data.report_markdown);
            setIsReportOpen(true);
        } catch (e) {
            console.error(e);
            setError("Failed to generate AI Deep Report. Is the microservice running?");
        } finally {
            setGeneratingReport(false);
        }
    };

    useEffect(() => {
        if (!loading && topRef.current) {
            topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    }, [loading]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) { navigate('/'); return; }

                const logsResponse = await axios.get(
                    `http://127.0.0.1:8000/projects/${projectId}/progress-logs/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setLogs(logsResponse.data);

                try {
                    const cpResponse = await axios.get(
                        `http://127.0.0.1:8000/projects/${projectId}/checkpoints/`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setCheckpoints(cpResponse.data);
                } catch (e) {
                    console.error("Failed to fetch checkpoints", e);
                }

                const reviewsResponse = await axios.get(
                    `http://127.0.0.1:8000/projects/${projectId}/review-code/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const parsedReviews = Array.isArray(reviewsResponse.data)
                    ? reviewsResponse.data.map((review: any) => ({
                        ...review,
                        security_issues: typeof review.security_issues === 'string'
                            ? JSON.parse(review.security_issues)
                            : review.security_issues || [],
                        optimization_tips: typeof review.optimization_tips === 'string'
                            ? JSON.parse(review.optimization_tips)
                            : review.optimization_tips || [],
                    }))
                    : [];

                setCodeReviews(parsedReviews);
            } catch (err) {
                setError('Failed to load project data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchData();
        }
    }, [projectId, navigate]);


    if (loading) {
        return (
            <Flex minH="100vh" align="center" justify="center" bg="gray.900" color="white">
                <VStack spacing={4}>
                    <Spinner size="xl" color={accentColor} thickness="4px" speed="0.65s" />
                    <Text fontSize="xl" fontFamily="monospace" color={accentColor} css={{ animation: "pulse 2s infinite" }}>
                        INITIALIZING DATA STREAM...
                    </Text>
                </VStack>
            </Flex>
        );
    }

    return (
        <Box ref={topRef} minH="100vh" bgGradient={bgGradient} color="gray.100" py={8} overflowX="hidden">
            <Container maxW="container.xl">
                <MotionFlex
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    mb={8}
                    align="center"
                >
                    <Button
                        onClick={() => navigate(-1)}
                        leftIcon={<ArrowLeft />}
                        variant="ghost"
                        color={accentColor}
                        _hover={{ bg: 'whiteAlpha.100', transform: 'translateX(-5px)' }}
                        mr={4}
                    >
                        Back
                    </Button>
                    <VStack align="start" spacing={0}>
                        <Heading
                            size="lg"
                            bgGradient={`linear(to-r, ${accentColor}, ${secondaryAccent})`}
                            bgClip="text"
                            letterSpacing="tight"
                        >
                            PROJECT DASHBOARD
                        </Heading>
                        <Text fontSize="sm" color="gray.400" fontFamily="monospace">
                            ID: {projectId} // ACCESS LEVEL: TEACHER
                        </Text>
                    </VStack>
                    <Button
                        ml="auto"
                        leftIcon={<Zap size={18} />}
                        colorScheme="cyan"
                        variant="outline"
                        isLoading={generatingReport}
                        loadingText="Thinking..."
                        onClick={handleDeepDive}
                    >
                        AI Deep Dive
                    </Button>
                </MotionFlex>

                {error && (
                    <Alert status="error" variant="subtle" bg="red.900" color="red.200" borderRadius="md" mb={6} border="1px solid" borderColor="red.700">
                        <AlertIcon color="red.400" /> {error}
                    </Alert>
                )}

                {/* --- DEEP REPORT MODAL --- */}
                <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} size="4xl" scrollBehavior="inside">
                    <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
                    <ModalContent bg="gray.900" border="1px solid" borderColor="cyan.700" color="white">
                        <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.100">
                            <HStack>
                                <Icon as={Zap} color="cyan.400" />
                                <Text>AI Deep Dive Analysis</Text>
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody p={6}>
                            <Box className="markdown-body" sx={{
                                'h1, h2, h3': { color: 'cyan.300', mt: 4, mb: 2 },
                                'strong': { color: 'white' },
                                'ul': { pl: 4, mb: 4 },
                                'li': { mb: 1, color: 'gray.300' },
                                'p': { mb: 4, color: 'gray.300', lineHeight: 1.7 },
                                'code': { bg: 'blackAlpha.500', px: 1, borderRadius: 'sm', fontFamily: 'monospace', color: 'pink.300' }
                            }}>
                                <ReactMarkdown>{deepReport}</ReactMarkdown>
                            </Box>
                        </ModalBody>
                        <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100">
                            <Button colorScheme="cyan" mr={3} onClick={() => setIsReportOpen(false)}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <Tabs colorScheme="cyan" variant="line" isLazy>
                    <TabList borderBottom="1px solid" borderColor="whiteAlpha.200">
                        <Tab
                            _selected={{ color: accentColor, borderColor: accentColor, bg: 'whiteAlpha.50' }}
                            _hover={{ color: 'cyan.200' }}
                            color="gray.400"
                            fontWeight="bold"
                            px={6}
                            py={4}
                        >
                            <HStack><Map size={18} /><Text>Roadmap</Text></HStack>
                        </Tab>
                        <Tab
                            _selected={{ color: secondaryAccent, borderColor: secondaryAccent, bg: 'whiteAlpha.50' }}
                            _hover={{ color: 'purple.200' }}
                            color="gray.400"
                            fontWeight="bold"
                            px={6}
                            py={4}
                        >
                            <HStack>
                                <CodeIcon size={18} />
                                <Text>Code Reviews</Text>
                                <Badge ml={2} colorScheme="purple" variant="solid" borderRadius="full">{codeReviews.length}</Badge>
                            </HStack>
                        </Tab>
                        <Tab
                            _selected={{ color: 'green.400', borderColor: 'green.400', bg: 'whiteAlpha.50' }}
                            _hover={{ color: 'green.200' }}
                            color="gray.400"
                            fontWeight="bold"
                            px={6}
                            py={4}
                        >
                            <HStack>
                                <Activity size={18} />
                                <Text>Logs</Text>
                                <Badge ml={2} colorScheme="green" variant="solid" borderRadius="full">{logs.length}</Badge>
                            </HStack>
                        </Tab>
                    </TabList>

                    <TabPanels mt={6}>
                        {/* Roadmap Tab */}
                        <TabPanel p={0}>
                            <MotionBox
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                p={6}
                                bg={glassBg}
                                backdropFilter="blur(10px)"
                                borderRadius="xl"
                                border={glassBorder}
                                boxShadow="xl"
                            >
                                {checkpoints.length > 0 ? (
                                    <>
                                        <HStack mb={6} color="yellow.400">
                                            <Map />
                                            <Heading size="md" fontFamily="monospace">STUDENT_PROGRESS_ROADMAP</Heading>
                                        </HStack>
                                        <Box className="dark-theme-roadmap">
                                            <CheckpointList
                                                checkpoints={checkpoints}
                                                projectId={Number(projectId)}
                                                isTeacher={true}
                                            />
                                        </Box>
                                    </>
                                ) : (
                                    <VStack py={10} spacing={4}>
                                        <Map size={48} color="gray" opacity={0.5} />
                                        <Text color="gray.400">No roadmap data found.</Text>
                                    </VStack>
                                )}
                            </MotionBox>
                        </TabPanel>

                        {/* Code Reviews Tab */}
                        <TabPanel p={0}>
                            {codeReviews.length === 0 ? (
                                <Flex
                                    direction="column"
                                    align="center"
                                    justify="center"
                                    py={20}
                                    bg={glassBg}
                                    borderRadius="xl"
                                    border={glassBorder}
                                    borderStyle="dashed"
                                >
                                    <Terminal size={64} color="gray" opacity={0.3} />
                                    <Text color="gray.500" mt={4} fontSize="lg">No code submissions detected.</Text>
                                </Flex>
                            ) : (
                                <MotionBox variants={containerVariants} initial="hidden" animate="visible">
                                    <VStack spacing={6} align="stretch">
                                        {codeReviews.map((review) => (
                                            <MotionBox
                                                key={review.id}
                                                variants={itemVariants}
                                                whileHover="hover"
                                                p={6}
                                                bg="rgba(15, 23, 42, 0.6)"
                                                backdropFilter="blur(16px)"
                                                border={glassBorder}
                                                borderRadius="xl"
                                                position="relative"
                                                overflow="hidden"
                                            >
                                                {/* Decorative gradient blob */}
                                                <Box
                                                    position="absolute"
                                                    top="-50%"
                                                    right="-10%"
                                                    w="300px"
                                                    h="300px"
                                                    bgGradient={`radial(${secondaryAccent}, transparent)`}
                                                    opacity={0.1}
                                                    filter="blur(40px)"
                                                    pointerEvents="none"
                                                />

                                                <VStack align="stretch" spacing={5}>
                                                    {/* Header */}
                                                    <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                                                        <HStack>
                                                            <Icon as={Terminal} color={secondaryAccent} boxSize={5} />
                                                            <Text fontSize="lg" fontWeight="bold" color="white">
                                                                {review.file_name}
                                                            </Text>
                                                            <Badge colorScheme="purple" variant="outline" fontSize="xs">
                                                                {review.student_username}
                                                            </Badge>
                                                        </HStack>
                                                        <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                                                            {new Date(review.uploaded_at).toLocaleString()}
                                                        </Text>
                                                    </Flex>

                                                    {/* Scores */}
                                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                                        <Box>
                                                            <HStack mb={2} justify="space-between">
                                                                <HStack color="blue.300">
                                                                    <Shield size={16} />
                                                                    <Text fontSize="sm" fontWeight="bold">Security</Text>
                                                                </HStack>
                                                                <Text fontSize="sm" fontWeight="bold" color={getScoreColor(review.security_score) + ".300"}>
                                                                    {review.security_score}/10
                                                                </Text>
                                                            </HStack>
                                                            <Progress
                                                                value={review.security_score * 10}
                                                                size="sm"
                                                                colorScheme={getScoreColor(review.security_score)}
                                                                borderRadius="full"
                                                                bg="whiteAlpha.100"
                                                            />
                                                        </Box>
                                                        <Box>
                                                            <HStack mb={2} justify="space-between">
                                                                <HStack color="pink.300">
                                                                    <BarChart size={16} />
                                                                    <Text fontSize="sm" fontWeight="bold">Quality</Text>
                                                                </HStack>
                                                                <Text fontSize="sm" fontWeight="bold" color={getScoreColor(review.quality_score) + ".300"}>
                                                                    {review.quality_score}/10
                                                                </Text>
                                                            </HStack>
                                                            <Progress
                                                                value={review.quality_score * 10}
                                                                size="sm"
                                                                colorScheme={getScoreColor(review.quality_score)}
                                                                borderRadius="full"
                                                                bg="whiteAlpha.100"
                                                            />
                                                        </Box>
                                                    </SimpleGrid>

                                                    <Divider borderColor="whiteAlpha.100" />

                                                    {/* AI Feedback */}
                                                    <Box
                                                        p={4}
                                                        bg="blue.900"
                                                        borderRadius="md"
                                                        borderLeft="4px solid"
                                                        borderColor="blue.400"
                                                        backgroundColor="rgba(23, 25, 35, 0.4)"
                                                    >
                                                        <HStack mb={2}>
                                                            <Zap size={16} color="#63B3ED" />
                                                            <Text fontSize="sm" fontWeight="bold" color="blue.300">
                                                                AI Analysis
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                                                            {review.ai_feedback}
                                                        </Text>
                                                    </Box>

                                                    {/* Issues & Tips Grid */}
                                                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                                                        {review.security_issues?.length > 0 && (
                                                            <Box
                                                                p={4}
                                                                bg="rgba(155, 44, 44, 0.2)"
                                                                borderRadius="md"
                                                                border="1px solid"
                                                                borderColor="red.900"
                                                            >
                                                                <HStack mb={3}>
                                                                    <AlertTriangle size={16} color="#FC8181" />
                                                                    <Text fontSize="sm" fontWeight="bold" color="red.300">Security Concerns</Text>
                                                                </HStack>
                                                                <VStack align="start" spacing={2}>
                                                                    {review.security_issues.map((issue, idx) => (
                                                                        <HStack key={idx} align="start">
                                                                            <Text color="red.500" fontSize="xs">•</Text>
                                                                            <Text fontSize="xs" color="gray.400">{issue}</Text>
                                                                        </HStack>
                                                                    ))}
                                                                </VStack>
                                                            </Box>
                                                        )}

                                                        {review.optimization_tips?.length > 0 && (
                                                            <Box
                                                                p={4}
                                                                bg="rgba(39, 103, 73, 0.2)"
                                                                borderRadius="md"
                                                                border="1px solid"
                                                                borderColor="green.900"
                                                            >
                                                                <HStack mb={3}>
                                                                    <CheckCircle size={16} color="#68D391" />
                                                                    <Text fontSize="sm" fontWeight="bold" color="green.300">Optimization</Text>
                                                                </HStack>
                                                                <VStack align="start" spacing={2}>
                                                                    {review.optimization_tips.map((tip, idx) => (
                                                                        <HStack key={idx} align="start">
                                                                            <Text color="green.500" fontSize="xs">✓</Text>
                                                                            <Text fontSize="xs" color="gray.400">{tip}</Text>
                                                                        </HStack>
                                                                    ))}
                                                                </VStack>
                                                            </Box>
                                                        )}
                                                    </SimpleGrid>

                                                    {/* Code Preview */}
                                                    <Accordion allowToggle>
                                                        <AccordionItem border="none">
                                                            <AccordionButton
                                                                bg="whiteAlpha.100"
                                                                _hover={{ bg: 'whiteAlpha.200' }}
                                                                borderRadius="md"
                                                                color="gray.300"
                                                            >
                                                                <Box flex="1" textAlign="left" fontSize="sm">
                                                                    View Source Code
                                                                </Box>
                                                                <AccordionIcon />
                                                            </AccordionButton>
                                                            <AccordionPanel pb={4} pt={4}>
                                                                <Box
                                                                    position="relative"
                                                                    borderRadius="md"
                                                                    overflow="hidden"
                                                                    border="1px solid"
                                                                    borderColor="whiteAlpha.200"
                                                                >
                                                                    <Box bg="gray.800" px={4} py={2} borderBottom="1px solid" borderColor="whiteAlpha.100">
                                                                        <HStack spacing={2}>
                                                                            <Box w={3} h={3} borderRadius="full" bg="red.500" />
                                                                            <Box w={3} h={3} borderRadius="full" bg="yellow.500" />
                                                                            <Box w={3} h={3} borderRadius="full" bg="green.500" />
                                                                        </HStack>
                                                                    </Box>
                                                                    <Code
                                                                        display="block"
                                                                        whiteSpace="pre-wrap"
                                                                        p={4}
                                                                        bg="gray.900"
                                                                        color="green.300"
                                                                        fontSize="xs"
                                                                        fontFamily="monospace"
                                                                        overflowX="auto"
                                                                        minH="100px"
                                                                    >
                                                                        {review.code_content || "// No code content available for this review."}
                                                                    </Code>
                                                                </Box>
                                                            </AccordionPanel>
                                                        </AccordionItem>
                                                    </Accordion>
                                                </VStack>
                                            </MotionBox>
                                        ))}
                                    </VStack>
                                </MotionBox>
                            )}
                        </TabPanel>

                        {/* Legacy Logs Tab */}
                        <TabPanel p={0}>
                            {logs.length === 0 ? (
                                <Flex
                                    direction="column"
                                    align="center"
                                    justify="center"
                                    py={20}
                                    bg={glassBg}
                                    borderRadius="xl"
                                    border={glassBorder}
                                    borderStyle="dashed"
                                >
                                    <Activity size={64} color="gray" opacity={0.3} />
                                    <Text color="gray.500" mt={4} fontSize="lg">No activity logs found.</Text>
                                </Flex>
                            ) : (
                                <MotionBox variants={containerVariants} initial="hidden" animate="visible">
                                    <VStack spacing={6} align="stretch" position="relative">
                                        {/* Timeline Line */}
                                        <Box
                                            position="absolute"
                                            left="24px"
                                            top="0"
                                            bottom="0"
                                            w="2px"
                                            bgGradient={`linear(to-b, ${accentColor}, transparent)`}
                                            zIndex={0}
                                            display={{ base: 'none', md: 'block' }}
                                        />

                                        {logs.map((log) => (
                                            <MotionBox
                                                key={log.id}
                                                variants={itemVariants}
                                                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                                                pl={{ base: 0, md: 16 }}
                                                position="relative"
                                            >
                                                {/* Timeline Dot */}
                                                <Box
                                                    position="absolute"
                                                    left="19px"
                                                    top="24px"
                                                    w="12px"
                                                    h="12px"
                                                    borderRadius="full"
                                                    bg={accentColor}
                                                    boxShadow={`0 0 10px ${accentColor}`}
                                                    zIndex={1}
                                                    display={{ base: 'none', md: 'block' }}
                                                />

                                                <Box
                                                    p={5}
                                                    bg="rgba(255, 255, 255, 0.05)"
                                                    backdropFilter="blur(10px)"
                                                    border="1px solid rgba(255, 255, 255, 0.1)"
                                                    borderRadius="lg"
                                                    _hover={{ borderColor: accentColor }}
                                                    transition="all 0.3s"
                                                >
                                                    <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                                                        <HStack color={accentColor}>
                                                            <Calendar size={16} />
                                                            <Text fontWeight="bold" fontSize="sm">
                                                                {new Date(log.created_at).toLocaleString()}
                                                            </Text>
                                                        </HStack>
                                                        <HStack>
                                                            <Tooltip label={`Sentiment: ${log.sentiment}`}>
                                                                <Text fontSize="xl" cursor="help">
                                                                    {getSentimentIcon(log.sentiment)}
                                                                </Text>
                                                            </Tooltip>
                                                            <Badge
                                                                colorScheme="green"
                                                                variant="solid"
                                                                fontSize="xs"
                                                                px={2}
                                                                py={1}
                                                                borderRadius="md"
                                                                bgGradient="linear(to-r, green.500, green.400)"
                                                            >
                                                                AI Progress: {log.ai_suggested_percentage}%
                                                            </Badge>
                                                            <Badge
                                                                colorScheme={log.status === 'Approved' ? 'green' : log.status === 'Rejected' ? 'red' : 'yellow'}
                                                                variant="subtle"
                                                                fontSize="xs"
                                                                px={2} py={1} borderRadius="md"
                                                            >
                                                                {log.status || 'Pending'}
                                                            </Badge>
                                                        </HStack>
                                                    </Flex>

                                                    <Divider borderColor="whiteAlpha.100" my={3} />

                                                    <Text fontWeight="bold" color="gray.300" mb={2} fontSize="sm">
                                                        Student: {log.author_username}
                                                    </Text>
                                                    <Box
                                                        p={4}
                                                        bg="blackAlpha.400"
                                                        borderRadius="md"
                                                        borderLeft="2px solid"
                                                        borderColor="whiteAlpha.300"
                                                    >
                                                        <Text color="gray.400" fontSize="xs" mb={1} fontFamily="monospace" textTransform="uppercase">
                                                            Proof / Activity:
                                                        </Text>
                                                        <Code
                                                            display="block"
                                                            whiteSpace="pre-wrap"
                                                            p={3}
                                                            bg="blackAlpha.600"
                                                            color="cyan.200"
                                                            fontSize="xs"
                                                            fontFamily="monospace"
                                                            borderRadius="md"
                                                        >
                                                            {log.update_text}
                                                        </Code>
                                                    </Box>

                                                    {/* AI Analysis & Decision Block */}
                                                    {(log.status === 'Pending' || log.ai_analysis_result) && (
                                                        <Box mt={4} p={4} bg="rgba(0, 0, 0, 0.3)" borderRadius="md" border="1px dashed" borderColor={log.status === 'Pending' ? "yellow.600" : "whiteAlpha.200"}>
                                                            <HStack mb={2}>
                                                                <Zap size={16} color={log.status === 'Pending' ? "yellow" : "gray"} />
                                                                <Text fontWeight="bold" color={log.status === 'Pending' ? "yellow.300" : "gray.400"} fontSize="sm">
                                                                    AI Verification Analysis
                                                                </Text>
                                                            </HStack>
                                                            <Box className="markdown-body" fontSize="sm" sx={{
                                                                'p': { color: 'gray.400', mb: 2 },
                                                                'strong': { color: 'gray.200' },
                                                                'ul': { pl: 4, mb: 2 },
                                                                'li': { color: 'gray.400' }
                                                            }}>
                                                                <ReactMarkdown>
                                                                    {log.ai_analysis_result?.feedback || "No AI feedback recorded."}
                                                                </ReactMarkdown>
                                                            </Box>

                                                            {log.status === 'Pending' && (
                                                                <HStack spacing={4}>
                                                                    <Button
                                                                        size="sm"
                                                                        colorScheme="green"
                                                                        isLoading={processingId === log.id}
                                                                        onClick={() => handleDecision(log.id, 'approve')}
                                                                        leftIcon={<CheckCircle size={14} />}
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        colorScheme="red"
                                                                        variant="outline"
                                                                        isLoading={processingId === log.id}
                                                                        onClick={() => handleDecision(log.id, 'reject')}
                                                                        leftIcon={<AlertTriangle size={14} />}
                                                                        _hover={{ bg: 'red.900' }}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </HStack>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </MotionBox>
                                        ))}
                                    </VStack>
                                </MotionBox>
                            )}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Container>
        </Box >
    );
};

export default TeacherProgressLog;
