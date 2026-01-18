
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    VStack,
    HStack,
    Heading,
    Input,
    Text,
    Spinner,
    useToast,
    IconButton,
    Flex,
    Icon,
    Container,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from './Layout';

const { Send, Bot, Sparkles, User, StopCircle } = Lucide;

// --- Interfaces & Animation Variants ---
interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const messageVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const mainContainerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const MotionBox = motion(Box);

// --- Chat Message Component (Redesigned) ---
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <MotionBox
            initial="hidden"
            animate="visible"
            variants={messageVariants}
            alignSelf={isUser ? 'flex-end' : 'flex-start'}
            maxW={{ base: '90%', md: '80%' }}
            mb={6}
        >
            <Flex direction={isUser ? 'row-reverse' : 'row'} gap={3}>
                {/* Avatar */}
                <Box flexShrink={0} mt={1}>
                    {isUser ? (
                        <Box w={8} h={8} borderRadius="full" bgGradient="linear(to-br, orange.400, red.500)" display="flex" alignItems="center" justifyContent="center">
                            <Icon as={User} color="white" w={4} h={4} />
                        </Box>
                    ) : (
                        <Box w={8} h={8} borderRadius="full" bgGradient="linear(to-br, blue.400, purple.500)" display="flex" alignItems="center" justifyContent="center" boxShadow="0 0 10px rgba(128, 90, 213, 0.4)">
                            <Icon as={Bot} color="white" w={5} h={5} />
                        </Box>
                    )}
                </Box>

                {/* Bubble */}
                <Box>
                    <Box
                        bg={isUser ? 'orange.900' : 'rgba(255, 255, 255, 0.05)'}
                        color="white"
                        px={isUser ? 5 : 5}
                        py={isUser ? 3 : 4}
                        borderRadius="2xl"
                        border={isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'}
                        boxShadow="md"
                    >
                        {isUser ? (
                            <Text fontSize="md" color="white">{message.text}</Text>
                        ) : (
                            <Box
                                className="markdown-body"
                                sx={{
                                    'p': { marginBottom: '0.8rem', lineHeight: 1.7, fontSize: '0.95rem' },
                                    'ul, ol': { marginLeft: '1.5rem', marginBottom: '0.8rem' },
                                    'li': { marginBottom: '0.3rem' },
                                    'strong': { color: 'purple.300', fontWeight: '700' },
                                    'h1, h2, h3': { marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '700', color: 'white' },
                                    'table': { width: '100%', borderCollapse: 'collapse', marginY: '1rem', bg: 'rgba(255,255,255,0.03)', borderRadius: 'md', overflow: 'hidden' },
                                    'th, td': { padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' },
                                    'th': { bg: 'rgba(255,255,255,0.05)', fontWeight: 'bold', color: 'purple.300', fontSize: '0.85rem', textTransform: 'uppercase' },
                                    'a': { color: 'purple.400', textDecoration: 'none', borderBottom: '1px dotted', _hover: { color: 'purple.300' } },
                                    'code': { bg: 'rgba(0,0,0,0.3)', px: 1.5, py: 0.5, borderRadius: 'md', fontFamily: 'monospace', color: 'orange.300', fontSize: '0.85em' },
                                    'pre': { bg: '#0d1117', p: 4, borderRadius: 'lg', overflowX: 'auto', marginY: '1rem', border: '1px solid rgba(255,255,255,0.1)' },
                                    'pre code': { bg: 'transparent', color: 'inherit', px: 0, py: 0 },
                                    'blockquote': { borderLeft: '3px solid', borderColor: 'orange.500', pl: 4, ml: 0, fontStyle: 'italic', color: 'gray.400' }
                                }}
                            >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.text}
                                </ReactMarkdown>
                            </Box>
                        )}
                    </Box>
                    <Text fontSize="xs" color="gray.500" mt={1} textAlign={isUser ? 'right' : 'left'}>
                        {isUser ? 'You' : 'Project Assistant'} • Just now
                    </Text>
                </Box>
            </Flex>
        </MotionBox>
    );
};

