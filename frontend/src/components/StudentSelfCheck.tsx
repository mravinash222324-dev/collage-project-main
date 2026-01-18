
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    Alert,
    AlertIcon,
    SimpleGrid,
    Badge,
    Progress,
    Container,
    useToast,
    Card,
    CardHeader,
    CardBody,
    List,
    ListItem,
    ListIcon,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';

const { AlertTriangle, GraduationCap, Zap, BookOpen } = Lucide;

const MotionBox = motion(Box);

interface MockGradingResult {
    predicted_grade: number;
    letter_grade: string;
    rubric_breakdown: {
        innovation: number;
        feasibility: number;
        quality: number;
        completeness: number;
    };
    critical_issues: string[];
    examiner_comments: string;
}

const StudentSelfCheck: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MockGradingResult | null>(null);
    const [project, setProject] = useState<any>(null); // To store basic project details
    const [error, setError] = useState('');
    const toast = useToast();

    // Fetch Student Project Details on Load
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://127.0.0.1:8000/student/my-project/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProject(response.data);
            } catch (err) {
                console.error("Failed to fetch project", err);
                setError("Could not load your project details. Make sure you have created a project.");
            }
        };
        fetchProject();
    }, []);

    const handleRunCheck = async () => {
        if (!project) return;
        setLoading(true);
        setError('');
        try {
            // Direct call to AI Microservice (or via Django Proxy if preferred)
            // Assuming direct call for now as CORS is open on 8001
            const response = await axios.post('http://127.0.0.1:8001/mock-grading', {
                project_title: project.title,
                project_description: project.abstract,
                repo_link: project.github_link || "https://github.com/example/repo" // Fallback or user input if missing
            });

            setResult(response.data);
            toast({
                title: "Grading Complete",
                description: "The AI Examiner has reviewed your work.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (err) {
            console.error("Mock grading failed", err);
            setError("Failed to run the mock grading. Please check your GitHub link and try again.");
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 80) return 'green';
        if (grade >= 60) return 'yellow';
        return 'red';
    };

    return (
        <Layout userRole="Student">
            <Container maxW="container.xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="flex-start" wrap="wrap">
                        <VStack align="start" spacing={2}>
                            <Heading
                                as="h1"
                                size="2xl"
                                bgGradient="linear(to-r, cyan.400, purle.400)"
                                bgClip="text"
                                letterSpacing="tight"
                            >
                                Pre-Submission Check
                            </Heading>
                            <Text color="gray.400" fontSize="lg">
                                Audit your project before the teacher sees it. Get a predictable grade.
                            </Text>
                        </VStack>
                        <Button
                            size="lg"
                            leftIcon={<Zap size={20} />}
                            colorScheme="cyan"
                            onClick={handleRunCheck}
                            isLoading={loading}
                            loadingText="AI Examiner is Grading..."
                            isDisabled={!project}
                            boxShadow="0 0 20px rgba(0, 255, 255, 0.4)"
                            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)' }}
                        >
                            Run AI Grade Audit
                        </Button>
                    </HStack>

                    {error && (
                        <Alert status="error" variant="subtle" bg="red.900" color="red.200" borderRadius="lg" border="1px solid" borderColor="red.700">
                            <AlertIcon color="red.400" /> {error}
                        </Alert>
                    )}

                    {/* Results Area */}
                    {result && (
                        <MotionBox
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                                {/* Main Score Card */}
                                <Card bg="rgba(255,255,255,0.03)" backdropFilter="blur(10px)" borderRadius="xl" border="1px solid" borderColor={getGradeColor(result.predicted_grade) + ".500"}>
                                    <CardBody textAlign="center" py={10}>
                                        <VStack spacing={4}>
                                            <GraduationCap size={48} color="white" />
                                            <Text fontSize="lg" color="gray.400">Predicted Score</Text>
                                            <Heading size="4xl" color={getGradeColor(result.predicted_grade) + ".400"}>
                                                {result.predicted_grade}/100
                                            </Heading>
                                            <Badge
                                                fontSize="2xl"
                                                colorScheme={getGradeColor(result.predicted_grade)}
                                                px={4}
                                                py={1}
                                                borderRadius="md"
                                            >
                                                Grade: {result.letter_grade}
                                            </Badge>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Rubric Breakdown */}
                                <Card bg="rgba(0,0,0,0.3)" borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
                                    <CardHeader>
                                        <Heading size="md" color="cyan.300">Detailed Rubric</Heading>
                                    </CardHeader>
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            {Object.entries(result.rubric_breakdown).map(([key, value]) => (
                                                <Box key={key}>
                                                    <HStack justify="space-between" mb={1}>
                                                        <Text textTransform="capitalize" color="gray.300">{key}</Text>
                                                        <Text fontWeight="bold" color="white">{value}/{(key === 'quality' || key === 'completeness') ? 30 : 20}</Text>
                                                    </HStack>
                                                    <Progress
                                                        value={(value / ((key === 'quality' || key === 'completeness') ? 30 : 20)) * 100}
                                                        size="sm"
                                                        colorScheme="cyan"
                                                        borderRadius="full"
                                                        bg="whiteAlpha.100"
                                                    />
                                                </Box>
                                            ))}
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Critical Issues */}
                                <Card bg="rgba(255,0,0,0.1)" borderRadius="xl" border="1px solid" borderColor="red.800">
                                    <CardHeader>
                                        <HStack>
                                            <AlertTriangle color="#FC8181" />
                                            <Heading size="md" color="red.300">Critical Fixes Needed</Heading>
                                        </HStack>
                                    </CardHeader>
                                    <CardBody>
                                        <List spacing={3}>
                                            {result.critical_issues.map((issue, idx) => (
                                                <ListItem key={idx} color="gray.300" fontSize="sm" display="flex" alignItems="start">
                                                    <ListIcon as={AlertTriangle} color="red.500" mt={1} />
                                                    {issue}
                                                </ListItem>
                                            ))}
                                        </List>
                                    </CardBody>
                                </Card>
                            </SimpleGrid>

                            {/* Examiner Comments */}
                            <Box mt={8} p={6} bg="blue.900" borderRadius="xl" borderLeft="4px solid" borderColor="blue.400" backgroundColor="rgba(23, 25, 35, 0.5)">
                                <HStack mb={4}>
                                    <BookOpen color="#63B3ED" />
                                    <Heading size="md" color="blue.300">Examiner's Verdict</Heading>
                                </HStack>
                                <Text color="gray.200" whiteSpace="pre-wrap" lineHeight="tall">
                                    {result.examiner_comments}
                                </Text>
                            </Box>
                        </MotionBox>
                    )}
                </VStack>
            </Container>
        </Layout>
    );
};

export default StudentSelfCheck;
