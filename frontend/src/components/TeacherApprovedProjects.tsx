import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
// Fallback for image/file URLs if not absolute
const API_BASE_URL = 'http://127.0.0.1:8000'; // Consider moving to config
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  Container,
  Badge,
  Flex,
  Center,
  HStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  SimpleGrid,
  Image,
  Tag,
  Icon,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";
import ChatInterface from './ChatInterface';

const {
  BookCopy,
  User,
  MessageSquare,
  History,
  Bot,
  BarChart,
  FileText,
  Image: ImageIcon,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Info,
  Layers,
  Award,
  Activity,
  Search,
} = Lucide;

// --- Interfaces ---
interface ApprovedProject {
  id: number;
  submission_id: number;
  title: string;
  student_name: string;
  status: 'In Progress' | 'Completed' | 'Archived' | string;
  progress_percentage: number;
  category: string;
  relevance_score?: number;
  feasibility_score?: number;
  innovation_score?: number;

  // newly added fields
  final_report?: string | null;
  ai_report_feedback?: string | null;

  // Audit Fields
  audit_security_score?: number | null;
  audit_quality_score?: number | null;
  audit_report?: any;
  last_audit_date?: string | null;

  // team members (optional; backend may provide)
  team_members?: { id: number; username: string; role?: string }[];
  member_stats?: {
    student_id: number;
    username: string;
    updates_count: number;
    reviews_count: number;
    viva_average: number;
  }[];
}

interface Artifact {
  id: number;
  image_file: string;
  description: string;
  extracted_text: string | null;
  ai_tags: string[] | null;
  uploaded_at: string;
}

// chat user shape expected by ChatInterface
interface UserSimple {
  id: number;
  username: string;
  role: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const TeacherApprovedProjects: React.FC = () => {
  const [projects, setProjects] = useState<ApprovedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  // Selection State
  const [selectedProject, setSelectedProject] = useState<ApprovedProject | null>(null);

  // grading state
  const [gradingLoading, setGradingLoading] = useState<number | null>(null);

  // --- Chat Modal State (uses ChatInterface) ---
  const {
    isOpen: isChatOpen,
    onOpen: onChatOpen,
    onClose: onChatClose,
  } = useDisclosure();
  const [chatProject, setChatProject] = useState<ApprovedProject | null>(null);

  // --- Team Stats Modal State ---
  const {
    isOpen: isStatsOpen,
    onOpen: onStatsOpen,
    onClose: onStatsClose,
  } = useDisclosure();

  // current user for chat
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);

