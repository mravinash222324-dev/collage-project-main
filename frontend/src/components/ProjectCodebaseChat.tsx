
import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Input,
    Button,
    Text,
    useToast,
    IconButton,
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Spinner,
    Avatar
} from '@chakra-ui/react';
import { Send, MessageSquare, Bot, User } from 'lucide-react';
import axios from 'axios';
// import ReactMarkdown from 'react-markdown'; // Optional if you have it

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface ProjectCodebaseChatProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
}

const ProjectCodebaseChat: React.FC<ProjectCodebaseChatProps> = ({ isOpen, onClose, projectId }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hello! I am your Codebase Assistant. Ask me anything about your project code (e.g., "How does login work?", "Where is the database config?").' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.post(
                `http://127.0.0.1:8000/projects/${projectId}/chat-codebase/`,
                { query: userMsg },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.answer) {
                setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't find an answer in the codebase." }]);
            }

        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to chat with codebase.',
                status: 'error'
            });
            setMessages(prev => [...prev, { role: 'ai', content: "Error communicating with the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
            <DrawerOverlay />
            <DrawerContent bg="gray.900" color="white">
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px" borderColor="gray.700">
                    <HStack>
                        <Bot color="#9F7AEA" />
                        <Text>Chat with Codebase</Text>
                    </HStack>
                </DrawerHeader>

                <DrawerBody>
                    <VStack spacing={4} align="stretch" pb={4}>
                        {messages.map((msg, index) => (
                            <HStack key={index} alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'} align="start">
                                {msg.role === 'ai' && <Avatar icon={<Bot size={20} />} bg="purple.600" size="sm" mt={1} />}
                                <Box
                                    bg={msg.role === 'user' ? 'blue.600' : 'gray.700'}
                                    color="white"
                                    px={4}
                                    py={2}
                                    borderRadius="lg"
                                    maxW="80%"
                                >
                                    <Text fontSize="sm" whiteSpace="pre-wrap">{msg.content}</Text>
                                </Box>
                                {msg.role === 'user' && <Avatar icon={<User size={20} />} bg="blue.500" size="sm" mt={1} />}
                            </HStack>
                        ))}
                        {isLoading && (
                            <HStack alignSelf="flex-start">
                                <Avatar icon={<Bot size={20} />} bg="purple.600" size="sm" />
                                <Box bg="gray.700" px={4} py={2} borderRadius="lg">
                                    <Spinner size="sm" />
                                </Box>
                            </HStack>
                        )}
                    </VStack>
                </DrawerBody>

                <DrawerFooter borderTopWidth="1px" borderColor="gray.700">
                    <HStack w="full">
                        <Input
                            placeholder="Ask about your code..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            bg="gray.800"
                            border="none"
                            _focus={{ ring: 1, ringColor: "purple.500" }}
                        />
                        <IconButton
                            aria-label="Send"
                            icon={<Send size={20} />}
                            colorScheme="purple"
                            onClick={handleSend}
                            isLoading={isLoading}
                        />
                    </HStack>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

export default ProjectCodebaseChat;
