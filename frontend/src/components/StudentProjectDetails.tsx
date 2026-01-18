import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box,
    Heading,
    Text,
    Button,
    Flex,
    VStack,
    HStack,
    Badge,
    SimpleGrid,
    Icon,
    useToast,
    Spinner,
    Progress,
    Container,
    Input,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import Layout from './Layout';

import CheckpointList from './CheckpointList';
import ProjectCodebaseChat from './ProjectCodebaseChat';

const {
    ArrowLeft,
    KanbanSquare,
    Code2,
    MessageSquare,
    Bot,
    FileText,
    Trophy,
    Target,
    Zap,
    Network,
    Upload,
    Briefcase
} = Lucide;

const MotionBox = motion(Box);

interface Checkpoint {
    id: number;
    title: string;
    description: string;
    deadline: string | null;
    is_completed: boolean;
    date_completed: string | null;
    status: 'Completed' | 'Pending Approval' | 'Rejected' | 'Incomplete';
}

interface ProjectDetails {
    id: number;
    project_id?: number;
    title: string;
    abstract: string;
    status: string;
    progress: number; // Changed from progress_percentage
    relevance_score: number;
    feasibility_score: number;
    innovation_score: number;
    ai_suggestions: string;
    ai_resume_points?: string[];
    final_report?: string;
    ai_report_feedback?: string;
    github_repo_link?: string;
    audit_security_score?: number;
    audit_quality_score?: number;
    audit_report?: any;
    last_audit_date?: string;
}

const getScoreColor_Local = (score: number) => {
    if (score >= 80) return "green.400";
    if (score >= 60) return "orange.400";
    return "red.400";
};

const StudentProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [generatingResume, setGeneratingResume] = useState(false);

    const [isAuditing, setIsAuditing] = useState(false);

    // Agentic Features State
    const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
    const [docsContent, setDocsContent] = useState<string | null>(null);
    const [isAnalyzingIssues, setIsAnalyzingIssues] = useState(false);
    const [issuesAnalysis, setIssuesAnalysis] = useState<string | null>(null);

    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [updateText, setUpdateText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        fetchProjectDetails();
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) { navigate('/'); return; }

            const listResponse = await axios.get('http://127.0.0.1:8000/student/submissions/', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Match by project_id or id
            const foundProject = listResponse.data.find((p: any) => p.project_id === Number(projectId) || p.id === Number(projectId));

            if (foundProject) {
                setProject(foundProject);
                // If we have a project_id, fetch checkpoints
                if (foundProject.project_id) {
                    fetchCheckpoints(foundProject.project_id);
                }
            } else {
                toast({ title: 'Project not found', status: 'error' });
                navigate('/student-dashboard');
            }

        } catch (err) {
            console.error(err);
            toast({ title: 'Failed to load project details', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCheckpoints = async (realProjectId: number) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`http://127.0.0.1:8000/projects/${realProjectId}/checkpoints/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCheckpoints(res.data);
        } catch (e) {
            console.error("Failed to fetch checkpoints", e);
        }
    };

    const handleGenerateRoadmap = async () => {
        if (!project?.project_id) return;
        setIsGeneratingRoadmap(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/checkpoints/generate/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: "Roadmap Generated!", status: "success" });
            fetchCheckpoints(project.project_id);
        } catch (e) {
            console.error("Roadmap generation error:", e);
            toast({ title: "Generation Failed", status: "error" });
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    const handleGenerateResume = async () => {
        if (!project?.project_id) return;
        setGeneratingResume(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/resume/generate/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Resume Points Generated!', status: 'success' });
            // Refresh project to get new points
            fetchProjectDetails();
        } catch (e) {
            console.error('Resume generation error:', e);
            toast({ title: 'Generation Failed', status: 'error' });
        } finally {
            setGeneratingResume(false);
        }
    };

    const handleReportUpload = async (file: File) => {
        if (!project?.project_id) return;
        const formData = new FormData();
        formData.append('final_report', file);

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/report/upload/`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Report Uploaded!', status: 'success' });
            fetchProjectDetails();
        } catch (e) {
            console.error('Report upload error:', e);
            toast({ title: 'Upload Failed', status: 'error' });
        }
    };

    const handleUpdateProgress = async () => {
        if (!project?.project_id || !updateText.trim()) return;
        setIsUpdating(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/log-update/`,
                { update_text: updateText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Progress Updated!', status: 'success' });
            setIsUpdateOpen(false);
            setUpdateText('');
            fetchProjectDetails();
        } catch (e) {
            console.error('Progress update error:', e);
            toast({ title: 'Update Failed', status: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAuditCode = async () => {
        if (!project?.project_id || !project.github_repo_link) return;
        setIsAuditing(true);
        try {
            const token = localStorage.getItem('accessToken');

            // Auto-save the link first to ensure backend has it
            await axios.patch(
                `http://127.0.0.1:8000/projects/${project.project_id}/update/`,
                { github_repo_link: project.github_repo_link },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/audit/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Code Audit Completed!', status: 'success' });
            fetchProjectDetails();
        } catch (e: any) {
            console.error('Audit error:', e);
            const errorMsg = e.response?.data?.error || 'AI service might be busy or repo is inaccessible.';
            toast({ title: 'Audit Failed', description: errorMsg, status: 'error' });

        } finally {
            setIsAuditing(false);
        }
    };

    const handleGenerateDocs = async () => {
        if (!project?.project_id || !project.github_repo_link) return;
        setIsGeneratingDocs(true);
        setDocsContent(null);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/docs/generate/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.markdown_content) {
                setDocsContent(res.data.markdown_content);
                toast({ title: 'Documentation Generated!', status: 'success' });
            }
        } catch (e: any) {
            console.error('Docs generation error:', e);
            toast({ title: 'Generation Failed', description: e.response?.data?.error, status: 'error' });
        } finally {
            setIsGeneratingDocs(false);
        }
    };

    const handleAnalyzeIssues = async () => {
        if (!project?.project_id || !project.github_repo_link) return;
        setIsAnalyzingIssues(true);
        setIssuesAnalysis(null);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/issues/analyze/`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.analysis) {
                setIssuesAnalysis(res.data.analysis);
                toast({ title: 'Issues Analyzed!', status: 'success' });
            }
        } catch (e: any) {
            console.error('Issue analysis error:', e);
            toast({ title: 'Analysis Failed', description: e.response?.data?.error, status: 'error' });

        } finally {
            setIsAnalyzingIssues(false);
        }

    };

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);

    // ... existing auto fix ...
    const [isFixingIssue, setIsFixingIssue] = useState<number | null>(null);

    const handleAutoFix = async (issue: any, index: number) => {
        if (!project?.project_id || !project.github_repo_link) return;
        setIsFixingIssue(index);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.post(
                `http://127.0.0.1:8000/projects/${project.project_id}/auto-fix/`,
                {
                    issue_title: issue.title,
                    issue_description: issue.description,
                    file_path: issue.file_path
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success && res.data.pr_url) {
                toast({
                    title: 'Fix PR Created!',
                    description: `Pull Request opened: ${res.data.pr_url}`,
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                });
                window.open(res.data.pr_url, '_blank');
            } else {
                toast({ title: 'Fix Failed', description: res.data.error, status: 'error' });
            }
        } catch (e: any) {
            console.error('Auto-fix error:', e);
            toast({ title: 'Fix Failed', description: e.response?.data?.error, status: 'error' });
        } finally {
            setIsFixingIssue(null);
        }
    };

    if (loading) return (
        <Layout userRole="Student">
            <Flex h="80vh" align="center" justify="center">
                <Spinner size="xl" color="blue.500" thickness="4px" />
            </Flex>
        </Layout>
    );

    if (!project) return null;

    return (
        <Layout userRole="Student">
            <Container maxW="container.xl" py={8}>
                <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={20} />}
                    mb={6}
                    onClick={() => navigate('/student-dashboard')}
                    color="gray.400"
                    _hover={{ color: "white", bg: "whiteAlpha.200" }}
                >
                    Back to Dashboard
                </Button>

                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card"
                        p={8}
                    >
                        <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
                            <Box>
                                <HStack mb={2}>
                                    <Badge colorScheme={project.status === 'Approved' ? 'green' : 'blue'} fontSize="0.9em" px={3} py={1} borderRadius="full">
                                        {project.status}
                                    </Badge>
                                    <Text color="gray.500" fontSize="sm">ID: #{project.id}</Text>
                                </HStack>
                                <Heading size="2xl" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text" mb={4}>
                                    {project.title}
                                </Heading>
                                <Text fontSize="lg" color="gray.400" maxW="800px">
                                    {project.abstract}
                                </Text>
                            </Box>

                            <Box minW="200px" p={4} bg="rgba(255,255,255,0.05)" borderRadius="xl">
                                <Text color="gray.400" mb={2} fontWeight="bold">Overall Progress</Text>
                                <Progress value={project.progress} size="lg" colorScheme="blue" borderRadius="full" mb={2} />
                                <Flex justify="space-between" align="center">
                                    <Text fontWeight="bold" fontSize="xl">{project.progress}%</Text>
                                    <Button size="xs" colorScheme="blue" onClick={() => setIsUpdateOpen(true)}>
                                        Update
                                    </Button>
                                </Flex>
                            </Box>
                        </Flex>
                    </MotionBox>

                    {/* Update Progress Modal */}
                    {isUpdateOpen && (
                        <Box position="fixed" top="0" left="0" w="100vw" h="100vh" bg="blackAlpha.700" zIndex={1000} display="flex" alignItems="center" justifyContent="center">
                            <Box bg="gray.800" p={6} borderRadius="xl" w="90%" maxW="500px" border="1px solid" borderColor="gray.600">
                                <Heading size="md" mb={4} color="white">Update Progress</Heading>
                                <Text color="gray.300" mb={2}>Describe what you've accomplished. AI will analyze this to update your progress percentage.</Text>
                                <textarea
                                    value={updateText}
                                    onChange={(e) => setUpdateText(e.target.value)}
                                    placeholder="I have completed the login module and started working on..."
                                    style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid #4A5568' }}
                                />
                                <HStack justify="flex-end" mt={4} spacing={3}>
                                    <Button variant="ghost" colorScheme="gray" onClick={() => setIsUpdateOpen(false)}>Cancel</Button>
                                    <Button colorScheme="blue" isLoading={isUpdating} onClick={handleUpdateProgress}>Submit Update</Button>
                                </HStack>
                            </Box>
                        </Box>
                    )}

                    {/* AI Scores */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                        <ScoreCard icon={<Target />} label="Relevance" score={project.relevance_score} color="blue" />
                        <ScoreCard icon={<Zap />} label="Feasibility" score={project.feasibility_score} color="purple" />
                        <ScoreCard icon={<Trophy />} label="Innovation" score={project.innovation_score} color="orange" />
                    </SimpleGrid>

                    {/* Actions Grid */}
                    <Heading size="lg" mt={4} color="gray.200">Project Tools</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                        <ActionCard
                            icon={<KanbanSquare size={32} />}
                            title="Task Board"
                            desc="Manage tasks with Kanban"
                            onClick={() => navigate(`/projects/${project.project_id || project.id}/tasks`)}
                            color="cyan"
                        />
                        <ActionCard
                            icon={<Code2 size={32} />}
                            title="Code Review"
                            desc="Get AI feedback on code"
                            onClick={() => navigate(`/projects/${project.project_id || project.id}/code-review`)}
                            color="green"
                        />
                        <ActionCard
                            icon={<Bot size={32} />}
                            title="AI Viva Prep"
                            desc="Practice for your viva"
                            onClick={() => navigate(`/ai-viva/${project.project_id || project.id}`)}
                            color="purple"
                        />
                        <ActionCard
                            icon={<MessageSquare size={32} />}
                            title="Team Chat"
                            desc="Discuss with your group"
                            onClick={() => navigate(`/projects/${project.project_id || project.id}/messages`)}
                            color="pink"
                        />
                    </SimpleGrid>

                    {/* --- NEW: Project Roadmap (Checkpoints) --- */}
                    <Box mt={8}>
                        <Flex justify="space-between" align="center" mb={6}>
                            <Heading size="lg" color="gray.200">Project Roadmap</Heading>
                            <Button
                                size="sm"
                                colorScheme="purple"
                                onClick={handleGenerateRoadmap}
                                isLoading={isGeneratingRoadmap}
                                leftIcon={<Network size={16} />}
                            >
                                Generate AI Roadmap
                            </Button>
                        </Flex>
                        {project.project_id && (
                            <CheckpointList
                                checkpoints={checkpoints}
                                projectId={project.project_id}
                                onUpdate={() => project.project_id && fetchCheckpoints(project.project_id)}
                            />
                        )}
                    </Box>

                    {/* --- NEW: Career & Resume --- */}
                    <Box mt={8} p={6} className="glass-card" border="1px solid" borderColor="purple.500">
                        <Flex justify="space-between" align="center" mb={4}>
                            <HStack>
                                <Briefcase size={24} color="#D6BCFA" />
                                <Heading size="md" color="purple.300">Career & Resume</Heading>
                            </HStack>
                            {!project.ai_resume_points && (
                                <Button
                                    size="sm"
                                    colorScheme="purple"
                                    isLoading={generatingResume}
                                    onClick={handleGenerateResume}
                                >
                                    Generate Bullet Points
                                </Button>
                            )}
                        </Flex>

                        {project.ai_resume_points ? (
                            <VStack align="start" spacing={2} mt={2}>
                                <Text fontSize="sm" color="gray.400" mb={2}>Copy these points to your CV:</Text>
                                {project.ai_resume_points.map((point, i) => (
                                    <HStack key={i} align="start">
                                        <Text color="purple.400">•</Text>
                                        <Text fontSize="md" color="white">{point}</Text>
                                    </HStack>
                                ))}
                            </VStack>
                        ) : (
                            <Text fontSize="sm" color="gray.400">
                                Generate professional bullet points describing this project for your job applications.
                            </Text>
                        )}
                    </Box>

                    {/* --- NEW: Project Documentation --- */}
                    <Box mt={8} p={6} className="glass-card" border="1px dashed" borderColor="cyan.600">
                        <HStack mb={4}>
                            <FileText size={24} color="#90CDF4" />
                            <Heading size="md" color="cyan.300">Project Documentation</Heading>
                        </HStack>

                        {project.final_report ? (
                            <VStack align="start" spacing={4}>
                                <Text color="green.300" fontSize="md" fontWeight="bold">✅ Documentation Uploaded</Text>
                                {project.ai_report_feedback ? (
                                    <Box w="full" p={4} bg="blackAlpha.400" borderRadius="md">
                                        <Text fontWeight="bold" color="yellow.300" fontSize="sm" mb={2}>AI Analysis Result:</Text>
                                        <Text fontSize="sm" whiteSpace="pre-wrap" color="gray.300">
                                            {project.ai_report_feedback}
                                        </Text>
                                    </Box>
                                ) : (
                                    <Text fontSize="sm" color="gray.400">Waiting for teacher to analyze...</Text>
                                )}
                            </VStack>
                        ) : (
                            <Box>
                                <Text fontSize="md" color="gray.300" mb={4}>Upload your full project documentation (PDF).</Text>
                                <Button
                                    as="label"
                                    htmlFor="file-upload"
                                    leftIcon={<Upload size={20} />}
                                    colorScheme="cyan"
                                    cursor="pointer"
                                >
                                    Upload Report
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleReportUpload(file);
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* --- NEW: GitHub Repository Link --- */}
                    <Box mt={8} p={6} className="glass-card" border="1px dashed" borderColor="gray.600">
                        <HStack mb={4}>
                            <Icon as={Lucide.Github} size={24} color="white" />
                            <Heading size="md" color="white">GitHub Repository</Heading>
                        </HStack>

                        <Text color="gray.400" fontSize="sm" mb={4}>
                            Link your GitHub repository to enable AI code analysis and automated feedback.
                        </Text>

                        <Flex gap={2}>
                            <Input
                                placeholder="https://github.com/username/repo"
                                value={project.github_repo_link || ''}
                                onChange={(e) => setProject({ ...project, github_repo_link: e.target.value })}
                                bg="blackAlpha.400"
                                border="1px solid"
                                borderColor="gray.600"
                                color="white"
                            />
                            <Button
                                colorScheme="gray"
                                onClick={async () => {
                                    if (!project.github_repo_link) return;
                                    try {
                                        const token = localStorage.getItem('accessToken');
                                        await axios.patch(
                                            `http://127.0.0.1:8000/projects/${project.project_id}/update/`,
                                            { github_repo_link: project.github_repo_link },
                                            { headers: { Authorization: `Bearer ${token}` } }
                                        );
                                        toast({ title: 'Repository Linked!', status: 'success' });
                                    } catch (e) {
                                        console.error(e);
                                        toast({ title: 'Failed to link repo', status: 'error' });
                                    }
                                }}
                            >
                                Save
                            </Button>


                            <Button
                                colorScheme="purple"
                                leftIcon={<Icon as={Lucide.ShieldCheck} />}
                                isLoading={isAuditing}
                                isDisabled={!project.github_repo_link}
                                onClick={handleAuditCode}
                            >
                                Run Audit
                            </Button>

                            <Button
                                colorScheme="cyan"
                                leftIcon={<Icon as={FileText} />}
                                isLoading={isGeneratingDocs}
                                isDisabled={!project.github_repo_link}
                                onClick={handleGenerateDocs}
                            >
                                Auto-Docs
                            </Button>


                            <Button
                                colorScheme="orange"
                                leftIcon={<Icon as={Lucide.Bug} />}
                                isLoading={isAnalyzingIssues}
                                isDisabled={!project.github_repo_link}
                                onClick={handleAnalyzeIssues}
                            >
                                Analyze Issues
                            </Button>

                            <Button
                                colorScheme="purple"
                                leftIcon={<Icon as={MessageSquare} />}
                                isDisabled={!project.github_repo_link}
                                onClick={() => setIsChatOpen(true)}
                                variant="outline"
                                _hover={{ bg: "purple.500", color: "white" }}
                            >
                                Ask Codebase
                            </Button>
                        </Flex>

                        {/* Results: Auto-Docs */}
                        {docsContent && (
                            <Box mt={6} p={4} bg="blackAlpha.400" borderRadius="md" borderLeft="4px solid" borderColor="cyan.400">
                                <Heading size="sm" color="cyan.300" mb={2}>Generated Documentation</Heading>
                                <Box maxH="300px" overflowY="auto" fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                                    {docsContent}
                                </Box>
                                <Button size="xs" mt={2} onClick={() => navigator.clipboard.writeText(docsContent)}>Copy Markdown</Button>
                            </Box>
                        )}

                        {/* Results: Issue Analysis */}
                        {issuesAnalysis && (
                            <Box mt={6} p={4} bg="blackAlpha.400" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
                                <Heading size="sm" color="orange.300" mb={2}>Issue Analysis</Heading>
                                <Box maxH="300px" overflowY="auto" fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                                    {issuesAnalysis}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* --- NEW: Code Audit Report --- */}
                    {project.audit_report && (
                        <Box mt={8} p={6} className="glass-card" border="1px solid" borderColor={project.audit_security_score && project.audit_security_score > 80 ? "green.500" : "orange.500"}>
                            <Flex justify="space-between" align="center" mb={6}>
                                <HStack>
                                    <Icon as={Lucide.ShieldAlert} size={24} color={project.audit_security_score && project.audit_security_score > 80 ? "green.400" : "orange.400"} />
                                    <Heading size="md" color="white">Code Auditor Report</Heading>
                                </HStack>
                                <Badge colorScheme="purple">AI Verified</Badge>
                            </Flex>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={6}>
                                <Box textAlign="center" p={4} bg="blackAlpha.400" borderRadius="xl">
                                    <Text color="gray.400" mb={2}>Security Score</Text>
                                    <Heading size="2xl" color={getScoreColor_Local(project.audit_security_score || 0)}>
                                        {project.audit_security_score}/100
                                    </Heading>
                                </Box>
                                <Box textAlign="center" p={4} bg="blackAlpha.400" borderRadius="xl">
                                    <Text color="gray.400" mb={2}>Quality Score</Text>
                                    <Heading size="2xl" color={getScoreColor_Local(project.audit_quality_score || 0)}>
                                        {project.audit_quality_score}/100
                                    </Heading>
                                </Box>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <Box>
                                    <Heading size="sm" color="red.300" mb={3}>Issues Detected</Heading>
                                    <VStack align="start" spacing={2}>
                                        {project.audit_report.issues?.map((issue: any, i: number) => (

                                            <HStack key={i} align="start" p={2} bg="red.900" borderRadius="md" w="full" justify="space-between">
                                                <HStack align="start">
                                                    <Icon as={Lucide.AlertTriangle} color="red.400" mt={1} />
                                                    <Box>
                                                        <Text fontWeight="bold" color="red.200" fontSize="sm">{issue.title}</Text>
                                                        <Text color="red.100" fontSize="xs">{issue.description}</Text>
                                                        {issue.file_path && issue.file_path !== "null" && (
                                                            <Text color="gray.400" fontSize="xs" mt={1} fontFamily="monospace">
                                                                File: {issue.file_path}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                </HStack>
                                                {issue.file_path && issue.file_path !== "null" && (
                                                    <Button
                                                        size="xs"
                                                        colorScheme="purple"
                                                        isLoading={isFixingIssue === i}
                                                        onClick={() => handleAutoFix(issue, i)}
                                                        leftIcon={<Bot size={12} />}
                                                    >
                                                        Fix
                                                    </Button>
                                                )}
                                            </HStack>
                                        ))}
                                        {(!project.audit_report.issues || project.audit_report.issues.length === 0) && (
                                            <Text color="gray.500" fontSize="sm">No major issues found.</Text>
                                        )}
                                    </VStack>
                                </Box>
                                <Box>
                                    <Heading size="sm" color="blue.300" mb={3}>Recommendations</Heading>
                                    <VStack align="start" spacing={2}>
                                        {project.audit_report.recommendations?.map((rec: string, i: number) => (
                                            <HStack key={i} align="start">
                                                <Icon as={Lucide.CheckCircle2} color="blue.400" mt={1} />
                                                <Text color="gray.300" fontSize="sm">{rec}</Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </Box>
                            </SimpleGrid>
                        </Box>
                    )}

                    {/* AI Suggestions */}
                    {project.ai_suggestions && (
                        <MotionBox
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass-card"
                            p={6}
                            borderLeft="4px solid"
                            borderColor="purple.400"
                        >
                            <HStack mb={4}>
                                <Icon as={Bot} w={6} h={6} color="purple.400" />
                                <Heading size="md">AI Suggestions</Heading>
                            </HStack>
                            <Text whiteSpace="pre-wrap" color="gray.300">
                                {project.ai_suggestions}
                            </Text>
                        </MotionBox>
                    )}

                </VStack>
            </Container>

            {/* Chat Drawer */}
            {project?.project_id && (
                <ProjectCodebaseChat
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    projectId={project.project_id}
                />
            )}
        </Layout>
    );
};

const ScoreCard = ({ icon, label, score, color }: any) => (
    <MotionBox
        whileHover={{ y: -5 }}
        className="glass-card"
        p={6}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
    >
        <HStack spacing={4}>
            <Flex p={3} bg={`${color}.900`} borderRadius="lg" color={`${color}.400`}>
                {icon}
            </Flex>
            <Text fontSize="lg" fontWeight="bold" color="gray.300">{label}</Text>
        </HStack>
        <Text fontSize="3xl" fontWeight="800" color={`${color}.400`}>{score}/10</Text>
    </MotionBox>
);

const ActionCard = ({ icon, title, desc, onClick, color }: any) => (
    <MotionBox
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card"
        p={6}
        cursor="pointer"
        onClick={onClick}
        position="relative"
        overflow="hidden"
        role="group"
    >
        <Box position="absolute" top="-20px" right="-20px" opacity={0.1} transform="rotate(15deg)" transition="0.3s" _groupHover={{ transform: 'rotate(0deg) scale(1.2)', opacity: 0.2 }}>
            <Icon as={FileText} w={100} h={100} color={`${color}.400`} />
        </Box>

        <VStack align="start" spacing={4}>
            <Flex p={4} bg={`${color}.900`} borderRadius="xl" color={`${color}.400`}>
                {icon}
            </Flex>
            <Box>
                <Heading size="md" mb={1}>{title}</Heading>
                <Text color="gray.500" fontSize="sm">{desc}</Text>
            </Box>
        </VStack>
    </MotionBox>
);

export default StudentProjectDetails;
