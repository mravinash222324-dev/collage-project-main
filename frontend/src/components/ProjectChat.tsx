import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Flex,
    Spinner,
    useToast,
    Container,
    Button
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import Layout from './Layout';
import ChatInterface from './ChatInterface';

const ProjectChat: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) { navigate('/'); return; }

                // 1. Get Current User Info (decode token or fetch profile)
                // For now, we'll use localStorage if available, or fetch from a profile endpoint
                // Assuming we have username and role in localStorage for simplicity, 
                // but ideally we should fetch from /auth/users/me/
                const storedUsername = localStorage.getItem('username');
                const storedRole = localStorage.getItem('userRole');

                // Fetch user profile to get ID
                const userRes = await axios.get('http://127.0.0.1:8000/auth/users/me/', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const user = {
                    id: userRes.data.id,
                    username: userRes.data.username || storedUsername,
                    role: storedRole || 'Student' // Default to Student if not found
                };
                setCurrentUser(user);

                // 2. Get Project Details to find Team Members
                // We'll try to get it from the student submissions list
                const listResponse = await axios.get('http://127.0.0.1:8000/student/submissions/', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // FIX: Match against p.project_id because the URL contains the Real Project ID
                const foundProject = listResponse.data.find((p: any) => p.project_id === Number(projectId));

                if (foundProject) {
                    // Use the team_members from the serializer
                    const members = foundProject.team_members || [currentUser];
                    setTeamMembers(members);
                } else {
                    toast({ title: 'Project not found', status: 'error' });
                    navigate('/student-dashboard');
                }

            } catch (err) {
                console.error(err);
                toast({ title: 'Failed to load chat data', status: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, navigate, toast]);

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
                <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={20} />}
                    mb={6}
                    onClick={() => navigate(`/student/project-view/${projectId}`)}
                    color="gray.400"
                    _hover={{ color: "white", bg: "whiteAlpha.200" }}
                >
                    Back to Project Details
                </Button>

                <Box h="600px">
                    {currentUser && (
                        <ChatInterface
                            projectId={Number(projectId)}
                            currentUser={currentUser}
                            teamMembers={teamMembers}
                        />
                    )}
                </Box>
            </Container>
        </Layout>
    );
};

export default ProjectChat;