// --- Main Chatbot Component ---
const AIProjectAssistant: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const { projectId } = useParams<{ projectId: string }>(); // Get project ID from URL

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const toast = useToast();

    // Set initial welcome message
    useEffect(() => {
        setMessages([
            { sender: 'ai', text: `**Hello!** I am your focused assistant for **Project #${projectId}**.\n\nI can help you review code, analyze audit scores, generates vival questions, or summarize progress.\n\n*How can I assist you today?*` }
        ]);
    }, [projectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading || !projectId) return;

        setLoading(true);
        const userMessage: Message = { sender: 'user', text: prompt };
        setMessages((prev) => [...prev, userMessage]);
        setPrompt('');

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/');
                return;
            }

            // Use the project-inquiry endpoint
            const response = await axios.post(
                'http://127.0.0.1:8000/ai/project-inquiry/',
                {
                    prompt: userMessage.text,
                    project_id: projectId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const aiMessage: Message = { sender: 'ai', text: response.data.response };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err: any) {
            console.error('AI Chat Error:', err);
            const errorText = err.response?.data?.error || 'Could not get a response from the server.';
            toast({
                title: 'AI Connection Failed',
                description: errorText,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top',
            });
            // Add error message to chat
            setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I encountered an error: ${errorText}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout userRole="Teacher">
            <Container maxW="5xl" zIndex={2} py={{ base: 4, md: 8 }} h="calc(100vh - 80px)">
                <MotionBox
                    variants={mainContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="glass-card"
                    h="full"
                    display="flex"
                    flexDirection="column"
                    position="relative"
                    overflow="hidden"
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="2xl"
                    bg="rgba(15, 23, 42, 0.6)"
                >
                    {/* Header */}
                    <Flex
                        px={6} py={4}
                        justify="space-between"
                        align="center"
                        borderBottom="1px solid rgba(255,255,255,0.05)"
                        bg="rgba(0,0,0,0.2)"
                    >
                        <HStack spacing={3}>
                            <Box p={2} bg="rgba(128, 90, 213, 0.1)" borderRadius="lg" color="purple.400">
                                <Sparkles size={20} />
                            </Box>
                            <VStack align="start" spacing={0}>
                                <Heading size="md" color="white" letterSpacing="tight">Project Assistant</Heading>
                                <Text fontSize="xs" color="purple.300">Teacher Edition • Project #{projectId}</Text>
                            </VStack>
                        </HStack>
                    </Flex>


                    {/* Chat Area */}
                    <VStack
                        flex="1"
                        w="full"
                        spacing={0}
                        overflowY="auto"
                        px={{ base: 4, md: 6 }}
                        pt={6}
                        pb={4}
                        css={{
                            '&::-webkit-scrollbar': { width: '4px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
                            '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
                        }}
                    >
                        <Box w="full">
                            {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                            {loading && (
                                <Flex gap={3} align="center" ml={1} mb={4}>
                                    <Box w={8} h={8} borderRadius="full" bg="rgba(255,255,255,0.05)" display="flex" alignItems="center" justifyContent="center">
                                        <Spinner size="xs" color="purple.400" />
                                    </Box>
                                    <Text fontSize="sm" color="gray.500" fontStyle="italic">Analyzing project data...</Text>
                                </Flex>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>
                    </VStack>

                    {/* Input Area */}
                    <Box w="full" p={4} borderTop="1px solid rgba(255,255,255,0.05)" bg="rgba(0,0,0,0.2)">
                        <form onSubmit={handleSendMessage}>
                            <Flex
                                bg="rgba(0, 0, 0, 0.3)"
                                borderRadius="xl"
                                border="1px solid rgba(255,255,255,0.1)"
                                p={1}
                                pl={4}
                                transition="all 0.3s"
                                _focusWithin={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple' }}
                                align="center"
                            >
                                <Input
                                    flex="1"
                                    variant="unstyled"
                                    placeholder="Ask about audit scores, code quality, or student progress..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    py={3}
                                    color="white"
                                    fontSize="md"
                                    _placeholder={{ color: 'gray.500' }}
                                    isDisabled={loading}
                                />
                                <IconButton
                                    aria-label="Send"
                                    icon={loading ? <StopCircle size={20} /> : <Send size={20} />}
                                    type="submit"
                                    variant="ghost"
                                    color={prompt.trim() ? "purple.400" : "gray.600"}
                                    isLoading={loading}
                                    _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                    borderRadius="lg"
                                    isDisabled={!prompt.trim() && !loading}
                                    size="md"
                                    mr={1}
                                />
                            </Flex>
                        </form>
                    </Box>
                </MotionBox>
            </Container>
        </Layout>
    );
};

export default AIProjectAssistant;