import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, SimpleGrid, Text, Avatar, VStack, Badge, Center, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const MotionBox = motion(Box);

interface TeamMember {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface Project {
    id: number;
    title: string;
    team_members: TeamMember[];
}

const Team: React.FC = () => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://127.0.0.1:8000/projects/my_project/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProject(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    return (
        <Container maxW="container.xl" py={8}>
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Heading mb={6} bgGradient="linear(to-r, cyan.400, blue.400)" bgClip="text">
                    Team Members
                </Heading>

                <Box
                    bg="rgba(28, 38, 78, 0.5)"
                    backdropFilter="blur(20px)"
                    borderRadius="xl"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    p={8}
                    boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                    minH="400px"
                >
                    {loading ? (
                        <Center h="full" minH="200px">
                            <Spinner size="xl" color="cyan.400" />
                        </Center>
                    ) : project && project.team_members.length > 0 ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                            {project.team_members.map((member) => (
                                <MotionBox
                                    key={member.id}
                                    whileHover={{ y: -5 }}
                                    bg="whiteAlpha.100"
                                    p={6}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                    textAlign="center"
                                >
                                    <VStack spacing={4}>
                                        <Avatar size="xl" name={member.username} src={`https://ui-avatars.com/api/?name=${member.username}&background=0D8ABC&color=fff`} />
                                        <Box>
                                            <Heading size="md" color="white">{member.username}</Heading>
                                            <Text color="gray.400" fontSize="sm">{member.email}</Text>
                                        </Box>
                                        <Badge colorScheme="cyan" variant="solid" borderRadius="full" px={3}>
                                            {member.role || 'Member'}
                                        </Badge>
                                    </VStack>
                                </MotionBox>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Center h="full" minH="200px" flexDirection="column">
                            <Text color="gray.400" fontSize="lg">No team members found.</Text>
                            <Text color="gray.500" fontSize="sm">You might not be assigned to a project yet.</Text>
                        </Center>
                    )}
                </Box>
            </MotionBox>
        </Container>
    );
};

export default Team;
