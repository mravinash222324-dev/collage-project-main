// frontend/src/components/CodeReview.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    Spinner,
    Alert,
    AlertIcon,
    useToast,
    FormControl,
    FormLabel,
    Input,
    Flex,
    Container,
    Badge,
    Center,
    Textarea,
    Progress,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Code,
    Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';

const { Upload, CheckCircle, AlertTriangle, Code: CodeIcon, ArrowLeft, FileCode, Shield, Zap, Wand2 } = Lucide;
import RefactorPreview from './RefactorPreview';

const MotionBox = motion(Box);

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

const CodeReview: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [reviews, setReviews] = useState<CodeReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [codeContent, setCodeContent] = useState('');
    const [error, setError] = useState('');

    // Refactor State
    const [isRefactorOpen, setIsRefactorOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<CodeReview | null>(null);
    const [refactoredCode, setRefactoredCode] = useState('');
    const [isRefactoring, setIsRefactoring] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [projectId]);

    const fetchReviews = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/');
                return;
            }

            const response = await axios.get(
                `http://127.0.0.1:8000/projects/${projectId}/review-code/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = Array.isArray(response.data) ? response.data : [];

            // Parse JSON strings for arrays
            const parsedData = data.map((review: any) => ({
                ...review,
                security_issues: typeof review.security_issues === 'string'
                    ? JSON.parse(review.security_issues)
                    : review.security_issues || [],
                optimization_tips: typeof review.optimization_tips === 'string'
                    ? JSON.parse(review.optimization_tips)
                    : review.optimization_tips || [],
            }));

            setReviews(parsedData);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to fetch code reviews.');
            console.error('Fetch Reviews Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitCode = async () => {
        if (!fileName.trim() || !codeContent.trim()) {
            toast({
                title: 'Input Required',
                description: 'Please provide both file name and code content.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setUploading(true);

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('No token');

            await axios.post(
                `http://127.0.0.1:8000/projects/${projectId}/review-code/`,
                {
                    file_name: fileName,
                    code_content: codeContent,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: 'Code Submitted!',
                description: 'AI is analyzing your code...',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            setFileName('');
            setCodeContent('');
            await fetchReviews();
        } catch (err: any) {
            toast({
                title: 'Submission Failed',
                description: err?.response?.data?.error || 'Could not submit code for review.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
            console.error('Code Submit Error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleRefactor = async (review: CodeReview) => {
        setIsRefactoring(true);
        setSelectedReview(review);
        try {
            // Call AI Microservice directly
            const response = await axios.post('http://127.0.0.1:8001/generate-refactor', {
                code: review.code_content,
                file_name: review.file_name,
                issue_description: review.ai_feedback, // Use AI feedback as the issue description
                tech_stack: "Inferred",
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setRefactoredCode(response.data.refactored_code);
            setIsRefactorOpen(true);
            toast({
                title: 'Refactor Generated',
                description: 'Review the changes and copy the fix.',
                status: 'success',
                duration: 3000,
            });
        } catch (err: any) {
            toast({
                title: 'Refactor Failed',
                description: 'Could not generate refactored code.',
                status: 'error',
                duration: 4000,
            });
            console.error("Refactor Error:", err);
        } finally {
            setIsRefactoring(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'green';
        if (score >= 6) return 'yellow';
        return 'red';
    };

    if (loading) {
        return (
            <Layout userRole="Student">
                <Center h="80vh" color="white">
                    <Spinner size="xl" color="cyan.400" thickness="4px" />
                    <Text ml={4} fontSize="xl">Loading Code Reviews...</Text>
                </Center>
            </Layout>
        );
    }

    return (
        <Layout userRole="Student">
            <Container
                maxW="container.xl"
                py={{ base: 6, md: 8 }}
            >
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between">
                        <VStack align="flex-start" spacing={2}>
                            <Heading
                                as="h1"
                                size="2xl"
                                bgGradient="linear(to-r, cyan.400, blue.400)"
                                bgClip="text"
                                fontWeight="extrabold"
                            >
                                AI Code Review
                            </Heading>
                            <Text color="gray.400">Upload your code for instant AI-powered analysis</Text>
                        </VStack>
                        <Button
                            leftIcon={<ArrowLeft size={20} />}
                            onClick={() => navigate(-1)}
                            variant="ghost"
                            colorScheme="gray"
                            color="gray.400"
                            _hover={{ color: "white", bg: "whiteAlpha.200" }}
                        >
                            Back
                        </Button>
                    </HStack>

                    {error && (
                        <Alert status="error" borderRadius="lg" bg="rgba(255,0,0,0.1)" border="1px solid rgba(255,0,0,0.3)">
                            <AlertIcon color="red.300" />
                            {error}
                        </Alert>
                    )}

                    {/* Upload Form */}
                    <MotionBox
                        p={8}
                        className="glass-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <VStack spacing={6} align="stretch">
                            <HStack>
                                <Box p={2} bg="cyan.900" borderRadius="lg" color="cyan.400">
                                    <FileCode size={24} />
                                </Box>
                                <Heading size="md" color="cyan.300">Submit New Code for Review</Heading>
                            </HStack>

                            <FormControl>
                                <FormLabel color="gray.300" fontSize="sm">File Name (e.g., auth.py, HomePage.tsx)</FormLabel>
                                <Input
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder="Enter file name..."
                                    bg="rgba(0,0,0,0.2)"
                                    borderColor="whiteAlpha.200"
                                    _hover={{ borderColor: 'cyan.400' }}
                                    _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px cyan', bg: 'rgba(0,0,0,0.4)' }}
                                    color="white"
                                    borderRadius="md"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel color="gray.300" fontSize="sm">Code Content</FormLabel>
                                <Textarea
                                    value={codeContent}
                                    onChange={(e) => setCodeContent(e.target.value)}
                                    placeholder="Paste your code here..."
                                    rows={12}
                                    fontFamily="monospace"
                                    fontSize="sm"
                                    bg="rgba(0,0,0,0.3)"
                                    borderColor="whiteAlpha.200"
                                    _hover={{ borderColor: 'cyan.400' }}
                                    _focus={{ borderColor: 'cyan.300', boxShadow: '0 0 0 1px cyan', bg: 'rgba(0,0,0,0.5)' }}
                                    color="cyan.100"
                                    borderRadius="md"
                                />
                            </FormControl>

                            <Button
                                onClick={handleSubmitCode}
                                isLoading={uploading}
                                loadingText="Analyzing..."
                                leftIcon={<Upload size={20} />}
                                bgGradient="linear(to-r, cyan.500, blue.500)"
                                color="white"
                                size="lg"
                                _hover={{ bgGradient: 'linear(to-r, cyan.400, blue.400)', transform: 'translateY(-2px)', boxShadow: '0 5px 15px rgba(0, 255, 255, 0.3)' }}
                                transition="all 0.3s ease"
                            >
                                Submit for AI Review
                            </Button>
                        </VStack>
                    </MotionBox>

                    {/* Reviews List */}
                    <Heading size="lg" color="gray.200" mt={4}>
                        Review History
                    </Heading>

                    {reviews.length === 0 ? (
                        <Center h="200px" className="glass-card">
                            <VStack spacing={3}>
                                <CodeIcon size={48} color="gray" />
                                <Text fontSize="lg" color="gray.400">No code reviews yet</Text>
                                <Text fontSize="sm" color="gray.500">Submit your first code snippet above to get started!</Text>
                            </VStack>
                        </Center>
                    ) : (
                        <VStack spacing={6} align="stretch">
                            {reviews.map((review) => (
                                <MotionBox
                                    key={review.id}
                                    p={6}
                                    className="glass-card"
                                    whileHover={{ transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                    transition={{ duration: 0.2 }}
                                    border="1px solid"
                                    borderColor="whiteAlpha.100"
                                >
                                    <VStack align="stretch" spacing={6}>
                                        {/* Header */}
                                        <Flex justify="space-between" align="center">
                                            <HStack>
                                                <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="md">
                                                    {review.file_name}
                                                </Badge>
                                                <Text fontSize="sm" color="gray.400">
                                                    by {review.student_username}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.500">
                                                {new Date(review.uploaded_at).toLocaleString()}
                                            </Text>
                                        </Flex>

                                        {/* Scores */}
                                        <HStack spacing={6}>
                                            <Box flex="1" p={4} bg="rgba(0,0,0,0.2)" borderRadius="lg">
                                                <HStack mb={2}>
                                                    <Shield size={16} color={getScoreColor(review.security_score) === 'green' ? '#48BB78' : '#F6E05E'} />
                                                    <Text fontSize="xs" color="gray.400">Security Score</Text>
                                                </HStack>
                                                <HStack>
                                                    <Progress
                                                        value={review.security_score * 10}
                                                        size="sm"
                                                        colorScheme={getScoreColor(review.security_score)}
                                                        borderRadius="full"
                                                        flex="1"
                                                        bg="whiteAlpha.100"
                                                    />
                                                    <Text fontWeight="bold" color={getScoreColor(review.security_score) + '.300'}>
                                                        {review.security_score}/10
                                                    </Text>
                                                </HStack>
                                            </Box>
                                            <Box flex="1" p={4} bg="rgba(0,0,0,0.2)" borderRadius="lg">
                                                <HStack mb={2}>
                                                    <Zap size={16} color={getScoreColor(review.quality_score) === 'green' ? '#48BB78' : '#F6E05E'} />
                                                    <Text fontSize="xs" color="gray.400">Quality Score</Text>
                                                </HStack>
                                                <HStack>
                                                    <Progress
                                                        value={review.quality_score * 10}
                                                        size="sm"
                                                        colorScheme={getScoreColor(review.quality_score)}
                                                        borderRadius="full"
                                                        flex="1"
                                                        bg="whiteAlpha.100"
                                                    />
                                                    <Text fontWeight="bold" color={getScoreColor(review.quality_score) + '.300'}>
                                                        {review.quality_score}/10
                                                    </Text>
                                                </HStack>
                                            </Box>
                                        </HStack>

                                        <Divider borderColor="whiteAlpha.100" />

                                        {/* AI Feedback */}
                                        <Box
                                            p={5}
                                            bg="rgba(0, 0, 0, 0.3)"
                                            borderRadius="lg"
                                            borderLeft="4px solid"
                                            borderColor="cyan.400"
                                        >
                                            <HStack mb={3}>
                                                <Lucide.Bot size={20} color="#0BC5EA" />
                                                <Text fontSize="md" fontWeight="bold" color="cyan.300">
                                                    AI Analysis
                                                </Text>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.200" whiteSpace="pre-wrap" lineHeight="tall">
                                                {review.ai_feedback}
                                            </Text>
                                        </Box>

                                        {/* Security Issues */}
                                        {review.security_issues && review.security_issues.length > 0 && (
                                            <Box
                                                p={5}
                                                bg="rgba(255, 0, 0, 0.05)"
                                                borderRadius="lg"
                                                borderLeft="4px solid"
                                                borderColor="red.400"
                                            >
                                                <HStack mb={3}>
                                                    <AlertTriangle size={20} color="#FC8181" />
                                                    <Text fontSize="md" fontWeight="bold" color="red.300">
                                                        Security Concerns
                                                    </Text>
                                                </HStack>
                                                <VStack align="start" spacing={2}>
                                                    {review.security_issues.map((issue, idx) => (
                                                        <HStack key={idx} align="start">
                                                            <Text color="red.400">•</Text>
                                                            <Text fontSize="sm" color="gray.200">{issue}</Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}

                                        {/* Optimization Tips */}
                                        {review.optimization_tips && review.optimization_tips.length > 0 && (
                                            <Box
                                                p={5}
                                                bg="rgba(72, 187, 120, 0.05)"
                                                borderRadius="lg"
                                                borderLeft="4px solid"
                                                borderColor="green.400"
                                            >
                                                <HStack mb={3}>
                                                    <CheckCircle size={20} color="#68D391" />
                                                    <Text fontSize="md" fontWeight="bold" color="green.300">
                                                        Optimization Suggestions
                                                    </Text>
                                                </HStack>
                                                <VStack align="start" spacing={2}>
                                                    {review.optimization_tips.map((tip, idx) => (
                                                        <HStack key={idx} align="start">
                                                            <Text color="green.400">✓</Text>
                                                            <Text fontSize="sm" color="gray.200">{tip}</Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}



                                        {/* AI Refactor Action */}
                                        <Button
                                            leftIcon={<Wand2 size={16} />}
                                            colorScheme="purple"
                                            variant="solid"
                                            isLoading={isRefactoring && selectedReview?.id === review.id}
                                            onClick={() => handleRefactor(review)}
                                            bgGradient="linear(to-r, purple.500, pink.500)"
                                            _hover={{ bgGradient: "linear(to-r, purple.400, pink.400)", transform: "scale(1.02)" }}
                                            size="md"
                                            width="full"
                                            mt={2}
                                            mb={2}
                                        >
                                            Fix Issues with AI Code Refactor
                                        </Button>

                                        {/* Code Preview */}
                                        <Accordion allowToggle>
                                            <AccordionItem border="none">
                                                <AccordionButton
                                                    bg="whiteAlpha.100"
                                                    _hover={{ bg: 'whiteAlpha.200' }}
                                                    borderRadius="md"
                                                    color="gray.300"
                                                >
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        View Submitted Code
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel pb={4} bg="blackAlpha.400" mt={2} borderRadius="md">
                                                    <Code
                                                        display="block"
                                                        whiteSpace="pre-wrap"
                                                        p={4}
                                                        bg="transparent"
                                                        color="cyan.100"
                                                        fontSize="xs"
                                                        fontFamily="monospace"
                                                        overflowX="auto"
                                                    >
                                                        {review.code_content}
                                                    </Code>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        </Accordion>
                                    </VStack>
                                </MotionBox>
                            ))}
                        </VStack>
                    )}
                </VStack>
            </Container>

            {/* Refactor Preview Modal */}
            {
                selectedReview && (
                    <RefactorPreview
                        isOpen={isRefactorOpen}
                        onClose={() => setIsRefactorOpen(false)}
                        originalCode={selectedReview.code_content}
                        refactoredCode={refactoredCode}
                        fileName={selectedReview.file_name}
                        projectId={projectId ? parseInt(projectId) : null}
                    />
                )
            }
        </Layout >
    );
};

export default CodeReview;
