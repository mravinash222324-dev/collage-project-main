// frontend/src/components/ProjectSubmissionNew.tsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    VStack,
    Heading,
    Input,
    Textarea,
    Button,
    FormControl,
    FormLabel,
    Alert,
    AlertIcon,
    Text,
    useToast,
    Container,
    HStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Badge,
    Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';

const { FileText, Send, AlertTriangle, Star, Zap } = Lucide;

const MotionBox = motion(Box);

interface SimilarProject {
    title: string;
    abstract_text: string;
    student: string;
}

interface AiReport {
    detail: string;
    suggestions: string;
    similar_project: SimilarProject | null;
    relevance_score: number;
    feasibility_score: number;
    innovation_score: number;
}

interface AlumniProject {
    id: number;
    title: string;
    student_name: string;
    innovation_score: number;
    abstract: string;
    // status: string; // available if needed
}

const ProjectSubmission: React.FC = () => {
    // Form state
    const [title, setTitle] = useState('');
    const [abstractText, setAbstractText] = useState('');
    const [abstractFile, setAbstractFile] = useState<File | null>(null);



    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState('');
    const [alumniProjects, setAlumniProjects] = useState<AlumniProject[]>([]);

    // --- (NEW) State for 2-Stage Submit ---
    const { isOpen, onOpen, onClose } = useDisclosure(); // For the modal
    const [aiReport, setAiReport] = useState<AiReport | null>(null);
    // We use a ref to hold the FormData to avoid state update issues
    const formDataRef = useRef<FormData | null>(null);

    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        fetchAlumniProjects();
    }, []);

    const fetchAlumniProjects = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/alumni/top-projects/');
            setAlumniProjects(response.data);
        } catch (err) {
            console.error("Failed to fetch alumni projects", err);
        }
    };

    // --- (UPDATED) This is Stage 3: Force Submit ---
    const handleForceSubmit = async () => {
        if (!formDataRef.current || !aiReport) return;

        setIsSubmitting(true);
        onClose(); // Close the modal

        // Add the new 'force' and AI data to the form
        formDataRef.current.append('force_submit', 'true');
        formDataRef.current.append('ai_suggested_features', aiReport.suggestions || 'None');
        formDataRef.current.append(
            'ai_similarity_report',
            aiReport.similar_project ? JSON.stringify(aiReport.similar_project) : 'null'
        );

        formDataRef.current.append('relevance_score', aiReport.relevance_score.toString());
        formDataRef.current.append('feasibility_score', aiReport.feasibility_score.toString());
        formDataRef.current.append('innovation_score', aiReport.innovation_score.toString());

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post('http://127.0.0.1:8000/projects/submit/', formDataRef.current, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast({
                title: 'Submission Acknowledged!',
                description: "Your project was submitted with the AI's feedback. Your teacher will review it.",
                status: 'success',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            setTimeout(() => navigate('/student-dashboard'), 2000);

        } catch (err: any) {
            setError('Submission failed. Please try again later.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
            formDataRef.current = null;
        }
    };

    // --- (MODIFIED) This is Stage 1: Analyze ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAiReport(null);
        formDataRef.current = null;

        if (!title.trim() || !abstractText.trim()) {
            setError('Project Title and Abstract are required.');
            return;
        }

        // Feature: Minimum Semantic Length Check
        const wordCount = abstractText.trim().split(/\s+/).length;
        if (wordCount < 50) {
            setError(`Abstract is too short (${wordCount} words). Please provide at least 50 words for accurate AI analysis.`);
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('abstract_text', abstractText);
        if (abstractFile) formData.append('abstract_file', abstractFile);


        formDataRef.current = formData;

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/');
                return;
            }

            await axios.post('http://127.0.0.1:8000/projects/submit/', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast({
                title: 'Submission Successful!',
                description: 'Your project (Original Idea) has been sent for review.',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            setTimeout(() => navigate('/student-dashboard'), 2000);

        } catch (err: any) {
            if (err.response && err.response.status === 409) {
                setAiReport(err.response.data);
                onOpen();
            } else if (err.response && err.response.status === 429) {
                setError(err.response.data.detail || 'AI Analyzer is busy. Please try again in one minute.');
            } else if (err.response && err.response.data) {
                const backendError = err.response.data.error || err.response.data.detail;
                if (backendError) {
                    setError(backendError);
                } else {
                    // Handle serializer field errors
                    try {
                        const firstField = Object.keys(err.response.data)[0];
                        const firstMsg = err.response.data[firstField];
                        if (firstMsg && Array.isArray(firstMsg)) {
                            setError(`${firstField}: ${firstMsg[0]}`);
                        } else {
                            setError('Submission failed. Please check your inputs and try again.');
                        }
                    } catch (e) {
                        setError('Submission failed. Please check your inputs and try again.');
                    }
                }
                console.error("Submission Error:", err.response.data);
            } else {
                setError('Submission failed. Please check your inputs and try again.');
                console.error(err);
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        setAbstractFile(file);

        if (file) {
            // Auto-extract info
            setIsExtracting(true);
            const extractFormData = new FormData();
            extractFormData.append('file', file);

            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.post('http://127.0.0.1:8000/projects/extract-info/', extractFormData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.title) setTitle(response.data.title);

                let newAbstract = response.data.abstract || "";
                if (response.data.tech_stack && response.data.tech_stack.length > 0) {
                    newAbstract += "\n\n**Tech Stack:** " + response.data.tech_stack.join(", ");
                }
                if (response.data.tools && response.data.tools.length > 0) {
                    newAbstract += "\n**Tools:** " + response.data.tools.join(", ");
                }
                setAbstractText(newAbstract);

                toast({
                    title: 'Auto-Filled!',
                    description: 'Extracted Title and Abstract from your document.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                    position: 'top'
                });

            } catch (err) {
                console.error("Extraction failed", err);
                toast({
                    title: 'Extraction Failed',
                    description: 'Could not auto-fill details. Please enter manually.',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true
                });
            } finally {
                setIsExtracting(false);
            }
        }
    };

    const inputStyles = {
        bg: "rgba(0,0,0,0.2)",
        color: "white",
        borderColor: "whiteAlpha.200",
        _hover: { borderColor: 'cyan.400', bg: "whiteAlpha.100" },
        _focus: { borderColor: 'cyan.300', boxShadow: '0 0 0 1px cyan', bg: "whiteAlpha.100" },
        borderRadius: "xl",
        py: 6
    };

    // Prepare alumni project elements
    // Fixed: Correctly accessing properties from AlumniProjectSerializer
    const alumniProjectElements = alumniProjects.slice(0, 3).map((project) => (
        <MotionBox
            key={project.id}
            className="glass-card"
            p={5}
            whileHover={{ scale: 1.02, borderColor: 'orange.400' }}
            border="1px solid"
            borderColor="whiteAlpha.100"
            bg="rgba(0,0,0,0.3)"
        >
            <HStack justify="space-between" mb={2}>
                <Badge colorScheme="orange" variant="solid" borderRadius="full" px={2}>
                    <HStack spacing={1}>
                        <Star size={10} />
                        <Text>{project.innovation_score?.toFixed(1) || 'N/A'}</Text>
                    </HStack>
                </Badge>
                {/* submitted_at is not in serializer, so we omit year or fetch it if needed */}
                <Text fontSize="xs" color="gray.500">Alumni</Text>
            </HStack>
            <Heading size="sm" color="white" mb={2} noOfLines={2}>{project.title}</Heading>
            <Text fontSize="xs" color="gray.400" mb={3}>by {project.student_name}</Text>
            <Text fontSize="sm" color="gray.300" noOfLines={3}>{project.abstract}</Text>
        </MotionBox>
    ));

    return (
        <Layout userRole="Student">
            <Container maxW="container.xl" py={{ base: 6, md: 10 }}>

                <Flex direction={{ base: 'column', lg: 'row' }} gap={8}>
                    {/* LEFT COLUMN: Submission Form */}
                    <Box flex="2">
                        <MotionBox
                            bg="rgba(10, 15, 40, 0.6)"
                            border="1px solid rgba(255, 255, 255, 0.1)"
                            borderRadius="3xl"
                            boxShadow="0 0 80px rgba(0, 255, 255, 0.1)"
                            backdropFilter="blur(20px)"
                            p={{ base: 6, md: 10 }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="glass-card"
                        >
                            <VStack as="form" onSubmit={handleSubmit} spacing={6} align="stretch">
                                <Box mb={4}>
                                    <Heading as="h1" size="xl" bgGradient="linear(to-r, cyan.400, blue.400)" bgClip="text" fontWeight="extrabold">
                                        Submit New Project
                                    </Heading>
                                    <Text color="gray.400" mt={2}>Pitch your idea to the AI committee for approval.</Text>
                                </Box>

                                {error && (
                                    <Alert status="error" borderRadius="xl" bg="rgba(255,0,0,0.1)" border="1px solid rgba(255,0,0,0.3)">
                                        <AlertIcon color="red.300" />{error}
                                    </Alert>
                                )}

                                <FormControl isRequired>
                                    <FormLabel color="cyan.200" fontWeight="bold">Project Title</FormLabel>
                                    <Input placeholder="e.g., AI-Powered Traffic Management System" value={title} onChange={(e) => setTitle(e.target.value)} {...inputStyles} />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel color="cyan.200" fontWeight="bold">Abstract (Text)</FormLabel>
                                    <Textarea
                                        placeholder="Describe your project's goals, methods, and technologies..."
                                        rows={8}
                                        value={abstractText}
                                        onChange={(e) => setAbstractText(e.target.value)}
                                        {...inputStyles}
                                        py={4}
                                    />
                                </FormControl>



                                <FormControl>
                                    <HStack justify="space-between">
                                        <FormLabel color="cyan.200" fontWeight="bold">Upload Abstract (PDF/PPT)</FormLabel>
                                        {isExtracting && <Text fontSize="xs" color="cyan.400">AI Extracting info...</Text>}
                                    </HStack>
                                    <Box
                                        border="2px dashed"
                                        borderColor={isExtracting ? "cyan.400" : "whiteAlpha.300"}
                                        borderRadius="xl"
                                        p={6}
                                        textAlign="center"
                                        _hover={{ borderColor: 'cyan.400', bg: 'whiteAlpha.05' }}
                                        cursor="pointer"
                                        position="relative"
                                        opacity={isExtracting ? 0.7 : 1}
                                    >
                                        <Input
                                            type="file"
                                            name="abstract_file"
                                            accept=".pdf,.ppt,.pptx"
                                            onChange={handleFileChange}
                                            opacity={0}
                                            position="absolute"
                                            top={0}
                                            left={0}
                                            w="full"
                                            h="full"
                                            cursor="pointer"
                                            disabled={isExtracting}
                                        />
                                        <VStack spacing={2}>
                                            <FileText size={32} color={abstractFile ? "#48BB78" : "#A0AEC0"} />
                                            <Text color={abstractFile ? "green.300" : "gray.400"} fontSize="sm">
                                                {abstractFile ? abstractFile.name : (isExtracting ? "Analyzing Document..." : "Click to upload PDF or PPT")}
                                            </Text>
                                        </VStack>
                                    </Box>
                                </FormControl>

                                <Button
                                    type="submit"
                                    size="lg"
                                    mt={4}
                                    h="60px"
                                    isLoading={isSubmitting}
                                    loadingText="AI Analyzing..."
                                    bgGradient="linear(to-r, cyan.500, blue.600)"
                                    color="white"
                                    leftIcon={<Send size={20} />}
                                    _hover={{
                                        bgGradient: "linear(to-r, cyan.400, blue.500)",
                                        boxShadow: "0 0 25px rgba(0,255,255,0.4)",
                                        transform: 'translateY(-2px)'
                                    }}
                                    transition="all 0.3s ease"
                                    fontSize="lg"
                                    borderRadius="xl"
                                >
                                    {isSubmitting ? 'Analyzing...' : 'Analyze & Submit Idea'}
                                </Button>
                            </VStack>
                        </MotionBox>
                    </Box>

                    {/* RIGHT COLUMN: Top Alumni Projects */}
                    <Box flex="1">
                        <MotionBox
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <HStack mb={6} spacing={3}>
                                <Box p={2} bg="orange.500" borderRadius="lg" boxShadow="0 0 15px orange">
                                    <Star size={24} color="white" />
                                </Box>
                                <Heading size="lg" color="orange.300">Top Alumni Projects</Heading>
                            </HStack>

                            <VStack spacing={4} align="stretch">
                                {alumniProjects.length === 0 ? (
                                    <Text color="gray.500">No alumni projects found.</Text>
                                ) : (
                                    alumniProjectElements
                                )}
                                <Button
                                    variant="outline"
                                    colorScheme="orange"
                                    w="full"
                                    mt={2}
                                    onClick={() => navigate('/top-projects')}
                                    _hover={{ bg: 'orange.900', borderColor: 'orange.400' }}
                                >
                                    View All Alumni Projects
                                </Button>
                            </VStack>

                            <Box mt={8} p={6} bg="blue.900" borderRadius="2xl" border="1px dashed" borderColor="blue.500">
                                <HStack mb={3}>
                                    <Zap size={24} color="#63B3ED" />
                                    <Heading size="md" color="blue.300">Tip for Success</Heading>
                                </HStack>
                                <Text color="blue.100" fontSize="sm">
                                    Projects with high innovation scores often solve real-world problems using unique approaches. Check out the alumni projects above for inspiration!
                                </Text>
                            </Box>
                        </MotionBox>
                    </Box>
                </Flex>

            </Container>

            {/* --- CONFIRMATION MODAL --- */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered motionPreset="slideInBottom">
                <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(12px)" />
                <ModalContent
                    bg="rgba(20, 20, 26, 0.95)"
                    border="1px solid"
                    borderColor="orange.500"
                    boxShadow="0 0 50px rgba(237, 137, 54, 0.2)"
                    borderRadius="2xl"
                    overflow="hidden"
                >
                    <Box
                        bgGradient="linear(to-r, orange.900, red.900)"
                        h="8px"
                        w="full"
                    />

                    <ModalHeader pt={6} pb={0}>
                        <HStack spacing={4} align="center">
                            <Box
                                p={3}
                                bg="rgba(237, 137, 54, 0.2)"
                                borderRadius="full"
                                border="1px solid"
                                borderColor="orange.400"
                            >
                                <AlertTriangle size={28} color="#ED8936" />
                            </Box>
                            <Box>
                                <Heading size="md" color="white" mb={1}>
                                    High Similarity Detected
                                </Heading>
                                <Text fontSize="sm" color="orange.200">
                                    Our AI found a significant match with an existing project.
                                </Text>
                            </Box>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton color="gray.400" mt={2} />

                    <ModalBody py={6}>
                        <VStack spacing={6} align="stretch">

                            {/* Similar Project Card */}
                            {aiReport?.similar_project && (
                                <Box
                                    p={5}
                                    bg="rgba(255, 255, 255, 0.03)"
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor="whiteAlpha.100"
                                >
                                    <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={3} textTransform="uppercase" letterSpacing="wider">
                                        Most Similar Project
                                    </Text>
                                    <HStack justify="space-between" align="start">
                                        <Box>
                                            <Heading size="sm" color="white" mb={1}>
                                                {aiReport.similar_project.title}
                                            </Heading>
                                            <Text fontSize="sm" color="cyan.400">
                                                by {aiReport.similar_project.student}
                                            </Text>
                                        </Box>
                                        <Badge colorScheme="orange" variant="solid" fontSize="0.7em" px={2} py={1} borderRadius="md">
                                            MATCH FOUND
                                        </Badge>
                                    </HStack>
                                </Box>
                            )}

                            {/* AI Suggestions */}
                            {aiReport?.suggestions && (
                                <Box>
                                    <HStack mb={2}>
                                        <Zap size={16} color="#FBD38D" />
                                        <Text color="orange.200" fontWeight="bold" fontSize="sm">
                                            AI Suggestions for Uniqueness
                                        </Text>
                                    </HStack>
                                    <Box
                                        p={4}
                                        bg="orange.900"
                                        borderRadius="xl"
                                        borderLeft="4px solid"
                                        borderColor="orange.500"
                                        style={{ backgroundColor: 'rgba(237, 137, 54, 0.1)' }}
                                    >
                                        <Text color="orange.50" fontSize="sm" lineHeight="tall">
                                            {aiReport.suggestions}
                                        </Text>
                                    </Box>
                                </Box>
                            )}

                            {/* Scores Grid */}
                            {aiReport && (
                                <Box>
                                    <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={3} textTransform="uppercase" letterSpacing="wider">
                                        AI Evaluation Scores
                                    </Text>
                                    <HStack spacing={4}>
                                        {['Relevance', 'Feasibility', 'Innovation'].map((metric) => {
                                            const score = metric === 'Relevance' ? aiReport.relevance_score :
                                                metric === 'Feasibility' ? aiReport.feasibility_score :
                                                    aiReport.innovation_score;
                                            const color = score >= 8 ? "green" : score >= 5 ? "yellow" : "red";
                                            return (
                                                <Box key={metric} flex="1" bg="whiteAlpha.05" p={3} borderRadius="lg" textAlign="center">
                                                    <Text fontSize="2xl" fontWeight="bold" color={`${color}.400`}>{score}</Text>
                                                    <Text fontSize="xs" color="gray.500">{metric}</Text>
                                                </Box>
                                            )
                                        })}
                                    </HStack>
                                </Box>
                            )}
                        </VStack>
                    </ModalBody>

                    <ModalFooter bg="rgba(0,0,0,0.2)" p={6}>
                        <VStack w="full" spacing={3}>
                            <Text fontSize="sm" color="gray.400" textAlign="center" mb={2}>
                                ⚠️ Submitting this may result in rejection if not sufficiently unique.
                            </Text>
                            <HStack w="full" spacing={4}>
                                <Button onClick={onClose} variant="ghost" colorScheme="gray" w="full">
                                    Back to Edit
                                </Button>
                                <Button
                                    onClick={handleForceSubmit}
                                    bgGradient="linear(to-r, orange.500, red.600)"
                                    _hover={{ bgGradient: "linear(to-r, orange.400, red.500)" }}
                                    color="white"
                                    w="full"
                                    isLoading={isSubmitting}
                                >
                                    Proceed Anyway
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Layout>
    );
};

export default ProjectSubmission;
