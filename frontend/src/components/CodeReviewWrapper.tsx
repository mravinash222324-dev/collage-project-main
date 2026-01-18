import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';

const CodeReviewWrapper: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProjectAndRedirect = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    navigate('/login');
                    return;
                }

                // Try to get the student's project
                const response = await axios.get('http://127.0.0.1:8000/projects/my_project/', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data && response.data.id) {
                    navigate(`/projects/${response.data.id}/code-review`);
                } else {
                    setError('No active project found.');
                }
            } catch (err) {
                console.error(err);
                // Fallback: try listing projects
                try {
                    const token = localStorage.getItem('accessToken');
                    const response = await axios.get('http://127.0.0.1:8000/projects/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.data && response.data.length > 0) {
                        navigate(`/projects/${response.data[0].id}/code-review`);
                    } else {
                        setError('You are not assigned to any project yet.');
                    }
                } catch (e) {
                    setError('Failed to load project information.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProjectAndRedirect();
    }, [navigate]);

    if (loading) {
        return (
            <Center h="100vh" bg="gray.900">
                <Spinner size="xl" color="cyan.400" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center h="100vh" bg="gray.900" color="white">
                <VStack spacing={4}>
                    <Text fontSize="xl" color="red.400">{error}</Text>
                    <Text color="gray.400">Please contact your teacher or administrator.</Text>
                </VStack>
            </Center>
        );
    }

    return null;
};

export default CodeReviewWrapper;
