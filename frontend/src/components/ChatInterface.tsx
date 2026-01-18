// frontend/src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, VStack, HStack, Text, Input, Avatar, Flex, Badge, Spinner, useToast, IconButton
} from '@chakra-ui/react';
import * as Lucide from "lucide-react";
import axios from 'axios';
import { motion } from 'framer-motion';

const { Send, Users, Hash, RefreshCw } = Lucide;
const MotionBox = motion(Box);

interface UserSimple {
    id: number;
    username: string;
    role: string;
}

interface Message {
    id: number;
    sender_username: string;
    content: string;
    timestamp: string;
    message_type: 'GUIDE_GROUP' | 'TEAM_GROUP' | 'DM';
}

interface ChatProps {
    projectId: number;
    currentUser: { id: number; username: string; role: string };
    teamMembers: UserSimple[];
}

const ChatInterface: React.FC<ChatProps> = ({ projectId, currentUser, teamMembers }) => {
    // --- UI STATE ---
    const [activeChannel, setActiveChannel] = useState<'GUIDE_GROUP' | 'TEAM_GROUP' | 'DM'>('GUIDE_GROUP');
    const [dmTargetId, setDmTargetId] = useState<number | null>(null);

    // --- DATA STATE ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    const getChannelName = () => {
        if (activeChannel === 'GUIDE_GROUP') return "Guide Group (Official)";
        if (activeChannel === 'TEAM_GROUP') return "Team Discussion (Private)";
        const target = teamMembers.find(m => m.id === dmTargetId);
        return target ? `DM: ${target.username}` : "Direct Message";
    };

    // --- FETCH LOGIC (Manual / On-Load Only) ---
    const fetchMessages = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!projectId) return;

            const params = new URLSearchParams();
            params.append('type', activeChannel);
            if (activeChannel === 'DM' && dmTargetId) {
                params.append('target_user_id', dmTargetId.toString());
            }

            const response = await axios.get(
                `http://127.0.0.1:8000/projects/${projectId}/messages/?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Deduplicate
            const uniqueMsgs = response.data.filter((msg: Message, index: number, self: Message[]) =>
                index === self.findIndex((m) => m.id === msg.id)
            );

            setMessages(uniqueMsgs);

        } catch (err) {
            console.error("Chat load error", err);
            toast({ title: "Failed to load messages", status: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // --- SEND LOGIC ---
    const handleSend = async () => {
        if (!newMessage.trim()) return;
        try {
            const token = localStorage.getItem('accessToken');
            const payload: any = { content: newMessage, message_type: activeChannel };

            if (activeChannel === 'DM' && dmTargetId) {
                payload.recipient_id = dmTargetId;
            }

            await axios.post(
                `http://127.0.0.1:8000/projects/${projectId}/messages/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNewMessage('');
            fetchMessages(); // Refresh immediately after sending

        } catch (err) {
            toast({ title: "Send failed", status: "error" });
        }
    };

    // --- EFFECTS ---
    // Load messages when channel changes
    useEffect(() => {
        setLoading(true);
        fetchMessages();
    }, [activeChannel, dmTargetId, projectId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);


    return (
        <Flex
            h="600px"
            className="glass-card"
            borderRadius="xl"
            overflow="hidden"
            border="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="0 0 40px rgba(0,0,0,0.5)"
        >

            {/* === LEFT SIDEBAR === */}
            <Box
                w="280px"
                bg="rgba(0, 0, 0, 0.3)"
                borderRight="1px solid"
                borderColor="whiteAlpha.100"
                display="flex"
                flexDirection="column"
                backdropFilter="blur(10px)"
            >
                <Box p={5} borderBottom="1px solid" borderColor="whiteAlpha.100">
                    <Text fontWeight="bold" color="cyan.300" letterSpacing="wider" fontSize="sm">CHANNELS</Text>
                </Box>

                <VStack spacing={1} align="stretch" overflowY="auto" flex="1" p={2}>
                    <MotionBox
                        whileHover={{ x: 5 }}
                        p={3} cursor="pointer"
                        bg={activeChannel === 'GUIDE_GROUP' ? 'whiteAlpha.200' : 'transparent'}
                        onClick={() => { setActiveChannel('GUIDE_GROUP'); setDmTargetId(null); }}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={activeChannel === 'GUIDE_GROUP' ? 'purple.500' : 'transparent'}
                        transition="all 0.2s"
                    >
                        <HStack>
                            <Flex p={2} bg="purple.500" borderRadius="md" color="white" boxShadow="0 0 10px purple">
                                <Users size={16} />
                            </Flex>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="bold" color="white">Guide Group</Text>
                                <Text fontSize="xs" color="gray.400">Official Updates</Text>
                            </VStack>
                        </HStack>
                    </MotionBox>

                    {currentUser.role === 'Student' && (
                        <MotionBox
                            whileHover={{ x: 5 }}
                            p={3} cursor="pointer"
                            bg={activeChannel === 'TEAM_GROUP' ? 'whiteAlpha.200' : 'transparent'}
                            onClick={() => { setActiveChannel('TEAM_GROUP'); setDmTargetId(null); }}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={activeChannel === 'TEAM_GROUP' ? 'cyan.500' : 'transparent'}
                            transition="all 0.2s"
                        >
                            <HStack>
                                <Flex p={2} bg="cyan.600" borderRadius="md" color="white" boxShadow="0 0 10px cyan">
                                    <Hash size={16} />
                                </Flex>
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="bold" color="white">Team Chat</Text>
                                    <Text fontSize="xs" color="gray.400">Private Discussion</Text>
                                </VStack>
                            </HStack>
                        </MotionBox>
                    )}

                    <Text px={3} py={2} fontSize="xs" color="gray.500" fontWeight="bold" mt={4} letterSpacing="wider">DIRECT MESSAGES</Text>

                    {teamMembers
                        .filter(m => m.id !== currentUser.id)
                        .map(member => (
                            <MotionBox
                                key={member.id}
                                whileHover={{ x: 5 }}
                                p={3} cursor="pointer"
                                bg={activeChannel === 'DM' && dmTargetId === member.id ? 'whiteAlpha.200' : 'transparent'}
                                onClick={() => { setActiveChannel('DM'); setDmTargetId(member.id); }}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor={activeChannel === 'DM' && dmTargetId === member.id ? 'blue.500' : 'transparent'}
                                transition="all 0.2s"
                            >
                                <HStack>
                                    <Avatar
                                        name={member.username}
                                        size="sm"
                                        bg={member.role === 'Teacher' ? 'orange.500' : 'blue.500'}
                                        border="2px solid"
                                        borderColor={member.role === 'Teacher' ? 'orange.300' : 'blue.300'}
                                    />
                                    <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" color="gray.200" fontWeight={activeChannel === 'DM' && dmTargetId === member.id ? "bold" : "normal"}>
                                            {member.username}
                                        </Text>
                                        <Badge fontSize="xx-small" colorScheme={member.role === 'Teacher' ? 'orange' : 'blue'} variant="solid">
                                            {member.role}
                                        </Badge>
                                    </VStack>
                                </HStack>
                            </MotionBox>
                        ))}
                </VStack>
            </Box>

            {/* === RIGHT CHAT AREA === */}
            <Flex direction="column" flex="1" bg="rgba(0,0,0,0.2)">

                {/* HEADER */}
                <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100" bg="rgba(0,0,0,0.2)">
                    <HStack justify="space-between">
                        <HStack>
                            <Text fontWeight="bold" color="white" fontSize="lg">{getChannelName()}</Text>
                            {activeChannel === 'GUIDE_GROUP' && <Badge colorScheme="purple">Official</Badge>}
                            {activeChannel === 'TEAM_GROUP' && <Badge colorScheme="cyan">Private</Badge>}
                        </HStack>

                        <IconButton
                            aria-label="Refresh Chat"
                            icon={<RefreshCw size={16} />}
                            size="sm"
                            colorScheme="whiteAlpha"
                            variant="ghost"
                            isLoading={refreshing}
                            onClick={() => fetchMessages(true)}
                            _hover={{ bg: "whiteAlpha.200", transform: "rotate(180deg)" }}
                            transition="all 0.5s"
                        />
                    </HStack>
                </Box>

                {/* MESSAGES LIST */}
                <Box
                    flex="1"
                    overflowY="auto"
                    p={6}
                    ref={scrollRef}
                    css={{
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.1)' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '3px' }
                    }}
                >
                    {loading && messages.length === 0 ? (
                        <Flex h="full" align="center" justify="center" direction="column">
                            <Spinner size="xl" color="cyan.400" thickness="4px" mb={4} />
                            <Text color="cyan.200" fontSize="sm">Decrypting messages...</Text>
                        </Flex>
                    ) : messages.length === 0 ? (
                        <Flex h="full" align="center" justify="center" color="gray.500" direction="column">
                            <Box p={6} borderRadius="full" bg="whiteAlpha.100" mb={4}>
                                <Lucide.MessageSquare size={32} color="gray" />
                            </Box>
                            <Text>No messages here yet.</Text>
                            <Text fontSize="sm">Start the conversation!</Text>
                        </Flex>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {messages.map((msg) => {
                                const isMe = msg.sender_username === currentUser.username;
                                return (
                                    <MotionBox
                                        key={`${msg.id}-${msg.timestamp}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        display="flex"
                                        justifyContent={isMe ? 'flex-end' : 'flex-start'}
                                    >
                                        {!isMe && (
                                            <Avatar
                                                size="sm"
                                                name={msg.sender_username}
                                                mr={3}
                                                mt={1}
                                                border="2px solid"
                                                borderColor="whiteAlpha.300"
                                            />
                                        )}
                                        <Box
                                            maxW="70%"
                                            bg={isMe ? 'linear-gradient(135deg, #3182CE 0%, #00B5D8 100%)' : 'rgba(255,255,255,0.1)'}
                                            p={4}
                                            borderRadius="2xl"
                                            borderTopLeftRadius={!isMe ? 0 : '2xl'}
                                            borderTopRightRadius={isMe ? 0 : '2xl'}
                                            boxShadow={isMe ? '0 4px 15px rgba(49, 130, 206, 0.4)' : 'none'}
                                            backdropFilter="blur(5px)"
                                            border="1px solid"
                                            borderColor={isMe ? 'transparent' : 'whiteAlpha.100'}
                                        >
                                            {!isMe && <Text fontSize="xs" color="cyan.300" fontWeight="bold" mb={1}>{msg.sender_username}</Text>}
                                            <Text fontSize="sm" color="white" lineHeight="tall">{msg.content}</Text>
                                            <Text fontSize="10px" color={isMe ? "whiteAlpha.800" : "gray.400"} textAlign="right" mt={2}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </Box>
                                    </MotionBox>
                                );
                            })}
                        </VStack>
                    )}
                </Box>

                {/* INPUT AREA */}
                <HStack p={4} bg="rgba(0,0,0,0.3)" borderTop="1px solid" borderColor="whiteAlpha.100" spacing={4}>
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${activeChannel === 'DM' ? 'user' : 'group'}...`}
                        bg="whiteAlpha.100"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        color="white"
                        _hover={{ borderColor: 'cyan.400', bg: 'whiteAlpha.200' }}
                        _focus={{ borderColor: 'cyan.400', boxShadow: '0 0 0 1px cyan', bg: 'whiteAlpha.200' }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        borderRadius="full"
                        py={6}
                        px={6}
                    />
                    <IconButton
                        aria-label="Send Message"
                        icon={<Send size={20} />}
                        colorScheme="cyan"
                        onClick={handleSend}
                        isDisabled={!newMessage.trim()}
                        borderRadius="full"
                        size="lg"
                        bgGradient="linear(to-r, cyan.400, blue.500)"
                        _hover={{ bgGradient: "linear(to-r, cyan.300, blue.400)", transform: "scale(1.05)" }}
                        boxShadow="0 0 15px cyan"
                    />
                </HStack>
            </Flex>
        </Flex>
    );
};

export default ChatInterface;