import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    Badge,
    HStack,
    Icon,
    Spinner,
    Flex,
    Container,
    Button,
    useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';

const {
    FolderGit2,
    ArrowRight,
    Calendar,
    Plus
} = Lucide;

const MotionBox = motion(Box);

interface Project {
    id: number;
    title: string;
    abstract: string;
    status: 'In Progress' | 'Completed' | 'Pending' | 'Approved' | 'Rejected';
    created_at?: string;
}

const StudentMyProjects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) { navigate('/'); return; }

            const res = await axios.get('http://127.0.0.1:8000/student/submissions/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data);
        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to load projects', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'green';
            case 'In Progress': return 'blue';
            case 'Pending': return 'yellow';
            case 'Rejected': return 'red';
            default: return 'gray';
        }
    };

    if (loading) return (
        <Layout userRole="Student">
            <Flex h="80vh" align="center" justify="center">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
        </Layout>
    );

    return (
        <Layout userRole="Student">
            <Container maxW="container.xl" py={8}>
                <Flex justify="space-between" align="center" mb={8}>
                    <HStack>
                        <Icon as={FolderGit2} boxSize={8} color="blue.400" />
                        <Heading size="xl" bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text">
                            My Projects
                        </Heading>
                    </HStack>
                    <Button
                        leftIcon={<Plus size={20} />}
                        colorScheme="blue"
                        onClick={() => navigate('/submit')}
                    >
                        New Project
                    </Button>
                </Flex>

                {projects.length === 0 ? (
                    <Flex direction="column" align="center" justify="center" h="400px" className="glass-card" borderRadius="xl">
                        <FolderGit2 size={64} color="#4A5568" />
                        <Text color="gray.400" mt={4} fontSize="lg">You haven't submitted any projects yet.</Text>
                        <Button mt={6} colorScheme="blue" onClick={() => navigate('/submit')}>
                            Submit Your First Project
                        </Button>
                    </Flex>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {projects.map((project, idx) => (
                            <MotionBox
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card"
                                p={6}
                                position="relative"
                                overflow="hidden"
                                _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
                                cursor="pointer"
                                onClick={() => navigate(`/student/project-view/${project.id}`)}
                            >
                                <Flex justify="space-between" align="start" mb={4}>
                                    <Badge colorScheme={getStatusColor(project.status)} px={2} py={1} borderRadius="md">
                                        {project.status}
                                    </Badge>
                                    {project.created_at && (
                                        <HStack color="gray.500" fontSize="xs">
                                            <Calendar size={12} />
                                            <Text>{new Date(project.created_at).toLocaleDateString()}</Text>
                                        </HStack>
                                    )}
                                </Flex>

                                <Heading size="md" mb={3} noOfLines={2} color="white">
                                    {project.title}
                                </Heading>
                                <Text color="gray.400" fontSize="sm" noOfLines={3} mb={6}>
                                    {project.abstract}
                                </Text>

                                <Flex justify="flex-end" align="center" mt="auto">
                                    <Text color="blue.400" fontSize="sm" fontWeight="bold" mr={2}>View Details</Text>
                                    <ArrowRight size={16} color="#4299E1" />
                                </Flex>
                            </MotionBox>
                        ))}
                    </SimpleGrid>
                )}
            </Container>
        </Layout>
    );
};

export default StudentMyProjects;
