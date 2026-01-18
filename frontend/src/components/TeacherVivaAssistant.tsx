import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Textarea,
    useToast,
    SimpleGrid,
    Badge,
    Spinner,
    Flex,
    Icon,
    Divider,
    Container
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Lucide from "lucide-react";
import Layout from './Layout'; // Assuming standard layout

const {
    Award,
    CheckCircle,
    XCircle,
    MessageSquare,
    RefreshCw,
    ArrowLeft,
    BrainCircuit
} = Lucide;

const MotionBox = motion(Box);

interface VivaQuestion {
    id: number;
    text: string;
    isAsked: boolean;
}

interface EvaluationResult {
    score: number;
    feedback: string;
}

const TeacherVivaAssistant: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [questions, setQuestions] = useState<VivaQuestion[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [studentAnswer, setStudentAnswer] = useState("");
    const [evaluating, setEvaluating] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

    // Initial Fetch (or Generate)
    const handleGenerateQuestions = async () => {
        setLoadingQuestions(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(
                'http://127.0.0.1:8000/ai/viva/',
                { project_id: projectId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Backend returns list of strings
            const newQuestions = response.data.questions.map((q: string, idx: number) => ({
                id: Date.now() + idx,
                text: q,
                isAsked: false
            }));
            setQuestions(newQuestions);
            toast({ title: "Questions Generated", status: "success" });
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to generate questions", status: "error" });
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleEvaluate = async () => {
        if (!currentQuestion || !studentAnswer) return;
        setEvaluating(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(
                'http://127.0.0.1:8000/ai/viva/evaluate/',
                {
                    project_id: projectId,
                    question: currentQuestion,
                    answer: studentAnswer
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setEvaluation({
                score: response.data.score,
                feedback: response.data.feedback
            });
        } catch (err) {
            console.error(err);
            toast({ title: "Evaluation failed", status: "error" });
        } finally {
            setEvaluating(false);
        }
    };

    const selectQuestion = (q: string) => {
        setCurrentQuestion(q);
        setStudentAnswer("");
        setEvaluation(null);
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "green.400";
        if (score >= 5) return "yellow.400";
        return "red.400";
    };

    return (
        <Layout userRole="Teacher">
            <Container maxW="container.xl" py={8} h="calc(100vh - 100px)">
                <Button
                    leftIcon={<ArrowLeft size={18} />}
                    variant="ghost"
                    color="gray.400"
                    mb={6}
                    onClick={() => navigate(-1)}
                    _hover={{ color: "white", bg: "whiteAlpha.200" }}
                >
                    Back to Dashboard
                </Button>

                <Flex justify="space-between" align="center" mb={8}>
                    <HStack>
                        <Box p={3} bg="purple.500" borderRadius="xl">
                            <Icon as={BrainCircuit} size={28} color="white" />
                        </Box>
                        <Box>
                            <Heading size="lg" bgGradient="linear(to-r, purple.400, pink.400)" bgClip="text">
                                AI Viva Assistant
                            </Heading>
                            <Text color="gray.400" fontSize="sm">Real-time question generation & evaluation</Text>
                        </Box>
                    </HStack>

                    <Button
                        leftIcon={<RefreshCw size={18} />}
                        colorScheme="purple"
                        onClick={handleGenerateQuestions}
                        isLoading={loadingQuestions}
                        loadingText="Thinking..."
                        boxShadow="0 0 20px rgba(128, 90, 213, 0.4)"
                    >
                        Generate New Questions
                    </Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} h="full" maxH="700px">

                    {/* Left Column: Question Bank */}
                    <VStack
                        align="stretch"
                        spacing={4}
                        className="glass-card"
                        p={6}
                        overflowY="auto"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        bg="rgba(0,0,0,0.3)"
                    >
                        <Heading size="md" color="gray.200" mb={2}>Question Bank</Heading>

                        {questions.length === 0 && !loadingQuestions && (
                            <Flex direction="column" align="center" justify="center" h="200px" color="gray.500">
                                <Icon as={MessageSquare} size={40} mb={4} opacity={0.5} />
                                <Text>No questions generated yet.</Text>
                                <Text fontSize="sm">Click "Generate New Questions" to start.</Text>
                            </Flex>
                        )}

                        {loadingQuestions && (
                            <Flex justify="center" p={8}>
                                <Spinner color="purple.400" size="xl" />
                            </Flex>
                        )}

                        <AnimatePresence>
                            {questions.map((q, i) => (
                                <MotionBox
                                    key={q.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    p={4}
                                    bg={currentQuestion === q.text ? "purple.500" : "whiteAlpha.100"}
                                    borderRadius="lg"
                                    cursor="pointer"
                                    onClick={() => selectQuestion(q.text)}
                                    _hover={{ bg: currentQuestion === q.text ? "purple.600" : "whiteAlpha.200", transform: "translateX(5px)" }}
                                    borderLeft="4px solid"
                                    borderColor={currentQuestion === q.text ? "white" : "transparent"}
                                >
                                    <Text color="white" fontWeight={currentQuestion === q.text ? "bold" : "normal"}>
                                        {i + 1}. {q.text}
                                    </Text>
                                </MotionBox>
                            ))}
                        </AnimatePresence>
                    </VStack>

                    {/* Right Column: Interaction Area */}
                    <VStack align="stretch" spacing={6}>
                        {/* Active Question Card */}
                        <Box p={6} className="glass-card" bg="linear-gradient(135deg, rgba(85, 60, 154, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%)">
                            <Badge colorScheme="cyan" mb={2}>Current Question</Badge>
                            <Heading size="md" color="white" minH="60px">
                                {currentQuestion || "Select a question from the left to begin..."}
                            </Heading>
                        </Box>

                        {/* Student Answer Input */}
                        <Box p={6} className="glass-card">
                            <Text mb={2} color="gray.400" fontSize="sm">Student's Answer (Transcribe or Type)</Text>
                            <Textarea
                                value={studentAnswer}
                                onChange={(e) => setStudentAnswer(e.target.value)}
                                placeholder="Type the student's answer here..."
                                size="lg"
                                minH="120px"
                                bg="blackAlpha.300"
                                border="none"
                                _focus={{ ring: 2, ringColor: "purple.500" }}
                                isDisabled={!currentQuestion}
                            />
                            <HStack justify="flex-end" mt={4}>
                                <Button
                                    leftIcon={<Award size={18} />}
                                    colorScheme="green"
                                    onClick={handleEvaluate}
                                    isDisabled={!currentQuestion || !studentAnswer.trim()}
                                    isLoading={evaluating}
                                >
                                    Evaluate Answer
                                </Button>
                            </HStack>
                        </Box>

                        {/* Evaluation Result */}
                        <AnimatePresence>
                            {evaluation && (
                                <MotionBox
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    p={6}
                                    className="glass-card"
                                    border="1px solid"
                                    borderColor={getScoreColor(evaluation.score)}
                                    bg={`rgba(0,0,0,0.6)`}
                                >
                                    <Flex justify="space-between" align="center" mb={4}>
                                        <HStack>
                                            <Icon
                                                as={evaluation.score >= 5 ? CheckCircle : XCircle}
                                                color={getScoreColor(evaluation.score)}
                                                size={24}
                                            />
                                            <Heading size="md" color={getScoreColor(evaluation.score)}>
                                                Score: {evaluation.score}/10
                                            </Heading>
                                        </HStack>
                                        <Badge
                                            colorScheme={evaluation.score >= 8 ? 'green' : evaluation.score >= 5 ? 'yellow' : 'red'}
                                            p={2}
                                            borderRadius="md"
                                        >
                                            {evaluation.score >= 8 ? "Excellent" : evaluation.score >= 5 ? "Average" : "Poor"}
                                        </Badge>
                                    </Flex>
                                    <Divider mb={3} borderColor="whiteAlpha.200" />
                                    <Text color="gray.300" lineHeight="tall">
                                        {evaluation.feedback}
                                    </Text>
                                </MotionBox>
                            )}
                        </AnimatePresence>
                    </VStack>
                </SimpleGrid>
            </Container>
        </Layout>
    );
};

export default TeacherVivaAssistant;