  // --- Artifacts State & Modal ---
  const {
    isOpen: isArtifactsOpen,
    onOpen: onArtifactsOpen,
    onClose: onArtifactsClose,
  } = useDisclosure();
  const [selectedArtifacts, setSelectedArtifacts] = useState<Artifact[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { navigate('/'); return; }
      const response = await api.get('/teacher/approved-projects/');
      const data = Array.isArray(response.data) ? response.data : [];

      // Sorting Logic: In Progress > Completed > Others (Archived)
      const sortedProjects = [...data].sort((a: ApprovedProject, b: ApprovedProject) => {
        const order: Record<string, number> = { 'In Progress': 0, 'Completed': 1, 'Archived': 2 };
        const valA = order[a.status] !== undefined ? order[a.status] : 10;
        const valB = order[b.status] !== undefined ? order[b.status] : 10;
        return valA - valB;
      });

      setProjects(sortedProjects);
    } catch (err) {
      setError('Failed to fetch approved projects.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Load current user (prefer localStorage, fallback to API) ---
  useEffect(() => {
    const loadMe = async () => {
      const idStr = localStorage.getItem('user_id');
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');

      if (idStr && username && role) {
        setCurrentUser({ id: Number(idStr), username, role });
        return;
      }

      try {
        const res = await api.get('/auth/users/me/');
        const data = res.data;
        setCurrentUser({
          id: data.id,
          username: data.username,
          role: data.role ?? (data.is_staff ? 'Teacher' : 'Student'),
        });
        localStorage.setItem('user_id', String(data.id));
        localStorage.setItem('username', data.username);
        if (data.role) localStorage.setItem('role', data.role);
      } catch (e) {
        console.error('Failed to fetch current user', e);
      }
    };
    loadMe();
  }, []);

  // --- Artifacts Functions ---
  const handleViewArtifacts = async (projectId: number, projectTitle: string) => {
    setCurrentProjectTitle(projectTitle);
    setLoadingArtifacts(true);
    onArtifactsOpen();
    setSelectedArtifacts([]); // clear previous
    try {
      const response = await api.get(`/ projects / ${projectId} /artifacts/`);
      setSelectedArtifacts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      toast({ title: 'Failed to load documents', status: 'error' });
      console.error(err);
    } finally {
      setLoadingArtifacts(false);
    }
  };

  // --- Analyze Docs function for final report (improved error handling + refresh) ---
  const handleAutoGrade = async (projectId: number) => {
    setGradingLoading(projectId);
    try {
      await api.post(`/ projects / ${projectId} /report/grade / `, {});
      toast({ title: 'Analysis Complete!', status: 'success' });

      // Reload projects to show the new feedback
      const response = await api.get('/teacher/approved-projects/');
      const data = Array.isArray(response.data) ? response.data : [];
      const sortedProjects = [...data].sort((a: ApprovedProject, b: ApprovedProject) => {
        const order: Record<string, number> = { 'In Progress': 0, 'Completed': 1, 'Archived': 2 };
        const valA = order[a.status] !== undefined ? order[a.status] : 10;
        const valB = order[b.status] !== undefined ? order[b.status] : 10;
        return valA - valB;
      });
      setProjects(sortedProjects);

      // Also update selected project if it's the one being graded
      if (selectedProject && selectedProject.id === projectId) {
        const updated = (response.data as ApprovedProject[]).find(p => p.id === projectId);
        if (updated) setSelectedProject(updated);
      }

    } catch (err: any) {
      if (err.response && err.response.status === 429) {
        toast({
          title: 'AI Busy',
          description: 'Please wait 1 minute before analyzing another document.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Analysis Failed',
          description: 'Check if report is uploaded.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        console.error('Analyze Docs error:', err);
      }
    } finally {
      setGradingLoading(null);
    }
  };

  // --- Status Change (Complete/Archive) ---
  const handleStatusChange = async (projectId: number, newStatus: 'Completed' | 'Archived') => {
    try {
      await api.patch(`/projects/archive/${projectId}/`, { status: newStatus });
      toast({
        title: `Project ${newStatus}`,
        description: `The project has been successfully marked as ${newStatus.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh the list
      const response = await api.get('/teacher/approved-projects/');
      const data = Array.isArray(response.data) ? response.data : [];
      const sortedProjects = [...data].sort((a: ApprovedProject, b: ApprovedProject) => {
        const order: Record<string, number> = { 'In Progress': 0, 'Completed': 1, 'Archived': 2 };
        const valA = order[a.status] !== undefined ? order[a.status] : 10;
        const valB = order[b.status] !== undefined ? order[b.status] : 10;
        return valA - valB;
      });
      setProjects(sortedProjects);

      // If the project was the selected one, update its local state or close it
      if (selectedProject && selectedProject.id === projectId) {
        if (newStatus === 'Completed') {
          // It might still be in the list but filtered differently, or moved to another view.
          // For now, let's just update the local status so the UI reflects it.
          setSelectedProject({ ...selectedProject, status: newStatus });
        } else {
          setSelectedProject(null);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.response?.data?.error || 'Failed to update project status.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      console.error(err);
    }
  };

  const getStatusBadge = (status: ApprovedProject['status']) => {
    switch (status) {
      case 'In Progress': return { colorScheme: 'blue', text: 'In Progress' };
      case 'Completed': return { colorScheme: 'green', text: 'Completed' };
      case 'Archived': return { colorScheme: 'gray', text: 'Archived' };
      default: return { colorScheme: 'cyan', text: String(status) || 'Approved' };
    }
  };

  // --- Open Chat using ChatInterface (passes team members + currentUser) ---
  const openChat = (project: ApprovedProject) => {
    setChatProject(project);
    onChatOpen();
  };

  if (loading) return (
    <Center h="calc(100vh - 72px)" color="gray.400">
      <Spinner size="xl" color="blue.500" thickness="4px" />
      <Text ml={4} fontSize="xl">Loading Projects...</Text>
    </Center>
  );

  // helper to normalize team members for ChatInterface
  const normalizeTeamMembers = (members?: { id: number; username: string; role?: string }[]): UserSimple[] => {
    if (!members || !Array.isArray(members)) return [];
    return members.map(m => ({
      id: m.id,
      username: m.username,
      role: m.role ?? 'Student',
    }));
  };

  // --- Action Card Component ---
  const ActionCard = ({ icon, title, desc, onClick, color }: any) => (
    <MotionBox
      whileHover={{
        scale: 1.05,
        translateY: -5,
        boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 20px rgba(${color === 'purple' ? '159, 122, 234' : color === 'teal' ? '79, 209, 197' : color === 'orange' ? '246, 173, 85' : '66, 153, 225'}, 0.2)`
      }}
      whileTap={{ scale: 0.95 }}
      p={6}
      cursor="pointer"
      onClick={onClick}
      position="relative"
      overflow="hidden"
      role="group"
      bg="rgba(255, 255, 255, 0.03)"
      border="1px solid rgba(255, 255, 255, 0.08)"
      backdropFilter="blur(16px)"
      borderRadius="2xl"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Box
        position="absolute"
        top="-10%"
        right="-10%"
        opacity={0.05}
        transform="rotate(15deg)"
        transition="0.5s ease"
        _groupHover={{ transform: 'rotate(0deg) scale(1.3)', opacity: 0.15 }}
      >
        <Icon as={icon.props.as || icon.type} w={120} h={120} color={`${color}.400`} />
      </Box>

      <VStack align="start" spacing={5} position="relative" zIndex={1}>
        <Flex
          p={3}
          bg={`rgba(${color === 'purple' ? '159, 122, 234' : color === 'teal' ? '79, 209, 197' : color === 'orange' ? '246, 173, 85' : '66, 153, 225'}, 0.15)`}
          borderRadius="lg"
          color={`${color}.300`}
          boxShadow={`inset 0 0 10px rgba(${color === 'purple' ? '159, 122, 234' : color === 'teal' ? '79, 209, 197' : color === 'orange' ? '246, 173, 85' : '66, 153, 225'}, 0.2)`}
        >
          {React.cloneElement(icon, { size: 24 })}
        </Flex>
        <Box>
          <Heading size="md" mb={2} color="white" fontWeight="bold" letterSpacing="tight">{title}</Heading>
          <Text color="gray.400" fontSize="sm" lineHeight="tall">{desc}</Text>
        </Box>
      </VStack>

      {/* Decorative Border Glow on Hover */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius="2xl"
        pointerEvents="none"
        border="1px solid transparent"
        _groupHover={{
          borderColor: `rgba(${color === 'purple' ? '159, 122, 234' : color === 'teal' ? '79, 209, 197' : color === 'orange' ? '246, 173, 85' : '66, 153, 225'}, 0.3)`,
        }}
        transition="border-color 0.3s"
      />
    </MotionBox>
  );

  // --- Render Views ---

  const renderProjectList = () => (
    <VStack spacing={10} w="full">
      <VStack spacing={2} textAlign="center" py={4}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Heading as="h1" size="2xl" bgGradient="linear(to-r, blue.400, cyan.400, purple.400)" bgClip="text" fontWeight="900" letterSpacing="tight">
            Approved Projects
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="600px" mx="auto" mt={2}>
            Monitor and manage ongoing development cycles. In-progress projects are pinned to the top for your attention.
          </Text>
        </motion.div>
      </VStack>

      {error && (
        <Alert status="error" borderRadius="xl" bg="rgba(254, 178, 178, 0.05)" color="red.200" border="1px solid" borderColor="red.900" backdropFilter="blur(5px)">
          <AlertIcon color="red.400" />
          {error}
        </Alert>
      )}

      {projects.length === 0 && !error ? (
        <Center h="50vh" flexDirection="column">
          <Icon as={BookCopy} size={64} color="gray.700" mb={4} opacity={0.5} />
          <Text fontSize="xl" color="gray.500" fontWeight="medium">No active projects found.</Text>
        </Center>
      ) : (
        <MotionVStack w="full" spacing={5} variants={containerVariants} initial="hidden" animate="visible">
          {projects.map((project) => {
            const status = getStatusBadge(project.status);
            const isInProgress = project.status === 'In Progress';

            return (
              <MotionBox
                key={project.id}
                variants={itemVariants}
                w="full"
                p={5}
                borderRadius="2xl"
                bg={isInProgress ? "rgba(49, 130, 206, 0.05)" : "rgba(255, 255, 255, 0.02)"}
                border="1px solid"
                borderColor={isInProgress ? "rgba(49, 130, 206, 0.2)" : "rgba(255, 255, 255, 0.06)"}
                backdropFilter="blur(20px)"
                boxShadow={isInProgress ? "0 4px 20px rgba(49, 130, 206, 0.1)" : "0 4px 10px rgba(0, 0, 0, 0.2)"}
                whileHover={{
                  scale: 1.01,
                  backgroundColor: isInProgress ? "rgba(49, 130, 206, 0.08)" : "rgba(255, 255, 255, 0.05)",
                  borderColor: isInProgress ? "rgba(49, 130, 206, 0.4)" : "rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                }}
                transition={{ duration: 0.3 }}
                cursor="pointer"
                onClick={() => setSelectedProject(project)}
                position="relative"
                overflow="hidden"
              >
                {/* Status Indicator Bar */}
                <Box
                  position="absolute"
                  left={0}
                  top={0}
                  bottom={0}
                  w="4px"
                  bg={isInProgress ? "blue.400" : project.status === 'Completed' ? "green.400" : "gray.600"}
                  boxShadow={isInProgress ? "0 0 10px rgba(49, 130, 206, 0.6)" : "none"}
                />

                <VStack align="stretch" spacing={4}>
                  <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
                    <VStack align="start" spacing={1}>
                      <Heading size="md" color="white" letterSpacing="tight">{project.title}</Heading>
                      <HStack spacing={4} color="gray.400">
                        <HStack spacing={1}>
                          <Icon as={User} size={14} />
                          <Text fontSize="xs" fontWeight="medium">{project.student_name}</Text>
                        </HStack>
                        <HStack spacing={1}>
                          <Icon as={BookCopy} size={14} />
                          <Text fontSize="xs" fontWeight="medium">{project.category}</Text>
                        </HStack>
                      </HStack>
                    </VStack>
                    <Badge
                      colorScheme={status.colorScheme}
                      variant="subtle"
                      px={4}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      bg={`rgba(${status.colorScheme === 'blue' ? '49, 130, 206' : '72, 187, 120'}, 0.1)`}
                      color={`${status.colorScheme}.300`}
                      border="1px solid"
                      borderColor={`rgba(${status.colorScheme === 'blue' ? '49, 130, 206' : '72, 187, 120'}, 0.2)`}
                    >
                      {status.text}
                    </Badge>
                  </Flex>

                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Project Development Progress</Text>
                      <Text fontWeight="black" color={project.progress_percentage > 80 ? "green.400" : "blue.400"} fontSize="sm">
                        {project.progress_percentage}%
                      </Text>
                    </Flex>
                    <Progress
                      value={project.progress_percentage}
                      size="xs"
                      colorScheme={project.progress_percentage > 80 ? "green" : "blue"}
                      borderRadius="full"
                      bg="rgba(255,255,255,0.05)"
                      boxShadow="inset 0 0 5px rgba(0,0,0,0.5)"
                      hasStripe={isInProgress}
                      isAnimated={isInProgress}
                    />
                  </Box>
                </VStack>
              </MotionBox>
            );
          })}
        </MotionVStack>
      )}
    </VStack>
  );

  const renderProjectTools = () => {
    if (!selectedProject) return null;
    const status = getStatusBadge(selectedProject.status);
    const isInProgress = selectedProject.status === 'In Progress';

    return (
      <MotionVStack spacing={8} w="full" align="stretch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Button
          leftIcon={<ArrowLeft size={18} />}
          variant="ghost"
          color="gray.400"
          alignSelf="flex-start"
          onClick={() => setSelectedProject(null)}
          _hover={{ color: "white", bg: "whiteAlpha.100", transform: "translateX(-5px)" }}
          transition="all 0.3s"
          fontSize="sm"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Back to Monitor
        </Button>

        <MotionBox
          layoutId={`project-card-${selectedProject.id}`}
          p={8}
          bg="rgba(255, 255, 255, 0.03)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.08)"
          backdropFilter="blur(30px)"
          borderRadius="2xl"
          boxShadow="0 20px 50px rgba(0, 0, 0, 0.4)"
        >
          <Flex justify="space-between" align="start" wrap="wrap" gap={6}>
            <Box flex="1" minW="300px">
              <HStack mb={4} spacing={3}>
                <Badge
                  colorScheme={status.colorScheme}
                  px={4}
                  py={1}
                  borderRadius="full"
                  variant="solid"
                  boxShadow={`0 0 15px rgba(${status.colorScheme === 'blue' ? '66, 153, 225' : '72, 187, 120'}, 0.3)`}
                >
                  {status.text}
                </Badge>
                <Text color="gray.500" fontSize="xs" fontWeight="bold" letterSpacing="widest">PROJECT ID: #{selectedProject.id}</Text>
              </HStack>

              <Heading size="2xl" bgGradient="linear(to-r, white, gray.400)" bgClip="text" mb={6} fontWeight="900" letterSpacing="tight">
                {selectedProject.title}
              </Heading>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6} mb={8}>
                <HStack spacing={4} bg="whiteAlpha.50" p={3} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                  <Center boxSize="40px" bg="blue.900" borderRadius="lg" color="blue.300">
                    <User size={20} />
                  </Center>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Project Leader</Text>
                    <Text fontSize="md" color="white" fontWeight="bold">{selectedProject.student_name}</Text>
                  </Box>
                </HStack>
                <HStack spacing={4} bg="whiteAlpha.50" p={3} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                  <Center boxSize="40px" bg="purple.900" borderRadius="lg" color="purple.300">
                    <BookCopy size={20} />
                  </Center>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Category</Text>
                    <Text fontSize="md" color="white" fontWeight="bold">{selectedProject.category}</Text>
                  </Box>
                </HStack>
              </SimpleGrid>

              <HStack spacing={3} wrap="wrap">
                {[
                  { label: 'Relevance', score: selectedProject.relevance_score },
                  { label: 'Feasibility', score: selectedProject.feasibility_score },
                  { label: 'Innovation', score: selectedProject.innovation_score }
                ].map((item, idx) => (
                  <Tag
                    key={idx}
                    size="lg"
                    variant="subtle"
                    colorScheme={item.score && item.score >= 7 ? 'green' : 'orange'}
                    borderRadius="full"
                    px={4}
                    bg={`rgba(${item.score && item.score >= 7 ? '72, 187, 120' : '237, 137, 54'}, 0.1)`}
                    border="1px solid"
                    borderColor={`rgba(${item.score && item.score >= 7 ? '72, 187, 120' : '237, 137, 54'}, 0.2)`}
                  >
                    <Text fontSize="xs" fontWeight="black" mr={2}>{item.label}:</Text>
                    <Text fontSize="sm" fontWeight="bold">{item.score?.toFixed(1) ?? 'N/A'}</Text>
                  </Tag>
                ))}
              </HStack>
            </Box>

            <Box
              minW="280px"
              p={6}
              bg="rgba(0,0,0,0.2)"
              borderRadius="2xl"
              border="1px solid"
              borderColor="whiteAlpha.100"
              boxShadow="inner"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Text color="gray.400" fontWeight="bold" fontSize="xs" textTransform="uppercase" letterSpacing="widest">Development Progress</Text>
                <Badge variant="outline" colorScheme="blue" borderRadius="md">{selectedProject.progress_percentage}%</Badge>
              </Flex>

              <Box position="relative" mb={6}>
                <Progress
                  value={selectedProject.progress_percentage}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                  bg="whiteAlpha.100"
                  boxShadow={`0 0 20px rgba(66, 153, 225, ${selectedProject.progress_percentage / 200})`}
                />
              </Box>

              <VStack align="stretch" spacing={4}>
                <Flex justify="center" align="center">
                  <Text fontWeight="900" fontSize="4xl" color="white" letterSpacing="tighter">
                    {selectedProject.progress_percentage}<Text as="span" fontSize="lg" color="blue.400" ml={1}>%</Text>
                  </Text>
                </Flex>

                {isInProgress && (
                  <Button
                    w="full"
                    h="12"
                    colorScheme="green"
                    leftIcon={<Lucide.CheckCircle size={20} />}
                    onClick={() => handleStatusChange(selectedProject.id, 'Completed')}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(72, 187, 120, 0.4)',
                      bg: "green.400"
                    }}
                    transition="all 0.3s"
                    borderRadius="xl"
                    fontWeight="bold"
                  >
                    Mark Project Completed
                  </Button>
                )}
              </VStack>
            </Box>
          </Flex>
        </MotionBox>

        <VStack align="start" spacing={4} pt={4}>
          <Heading size="lg" color="white" fontWeight="900" letterSpacing="tight">Management Tools</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
            <ActionCard
              icon={<Bot />}
              title="AI Project Assistant"
              desc="Interactive AI guidance for technical queries"
              onClick={() => navigate(`/teacher/project-assistant/${selectedProject.id}`)}
              color="purple"
            />
            <ActionCard
              icon={<History />}
              title="Viva & Oral History"
              desc="Review performance in past viva sessions"
              onClick={() => navigate(`/teacher/projects/${selectedProject.id}/viva-history`)}
              color="teal"
            />
            <ActionCard
              icon={<BarChart />}
              title="Progress Logs"
              desc="Timeline of student milestone updates"
              onClick={() => navigate(`/teacher/projects/${selectedProject.id}/progress-logs`)}
              color="orange"
            />
            <ActionCard
              icon={<MessageSquare />}
              title="Direct Team Chat"
              desc="Secure channel for student communication"
              onClick={() => openChat(selectedProject)}
              color="blue"
            />
            <ActionCard
              icon={<User />}
              title="Contribution Insights"
              desc="Per-student technical work analytics"
              onClick={onStatsOpen}
              color="cyan"
            />
            <ActionCard
              icon={<ImageIcon />}
              title="Project Artifacts"
              desc="Visual assets, diagrams, and documentation"
              onClick={() => handleViewArtifacts(selectedProject.id, selectedProject.title)}
              color="pink"
            />
          </SimpleGrid>
        </VStack>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8} mt={4}>
          {/* --- DOCUMENTATION & ANALYSIS --- */}
          <Box p={8} bg="rgba(255,255,255,0.02)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" backdropFilter="blur(10px)">
            <HStack mb={6} spacing={4}>
              <Center boxSize="48px" bg="blue.900" borderRadius="xl" color="blue.300" boxShadow="0 0 15px rgba(49, 130, 206, 0.2)">
                <FileText size={24} />
              </Center>
              <Box>
                <Heading size="md" color="white">Technical Documentation</Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Final Project Report</Text>
              </Box>
            </HStack>

            {selectedProject.final_report ? (
              <VStack align="stretch" spacing={6}>
                <Flex align="center" justify="space-between" p={4} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="green.900">
                  <HStack>
                    <Icon as={Lucide.CheckCircle} color="green.400" size={20} />
                    <Text color="green.300" fontWeight="bold">Report Uploaded</Text>
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="green"
                    variant="solid"
                    as="a"
                    href={selectedProject.final_report.startsWith('http') ? selectedProject.final_report : `${API_BASE_URL}${selectedProject.final_report}`}
                    target="_blank"
                    leftIcon={<ExternalLink size={14} />}
                    borderRadius="full"
                    px={6}
                    _hover={{ transform: "scale(1.05)", boxShadow: "0 0 15px rgba(72, 187, 120, 0.3)" }}
                  >
                    Open Document
                  </Button>
                </Flex>

                {selectedProject.ai_report_feedback && (
                  <Box p={5} bg="rgba(0,0,0,0.3)" borderRadius="xl" borderLeft="4px solid" borderColor="blue.400">
                    <HStack mb={3}>
                      <Icon as={Bot} color="blue.400" />
                      <Text fontWeight="black" color="blue.300" fontSize="xs" textTransform="uppercase" letterSpacing="widest">AI Intelligence Insight</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall" fontStyle="italic">
                      "{selectedProject.ai_report_feedback}"
                    </Text>
                  </Box>
                )}
              </VStack>
            ) : (
              <Center p={10} bg="whiteAlpha.50" borderRadius="xl" border="2px dashed" borderColor="whiteAlpha.100">
                <VStack spacing={2}>
                  <Text color="gray.500" fontSize="sm">No documentation uploaded yet.</Text>
                  <Text fontSize="xs" color="gray.600">Reports will appear here once submitted by students.</Text>
                </VStack>
              </Center>
            )}
          </Box>

          {/* --- AI CODE AUDIT REPORT --- */}
          <Box p={8} bg="rgba(255,255,255,0.02)" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" backdropFilter="blur(10px)">
            <HStack mb={6} spacing={4}>
              <Center boxSize="48px" bg="purple.900" borderRadius="xl" color="purple.300" boxShadow="0 0 15px rgba(159, 122, 234, 0.2)">
                <ShieldCheck size={24} />
              </Center>
              <Box>
                <Heading size="md" color="white">AI Secure Code Audit</Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Repository Analysis</Text>
              </Box>
            </HStack>

            {selectedProject.audit_report ? (
              <VStack align="stretch" spacing={6}>
                <SimpleGrid columns={2} spacing={4}>
                  {[
                    { label: 'Security Score', score: selectedProject.audit_security_score, color: 'green' },
                    { label: 'Quality Score', score: selectedProject.audit_quality_score, color: 'blue' }
                  ].map((s, idx) => (
                    <Box key={idx} p={4} bg="rgba(0,0,0,0.2)" borderRadius="xl" textAlign="center" border="1px solid" borderColor="whiteAlpha.100">
                      <Text fontSize="xs" color="gray.500" fontWeight="bold" mb={1}>{s.label}</Text>
                      <Text fontSize="2xl" fontWeight="black" color={`${s.color}.400`}>
                        {s.score}<Text as="span" fontSize="xs" color="gray.600">/100</Text>
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>

                <Box bg="rgba(0,0,0,0.2)" p={4} borderRadius="xl">
                  <HStack mb={3} justify="space-between">
                    <Text fontWeight="black" color="red.300" fontSize="xs" textTransform="uppercase" letterSpacing="widest">Critical Vulnerabilities</Text>
                    <Badge colorScheme="red" variant="subtle" fontSize="2xs">{selectedProject.audit_report.issues?.length || 0} Issues</Badge>
                  </HStack>

                  {selectedProject.audit_report.issues && selectedProject.audit_report.issues.length > 0 ? (
                    <VStack align="start" spacing={3} maxH="150px" overflowY="auto" pr={2} css={{
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '10px' }
                    }}>
                      {selectedProject.audit_report.issues.map((issue: any, idx: number) => (
                        <Box key={idx} p={3} bg="whiteAlpha.50" borderRadius="lg" w="full" borderLeft="2px solid" borderColor="red.500">
                          <Text fontSize="xs" color="white" fontWeight="bold" mb={1}>{issue.title}</Text>
                          <Text fontSize="2xs" color="gray.500" noOfLines={2}>{issue.description}</Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Center p={4} border="1px solid" borderColor="green.900" borderRadius="lg" bg="green.900" borderStyle="dashed">
                      <HStack color="green.300">
                        <Icon as={Lucide.CheckCircle} size={14} />
                        <Text fontSize="xs" fontWeight="bold">Clean Audit: No Vulerabilities</Text>
                      </HStack>
                    </Center>
                  )}
                </Box>
              </VStack>
            ) : (
              <Center p={10} bg="whiteAlpha.50" borderRadius="xl" border="2px dashed" borderColor="whiteAlpha.100">
                <VStack spacing={3} textAlign="center">
                  <Icon as={Bot} size={32} color="gray.600" />
                  <Text color="gray.500" fontSize="sm">Awaiting Code Audit Results</Text>
                  {selectedProject.last_audit_date && (
                    <Text fontSize="2xs" color="gray.600">Last scan failed or yielded no report.</Text>
                  )}
                </VStack>
              </Center>
            )}
          </Box>
        </SimpleGrid>
      </MotionVStack>
    );
  };

  return (
    <Flex w="100%" minH="calc(100vh - 72px)" justify="center" position="relative" color="white" bg="transparent">
      <Container maxW="container.xl" h="100%" overflowY="auto" py={{ base: 6, md: 8 }}>
        {selectedProject ? renderProjectTools() : renderProjectList()}
      </Container>

      {/* ----------------------------- CHAT MODAL (uses ChatInterface) ----------------------------- */}
      <Modal isOpen={isChatOpen} onClose={() => { setChatProject(null); onChatClose(); }} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(10, 15, 30, 0.95)"
          color="white"
          boxShadow="0 0 50px rgba(0,0,0,0.6)"
          borderRadius="2xl"
          border="1px solid rgba(255,255,255,0.1)"
          overflow="hidden"
        >
          <ModalHeader px={8} pt={8} pb={4} color="white" fontWeight="900" borderBottom="1px solid" borderColor="whiteAlpha.100">
            <HStack spacing={3}>
              <Icon as={MessageSquare} boxSize={5} color="blue.400" />
              <Text>Project Communications</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="gray.400" _hover={{ color: "white" }} top={6} right={6} />
          <ModalBody px={8} pb={8} pt={6}>
            {chatProject && currentUser ? (
              <ChatInterface
                projectId={chatProject.id}
                currentUser={currentUser}
                teamMembers={normalizeTeamMembers(chatProject.team_members)}
              />
            ) : chatProject && !currentUser ? (
              <Center py={10}><Spinner color="blue.500" thickness="4px" /></Center>
            ) : (
              <Center py={10}><Text color="gray.500">Initializing secure channel...</Text></Center>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ----------------------------- TEAM STATS MODAL ----------------------------- */}
      <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="3xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent bg="rgba(10, 15, 30, 0.98)" color="white" borderRadius="2xl" border="1px solid rgba(255,255,255,0.1)" boxShadow="2xl">
          <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.100" color="white" fontWeight="900" px={8} pt={8}>
            <HStack spacing={3}>
              <Icon as={User} boxSize={5} color="cyan.400" />
              <Text>Technical Contribution Analytics</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="gray.400" _hover={{ color: "white" }} top={6} right={6} />
          <ModalBody p={8}>
            {!selectedProject?.member_stats || selectedProject.member_stats.length === 0 ? (
              <Center py={10} flexDirection="column">
                <Icon as={Info} boxSize={12} color="gray.700" mb={4} />
                <Text color="gray.500" fontWeight="bold">No analytical data available for this project yet.</Text>
                <Text fontSize="xs" color="gray.600" mt={1}>Stats are generated periodically based on student activity.</Text>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {selectedProject.member_stats.map((stat) => (
                  <Box key={stat.student_id} p={6} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100" transition="all 0.3s" _hover={{ bg: "whiteAlpha.100", borderColor: "cyan.900" }}>
                    <HStack justify="space-between" mb={6}>
                      <Heading size="sm" color="white" fontWeight="900" letterSpacing="tight">{stat.username}</Heading>
                      <Badge variant="subtle" colorScheme="cyan" borderRadius="full" px={3} fontSize="10px">CONTRIBUTOR</Badge>
                    </HStack>
                    <VStack align="stretch" spacing={4}>
                      {[
                        { label: 'Progress Milestones', value: stat.updates_count, color: 'blue', icon: Activity },
                        { label: 'Technical Reviews', value: stat.reviews_count, color: 'purple', icon: Search },
                        { label: 'Viva Performance', value: `${stat.viva_average}/10`, color: stat.viva_average >= 7 ? 'green' : 'orange', icon: Award }
                      ].map((item, i) => (
                        <Flex key={i} justify="space-between" align="center">
                          <HStack spacing={2}>
                            <Icon as={item.icon || Layers} size={14} color="gray.500" />
                            <Text color="gray.400" fontSize="xs" fontWeight="bold" textTransform="uppercase">{item.label}</Text>
                          </HStack>
                          <Text color={`${item.color}.400`} fontWeight="black" fontSize="sm">{item.value}</Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
          <ModalFooter bg="blackAlpha.300" borderBottomRadius="2xl" px={8} py={4}>
            <Button onClick={onStatsClose} variant="ghost" color="gray.500" _hover={{ color: "white", bg: "whiteAlpha.100" }}>Dismiss</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ----------------------------- ARTIFACTS MODAL ----------------------------- */}
      <Modal isOpen={isArtifactsOpen} onClose={onArtifactsClose} size="5xl" scrollBehavior="inside" isCentered>
        <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(15px)" />
        <ModalContent
          bg="rgba(10, 15, 30, 0.95)"
          color="white"
          borderRadius="2xl"
          boxShadow="0 0 100px rgba(0,0,0,0.8)"
          border="1px solid rgba(255,255,255,0.1)"
          maxH="85vh"
        >
          <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.100" px={8} pt={8} pb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="pink.400" fontWeight="black" textTransform="uppercase" letterSpacing="widest">Document Vault</Text>
              <Heading size="lg" color="white" fontWeight="900">{currentProjectTitle}</Heading>
            </VStack>
          </ModalHeader>
          <ModalCloseButton color="gray.400" _hover={{ color: "white" }} top={8} right={8} />
          <ModalBody p={8}>
            {loadingArtifacts ? (
              <Center py={20} flexDirection="column">
                <Spinner size="xl" color="pink.500" thickness="4px" />
                <Text mt={4} color="gray.400" fontWeight="bold">Decrypting project assets...</Text>
              </Center>
            ) : selectedArtifacts.length === 0 ? (
              <Center py={20} flexDirection="column">
                <Icon as={ImageIcon} size={64} color="gray.800" mb={4} />
                <Text color="gray.500" fontSize="lg" fontWeight="medium">No visual artifacts or documentation found.</Text>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                {selectedArtifacts.map((art) => (
                  <Box
                    key={art.id}
                    bg="rgba(0,0,0,0.3)"
                    p={4}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    transition="all 0.3s"
                    _hover={{ transform: "translateY(-4px)", borderColor: "pink.900", bg: "rgba(0,0,0,0.4)" }}
                  >
                    <Box position="relative" borderRadius="xl" overflow="hidden" bg="black" mb={4}>
                      <Image
                        src={art.image_file.startsWith('http') ? art.image_file : `${API_BASE_URL}${art.image_file}`}
                        alt="Project Artifact"
                        objectFit="contain"
                        w="full"
                        maxH="300px"
                        fallbackSrc="https://via.placeholder.com/400x300?text=Image+Not+Available"
                      />
                    </Box>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between" align="center">
                        <Badge variant="subtle" colorScheme="pink" fontSize="10px" px={2} borderRadius="md">ARTIFACT #{art.id}</Badge>
                        <Text fontSize="2xs" color="gray.600" fontWeight="bold">{new Date(art.uploaded_at).toLocaleDateString()}</Text>
                      </Flex>
                      <Text fontSize="sm" color="white" fontWeight="bold">{art.description || "Project Technical Drawing"}</Text>
                      {art.ai_tags && art.ai_tags.length > 0 && (
                        <Flex wrap="wrap" gap={2}>
                          {art.ai_tags.map((tag, i) => (
                            <Tag key={i} size="sm" variant="outline" colorScheme="gray" color="gray.500" fontSize="9px" borderRadius="full">
                              {tag}
                            </Tag>
                          ))}
                        </Flex>
                      )}
                      {art.extracted_text && (
                        <Box mt={2}>
                          <Text fontSize="2xs" color="gray.500" fontWeight="bold" mb={1} textTransform="uppercase">Extracted Data</Text>
                          <Box maxH="100px" overflowY="auto" p={2} bg="blackAlpha.300" borderRadius="md" border="1px solid" borderColor="whiteAlpha.100" css={{
                            '&::-webkit-scrollbar': { width: '4px' },
                            '&::-webkit-scrollbar-thumb': { background: '#2D3748', borderRadius: '10px' }
                          }}>
                            <Text fontSize="10px" color="gray.400" fontFamily="monospace">{art.extracted_text}</Text>
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </ModalBody>
          <ModalFooter bg="blackAlpha.400" borderBottomRadius="2xl" px={8} py={4}>
            <Button onClick={onArtifactsClose} colorScheme="pink" variant="ghost" fontWeight="bold">Close Vault</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default TeacherApprovedProjects;
