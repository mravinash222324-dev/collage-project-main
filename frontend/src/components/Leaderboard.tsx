import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Avatar,
    Badge,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Spinner,
    useToast,
    Flex
} from '@chakra-ui/react';
import { Trophy, Medal, Crown } from 'lucide-react';
import axios from 'axios';
import Layout from './Layout';
import { motion } from 'framer-motion';

const MotionTr = motion(Tr);

interface LeaderboardEntry {
    student_name: string;
    student_full_name: string;
    total_xp: number;
    level: number;
    badges_count: number;
}

const Leaderboard: React.FC = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get('http://127.0.0.1:8000/gamification/leaderboard/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(res.data);
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to load leaderboard', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown size={24} color="#ECC94B" fill="#ECC94B" />; // Gold
            case 1: return <Medal size={24} color="#C0C0C0" />; // Silver
            case 2: return <Medal size={24} color="#CD7F32" />; // Bronze
            default: return <Text fontWeight="bold" color="gray.500">#{index + 1}</Text>;
        }
    };

    return (
        <Layout userRole="Student">
            <Box maxW="1200px" mx="auto" p={6}>
                <VStack spacing={8} align="stretch">
                    <Box textAlign="center" mb={6}>
                        <Heading size="2xl" bgGradient="linear(to-r, yellow.400, orange.500)" bgClip="text" letterSpacing="tight">
                            Global Leaderboard
                        </Heading>
                        <Text color="gray.400" fontSize="lg" mt={2}>
                            Top performing students in the Neural Nexus
                        </Text>
                    </Box>

                    {loading ? (
                        <Flex justify="center" align="center" h="300px">
                            <Spinner size="xl" color="yellow.500" />
                        </Flex>
                    ) : (
                        <Box
                            bg="rgba(255, 255, 255, 0.05)"
                            backdropFilter="blur(10px)"
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            overflow="hidden"
                            boxShadow="xl"
                        >
                            <Table variant="simple">
                                <Thead bg="whiteAlpha.100">
                                    <Tr>
                                        <Th color="gray.300">Rank</Th>
                                        <Th color="gray.300">Student</Th>
                                        <Th color="gray.300" isNumeric>Level</Th>
                                        <Th color="gray.300" isNumeric>Total XP</Th>
                                        <Th color="gray.300" isNumeric>Badges</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {entries.map((entry, index) => (
                                        <MotionTr
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            _hover={{ bg: 'whiteAlpha.100' }}
                                        >
                                            <Td>
                                                <Flex align="center" justify="center" w="40px">
                                                    {getRankIcon(index)}
                                                </Flex>
                                            </Td>
                                            <Td>
                                                <HStack spacing={3}>
                                                    <Avatar size="sm" name={entry.student_full_name} bg={`blue.${500 - (index * 50)}`} />
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="bold" color={index < 3 ? "white" : "gray.300"}>
                                                            {entry.student_full_name}
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500">@{entry.student_name}</Text>
                                                    </VStack>
                                                </HStack>
                                            </Td>
                                            <Td isNumeric>
                                                <Badge colorScheme="purple" variant="solid" borderRadius="full" px={2}>
                                                    Lvl {entry.level}
                                                </Badge>
                                            </Td>
                                            <Td isNumeric fontWeight="bold" color="yellow.300">
                                                {entry.total_xp.toLocaleString()} XP
                                            </Td>
                                            <Td isNumeric>
                                                <HStack justify="flex-end">
                                                    <Text>{entry.badges_count}</Text>
                                                    <Trophy size={14} color="#CBD5E0" />
                                                </HStack>
                                            </Td>
                                        </MotionTr>
                                    ))}
                                </Tbody>
                            </Table>
                        </Box>
                    )}
                </VStack>
            </Box>
        </Layout>
    );
};

export default Leaderboard;
