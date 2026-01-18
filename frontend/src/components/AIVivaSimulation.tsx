// frontend/src/components/AIVivaSimulation.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Text,
  Spinner,
  Center,
  useToast,
  Container,
  Textarea,
  Progress,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';
const { RefreshCw, Zap, ArrowLeft, Bot } = Lucide;

// Motion components
const MotionBox = motion(Box);

// Animation variants
const mainContainerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// --- NEW INTERFACES TO MATCH BACKEND ---
interface VivaQuestion {
  id: number;
  question_text: string;
  student_answer: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
}

interface VivaSession {
  id: number;
  questions: VivaQuestion[];
}

const AIVivaSimulation: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const submissionIdStr = projectId;

  // State for the full session data
  const [vivaSession, setVivaSession] = useState<VivaSession | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [error, setError] = useState('');
  const [actualProjectId, setActualProjectId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const [isEvaluating, setIsEvaluating] = useState(false);

  // Audio Ref to prevent overlapping speech
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  // Track the current active voice request to prevent race conditions
  const activeRequestId = React.useRef<number>(0);

  // --- Voice Helper (Updated to use POST for robustness) ---
  const speakExaminerLine = async (text: string) => {
    if (!text) return;

    // 1. Increment Request ID
    const requestId = ++activeRequestId.current;

    try {
      // Stop and cleanup previous audio IMMEDIATELY
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      console.log(`🔊 Examiner speaking (req #${requestId})...`);

      // Use POST endpoint to handle long text
      const response = await fetch('http://127.0.0.1:8001/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, voice: 'hannah' }),
      });

      if (!response.ok) throw new Error(`TTS API Error: ${response.statusText}`);

      // Get the audio blob
      const audioBlob = await response.blob();

      // CRITICAL CHECK: If a newer request started while we were fetching, ABORT.
      if (requestId !== activeRequestId.current) {
        console.log(`🔇 Audio request #${requestId} discarded (Newer request #${activeRequestId.current} active).`);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);

      audio.play().catch(e => {
        if (e.name !== 'AbortError') console.error("Audio play failed:", e);
      });

    } catch (error) {
      console.error("Examiner voice failed:", error);
      toast({
        title: "Voice Error",
        description: "Could not play examiner voice. Please check microservice.",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
    }
  };

  // --- Effect: Speak Question when it changes ---
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (vivaSession && vivaSession.questions.length > 0) {
      const currentQ = vivaSession.questions[currentQuestionIndex];
      // Only auto-speak if it's a new question (not answered yet)
      if (!currentQ.student_answer) {
         const questionText = currentQ.question_text;
         // Small delay to ensure UI updates first and handle rapid navigation
         timeoutId = setTimeout(() => speakExaminerLine(questionText), 400);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [vivaSession, currentQuestionIndex]);

  // --- 1. Fetch Project Details & Start Session ---
  useEffect(() => {
    const initSession = async () => {
      if (!submissionIdStr) {
        setError('Submission ID is missing from URL.');
        setIsLoadingSession(false);
        return;
      }

      setIsLoadingSession(true);
      setError('');

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/'); return; }

        // Treat route param as project_id
        const projId = parseInt(submissionIdStr);
        setActualProjectId(projId);

        // Start Viva
        const sessionResponse = await axios.post('http://127.0.0.1:8000/ai/viva/', {
          project_id: projId,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setVivaSession(sessionResponse.data);
        setCurrentQuestionIndex(0);

      } catch (err: any) {
        console.error(err);
        const errMsg = err.response?.data?.error || 'Failed to start Viva session.';
        setError(errMsg);
        toast({ title: 'Error', description: errMsg, status: 'error', duration: 5000, isClosable: true });
      } finally {
        setIsLoadingSession(false);
      }
    };

    initSession();

  }, [submissionIdStr, navigate, toast]);

  // Cleanup audio on unmount or navigation
  useEffect(() => {
    return () => {
      // FORCE STOP any playing audio
      if (audioRef.current) {
        console.log("🛑 Unmounting Viva: Stopping Audio");
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      activeRequestId.current++; // Invalidate any pending requests
    };
  }, []);

  // --- 2. Handle Answer Evaluation ---
  const handleEvaluateAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vivaSession || !currentAnswer.trim()) return;

    const questionToEvaluate = vivaSession.questions[currentQuestionIndex];

    setIsEvaluating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('http://127.0.0.1:8000/ai/viva/evaluate/', {
        question_id: questionToEvaluate.id,
        answer: currentAnswer,
      }, {
        headers: { Authorization: { toString: () => `Bearer ${token}` } as any },
      });

      const updatedQuestion = response.data;

      // Speak the feedback
      if (updatedQuestion.ai_feedback) {
        speakExaminerLine(updatedQuestion.ai_feedback);
      }

      setVivaSession(prev => {
        if (!prev) return null;
        const updatedQuestions = [...prev.questions];
        updatedQuestions[currentQuestionIndex] = updatedQuestion;
        return { ...prev, questions: updatedQuestions };
      });

    } catch (err) {
      console.error(err);
      toast({ title: 'Evaluation Failed', description: 'Could not submit answer. Try again.', status: 'error' });
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- Navigation Helpers ---
  const handleNextQuestion = () => {
    if (vivaSession && currentQuestionIndex < vivaSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQ = vivaSession.questions[currentQuestionIndex + 1];
      setCurrentAnswer(nextQ.student_answer || '');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      if (vivaSession) {
        setCurrentAnswer(vivaSession.questions[currentQuestionIndex - 1].student_answer || '');
      }
    }
  };

  // Current question helpers
  const currentQ = vivaSession?.questions[currentQuestionIndex];
  const isLastQuestion = vivaSession ? currentQuestionIndex >= vivaSession.questions.length - 1 : false;
  const isEvaluated = currentQ?.ai_score !== null && currentQ?.ai_score !== undefined;

  // --- Main Render ---
  return (
    <Layout userRole="Student">
      <Container maxW="4xl" zIndex={2} py={{ base: 8, md: 12 }}>
        <MotionBox
          variants={mainContainerVariants}
          initial="hidden"
          animate="visible"
          className="glass-card"
          p={{ base: 6, md: 10 }}
        >
          {/* Header */}
          <HStack justifyContent="space-between" align="center" borderBottom="1px solid" borderColor="whiteAlpha.200" pb={4} mb={6}>
            <HStack>
              <Button onClick={() => navigate(-1)} variant="ghost" size="sm" leftIcon={<ArrowLeft />} color="gray.400" _hover={{ color: "white", bg: "whiteAlpha.200" }}>
                Back
              </Button>
              <Heading as="h1" size="lg" bgGradient="linear(to-r, cyan.400, blue.400)" bgClip="text">
                AI Viva Simulation
              </Heading>
            </HStack>
            {actualProjectId && <Badge colorScheme="cyan" variant="outline" borderRadius="full" px={3}>Project ID: {actualProjectId}</Badge>}
          </HStack>

          {/* Loading State */}
          {isLoadingSession && (
            <Center py={20} flexDirection="column">
              <Spinner size="xl" color="cyan.400" thickness="4px" />
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Text mt={4} color="cyan.200" fontSize="lg">
                  AI Examiner is preparing your session...
                </Text>
              </motion.div>
            </Center>
          )}

          {/* Error State */}
          {error && !isLoadingSession && (
            <Center py={20} flexDirection="column">
              <Text fontSize="xl" color="red.400" mb={4}>{error}</Text>
              <Button variant="outline" colorScheme="cyan" onClick={() => navigate(-1)}>Return to Dashboard</Button>
            </Center>
          )}

          {/* Main Viva Content */}
          {!isLoadingSession && !error && vivaSession && currentQ && (
            <VStack spacing={8} align="stretch">
              {/* Progress Bar */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text color="gray.400" fontSize="sm">
                    Question {currentQuestionIndex + 1} of {vivaSession.questions.length}
                  </Text>
                  <Text color="cyan.400" fontSize="sm" fontWeight="bold">
                    {Math.round(((currentQuestionIndex + 1) / vivaSession.questions.length) * 100)}% Complete
                  </Text>
                </HStack>
                <Progress
                  value={((currentQuestionIndex + 1) / vivaSession.questions.length) * 100}
                  size="xs"
                  colorScheme="cyan"
                  borderRadius="full"
                  bg="whiteAlpha.100"
                />
              </Box>

              {/* Question Card */}
              <motion.div
                key={currentQ.id}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
              >
                <VStack
                  align="stretch"
                  spacing={4}
                  bg="linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
                  p={8}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="cyan.500"
                  boxShadow="0 0 20px rgba(0, 255, 255, 0.1)"
                  position="relative"
                  overflow="hidden"
                >
                  <Box position="absolute" top="-10px" right="-10px" opacity={0.1}>
                    <Bot size={100} color="cyan" />
                  </Box>

                  <HStack>
                    <Box p={2} bg="cyan.900" borderRadius="lg" color="cyan.400">
                      <Zap size={24} />
                    </Box>
                    <Text fontSize="lg" fontWeight="bold" color="cyan.200">
                      AI Examiner asks:
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" color="white" lineHeight="tall" fontWeight="medium">
                    {currentQ.question_text}
                  </Text>
                </VStack>
              </motion.div>

              {/* Answer Section */}
              <Box>
                <VStack as="form" onSubmit={handleEvaluateAnswer} spacing={6} align="stretch">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    rows={6}
                    isDisabled={isEvaluated || isEvaluating}
                    bg="rgba(0,0,0,0.3)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px cyan', bg: 'rgba(0,0,0,0.5)' }}
                    _hover={{ borderColor: 'cyan.600' }}
                    color="white"
                    fontSize="lg"
                    p={4}
                    borderRadius="xl"
                  />

                  {!isEvaluated ? (
                    <HStack justify="flex-end">
                      <Button
                        type="submit"
                        colorScheme="cyan"
                        isLoading={isEvaluating}
                        loadingText="Evaluating..."
                        isDisabled={!currentAnswer.trim()}
                        size="lg"
                        bgGradient="linear(to-r, cyan.500, blue.500)"
                        _hover={{ bgGradient: "linear(to-r, cyan.400, blue.400)", transform: "translateY(-2px)", boxShadow: "0 5px 15px rgba(0, 255, 255, 0.3)" }}
                        transition="all 0.3s"
                        px={8}
                      >
                        Submit Answer
                      </Button>
                    </HStack>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.5 }}
                    >
                      <VStack align="stretch" spacing={6} mt={2}>
                        {/* Feedback Card */}
                        <Box
                          p={6}
                          borderRadius="xl"
                          bg={currentQ.ai_score && currentQ.ai_score >= 7 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(236, 201, 75, 0.1)'}
                          border="1px solid"
                          borderColor={currentQ.ai_score && currentQ.ai_score >= 7 ? 'green.500' : 'yellow.500'}
                          boxShadow={currentQ.ai_score && currentQ.ai_score >= 7 ? '0 0 20px rgba(72, 187, 120, 0.2)' : '0 0 20px rgba(236, 201, 75, 0.2)'}
                        >
                          <HStack justify="space-between" mb={4}>
                            <Heading size="md" color={currentQ.ai_score && currentQ.ai_score >= 7 ? 'green.300' : 'yellow.300'}>
                              AI Feedback
                            </Heading>
                            <Badge
                              colorScheme={currentQ.ai_score && currentQ.ai_score >= 7 ? 'green' : 'yellow'}
                              fontSize="lg"
                              px={4}
                              py={1}
                              borderRadius="full"
                              variant="solid"
                            >
                              Score: {currentQ.ai_score}/10
                            </Badge>
                          </HStack>
                          <Text color="gray.200" fontSize="md" lineHeight="tall">
                            {currentQ.ai_feedback}
                          </Text>
                        </Box>

                        {/* Navigation Buttons */}
                        <HStack justify="space-between" pt={4}>
                          <Button
                            onClick={handlePrevQuestion}
                            isDisabled={currentQuestionIndex === 0}
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "white", bg: "whiteAlpha.200" }}
                          >
                            Previous
                          </Button>

                          {isLastQuestion ? (
                            <Button
                              onClick={() => {
                                toast({
                                  title: "Session Complete",
                                  description: "You have completed the Viva session.",
                                  status: "success",
                                  duration: 3000,
                                });
                                navigate('/student-dashboard');
                              }}
                              colorScheme="green"
                              rightIcon={<RefreshCw size={18} />}
                              size="lg"
                              bgGradient="linear(to-r, green.400, teal.500)"
                              _hover={{ bgGradient: "linear(to-r, green.300, teal.400)", transform: "scale(1.05)" }}
                            >
                              Finish Session
                            </Button>
                          ) : (
                            <Button
                              onClick={handleNextQuestion}
                              colorScheme="cyan"
                              variant="outline"
                              size="lg"
                              _hover={{ bg: "cyan.900", borderColor: "cyan.300" }}
                              rightIcon={<Lucide.ArrowRight size={18} />}
                            >
                              Next Question
                            </Button>
                          )}
                        </HStack>
                      </VStack>
                    </motion.div>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}
        </MotionBox>
      </Container>
    </Layout>
  );
};

export default AIVivaSimulation;
