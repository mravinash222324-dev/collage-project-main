import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box,
    Flex,
    Input,
    IconButton,
    Text,
    VStack,
    HStack,
    Avatar
} from '@chakra-ui/react';
import api from '../config/api';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const MotionBox = motion(Box);

const ProjectMentor: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Hi! I'm your AI Project Mentor. I know all about your project and performance. Ask me anything!",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post('/ai/mentor-chat/', { message: userMsg.text });

            const aiMsg: Message = {
                id: Date.now() + 1,
                text: response.data.mentor_response,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Mentor chat error:", error);
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting to the mentor service right now.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <>
            {/* Floating Action Button */}
            <MotionBox
                position="fixed"
                bottom="6"
                right="6"
                zIndex={1000}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <IconButton
                    aria-label="Open Project Mentor"
                    icon={<Sparkles size={24} />}
                    onClick={() => setIsOpen(true)}
                    isRound
                    size="lg"
                    bgGradient="linear(to-r, purple.500, blue.500)"
                    color="white"
                    shadow="lg"
                    _hover={{ bgGradient: "linear(to-r, purple.600, blue.600)" }}
                />
            </MotionBox>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <MotionBox
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        position="fixed"
                        bottom="24"
                        right="6"
                        w="380px"
                        h="600px"
                        bg="gray.900"
                        borderColor="whiteAlpha.200"
                        borderWidth="1px"
                        borderRadius="2xl"
                        shadow="2xl"
                        zIndex={1000}
                        display="flex"
                        flexDirection="column"
                        overflow="hidden"
                        backdropFilter="blur(10px)"
                    >
                        {/* Header */}
                        <Flex
                            p={4}
                            bg="whiteAlpha.100"
                            borderBottomWidth="1px"
                            borderColor="whiteAlpha.100"
                            justify="space-between"
                            align="center"
                        >
                            <HStack spacing={3}>
                                <Box p={2} bg="purple.500" borderRadius="lg">
                                    <Bot size={20} color="white" />
                                </Box>
                                <Box>
                                    <Text fontWeight="bold" color="white">Project Mentor</Text>
                                    <Text fontSize="xs" color="gray.400">Context-Aware AI Assistant</Text>
                                </Box>
                            </HStack>
                            <IconButton
                                aria-label="Close"
                                icon={<X size={20} />}
                                size="sm"
                                variant="ghost"
                                color="gray.400"
                                onClick={() => setIsOpen(false)}
                                _hover={{ bg: "whiteAlpha.200" }}
                            />
                        </Flex>

                        {/* Messages Area */}
                        <VStack
                            flex={1}
                            overflowY="auto"
                            p={4}
                            spacing={4}
                            align="stretch"
                            css={{
                                '&::-webkit-scrollbar': { width: '4px' },
                                '&::-webkit-scrollbar-track': { width: '6px' },
                                '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '24px' },
                            }}
                        >
                            {messages.map((msg) => (
                                <Flex
                                    key={msg.id}
                                    direction={msg.sender === 'user' ? 'row-reverse' : 'row'}
                                    gap={3}
                                >
                                    <Avatar
                                        size="sm"
                                        icon={msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        bg={msg.sender === 'user' ? 'blue.500' : 'purple.500'}
                                    />
                                    <Box
                                        maxW="80%"
                                        p={3}
                                        borderRadius="2xl"
                                        borderTopRightRadius={msg.sender === 'user' ? 'none' : '2xl'}
                                        borderTopLeftRadius={msg.sender === 'ai' ? 'none' : '2xl'}
                                        bg={msg.sender === 'user' ? 'blue.600' : 'whiteAlpha.200'}
                                        color={msg.sender === 'user' ? 'white' : 'gray.200'}
                                    >
                                        <Text fontSize="sm" whiteSpace="pre-wrap">{msg.text}</Text>
                                        <Text fontSize="xs" opacity={0.5} mt={1} textAlign="right">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Box>
                                </Flex>
                            ))}
                            {isLoading && (
                                <Flex gap={3}>
                                    <Avatar size="sm" icon={<Bot size={16} />} bg="purple.500" />
                                    <Box p={3} bg="whiteAlpha.200" borderRadius="2xl" borderTopLeftRadius="none">
                                        <HStack spacing={1}>
                                            <MotionBox w="2" h="2" bg="purple.400" borderRadius="full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                                            <MotionBox w="2" h="2" bg="purple.400" borderRadius="full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} />
                                            <MotionBox w="2" h="2" bg="purple.400" borderRadius="full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                        </HStack>
                                    </Box>
                                </Flex>
                            )}
                            <div ref={messagesEndRef} />
                        </VStack>

                        {/* Input Area */}
                        <Box p={4} bg="whiteAlpha.100" borderTopWidth="1px" borderColor="whiteAlpha.100">
                            <HStack>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about your project..."
                                    bg="blackAlpha.300"
                                    border="none"
                                    color="white"
                                    _focus={{ bg: "blackAlpha.500", ring: 1, ringColor: "purple.500" }}
                                    borderRadius="xl"
                                />
                                <IconButton
                                    aria-label="Send"
                                    icon={<Send size={20} />}
                                    onClick={handleSend}
                                    isDisabled={isLoading || !input.trim()}
                                    colorScheme="purple"
                                    borderRadius="xl"
                                />
                            </HStack>
                        </Box>
                    </MotionBox>
                )}
            </AnimatePresence>
        </>
    );
};

export default ProjectMentor;
