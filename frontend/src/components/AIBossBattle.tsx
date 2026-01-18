import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    Box,
    VStack,
    HStack,
    Text,
    Input,
    Button,
    Progress,
    Flex,
    Heading,
    useToast,
    Badge,
    Spinner
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Send, ShieldAlert, Skull, Zap } from 'lucide-react';
import axios from 'axios';

const MotionBox = motion(Box);

interface AIBossBattleProps {
    project: {
        title: string;
        abstract: string;
        tech_stack?: string; // Assuming this might be available or we pass a default
    };
    onClose: () => void;
}

interface BattleLog {
    sender: 'AI' | 'User';
    message: string;
    damage?: number;
}

const AIBossBattle: React.FC<AIBossBattleProps> = ({ project, onClose }) => {
    const [userHP, setUserHP] = useState(100);
    const [aiHP, setAiHP] = useState(100);
    const [logs, setLogs] = useState<BattleLog[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gameStatus, setGameStatus] = useState<'start' | 'battle' | 'victory' | 'defeat'>('start');
    const [currentQuestion, setCurrentQuestion] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const toast = useToast();

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Play Welcome Audio on component mount
    useEffect(() => {
        speakBossLine("Welcome challenger. Prepare to have your code deprecated.");

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, []);

    // Voice Effect (Groq TTS)
    const speakBossLine = (text: string) => {
        console.log("🔊 speakBossLine called with:", text);
        if (!text) return;

        try {
            // Stop and cleanup previous audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }

            const url = `http://127.0.0.1:8001/generate-voice-get?text=${encodeURIComponent(text)}&voice=troy`;
            console.log("🔗 Audio URL:", url);

            const audio = new Audio(url);
            audioRef.current = audio;
            audio.play()
                .then(() => console.log("✅ Audio started playing"))
                .catch(e => {
                    if (e.name !== 'AbortError') {
                        console.error("❌ Audio play failed:", e);
                    }
                });
        } catch (error) {
            console.error("Boss voice failed:", error);
        }
    };

    const startBattle = async () => {
        setLoading(true);
        try {
            const payload = {
                title: project.title,
                abstract: project.abstract,
                tech_stack: project.tech_stack || "Python, React, Django" // Default if not provided
            };

            const res = await axios.post('http://127.0.0.1:8001/start-boss-battle', payload);

            if (res.data.error) throw new Error(res.data.error);

            setLogs([
                { sender: 'AI', message: res.data.opening_line },
                { sender: 'AI', message: res.data.first_question }
            ]);
            setCurrentQuestion(res.data.first_question);
            setGameStatus('battle');

            // Speak intro
            speakBossLine(`${res.data.opening_line}. ${res.data.first_question}`);

        } catch (error) {
            toast({ title: 'Failed to enter the arena', status: 'error' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTurn = async () => {
        if (!input.trim()) return;

        const userMove = input;
        setInput('');
        setLogs(prev => [...prev, { sender: 'User', message: userMove }]);
        setLoading(true);

        try {
            const payload = {
                question: currentQuestion,
                user_answer: userMove,
                project_context: `Title: ${project.title}. Abstract: ${project.abstract}`
            };

            const res = await axios.post('http://127.0.0.1:8001/boss-battle-turn', payload);

            if (res.data.error) throw new Error(res.data.error);

            const { user_damage, ai_damage, feedback, next_question } = res.data;

            // Apply Damage
            if (user_damage > 0) {
                setUserHP(prev => Math.max(0, prev - user_damage));
                setLogs(prev => [...prev, { sender: 'AI', message: `⚠️ ${feedback}`, damage: user_damage }]);
            }

            if (ai_damage > 0) {
                setAiHP(prev => Math.max(0, prev - ai_damage));
                // Visual feedback for AI damage could be added here
            }

            // Speak feedback and next question
            // If the game ends, maybe speak something else?
            // For now, let's speak response if game continues
            if (aiHP - ai_damage > 0 && userHP - user_damage > 0) {
                speakBossLine(`${feedback}. ${next_question}`);
            }

            // Check Win/Loss
            if (aiHP - ai_damage <= 0) {
                setGameStatus('victory');
                speakBossLine("Impossible... I fade... into... legacy code...");
                return;
            }
            if (userHP - user_damage <= 0) {
                setGameStatus('defeat');
                speakBossLine("Fatal Error. Your skills are insufficient. System shutdown imminent.");
                return;
            }

            // Next Turn
            setLogs(prev => [...prev, { sender: 'AI', message: next_question }]);
            setCurrentQuestion(next_question);

        } catch (error) {
            toast({ title: 'Battle Error', status: 'error' });
        } finally {
            setLoading(false);
        }
    };


    return ReactDOM.createPortal(
        <Box
            position="fixed"
            top="0"
            left="0"
            w="100vw"
            h="100vh"
            bg="black"
            zIndex={9999}
            color="white"
            fontFamily="monospace"
        >
            {/* --- HUD --- */}
            <Flex p={6} justify="space-between" align="center" bg="whiteAlpha.100" borderBottom="1px solid" borderColor="whiteAlpha.200">
                {/* User Health */}
                <VStack align="start" w="40%">
                    <HStack>
                        <ShieldAlert color={userHP < 30 ? "red" : "#63B3ED"} />
                        <Text fontWeight="bold" color="blue.300">YOU (DEFENDER)</Text>
                    </HStack>
                    <Progress value={userHP} colorScheme={userHP < 30 ? "red" : "blue"} size="lg" w="full" hasStripe isAnimated />
                    <Text fontSize="xs">{userHP}/100 HP</Text>
                </VStack>

                {/* VS Badge */}
                <Badge fontSize="xl" colorScheme="red" variant="solid" px={4} py={1} borderRadius="full">VS</Badge>

                {/* AI Health */}
                <VStack align="end" w="40%">
                    <HStack>
                        <Text fontWeight="bold" color="red.300">THE DEPRECATOR</Text>
                        <Skull color="#F56565" />
                    </HStack>
                    <Progress value={aiHP} colorScheme="red" size="lg" w="full" hasStripe isAnimated transform="scaleX(-1)" />
                    <Text fontSize="xs">{aiHP}/100 HP</Text>
                </VStack>
            </Flex>

            {/* --- Battle Arena --- */}
            <Flex direction="column" h="calc(100vh - 200px)" maxW="800px" mx="auto" p={6}>

                {gameStatus === 'start' && (
                    <VStack justify="center" h="full" spacing={6}>
                        <Skull size={80} color="#F56565" />
                        <Heading size="2xl" color="red.500" textAlign="center">THE ARENA AWAITS</Heading>
                        <Text fontSize="xl" color="gray.400" textAlign="center">
                            Defend your project logic against The Deprecator.<br />
                            Weak arguments will cost you credibility.
                        </Text>
                        <Button
                            size="lg"
                            colorScheme="red"
                            variant="outline"
                            onClick={startBattle}
                            isLoading={loading}
                            loadingText="Summoning Boss..."
                            _hover={{ bg: 'red.900', borderColor: 'red.500' }}
                        >
                            ENTER THE ARENA
                        </Button>
                        <Button variant="ghost" color="gray.500" onClick={onClose}>Run Away</Button>
                    </VStack>
                )}

                {gameStatus === 'battle' && (
                    <>
                        <Box flex={1} overflowY="auto" mb={4} ref={scrollRef} css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#555' } }}>
                            <VStack spacing={4} align="stretch">
                                {logs.map((log, i) => (
                                    <MotionBox
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        alignSelf={log.sender === 'User' ? 'flex-end' : 'flex-start'}
                                        bg={log.sender === 'User' ? 'blue.900' : 'red.900'}
                                        p={4}
                                        borderRadius="lg"
                                        maxW="80%"
                                        border="1px solid"
                                        borderColor={log.sender === 'User' ? 'blue.700' : 'red.700'}
                                    >
                                        <HStack mb={1}>
                                            {log.sender === 'AI' ? <Skull size={16} color="#FC8181" /> : <Zap size={16} color="#63B3ED" />}
                                            <Text fontSize="xs" fontWeight="bold" color={log.sender === 'User' ? 'blue.200' : 'red.200'}>
                                                {log.sender === 'AI' ? 'THE DEPRECATOR' : 'YOU'}
                                            </Text>
                                        </HStack>
                                        <Text color="whiteAlpha.900">{log.message}</Text>
                                        {log.damage && (
                                            <Text color="red.400" fontWeight="bold" mt={1} fontSize="sm">
                                                💥 You took {log.damage} damage!
                                            </Text>
                                        )}
                                    </MotionBox>
                                ))}
                                {loading && (
                                    <HStack alignSelf="flex-start" p={4}>
                                        <Spinner size="sm" color="red.500" />
                                        <Text color="gray.500" fontSize="sm">The Deprecator is judging you...</Text>
                                    </HStack>
                                )}
                            </VStack>
                        </Box>

                        <HStack spacing={2}>
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your defense..."
                                bg="gray.900"
                                border="1px solid"
                                borderColor="gray.700"
                                _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                                onKeyPress={(e) => e.key === 'Enter' && handleTurn()}
                                isDisabled={loading}
                            />
                            <Button
                                colorScheme="blue"
                                onClick={handleTurn}
                                isLoading={loading}
                                rightIcon={<Send size={16} />}
                            >
                                Defend
                            </Button>
                        </HStack>
                    </>
                )}

                {gameStatus === 'victory' && (
                    <VStack justify="center" h="full" spacing={6}>
                        <Zap size={80} color="#F6E05E" />
                        <Heading size="2xl" color="yellow.400" textAlign="center">VICTORY!</Heading>
                        <Text fontSize="xl" color="gray.300" textAlign="center">
                            You have successfully defended your architecture.<br />
                            The Deprecator retreats into the void.
                        </Text>
                        <Button colorScheme="yellow" onClick={onClose}>Claim Glory (Exit)</Button>
                    </VStack>
                )}

                {gameStatus === 'defeat' && (
                    <VStack justify="center" h="full" spacing={6}>
                        <Skull size={80} color="#A0AEC0" />
                        <Heading size="2xl" color="gray.500" textAlign="center">DEFEATED</Heading>
                        <Text fontSize="xl" color="gray.400" textAlign="center">
                            Your arguments crumbled under pressure.<br />
                            Refactor your logic and try again.
                        </Text>
                        <Button colorScheme="gray" onClick={onClose}>Retreat (Exit)</Button>
                    </VStack>
                )}

            </Flex>
        </Box>,
        document.body
    );
};

export default AIBossBattle;
