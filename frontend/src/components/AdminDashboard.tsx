// frontend/src/components/AdminDashboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  useDisclosure,
  Flex,
  Text,
  SimpleGrid,
  Badge,
  Icon,
  Avatar,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Container,
} from '@chakra-ui/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import * as Lucide from "lucide-react";
import UpdateRoleModal from './UpdateRoleModal';
import ManageGroupModal from './ManageGroupModal';
import CreateGroupModal from './CreateGroupModal';

const {
  Users,
  Layers,
  Search,
  LogOut,
  Shield,
  Settings,
  Briefcase,
  GraduationCap,
  School,
  Plus
} = Lucide;

const MotionBox = motion(Box);

// ---- Shared-ish Types ----
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

type GroupUserRef = number | string | { id: number | string };

interface Group {
  id: number;
  name: string;
  description?: string;
  teachers: GroupUserRef[];
  students: GroupUserRef[];
}

interface DashboardData {
  users: User[];
  groups: Group[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';



// Robust normalizer
const safeNum = (v: any) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  if (typeof v === 'object' && v && 'id' in v) return Number(v.id);
  return 0;
}

const normalizeIds = (arr: any[] | undefined): number[] =>
  (arr ?? []).map(safeNum).filter((n) => Number.isFinite(n) && n > 0);

const normalizeGroup = (g: Group): Group => ({
  ...g,
  teachers: normalizeIds(g.teachers),
  students: normalizeIds(g.students),
});

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({ users: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- User Role modal state ---
  const {
    isOpen: isRoleModalOpen,
    onOpen: onRoleModalOpen,
    onClose: onRoleModalClose,
  } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // --- Group Manage modal state ---
  const {
    isOpen: isGroupModalOpen,
    onOpen: onGroupModalOpen,
    onClose: onGroupModalClose,
  } = useDisclosure();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // --- Create Group modal state ---
  const {
    isOpen: isCreateGroupOpen,
    onOpen: onCreateGroupOpen,
    onClose: onCreateGroupClose,
  } = useDisclosure();

  const isMounted = useRef(true);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken') || '';
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await axios.get<DashboardData>(`${API_URL}/admin/dashboard/`, {
        headers,
      });

      if (!isMounted.current) return;

      const payload = response.data || { users: [], groups: [] };
      const groups = Array.isArray(payload.groups) ? payload.groups.map(normalizeGroup) : [];
      setData({
        users: Array.isArray(payload.users) ? payload.users : [],
        groups,
      });
    } catch (err: unknown) {
      console.error('Failed to fetch admin data:', err);
      if (!isMounted.current) return;
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || err.message || 'Failed to load dashboard data.'
          : 'Failed to load dashboard data.'
      );
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleEditRoleClick = (user: User) => {
    setSelectedUser(user);
    onRoleModalOpen();
  };

  const handleUserUpdated = (updatedUser: User) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    }));
  };

  const handleManageGroupClick = (group: Group) => {
    setSelectedGroup(group);
    onGroupModalOpen();
  };

  const handleGroupUpdated = (updatedGroup: Group) => {
    const normalized = normalizeGroup(updatedGroup);
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === normalized.id ? normalized : g)),
    }));
    setSelectedGroup(normalized);
  };

  const handleGroupCreated = (newGroup: Group) => {
    const normalized = normalizeGroup(newGroup);
    setData(prev => ({
      ...prev,
      groups: [...prev.groups, normalized]
    }));
  };

  // Filter Logic
  const filteredUsers = data.users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = data.groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'HOD/Admin': return 'purple';
      case 'Teacher': return 'cyan';
      default: return 'blue';
    }
  };

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="cyan.400" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.900, #0f172a, #1e1b4b)" color="white" pb={20}>
      <Container maxW="container.xl" pt={8}>

        {/* Header */}
        <Flex justify="space-between" align="center" mb={10} wrap="wrap" gap={4}>
          <Box>
            <Heading size="2xl" bgGradient="linear(to-r, cyan.400, purple.400)" bgClip="text" letterSpacing="tight">
              Admin Command Center
            </Heading>
            <Text color="gray.400" mt={2} fontSize="lg">Manage users, roles, and project groups.</Text>
          </Box>
          <Button
            leftIcon={<Icon as={LogOut} />}
            colorScheme="red"
            variant="outline"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            _hover={{ bg: 'red.500', color: 'white', borderColor: 'red.500' }}
            size="lg"
            borderRadius="xl"
          >
            Logout
          </Button>
        </Flex>

        {error && (
          <Alert status="error" mb={6} borderRadius="xl" bg="red.900" borderColor="red.500" border="1px solid">
            <AlertIcon color="red.400" />
            {error}
          </Alert>
        )}

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
          {[
            { label: 'Total Users', value: data.users.length, icon: Users, color: 'blue' },
            { label: 'Active Groups', value: data.groups.length, icon: Layers, color: 'purple' },
            { label: 'Teachers', value: data.users.filter(u => u.role === 'Teacher').length, icon: Briefcase, color: 'cyan' },
          ].map((stat, idx) => (
            <MotionBox
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              p={6}
              bg="rgba(255, 255, 255, 0.03)"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              border="1px solid rgba(255, 255, 255, 0.05)"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Text color="gray.400" fontSize="sm" fontWeight="bold" textTransform="uppercase">{stat.label}</Text>
                <Heading size="2xl" color="white" mt={1}>{stat.value}</Heading>
              </Box>
              <Box p={4} bg={`${stat.color}.900`} borderRadius="xl" color={`${stat.color}.400`}>
                <Icon as={stat.icon} size={32} />
              </Box>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Main Content Tabs */}
        <Tabs variant="soft-rounded" colorScheme="cyan" isLazy>
          <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
            <TabList bg="rgba(255,255,255,0.05)" p={1} borderRadius="xl">
              <Tab color="gray.400" _selected={{ color: 'white', bg: 'cyan.600' }} borderRadius="lg" px={6}>
                <HStack><Icon as={Users} size={18} /><Text>Users</Text></HStack>
              </Tab>
              <Tab color="gray.400" _selected={{ color: 'white', bg: 'purple.600' }} borderRadius="lg" px={6}>
                <HStack><Icon as={Layers} size={18} /><Text>Groups</Text></HStack>
              </Tab>
            </TabList>

            <HStack spacing={4}>
              <Button
                leftIcon={<Icon as={Plus} />}
                colorScheme="purple"
                variant="solid"
                onClick={onCreateGroupOpen}
              >
                New Group
              </Button>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none"><Icon as={Search} color="gray.500" /></InputLeftElement>
                <Input
                  placeholder="Search..."
                  bg="rgba(255,255,255,0.05)"
                  border="none"
                  color="white"
                  _focus={{ bg: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </HStack>
          </Flex>

          <TabPanels>
            {/* Users Panel */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <MotionBox
                      key={user.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      p={6}
                      bg="rgba(255, 255, 255, 0.03)"
                      backdropFilter="blur(10px)"
                      borderRadius="xl"
                      border="1px solid rgba(255, 255, 255, 0.05)"
                      _hover={{ borderColor: 'cyan.500', transform: 'translateY(-2px)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Flex justify="space-between" align="start" mb={4}>
                        <HStack>
                          <Avatar size="sm" name={user.username} bg={`${getRoleColor(user.role)}.500`} />
                          <Box>
                            <Heading size="sm" color="white">{user.username}</Heading>
                            <Text fontSize="xs" color="gray.500">ID: {user.id}</Text>
                          </Box>
                        </HStack>
                        <Badge colorScheme={getRoleColor(user.role)} variant="solid" borderRadius="full" px={2}>
                          {user.role}
                        </Badge>
                      </Flex>

                      <Text color="gray.400" fontSize="sm" mb={6} noOfLines={1}>
                        {user.email}
                      </Text>

                      <Button
                        size="sm"
                        w="full"
                        leftIcon={<Icon as={Shield} size={16} />}
                        colorScheme="cyan"
                        variant="outline"
                        onClick={() => handleEditRoleClick(user)}
                        _hover={{ bg: 'cyan.500', color: 'white' }}
                      >
                        Manage Role
                      </Button>
                    </MotionBox>
                  ))}
                </AnimatePresence>
              </SimpleGrid>
              {filteredUsers.length === 0 && (
                <Flex justify="center" align="center" h="200px" color="gray.500" flexDirection="column">
                  <Icon as={Search} size={48} mb={4} />
                  <Text>No users found matching "{searchQuery}"</Text>
                </Flex>
              )}
            </TabPanel>

            {/* Groups Panel */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <AnimatePresence>
                  {filteredGroups.map((group) => {
                    const tCount = group.teachers.length;
                    const sCount = group.students.length;
                    return (
                      <MotionBox
                        key={group.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        p={6}
                        bg="rgba(255, 255, 255, 0.03)"
                        backdropFilter="blur(10px)"
                        borderRadius="xl"
                        border="1px solid rgba(255, 255, 255, 0.05)"
                        _hover={{ borderColor: 'purple.500', transform: 'translateY(-2px)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                        transition={{ duration: 0.2 }}
                      >
                        <Flex justify="space-between" align="start" mb={4}>
                          <HStack>
                            <Box p={2} bg="purple.900" borderRadius="lg" color="purple.300">
                              <Icon as={School} size={20} />
                            </Box>
                            <Box>
                              <Heading size="md" color="white">{group.name}</Heading>
                              <Text fontSize="xs" color="gray.500">ID: {group.id}</Text>
                            </Box>
                          </HStack>
                        </Flex>

                        <SimpleGrid columns={2} spacing={4} mb={6}>
                          <Box p={3} bg="rgba(255,255,255,0.05)" borderRadius="lg">
                            <Text fontSize="xs" color="gray.400" mb={1}>Teachers</Text>
                            <HStack>
                              <Icon as={Briefcase} size={14} color="cyan.400" />
                              <Text fontWeight="bold" fontSize="lg">{tCount}</Text>
                            </HStack>
                          </Box>
                          <Box p={3} bg="rgba(255,255,255,0.05)" borderRadius="lg">
                            <Text fontSize="xs" color="gray.400" mb={1}>Students</Text>
                            <HStack>
                              <Icon as={GraduationCap} size={14} color="purple.400" />
                              <Text fontWeight="bold" fontSize="lg">{sCount}</Text>
                            </HStack>
                          </Box>
                        </SimpleGrid>

                        <Button
                          size="sm"
                          w="full"
                          leftIcon={<Icon as={Settings} size={16} />}
                          colorScheme="purple"
                          variant="solid"
                          onClick={() => handleManageGroupClick(group)}
                          boxShadow="0 4px 14px 0 rgba(128, 90, 213, 0.39)"
                          _hover={{ bg: 'purple.500', transform: 'translateY(-1px)' }}
                        >
                          Manage Members
                        </Button>
                      </MotionBox>
                    );
                  })}
                </AnimatePresence>
              </SimpleGrid>
              {filteredGroups.length === 0 && (
                <Flex justify="center" align="center" h="200px" color="gray.500" flexDirection="column">
                  <Icon as={Search} size={48} mb={4} />
                  <Text>No groups found matching "{searchQuery}"</Text>
                </Flex>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modals */}
        {selectedUser && (
          <UpdateRoleModal
            isOpen={isRoleModalOpen}
            onClose={onRoleModalClose}
            user={selectedUser}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {selectedGroup && data.users && (
          <ManageGroupModal
            isOpen={isGroupModalOpen}
            onClose={onGroupModalClose}
            group={selectedGroup}
            allUsers={data.users}
            onGroupUpdated={handleGroupUpdated}
          />
        )}

        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={onCreateGroupClose}
          onGroupCreated={handleGroupCreated}
        />
      </Container>
    </Box>
  );
};

export default AdminDashboard;
