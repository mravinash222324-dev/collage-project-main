import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    VStack,
    Heading,
    Text,
    Badge,
    Container,
    Spinner,
    Flex,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    HStack,
    Avatar,
    Button,
    Icon,
    SimpleGrid
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
const { ArrowLeft, History, MessageSquare, Bot } = Lucide;

const MotionBox = motion(Box);

interface VivaQuestion {
    id: number;
    question_text: string;
    student_answer: string | null;
    ai_score: number | null;
    ai_feedback: string | null;
}

interface VivaSession {
    id: number;
    project: number;
    student_name: string;
    created_at: string;
    questions: VivaQuestion[];
}

const TeacherVivaHistory: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [sessions, setSessions] = useState<VivaSession[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(`http://127.0.0.1:8000/teacher/projects/${projectId}/viva-history/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(response.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [projectId]);

    if (loading) return (
        <Flex h="100vh" align="center" justify="center" bg="transparent" color="gray.400">
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text ml={4} fontSize="xl">Loading Viva History...</Text>
        </Flex>
    );

    return (
        <Box minH="100vh" bg="transparent" color="white" py={8} position="relative" overflow="hidden">
            {/* Background Glows */}
            <Box position="absolute" top="10%" left="-10%" w="500px" h="500px" bg="blue.600" filter="blur(150px)" opacity={0.1} zIndex={-1} />
            <Box position="absolute" bottom="10%" right="-10%" w="500px" h="500px" bg="purple.600" filter="blur(150px)" opacity={0.1} zIndex={-1} />

            <Container maxW="container.lg">
                <Button
                    onClick={() => navigate(-1)}
                    leftIcon={<ArrowLeft size={20} />}
                    variant="ghost"
                    color="gray.400"
                    mb={8}
                    _hover={{ color: "white", bg: "whiteAlpha.100" }}
                >
                    Back to Project
                </Button>

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <HStack mb={8} spacing={4}>
                        <Flex p={3} bg="rgba(255,255,255,0.05)" borderRadius="xl">
                            <Icon as={History} w={8} h={8} color="cyan.400" />
                        </Flex>
                        <Heading size="2xl" bgGradient="linear(to-r, cyan.400, blue.500, purple.500)" bgClip="text" fontWeight="extrabold">
                            Viva Examination History
                        </Heading>
                    </HStack>
                </motion.div>

                {sessions.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" h="400px" bg="rgba(255,255,255,0.02)" borderRadius="2xl" border="1px dashed" borderColor="whiteAlpha.200">
                        <Icon as={History} size={48} color="gray.600" mb={4} />
                        <Text color="gray.500" fontSize="lg">No viva sessions recorded for this project yet.</Text>
                    </Flex>
                ) : (
                    <VStack spacing={8} align="stretch">
                        {sessions.map((session, index) => (
                            <MotionBox
                                key={session.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                p={0}
                                className="glass-card"
                                bg="rgba(15, 23, 42, 0.6)"
                                borderRadius="2xl"
                                boxShadow="xl"
                                border="1px solid rgba(255, 255, 255, 0.08)"
                                backdropFilter="blur(12px)"
                                overflow="hidden"
                            >
                                {/* Session Header */}
                                <Box p={6} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="whiteAlpha.50">
                                    <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                                        <HStack spacing={4}>
                                            <Avatar name={session.student_name} bgGradient="linear(to-br, blue.400, purple.500)" color="white" size="md" />
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="bold" fontSize="lg" color="white">{session.student_name}</Text>
                                                <HStack spacing={2} color="gray.400" fontSize="sm">
                                                    <Icon as={History} size={14} />
                                                    <Text>
                                                        {new Date(session.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </HStack>
                                            </VStack>
                                        </HStack>
                                        <Badge colorScheme="cyan" variant="solid" px={3} py={1} borderRadius="full" fontSize="sm">
                                            Session #{sessions.length - index}
                                        </Badge>
                                    </Flex>
                                </Box>

                                {/* Questions Accordion */}
                                <Box p={4}>
                                    <Accordion allowMultiple>
                                        {session.questions.map((q, qIndex) => (
                                            <AccordionItem key={q.id} border="none" mb={3}>
                                                {({ isExpanded }) => (
                                                    <>
                                                        <h2>
                                                            <AccordionButton
                                                                bg={isExpanded ? "whiteAlpha.100" : "transparent"}
                                                                borderRadius="xl"
                                                                _hover={{ bg: 'whiteAlpha.100' }}
                                                                py={4}
                                                                px={4}
                                                            >
                                                                <HStack flex="1" textAlign="left" spacing={4}>
                                                                    <Flex
                                                                        w={8} h={8}
                                                                        align="center" justify="center"
                                                                        bg={isExpanded ? "blue.500" : "whiteAlpha.200"}
                                                                        color="white"
                                                                        borderRadius="full"
                                                                        fontSize="sm"
                                                                        fontWeight="bold"
                                                                    >
                                                                        {qIndex + 1}
                                                                    </Flex>
                                                                    <Text fontWeight="medium" color={isExpanded ? "white" : "gray.300"} fontSize="md" noOfLines={isExpanded ? undefined : 1}>
                                                                        {q.question_text}
                                                                    </Text>
                                                                </HStack>

                                                                <HStack spacing={4}>
                                                                    <Badge
                                                                        colorScheme={(q.ai_score || 0) >= 7 ? 'green' : (q.ai_score || 0) >= 4 ? 'yellow' : 'red'}
                                                                        variant="subtle"
                                                                        px={2}
                                                                        borderRadius="md"
                                                                    >
                                                                        Score: {q.ai_score}/10
                                                                    </Badge>
                                                                    <AccordionIcon color="gray.500" />
                                                                </HStack>
                                                            </AccordionButton>
                                                        </h2>
                                                        <AccordionPanel pb={4} px={6}>
                                                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={2}>
                                                                {/* Student Answer */}
                                                                <Box p={4} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                                                                    <HStack mb={2} color="blue.300">
                                                                        <Icon as={MessageSquare} size={16} />
                                                                        <Text fontSize="xs" fontWeight="bold" letterSpacing="wide">STUDENT ANSWER</Text>
                                                                    </HStack>
                                                                    <Text fontSize="sm" color="gray.300" lineHeight="1.6">
                                                                        {q.student_answer || <Text as="span" color="gray.500" fontStyle="italic">No answer provided.</Text>}
                                                                    </Text>
                                                                </Box>

                                                                {/* AI Feedback */}
                                                                <Box p={4} bg="rgba(128, 90, 213, 0.1)" borderRadius="xl" border="1px solid" borderColor="purple.500" position="relative" overflow="hidden">
                                                                    <Box position="absolute" top={0} left={0} w="4px" h="100%" bg="purple.500" />
                                                                    <HStack mb={2} color="purple.300">
                                                                        <Icon as={Bot} size={16} />
                                                                        <Text fontSize="xs" fontWeight="bold" letterSpacing="wide">AI FEEDBACK</Text>
                                                                    </HStack>
                                                                    <Text fontSize="sm" color="gray.200" lineHeight="1.6">
                                                                        {q.ai_feedback}
                                                                    </Text>
                                                                </Box>
                                                            </SimpleGrid>
                                                        </AccordionPanel>
                                                    </>
                                                )}
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </Box>
                            </MotionBox>
                        ))}
                    </VStack>
                )}
            </Container>
        </Box>
    );
};

export default TeacherVivaHistory;
