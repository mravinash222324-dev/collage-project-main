import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Flex,
    Heading,
    VStack,
    Text,
    useToast,
    FormControl,
    FormLabel,
    Textarea,
    Badge,
    HStack,
    Spinner,
    Card,
    CardBody,
    Divider,
    Icon,
    Input,
} from '@chakra-ui/react';
import * as Lucide from "lucide-react";
import Layout from './Layout';

const { Clock, Upload, CheckCircle, XCircle, FileText, ArrowLeft } = Lucide;

interface Assignment {
    id: number;
    title: string;
    description: string;
    assignment_type: 'Code' | 'Diagram' | 'Report' | 'Other';
    duration_minutes: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    is_submitted?: boolean;
}

const StudentAssignmentView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // ... (Effects remain same) ...

    useEffect(() => {
        if (id) {
            fetchAssignmentDetails(id);
        } else {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (assignment && assignment.is_active) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(assignment.end_time).getTime();
                const distance = end - now;

                if (distance < 0) {
                    clearInterval(interval);
                    setTimeLeft("Expired");
                } else {
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [assignment]);

    const fetchAssignmentDetails = async (assignmentId: string) => {
        setLoading(true);
        try {
            const response = await api.get('/assignments/list/');
            console.log("Fetching assignments for ID:", assignmentId);

            const found = response.data.find((a: Assignment) => a.id === parseInt(assignmentId));

            if (found) {
                setAssignment(found);
            } else {
                toast({ title: 'Assignment not found', status: 'error' });
            }
        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to load assignment details', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!assignment) return;
        if (!textContent && !file) {
            toast({ title: 'Please provide text or upload a file', status: 'warning' });
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            if (file) formData.append('file', file);
            if (textContent) formData.append('text_content', textContent);

            await api.post(
                `/assignments/${assignment.id}/submit/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast({ title: 'Assignment submitted successfully!', status: 'success' });
            fetchAssignmentDetails(assignment.id.toString());
        } catch (err) {
            console.error(err);
            toast({ title: 'Submission failed', description: 'Please try again.', status: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <Layout userRole="Student">
            <Flex h="80vh" align="center" justify="center">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
        </Layout>
    );

    if (!assignment) return (
        <Layout userRole="Student">
            <Flex h="80vh" align="center" justify="center" direction="column">
                <Heading color="white" mb={4}>Assignment Not Found</Heading>
                <Text color="gray.400" mb={6}>The assignment you are looking for does not exist or you do not have access to it.</Text>
                <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
            </Flex>
        </Layout>
    );

    return (
        <Layout userRole="Student">
            <Box maxW="1000px" mx="auto" p={6}>
                <Button
                    leftIcon={<Icon as={ArrowLeft} />}
                    variant="ghost"
                    mb={6}
                    onClick={() => navigate('/student/dashboard')}
                    color="gray.400"
                    _hover={{ color: "white", bg: "whiteAlpha.100" }}
                >
                    Back to Dashboard
                </Button>

                <Card bg="rgba(255, 255, 255, 0.05)" border="1px solid rgba(255, 255, 255, 0.1)" backdropFilter="blur(10px)">
                    <CardBody p={8}>
                        <Flex justify="space-between" align="start" mb={6}>
                            <VStack align="start" spacing={2}>
                                <HStack>
                                    <Badge colorScheme={assignment.is_submitted ? "blue" : assignment.is_active ? "green" : "red"} fontSize="0.9em" px={3} py={1} borderRadius="full">
                                        {assignment.is_submitted ? "Submitted" : assignment.is_active ? "Active" : "Expired"}
                                    </Badge>
                                </HStack>
                                <Heading size="xl" color="white">{assignment.title}</Heading>
                                <HStack spacing={4} color="gray.400">
                                    <HStack>
                                        <Icon as={FileText} size={18} />
                                        <Text>{assignment.assignment_type}</Text>
                                    </HStack>
                                    <HStack>
                                        <Icon as={Clock} size={18} />
                                        <Text>{assignment.duration_minutes} minutes</Text>
                                    </HStack>
                                </HStack>
                            </VStack>

                            {assignment.is_active && !assignment.is_submitted && (
                                <Box textAlign="right">
                                    <Text color="gray.400" fontSize="sm" mb={1}>Time Remaining</Text>
                                    <Text fontSize="2xl" fontWeight="bold" color={timeLeft === "Expired" ? "red.400" : "blue.400"}>
                                        {timeLeft}
                                    </Text>
                                </Box>
                            )}
                        </Flex>

                        <Divider borderColor="whiteAlpha.200" mb={6} />

                        <Box mb={8}>
                            <Heading size="md" color="gray.200" mb={4}>Instructions</Heading>
                            <Text color="gray.300" whiteSpace="pre-wrap" lineHeight="1.8">
                                {assignment.description}
                            </Text>
                        </Box>

                        {assignment.is_submitted ? (
                            <Box p={6} bg="blue.900" borderRadius="xl" border="1px solid" borderColor="blue.700">
                                <HStack spacing={3}>
                                    <Icon as={CheckCircle} color="blue.200" size={24} />
                                    <VStack align="start" spacing={0}>
                                        <Text color="blue.100" fontWeight="bold">You have already submitted this assignment.</Text>
                                        <Text color="blue.200" fontSize="sm">Great job! Your submission has been recorded.</Text>
                                    </VStack>
                                </HStack>
                            </Box>
                        ) : assignment.is_active ? (
                            <Box bg="whiteAlpha.50" p={6} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                                <Heading size="md" color="gray.200" mb={6}>Your Submission</Heading>

                                <FormControl mb={6}>
                                    <FormLabel color="gray.300">Text Response</FormLabel>
                                    <Textarea
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder="Type your answer here..."
                                        rows={6}
                                        bg="blackAlpha.300"
                                        border="1px solid"
                                        borderColor="whiteAlpha.200"
                                        color="white"
                                        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
                                    />
                                </FormControl>

                                <FormControl mb={8}>
                                    <FormLabel color="gray.300">Attachment (Optional)</FormLabel>
                                    <Box
                                        border="2px dashed"
                                        borderColor="whiteAlpha.300"
                                        borderRadius="xl"
                                        p={8}
                                        textAlign="center"
                                        cursor="pointer"
                                        transition="all 0.2s"
                                        _hover={{ borderColor: "blue.400", bg: "whiteAlpha.50" }}
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <Input
                                            id="file-upload"
                                            type="file"
                                            display="none"
                                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                        />
                                        <VStack spacing={3}>
                                            <Icon as={Upload} size={32} color="gray.400" />
                                            <Text color="gray.300" fontWeight="medium">
                                                {file ? file.name : "Click to upload a file"}
                                            </Text>
                                            <Text fontSize="sm" color="gray.500">
                                                PDF, DOCX, ZIP, or Image files
                                            </Text>
                                        </VStack>
                                    </Box>
                                </FormControl>

                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    width="full"
                                    onClick={handleSubmit}
                                    isLoading={submitting}
                                    loadingText="Submitting..."
                                    leftIcon={<Icon as={CheckCircle} />}
                                >
                                    Submit Assignment
                                </Button>
                            </Box>
                        ) : (
                            <Box p={6} bg="red.900" borderRadius="xl" border="1px solid" borderColor="red.700">
                                <HStack spacing={3}>
                                    <Icon as={XCircle} color="red.200" size={24} />
                                    <Text color="red.100" fontWeight="bold">This assignment has expired and is no longer accepting submissions.</Text>
                                </HStack>
                            </Box>
                        )}
                    </CardBody>
                </Card>
            </Box>
        </Layout>
    );
};

export default StudentAssignmentView;
