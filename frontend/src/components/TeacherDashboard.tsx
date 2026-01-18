// frontend/src/components/TeacherDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  Spinner,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  HStack,
  VStack,
  Stack,
  Avatar,
  Divider,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Alert,
  AlertIcon,
  Tag,
  Spacer,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  DrawerFooter,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  LogOut,
  BookOpen,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  MonitorPlay,
  Cpu,
  ShieldCheck,
  User,
  Settings,
  Bell,
  Server,
  Database,
  HardDrive,
} from "lucide-react";

// Sub-components
import TeacherAssignmentManager from './TeacherAssignmentManager';
import TeacherApprovedProjects from './TeacherApprovedProjects';
import TeacherProfile from './TeacherProfile';
import NotificationBell from './NotificationBell';
import UnappointedOngoingProjects from './UnappointedOngoingProjects';

const MotionBox = motion(Box);

// --- Interfaces ---
interface Submission {
  id: number;
  title: string;
  group_name: string;
  student: { username: string; first_name?: string; last_name?: string } | null;
  relevance_score: number | null;
  feasibility_score: number | null;
  innovation_score: number | null;
  abstract_text: string;
  status: 'Submitted' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed' | 'Archived';
  project_id: number | null;
  created_at?: string;
  tags?: string[] | null;
  ai_summary?: string | null;
  ai_similarity_report?: { title: string; abstract_text: string; student: string } | null;
  ai_suggested_features?: string | null;
  audit_security_score?: number | null;
  audit_quality_score?: number | null;

  audit_report?: any;
  abstract_file?: string | null;
}

interface DashboardStats {
  pending_approvals: number;
  active_projects: number;
  active_assignments: number;
  vivas_scheduled: number;
  unappointed_ongoing: number;
}

interface ActivityItem {
  id: string;
  type: 'submission' | 'message' | 'system';
  text: string;
  time: string; // ISO string
}

interface Message {
  id: number;
  sender_username: string;
  recipient_username: string;
  content: string;
  timestamp: string;
}

const TeacherDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'approvals' | 'assignments' | 'monitoring' | 'profile' | 'unappointed' | 'unappointed_ongoing'>('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [unappointedSubmissions, setUnappointedSubmissions] = useState<Submission[]>([]); // State for unappointed
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real Data State
  const [stats, setStats] = useState<DashboardStats>({
    pending_approvals: 0,
    active_projects: 0,
    active_assignments: 0,
    vivas_scheduled: 0,
    unappointed_ongoing: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Messaging State
  const { isOpen: isMsgOpen, onOpen: onMsgOpen, onClose: onMsgClose } = useDisclosure();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [msgError, setMsgError] = useState('');

  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('userAvatarUrl') || '');
  const [displayName, setDisplayName] = useState(localStorage.getItem('fullName') || '');

  // Drawer State (Mobile Menu)
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Submission Detail Drawer State
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  const navigate = useNavigate();
  const { submissionId } = useParams();
  const toast = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Handle direct link to submission
  useEffect(() => {
    if (submissionId) {
      const fetchAndOpenSubmission = async () => {
        try {
          // If we found the submission in either list, use it
          let submission = submissions.find(s => s.id === parseInt(submissionId)) ||
            unappointedSubmissions.find(s => s.id === parseInt(submissionId));

          if (!submission) {
            // Otherwise fetch it directly
            const response = await api.get(`/teacher/submissions/${submissionId}/`);
            if (response.data) {
              submission = response.data;
            } else {
              // Fallback logic if direct fetch returns empty/null but no error
              if (unappointedSubmissions.length === 0) {
                const unappointedRes = await api.get('/teacher/unappointed/');
                const found = unappointedRes.data.find((s: Submission) => s.id === parseInt(submissionId));
                if (found) {
                  submission = found;
                  setUnappointedSubmissions(unappointedRes.data);
                }
              }
            }
          }

          if (submission) {
            setSelectedSubmission(submission);
            onDetailOpen(); // Open the DETAIL drawer
          }
        } catch (error) {
          console.error("Failed to load submission from URL", error);
        }
      };
      fetchAndOpenSubmission();
    }
  }, [submissionId, onDetailOpen]); // Reduced dependencies to avoid loops



  useEffect(() => {
    // Fetch User Details & Avatar
    const fetchUserData = async () => {
      try {
        const userRes = await api.get('/auth/users/me/');
        if (userRes.data) {
          const fullName = `${userRes.data.first_name || ''} ${userRes.data.last_name || ''}`.trim() || userRes.data.username;
          setDisplayName(fullName);
          localStorage.setItem('fullName', fullName);

          let style = 'avataaars';
          let seed = userRes.data.username;

          // Fallback URL
          const fallbackUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
          if (!avatarUrl) setAvatarUrl(fallbackUrl);

          try {
            const xpRes = await api.get('/gamification/me/');
            if (xpRes.data) {
              style = xpRes.data.avatar_style || 'avataaars';
              seed = xpRes.data.avatar_seed || seed;
              const newUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
              if (newUrl !== avatarUrl) {
                setAvatarUrl(newUrl);
                localStorage.setItem('userAvatarUrl', newUrl);
              }
            }
          } catch (e) {
            if (!avatarUrl) setAvatarUrl(fallbackUrl);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUserData();

    // Listen for updates
    const handleProfileUpdate = () => fetchUserData();
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Stats & Activity
  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/teacher/stats/'),
        api.get('/teacher/activity/')
      ]);

      setStats(statsRes.data);
      setActivities(activityRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  useEffect(() => {
    if (activeView === 'overview') {
      fetchDashboardData();
      fetchUnappointedSubmissions();
    }
  }, [activeView]);

  // Fetch Submissions for "Approvals" view (Appointed)
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teacher/appointed/');
      setSubmissions(response.data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to fetch submissions', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Unappointed Submissions
  const fetchUnappointedSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teacher/unappointed/');
      setUnappointedSubmissions(response.data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to fetch unappointed projects', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'approvals') {
      fetchSubmissions();
    } else if (activeView === 'unappointed') {
      fetchUnappointedSubmissions();
    }
  }, [activeView]);

  const handleReview = async (submissionId: number, status: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/teacher/submissions/${submissionId}/`, { status });
      toast({ title: `Submission ${status}`, status: status === 'Approved' ? 'success' : 'info' });
      fetchSubmissions(); // Refresh appointed
      fetchUnappointedSubmissions(); // Refresh unappointed
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast({ title: 'Action failed', status: 'error' });
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const scoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'gray';
    if (score >= 7.5) return 'cyan';
    if (score >= 5) return 'yellow';
    return 'red';
  };

  // Messaging Logic
  const fetchMessages = useCallback(async (projectId: number) => {
    setLoadingMessages(true);
    setMsgError('');
    try {
      const response = await api.get(`/projects/${projectId}/messages/`);
      setMessages(response.data);
    } catch (err) {
      setMsgError('Failed to load messages.');
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const openMessageModal = (projectId: number) => {
    setSelectedProjectId(projectId);
    setMessages([]);
    fetchMessages(projectId);
    onMsgOpen();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedProjectId) return;
    setSendingMessage(true);
    try {
      const response = await api.post(`/projects/${selectedProjectId}/messages/`, { content: newMessage });
      const addedMessages = Array.isArray(response.data) ? response.data : [response.data];
      setMessages((prev) => [...prev, ...addedMessages]);
      setNewMessage('');
      toast({ title: 'Message Sent', status: 'success', duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: 'Error Sending Message', status: 'error', duration: 3000, isClosable: true });
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  // --- Views ---

  const OverviewView = () => {
    const greeting = currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
      <VStack spacing={8} align="stretch">
        {/* Welcome Header */}
        <Flex justify="space-between" align="flex-end" mb={4}>
          <Box>
            <Text fontSize="sm" color="blue.400" fontWeight="bold" letterSpacing="wide" mb={1}>
              DASHBOARD OVERVIEW
            </Text>
            <Heading size="2xl" bgGradient="linear(to-r, white, gray.400)" bgClip="text">
              {greeting}, Professor
            </Heading>
          </Box>
          <VStack align="end" spacing={0}>
            <Text fontSize="4xl" fontWeight="bold" fontFamily="monospace" color="cyan.400" lineHeight="1">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text fontSize="md" color="gray.500">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </VStack>
        </Flex>

        {/* Stats Row with Visuals */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {[
            { label: "Pending Reviews", value: stats.pending_approvals, icon: Clock, color: "orange.400", trend: "Needs Action", view: 'approvals' },
            { label: "Unassigned Projects", value: stats.unappointed_ongoing, icon: Activity, color: "blue.400", trend: "Unappointed", view: 'unappointed_ongoing' },
            { label: "Assignments", value: stats.active_assignments, icon: BookOpen, color: "purple.400", trend: "Active Now", view: 'assignments' },
          ].map((stat, index) => (
            <Box
              key={index}
              p={6}
              borderRadius="2xl"
              bg="rgba(255, 255, 255, 0.03)"
              border="1px solid rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              position="relative"
              overflow="hidden"
              cursor="pointer"
              onClick={() => setActiveView(stat.view as any)}
              _hover={{ borderColor: stat.color, transform: 'scale(1.01)', transition: 'all 0.2s', boxShadow: `0 0 20px ${stat.color}40` }}
            >
              {/* Decorative Gradient Blob */}
              <Box
                position="absolute"
                top="-50%"
                right="-50%"
                w="150px"
                h="150px"
                bg={stat.color}
                filter="blur(60px)"
                opacity={0.2}
              />

              <Flex justify="space-between" align="start" mb={4}>
                <Box p={3} borderRadius="xl" bg={`${stat.color}20`}>
                  <Icon as={stat.icon} size={24} color={stat.color} />
                </Box>
                <Badge colorScheme="gray" variant="solid" bg="whiteAlpha.200" borderRadius="full" px={2} fontSize="xs">
                  {stat.trend}
                </Badge>
              </Flex>
              <Stat>
                <StatLabel color="gray.400" fontSize="sm">{stat.label}</StatLabel>
                <StatNumber fontSize="4xl" fontWeight="bold" color="white">{stat.value}</StatNumber>
              </Stat>

              {/* Mini Progress Bar Visual */}
              <Progress value={70} size="xs" colorScheme={stat.color.split('.')[0]} mt={4} borderRadius="full" bg="whiteAlpha.100" />
            </Box>
          ))}
        </SimpleGrid>

        {/* --- Primary Content Split: 2/3 Action, 1/3 Feed --- */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          
          {/* LEFT: Priority Actions & Quick Links */}
          <Box gridColumn={{ lg: "span 2" }}>
            
            {/* 1. Quick Action Buttons */}
            <Heading size="md" mb={6} color="gray.300" display="flex" alignItems="center" gap={2}>
              <Icon as={TrendingUp} color="cyan.400" /> Management Console
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
              <Button
                height="100px"
                variant="solid"
                bg="linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(66, 153, 225, 0.05) 100%)"
                borderColor="blue.500"
                borderWidth="1px"
                backdropFilter="blur(10px)"
                _hover={{ bg: "linear-gradient(135deg, rgba(66, 153, 225, 0.3) 0%, rgba(66, 153, 225, 0.1) 100%)", transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(66, 153, 225, 0.3)" }}
                onClick={() => setActiveView('assignments')}
                display="flex"
                justifyContent="flex-start"
                alignItems="center"
                px={6}
                gap={4}
                borderRadius="xl"
              >
                <Box p={3} bg="blue.500" borderRadius="lg" boxShadow="0 0 15px blue">
                   <Icon as={BookOpen} size={24} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold">Assignments</Text>
                  <Text fontSize="xs" color="blue.200">Create & Manage</Text>
                </VStack>
              </Button>

              <Button
                height="100px"
                variant="solid"
                bg="linear-gradient(135deg, rgba(72, 187, 120, 0.2) 0%, rgba(72, 187, 120, 0.05) 100%)"
                borderColor="green.500"
                borderWidth="1px"
                backdropFilter="blur(10px)"
                _hover={{ bg: "linear-gradient(135deg, rgba(72, 187, 120, 0.3) 0%, rgba(72, 187, 120, 0.1) 100%)", transform: "translateY(-2px)", boxShadow: "0 4px 20px rgba(72, 187, 120, 0.3)" }}
                onClick={() => setActiveView('approvals')}
                display="flex"
                justifyContent="flex-start"
                alignItems="center"
                px={6}
                gap={4}
                borderRadius="xl"
              >
                <Box p={3} bg="green.500" borderRadius="lg" boxShadow="0 0 15px green">
                   <Icon as={CheckSquare} size={24} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold">Submissions</Text>
                  <Text fontSize="xs" color="green.200">{stats.pending_approvals} Pending Review</Text>
                </VStack>
              </Button>
            </SimpleGrid>

            {/* 2. Priority Inbox (Replaces System Status) */}
            <Box>
               <Heading size="md" mb={6} color="gray.300" display="flex" alignItems="center" gap={2}>
                 <Icon as={AlertTriangle} color="orange.400" /> Priority Items
               </Heading>
               
               <VStack spacing={4} align="stretch">
                 {/* High Priority Quality Alerts */}
                 {submissions.filter(s => (s.audit_security_score && s.audit_security_score < 70)).slice(0, 2).map(sub => (
                   <HStack key={sub.id} p={4} bg="rgba(245, 101, 101, 0.1)" borderRadius="xl" borderLeft="4px solid" borderLeftColor="red.500" spacing={4}>
                      <Icon as={AlertTriangle} color="red.400" boxSize={6} />
                      <Box flex={1}>
                        <Text fontWeight="bold" color="red.200">Quality Alert: {sub.title}</Text>
                        <Text fontSize="sm" color="gray.400">Security Score: {sub.audit_security_score}/100. Review advised.</Text>
                      </Box>
                      <Button size="sm" colorScheme="red" variant="outline" onClick={() => navigate(`/teacher/submissions/${sub.id}`)}>Review</Button>
                   </HStack>
                 ))}

                 {/* New Unassigned Projects */}
                 {unappointedSubmissions.slice(0, 3).map(sub => (
                   <HStack key={sub.id} p={4} bg="rgba(236, 201, 75, 0.1)" borderRadius="xl" borderLeft="4px solid" borderLeftColor="yellow.500" spacing={4}>
                      <Icon as={User} color="yellow.400" boxSize={6} />
                      <Box flex={1}>
                        <Text fontWeight="bold" color="yellow.200">Unassigned Project: {sub.title}</Text>
                        <Text fontSize="sm" color="gray.400">Student is waiting for a mentor.</Text>
                      </Box>
                      <Button size="sm" colorScheme="yellow" variant="solid" onClick={() => setActiveView('unappointed')}>View</Button>
                   </HStack>
                 ))}

                 {/* Empty State */}
                 {submissions.every(s => !s.audit_security_score || s.audit_security_score >= 70) && unappointedSubmissions.length === 0 && (
                   <Flex p={8} direction="column" align="center" justify="center" bg="whiteAlpha.50" borderRadius="xl" border="1px dashed" borderColor="gray.700">
                     <Icon as={CheckCircle} color="green.500" boxSize={8} mb={2} />
                     <Text color="gray.400">No urgent items requiring attention.</Text>
                   </Flex>
                 )}
               </VStack>
            </Box>

          </Box>

          {/* RIGHT: Activity Feed (Cleaned Up) */}
          <Box>
            <Box
              bg="rgba(0,0,0,0.2)"
              p={6}
              borderRadius="2xl"
              border="1px solid rgba(255,255,255,0.05)"
              backdropFilter="blur(10px)"
              h="full"
              maxH="600px"
              overflowY="hidden"
              display="flex"
              flexDirection="column"
            >
              <Heading size="md" mb={6} color="gray.300" display="flex" alignItems="center" gap={2}>
                <Icon as={Activity} color="purple.400" /> Live Feed
              </Heading>
              
              <VStack align="stretch" spacing={0} overflowY="auto" flex={1} sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#4A5568' } }}>
                {activities.length === 0 ? (
                  <Text color="gray.500" fontSize="sm" textAlign="center" mt={10}>No recent activity.</Text>
                ) : (
                  activities.map((activity, index) => (
                    <Box key={activity.id} position="relative" pb={6} _last={{ pb: 0 }}>
                      {/* Timeline Line */}
                      {index !== activities.length - 1 && (
                        <Box position="absolute" left="19px" top="36px" bottom="0" w="2px" bg="whiteAlpha.100" />
                      )}
                      
                      <HStack align="flex-start" spacing={4}>
                         <Box
                           mt={1}
                           boxSize="40px"
                           borderRadius="full"
                           bg={activity.type === 'message' ? 'blue.500' : activity.type === 'system' ? 'purple.500' : 'green.500'}
                           display="flex"
                           alignItems="center"
                           justifyContent="center"
                           boxShadow={`0 0 10px ${activity.type === 'message' ? 'blue' : activity.type === 'system' ? 'purple' : 'green'}`}
                           zIndex={1}
                         >
                            <Icon as={activity.type === 'message' ? MessageSquare : activity.type === 'system' ? Bell : CheckCircle} size={18} color="white" />
                         </Box>
                         <Box pt={1}>
                            <Text fontSize="sm" fontWeight="bold" color="gray.200">{activity.type.toUpperCase()}</Text>
                            <Text fontSize="sm" color="gray.400" mb={1}>{activity.text}</Text>
                            <Text fontSize="xs" color="gray.600">{formatTimeAgo(activity.time)}</Text>
                         </Box>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
            </Box>
          </Box>

        </SimpleGrid>
      </VStack >
    );
  };

  // --- Risk Radar Modal ---


  const ApprovalsView = () => (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="lg">Project Approvals</Heading>
        <Badge colorScheme="orange" p={2} borderRadius="md">{submissions.length} Pending</Badge>
      </Flex>

      {loading ? (
        <Flex justify="center" p={10}><Spinner /></Flex>
      ) : submissions.length === 0 ? (
        <Flex direction="column" align="center" justify="center" h="300px" bg="whiteAlpha.50" borderRadius="xl">
          <Icon as={CheckCircle} size={48} color="green.400" mb={4} />
          <Text color="gray.400">All caught up! No pending submissions.</Text>
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          <AnimatePresence>
            {submissions.map((sub) => (
              <MotionBox
                key={sub.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3 }}
                p={6}
                borderRadius="xl"
                bg="rgba(255, 255, 255, 0.03)"
                border="1px solid rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(5px)"
                whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Flex justify="space-between" mb={4} direction={{ base: "column", sm: "row" }} gap={2}>
                  <Badge colorScheme="yellow" alignSelf="start">Submitted</Badge>
                  <Text fontSize="xs" color="gray.500">{new Date(sub.created_at || Date.now()).toLocaleDateString()}</Text>
                </Flex>
                <Heading size="md" mb={2}>{sub.title}</Heading>
                <Text fontSize="sm" color="gray.400" mb={4} noOfLines={3}>{sub.abstract_text}</Text>

                {sub.student && (
                  <HStack mb={4}>
                    <Avatar size="xs" name={sub.student.username} />
                    <Text fontSize="sm" color="gray.300">
                      {sub.student.first_name} {sub.student.last_name}
                    </Text>
                  </HStack>
                )}

                {/* View Abstract File Button */}
                {sub.abstract_file && (
                  <Button
                    size="sm"
                    mb={4}
                    leftIcon={<Icon as={BookOpen} />}
                    colorScheme="cyan"
                    variant="outline"
                    as="a"
                    href={sub.abstract_file.startsWith('http') ? sub.abstract_file : `http://127.0.0.1:8000${sub.abstract_file}`}
                    target="_blank"
                  >
                    View Uploaded Abstract (PDF)
                  </Button>
                )}

                {/* ... Scores & AI Feedback ... */}
                <Flex mb={4} gap={3} wrap="wrap">
                  <Badge variant="solid" colorScheme={scoreColor(sub.relevance_score)}>
                    Relevance: {sub.relevance_score?.toFixed(1) ?? 'N/A'}
                  </Badge>
                  <Badge variant="solid" colorScheme={scoreColor(sub.feasibility_score)}>
                    Feasibility: {sub.feasibility_score?.toFixed(1) ?? 'N/A'}
                  </Badge>
                </Flex>

                {/* AI Summary Section */}
                {sub.ai_summary && (
                  <Box
                    w="full"
                    mt={4}
                    mb={4}
                    p={4}
                    bg="rgba(66, 153, 225, 0.05)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="blue.500"
                    boxShadow="0 0 15px rgba(66, 153, 225, 0.1)"
                  >
                    <HStack alignItems="flex-start" spacing={3} mb={2}>
                      <Icon as={MonitorPlay} size={18} color="blue.300" minW={5} />
                      <Heading size="sm" color="blue.300" mb={0}>
                        AI Abstract Summary
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall">
                      {sub.ai_summary}
                    </Text>
                  </Box>
                )}

                {/* AI Similarity Feedback */}
                {/* AI Similarity Feedback */}
                {sub.ai_similarity_report && sub.ai_similarity_report.title && (
                  (sub.ai_suggested_features && sub.ai_suggested_features !== "None") ? (
                    // CASE 1: High Similarity (Warning) - has suggestions
                    <Box
                      w="full"
                      mt={4}
                      mb={4}
                      p={4}
                      bg="rgba(255, 165, 0, 0.05)"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="orange.500"
                      boxShadow="0 0 15px rgba(237, 137, 54, 0.1)"
                    >
                      <HStack alignItems="flex-start" spacing={3}>
                        <Icon as={AlertTriangle} size={18} color="#ED8936" minW={5} />
                        <Heading size="sm" color="orange.300" mb={0}>
                          AI Feedback: High Similarity
                        </Heading>
                      </HStack>

                      <Text fontSize="sm" color="gray.300" mb={3} mt={2}>
                        Similar to:
                        <Text as="span" fontWeight="bold" ml={1} color="white">
                          "{sub.ai_similarity_report.title}"
                        </Text>
                      </Text>

                      <Text fontSize="xs" fontWeight="bold" color="orange.300" mb={1} textTransform="uppercase" letterSpacing="wide">
                        Suggestions for Uniqueness
                      </Text>
                      <Text fontSize="sm" color="gray.400" whiteSpace="pre-wrap">
                        {sub.ai_suggested_features}
                      </Text>
                    </Box>
                  ) : (
                    // CASE 2: Nearest Project (Info) - no suggestions, just reference
                    <Box
                      w="full"
                      mt={4}
                      mb={4}
                      p={4}
                      bg="rgba(66, 153, 225, 0.05)"
                      borderRadius="xl"
                      border="1px dashed"
                      borderColor="blue.400"
                    >
                      <HStack alignItems="flex-start" spacing={3}>
                        <Icon as={BookOpen} size={18} color="blue.300" minW={5} />
                        <Heading size="sm" color="blue.300" mb={0}>
                          Nearest Existing Project
                        </Heading>
                      </HStack>

                      <Text fontSize="sm" color="gray.400" mt={2}>
                        Closest match in database (for reference only):
                        <Text as="span" fontWeight="bold" ml={1} color="gray.200">
                          "{sub.ai_similarity_report.title}"
                        </Text>
                      </Text>
                    </Box>
                  )
                )}

                {!sub.ai_similarity_report && sub.ai_suggested_features && sub.ai_suggested_features !== "None" && (
                  <Box
                    w="full"
                    mt={4}
                    mb={4}
                    p={4}
                    bg="rgba(72, 187, 120, 0.05)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="green.500"
                    boxShadow="0 0 15px rgba(72, 187, 120, 0.1)"
                  >
                    <HStack alignItems="flex-start" spacing={3} mb={2}>
                      <Icon as={TrendingUp} size={18} color="green.300" minW={5} />
                      <Heading size="sm" color="green.300" mb={0}>
                        AI Suggestions for Improvement
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color="gray.300" whiteSpace="pre-wrap">
                      {sub.ai_suggested_features}
                    </Text>
                  </Box>
                )}

                {/* AI Code Audit Report */}
                {sub.audit_report && (
                  <Box
                    w="full"
                    mt={4}
                    mb={4}
                    p={4}
                    bg="rgba(128, 90, 213, 0.05)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="purple.500"
                    boxShadow="0 0 15px rgba(128, 90, 213, 0.1)"
                  >
                    <HStack alignItems="flex-start" justify="space-between" mb={3}>
                      <HStack>
                        <Icon as={ShieldCheck} size={18} color="purple.300" minW={5} />
                        <Heading size="sm" color="purple.300" mb={0}>
                          AI Code Audit
                        </Heading>
                      </HStack>
                      <Badge colorScheme="purple">Verified</Badge>
                    </HStack>

                    <Flex gap={4} mb={3}>
                      <Box textAlign="center">
                        <Text fontSize="xs" color="gray.400">Security</Text>
                        <Text fontSize="lg" fontWeight="bold" color={sub.audit_security_score && sub.audit_security_score > 80 ? "green.400" : "orange.400"}>
                          {sub.audit_security_score}/100
                        </Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="xs" color="gray.400">Quality</Text>
                        <Text fontSize="lg" fontWeight="bold" color={sub.audit_quality_score && sub.audit_quality_score > 80 ? "green.400" : "orange.400"}>
                          {sub.audit_quality_score}/100
                        </Text>
                      </Box>
                    </Flex>

                    {sub.audit_report.issues && sub.audit_report.issues.length > 0 ? (
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="red.300" fontWeight="bold">Critical Issues:</Text>
                        {sub.audit_report.issues.slice(0, 2).map((issue: any, i: number) => (
                          <Text key={i} fontSize="xs" color="gray.400" noOfLines={1}>• {issue.title}</Text>
                        ))}
                        {sub.audit_report.issues.length > 2 && (
                          <Text fontSize="xs" color="gray.500" fontStyle="italic">
                            + {sub.audit_report.issues.length - 2} more issues
                          </Text>
                        )}
                      </VStack>
                    ) : (
                      <Text fontSize="xs" color="green.300">No major issues detected.</Text>
                    )}
                  </Box>
                )}

                {sub.tags && sub.tags.length > 0 && (
                  <Box mt={3} py={2} mb={4}>
                    <HStack spacing={2} wrap="wrap">
                      <Text fontSize="sm" fontWeight="bold" color="cyan.200">AI Keywords:</Text>
                      {sub.tags.map((tag, idx) => (
                        <Tag key={idx} size="sm" colorScheme="cyan" variant="solid" borderRadius="full">
                          {tag}
                        </Tag>
                      ))}
                    </HStack>
                  </Box>
                )}

                <Stack direction={{ base: "column", sm: "row" }} spacing={4} mt={4}>
                  <Button
                    flex={1}
                    colorScheme="green"
                    variant="solid"
                    leftIcon={<Icon as={CheckCircle} />}
                    onClick={() => handleReview(sub.id, 'Approved')}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: '0 5px 15px rgba(72, 187, 120, 0.4)' }}
                  >
                    Approve
                  </Button>
                  <Button
                    flex={1}
                    colorScheme="red"
                    variant="solid"
                    leftIcon={<Icon as={XCircle} />}
                    onClick={() => handleReview(sub.id, 'Rejected')}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: '0 5px 15px rgba(245, 101, 101, 0.4)' }}
                  >
                    Reject
                  </Button>

                  {/* Message Button */}
                  {sub.project_id && (
                    <IconButton
                      aria-label="Message Team"
                      icon={<MessageSquare size={20} />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => openMessageModal(sub.project_id!)}
                    />
                  )}
                </Stack>
              </MotionBox>
            ))}
          </AnimatePresence>
        </VStack>
      )
      }
    </VStack >
  );

  const UnappointedView = () => (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="lg">Other Group Projects (Unappointed)</Heading>
        <Badge colorScheme="purple" p={2} borderRadius="md">{unappointedSubmissions.length} Projects</Badge>
      </Flex>

      {loading ? (
        <Flex justify="center" p={10}><Spinner /></Flex>
      ) : unappointedSubmissions.length === 0 ? (
        <Flex direction="column" align="center" justify="center" h="300px" bg="whiteAlpha.50" borderRadius="xl">
          <Icon as={CheckCircle} size={48} color="gray.500" mb={4} />
          <Text color="gray.400">No unappointed projects found.</Text>
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          <AnimatePresence>
            {unappointedSubmissions.map((sub) => (
              <MotionBox
                key={sub.id}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
                transition={{ duration: 0.3 }}
                p={6}
                borderRadius="xl"
                bg="rgba(255, 255, 255, 0.03)"
                border="1px solid rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(5px)"
                whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <HStack justify="space-between" mb={4}>
                  <Badge colorScheme="yellow">Submitted</Badge>
                  <Text fontSize="xs" color="gray.500">{new Date(sub.created_at || Date.now()).toLocaleDateString()}</Text>
                </HStack>
                <Heading size="md" mb={2}>{sub.title}</Heading>
                <Text fontSize="sm" color="gray.400" mb={4} noOfLines={3}>{sub.abstract_text}</Text>

                {sub.student && (
                  <HStack mb={4}>
                    <Avatar size="xs" name={sub.student.username} />
                    <Text fontSize="sm" color="gray.300">
                      {sub.student.first_name} {sub.student.last_name}
                    </Text>
                  </HStack>
                )}

                {/* View Abstract File Button */}
                {sub.abstract_file && (
                  <Button
                    size="sm"
                    mb={4}
                    leftIcon={<Icon as={BookOpen} />}
                    colorScheme="cyan"
                    variant="outline"
                    as="a"
                    href={sub.abstract_file.startsWith('http') ? sub.abstract_file : `http://127.0.0.1:8000${sub.abstract_file}`}
                    target="_blank"
                  >
                    View Uploaded Abstract (PDF)
                  </Button>
                )}

                <Flex mb={4} gap={3} wrap="wrap">
                  <Badge variant="solid" colorScheme={scoreColor(sub.relevance_score)}>
                    Relevance: {sub.relevance_score?.toFixed(1) ?? 'N/A'}
                  </Badge>
                  <Badge variant="solid" colorScheme={scoreColor(sub.feasibility_score)}>
                    Feasibility: {sub.feasibility_score?.toFixed(1) ?? 'N/A'}
                  </Badge>
                </Flex>

                <HStack spacing={4}>
                  <Button
                    flex={1}
                    colorScheme="green"
                    variant="solid"
                    leftIcon={<Icon as={CheckCircle} />}
                    onClick={() => handleReview(sub.id, 'Approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    flex={1}
                    colorScheme="red"
                    variant="solid"
                    leftIcon={<Icon as={XCircle} />}
                    onClick={() => handleReview(sub.id, 'Rejected')}
                  >
                    Reject
                  </Button>
                </HStack>
              </MotionBox>
            ))}
          </AnimatePresence>
        </VStack>
      )}
    </VStack>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return OverviewView();
      case 'approvals': return ApprovalsView();
      case 'unappointed': return UnappointedView();
      case 'assignments': return <TeacherAssignmentManager />;
      case 'monitoring': return <TeacherApprovedProjects />;
      case 'profile': return <TeacherProfile />;
      case 'unappointed_ongoing': return <UnappointedOngoingProjects />;
      default: return OverviewView();
    }
  };

  return (
    <Flex minH="100vh" bg="gray.900" color="white" overflowX="hidden">
      {/* Sidebar / Navigation Rail */}
      <Box
        w="280px"
        bg="rgba(0, 0, 0, 0.3)"
        borderRight="1px solid rgba(72, 187, 120, 0.2)"
        p={6}
        display={{ base: 'none', lg: 'block' }}
        position="fixed"
        h="100vh"
        backdropFilter="blur(10px)"
      >
        <VStack spacing={8} align="start" h="full">
          <Heading size="lg" bgGradient="linear(to-r, green.400, teal.300)" bgClip="text" letterSpacing="tight">
            Teacher Portal
          </Heading>

          <VStack spacing={2} w="full" align="stretch">
            <Button
              variant={activeView === 'overview' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'overview' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<LayoutDashboard size={20} />}
              onClick={() => setActiveView('overview')}
              _hover={{ bg: activeView === 'overview' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Overview
            </Button>
            <Button
              variant={activeView === 'approvals' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'approvals' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<CheckSquare size={20} />}
              onClick={() => setActiveView('approvals')}
              _hover={{ bg: activeView === 'approvals' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Approvals
            </Button>
            <Button
              variant={activeView === 'unappointed' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'unappointed' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<CheckSquare size={20} />}
              onClick={() => setActiveView('unappointed')}
              _hover={{ bg: activeView === 'unappointed' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Other Projects
            </Button>
            <Button
              variant={activeView === 'assignments' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'assignments' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<BookOpen size={20} />}
              onClick={() => setActiveView('assignments')}
              _hover={{ bg: activeView === 'assignments' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Assignments
            </Button>
            <Button
              variant={activeView === 'unappointed_ongoing' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'unappointed_ongoing' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<Activity size={20} />}
              onClick={() => setActiveView('unappointed_ongoing')}
              _hover={{ bg: activeView === 'unappointed_ongoing' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Other Ongoing
            </Button>
            <Button
              variant={activeView === 'monitoring' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'monitoring' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<MonitorPlay size={20} />}
              onClick={() => setActiveView('monitoring')}
              _hover={{ bg: activeView === 'monitoring' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Monitoring
            </Button>
            <Button
              variant={activeView === 'profile' ? 'solid' : 'ghost'}
              colorScheme={activeView === 'profile' ? 'green' : 'gray'}
              justifyContent="flex-start"
              leftIcon={<User size={20} />}
              onClick={() => setActiveView('profile')}
              _hover={{ bg: activeView === 'profile' ? 'green.500' : 'whiteAlpha.100' }}
            >
              Profile
            </Button>
          </VStack>

          <Spacer />

          <VStack spacing={4} w="full">
            <Divider borderColor="whiteAlpha.200" />
            <Button
              variant="ghost"
              colorScheme="gray"
              justifyContent="flex-start"
              w="full"
              leftIcon={<Icon as={Settings} size={20} />}
              onClick={() => navigate('/settings')}
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              justifyContent="flex-start"
              w="full"
              leftIcon={<Icon as={BookOpen} size={20} />}
              onClick={() => navigate('/help')}
            >
              Help & Support
            </Button>
            <Button
              variant="outline"
              colorScheme="red"
              w="full"
              leftIcon={<LogOut size={20} />}
              onClick={() => {
                localStorage.clear();
                navigate('/');
              }}
            >
              Logout
            </Button>
          </VStack>
        </VStack>
      </Box>

      {/* Mobile Header & Drawer Trigger */}
      <Box display={{ base: 'block', lg: 'none' }} position="fixed" top={0} left={0} right={0} zIndex={100} bg="gray.900" borderBottom="1px solid rgba(255,255,255,0.1)" p={4}>
        <Flex justify="space-between" align="center">
          <IconButton
            aria-label="Open Menu"
            icon={<Icon as={LayoutDashboard} />}
            variant="ghost"
            color="white"
            onClick={onOpen}
          />
          <Heading size="md" bgGradient="linear(to-r, green.400, teal.500)" bgClip="text">Teacher Portal</Heading>
          <NotificationBell />
        </Flex>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay backdropFilter="blur(5px)" />
        <DrawerContent bg="gray.900" borderRight="1px solid rgba(255,255,255,0.1)">
          <DrawerCloseButton color="white" />
          <DrawerHeader borderBottomWidth="1px" borderColor="whiteAlpha.100">
            <Heading size="md" color="white">Menu</Heading>
          </DrawerHeader>
          <DrawerBody p={4}>
            <VStack spacing={2} align="stretch">
              <Button variant={activeView === 'overview' ? 'solid' : 'ghost'} colorScheme={activeView === 'overview' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<LayoutDashboard size={20} />} onClick={() => { setActiveView('overview'); onClose(); }}>Overview</Button>
              <Button variant={activeView === 'approvals' ? 'solid' : 'ghost'} colorScheme={activeView === 'approvals' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<CheckSquare size={20} />} onClick={() => { setActiveView('approvals'); onClose(); }}>Approvals</Button>
              <Button variant={activeView === 'unappointed_ongoing' ? 'solid' : 'ghost'} colorScheme={activeView === 'unappointed_ongoing' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<Activity size={20} />} onClick={() => { setActiveView('unappointed_ongoing'); onClose(); }}>Unassigned Projects</Button>
              <Button variant={activeView === 'unappointed' ? 'solid' : 'ghost'} colorScheme={activeView === 'unappointed' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<CheckSquare size={20} />} onClick={() => { setActiveView('unappointed'); onClose(); }}>Other Submissions</Button>
              <Button variant={activeView === 'assignments' ? 'solid' : 'ghost'} colorScheme={activeView === 'assignments' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<BookOpen size={20} />} onClick={() => { setActiveView('assignments'); onClose(); }}>Assignments</Button>
              <Button variant={activeView === 'monitoring' ? 'solid' : 'ghost'} colorScheme={activeView === 'monitoring' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<MonitorPlay size={20} />} onClick={() => { setActiveView('monitoring'); onClose(); }}>Monitoring</Button>
              <Button variant={activeView === 'profile' ? 'solid' : 'ghost'} colorScheme={activeView === 'profile' ? 'cyan' : 'gray'} justifyContent="flex-start" leftIcon={<User size={20} />} onClick={() => { setActiveView('profile'); onClose(); }}>Profile</Button>

              <Divider my={4} borderColor="whiteAlpha.200" />

              <Button variant="ghost" colorScheme="gray" justifyContent="flex-start" leftIcon={<Icon as={Settings} size={20} />} onClick={() => { navigate('/settings'); onClose(); }}>Settings</Button>
              <Button variant="ghost" colorScheme="gray" justifyContent="flex-start" leftIcon={<Icon as={BookOpen} size={20} />} onClick={() => { navigate('/help'); onClose(); }}>Help & Support</Button>
              <Button variant="outline" colorScheme="red" mt={4} leftIcon={<LogOut size={20} />} onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content Area */}
      <Box
        flex="1"
        ml={{ base: 0, lg: '280px' }}
        p={{ base: 4, lg: 8 }}
        pt={{ base: 20, lg: 8 }} // Add padding top for mobile header
        transition="all 0.3s"
      >
        {/* Desktop Header Actions */}
        <Flex justify="flex-end" mb={6} display={{ base: 'none', lg: 'flex' }}>
          <HStack spacing={4}>
            <NotificationBell />
            <Avatar size="sm" name={displayName || "Professor"} src={avatarUrl} bg="cyan.500" cursor="pointer" onClick={() => setActiveView('profile')} />
          </HStack>
        </Flex>

        <AnimatePresence mode="wait">
          <MotionBox
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </MotionBox>
        </AnimatePresence>
      </Box>

      {/* Message Modal */}
      <Modal isOpen={isMsgOpen} onClose={onMsgClose} size="lg">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Project Messages</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto" mb={4}>
              {loadingMessages ? (
                <Spinner />
              ) : msgError ? (
                <Alert status="error">
                  <AlertIcon />
                  {msgError}
                </Alert>
              ) : messages.length === 0 ? (
                <Text color="gray.500">No messages yet.</Text>
              ) : (
                messages.map((msg) => (
                  <Box key={msg.id} p={3} bg="whiteAlpha.100" borderRadius="md">
                    <Text fontWeight="bold" fontSize="sm">{msg.sender_username}</Text>
                    <Text fontSize="md">{msg.content}</Text>
                    <Text fontSize="xs" color="gray.500">{new Date(msg.timestamp).toLocaleString()}</Text>
                  </Box>
                ))
              )}
            </VStack>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onMsgClose}>Close</Button>
            <Button colorScheme="blue" onClick={handleSendMessage} isLoading={sendingMessage}>Send</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Submission Detail Drawer */}
      <Drawer isOpen={isDetailOpen} placement="right" onClose={onDetailClose} size="lg">
        <DrawerOverlay backdropFilter="blur(5px)" />
        <DrawerContent bg="gray.900" borderLeft="1px solid rgba(255,255,255,0.1)">
          <DrawerCloseButton color="white" />
          <DrawerHeader borderBottomWidth="1px" borderColor="whiteAlpha.100">
            <Heading size="md" color="white" noOfLines={1}>
              {selectedSubmission?.title || 'Submission Details'}
            </Heading>
            {selectedSubmission?.group_name && (
              <Text fontSize="sm" color="cyan.400" mt={1}>
                {selectedSubmission.group_name}
              </Text>
            )}
          </DrawerHeader>

          <DrawerBody p={6}>
            {selectedSubmission && (
              <VStack spacing={6} align="stretch">
                {/* Student Info */}
                <HStack>
                  <Avatar size="sm" name={selectedSubmission.student?.username} src={selectedSubmission.student?.username ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSubmission.student.username}` : undefined} />
                  <Box>
                    <Text fontWeight="bold" color="white">
                      {selectedSubmission.student?.first_name} {selectedSubmission.student?.last_name}
                    </Text>
                    <Text fontSize="xs" color="gray.400">@{selectedSubmission.student?.username}</Text>
                  </Box>
                  <Spacer />
                  <Badge colorScheme={selectedSubmission.status === 'Approved' ? 'green' : selectedSubmission.status === 'Rejected' ? 'red' : 'yellow'}>
                    {selectedSubmission.status}
                  </Badge>
                </HStack>

                {/* Abstract */}
                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={2}>Abstract</Text>
                  <Text fontSize="sm" color="gray.300" lineHeight="relaxed">
                    {selectedSubmission.abstract_text}
                  </Text>
                </Box>

                {/* AI Scores */}
                <SimpleGrid columns={3} spacing={4}>
                  <Box p={3} bg="whiteAlpha.50" borderRadius="lg" textAlign="center">
                    <Text fontSize="xs" color="gray.500">Relevance</Text>
                    <Text fontSize="xl" fontWeight="bold" color={scoreColor(selectedSubmission.relevance_score)}>
                      {selectedSubmission.relevance_score?.toFixed(1) ?? '-'}
                    </Text>
                  </Box>
                  <Box p={3} bg="whiteAlpha.50" borderRadius="lg" textAlign="center">
                    <Text fontSize="xs" color="gray.500">Feasibility</Text>
                    <Text fontSize="xl" fontWeight="bold" color={scoreColor(selectedSubmission.feasibility_score)}>
                      {selectedSubmission.feasibility_score?.toFixed(1) ?? '-'}
                    </Text>
                  </Box>
                  <Box p={3} bg="whiteAlpha.50" borderRadius="lg" textAlign="center">
                    <Text fontSize="xs" color="gray.500">Innovation</Text>
                    <Text fontSize="xl" fontWeight="bold" color={scoreColor(selectedSubmission.innovation_score)}>
                      {selectedSubmission.innovation_score?.toFixed(1) ?? '-'}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Files */}
                {selectedSubmission.abstract_file && (
                  <Button
                    size="sm"
                    leftIcon={<Icon as={BookOpen} />}
                    colorScheme="cyan"
                    variant="outline"
                    as="a"
                    href={selectedSubmission.abstract_file.startsWith('http') ? selectedSubmission.abstract_file : `http://127.0.0.1:8000${selectedSubmission.abstract_file}`}
                    target="_blank"
                  >
                    View Project Document (PDF)
                  </Button>
                )}

                {/* AI Audit */}
                {selectedSubmission.audit_report && (
                  <Box p={4} bg="rgba(128, 90, 213, 0.1)" borderRadius="xl" border="1px solid" borderColor="purple.500">
                    <HStack mb={2}>
                      <Icon as={ShieldCheck} color="purple.400" />
                      <Text fontWeight="bold" color="purple.300">AI Audit Summary</Text>
                    </HStack>
                    <Flex gap={4} mb={2}>
                      <Text fontSize="sm" color="gray.300">Security: <span style={{ fontWeight: 'bold', color: (selectedSubmission.audit_security_score || 0) > 80 ? '#48BB78' : '#ECC94B' }}>{selectedSubmission.audit_security_score}/100</span></Text>
                      <Text fontSize="sm" color="gray.300">Quality: <span style={{ fontWeight: 'bold', color: (selectedSubmission.audit_quality_score || 0) > 80 ? '#48BB78' : '#ECC94B' }}>{selectedSubmission.audit_quality_score}/100</span></Text>
                    </Flex>
                  </Box>
                )}

              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor="whiteAlpha.100">
            <Button variant="ghost" mr={3} onClick={onDetailClose} color="gray.400">Cancel</Button>
            {selectedSubmission && selectedSubmission.status === 'Submitted' && (
              <>
                <Button colorScheme="red" mr={3} onClick={() => { handleReview(selectedSubmission.id, 'Rejected'); onDetailClose(); }}>
                  Reject
                </Button>
                <Button colorScheme="green" onClick={() => { handleReview(selectedSubmission.id, 'Approved'); onDetailClose(); }}>
                  Approve
                </Button>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>


    </Flex>
  );
};

export default TeacherDashboard;
