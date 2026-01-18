import React, { useState, useEffect } from 'react';
import { Box, Container, Heading, Spinner, Center, useToast } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import CheckpointList from './CheckpointList';

const MotionBox = motion(Box);

interface Project {
    id: number;
    title: string;
    checkpoints: any[];
}

const Checkpoints: React.FC = () => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const fetchProjectData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            // Assuming the student has one active project or we get the first one
            // We might need a specific endpoint for "my project"
            const response = await axios.get('http://127.0.0.1:8000/projects/my_project/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProject(response.data);
        } catch (err) {
            console.error(err);
            // Fallback: try listing projects and picking the first one
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://127.0.0.1:8000/projects/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && response.data.length > 0) {
                    setProject(response.data[0]);
                }
            } catch (e) {
                toast({ title: 'Failed to load project data', status: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, []);

    return (
        <Container maxW="container.xl" py={8}>
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Heading mb={6} bgGradient="linear(to-r, cyan.400, blue.400)" bgClip="text">
                    Project Checkpoints
                </Heading>

                <Box
                    bg="rgba(28, 38, 78, 0.5)"
                    backdropFilter="blur(20px)"
                    borderRadius="xl"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    p={6}
                    boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                    minH="400px"
                >
                    {loading ? (
                        <Center h="full" minH="200px">
                            <Spinner size="xl" color="cyan.400" />
                        </Center>
                    ) : project ? (
                        <CheckpointList
                            checkpoints={project.checkpoints}
                            projectId={project.id}
                            onUpdate={fetchProjectData}
                        />
                    ) : (
                        <Center h="full" minH="200px" color="gray.400">
                            No active project found.
                        </Center>
                    )}
                </Box>
            </MotionBox>
        </Container>
    );
};

export default Checkpoints;
