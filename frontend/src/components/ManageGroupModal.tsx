// frontend/src/components/ManageGroupModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useToast,
  Box,
  Heading,
  VStack,
  Text,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
  Avatar,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';
import * as Lucide from "lucide-react";

const {
  UserPlus,
  UserMinus,
  Search,
  Briefcase,
  GraduationCap,
} = Lucide;

// Define types
interface User {
  id: number;
  username: string;
  role: string;
}

type GroupUserRef = number | string | { id: number | string };

interface Group {
  id: number;
  name: string;
  teachers: GroupUserRef[];
  students: GroupUserRef[];
}

interface ManageGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  allUsers: User[];
  onGroupUpdated: (updatedGroup: Group) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const toNumericId = (val: GroupUserRef): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val);
  const raw = (val as { id?: number | string })?.id;
  return typeof raw === 'number' ? raw : Number(raw);
};

const normalizeIds = (arr: GroupUserRef[] | undefined): number[] =>
  (arr ?? [])
    .map(toNumericId)
    .filter((n) => Number.isFinite(n)) as number[];

const ManageGroupModal: React.FC<ManageGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  allUsers,
  onGroupUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  if (!group) return null;

  const teacherIds = normalizeIds(group.teachers);
  const studentIds = normalizeIds(group.students);

  const teachersInGroup = allUsers.filter((u) => teacherIds.includes(Number(u.id)));
  const studentsInGroup = allUsers.filter((u) => studentIds.includes(Number(u.id)));

  const members = [...teachersInGroup, ...studentsInGroup];
  const memberIds = members.map((m) => Number(m.id));
  const nonMembers = allUsers.filter((u) => !memberIds.includes(Number(u.id)));

  // Filter lists based on search
  const filterUser = (u: User) => u.username.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredTeachers = teachersInGroup.filter(filterUser);
  const filteredStudents = studentsInGroup.filter(filterUser);
  const filteredNonMembers = nonMembers.filter(filterUser);

  const handleUserAction = async (
    userId: number,
    action: 'add_student' | 'remove_student' | 'add_teacher' | 'remove_teacher'
  ) => {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await axios.patch(
        `${API_URL}/admin/dashboard/groups/${group.id}/manage-users/`,
        { user_id: userId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onGroupUpdated(response.data);
      toast({
        title: 'Success',
        description: 'Group membership updated.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to update group:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAction = (
    user: User,
    type: 'add' | 'remove'
  ): 'add_student' | 'remove_student' | 'add_teacher' | 'remove_teacher' => {
    if (type === 'add') {
      return user.role === 'Teacher' || user.role === 'HOD/Admin' ? 'add_teacher' : 'add_student';
    }
    if (teacherIds.includes(Number(user.id))) return 'remove_teacher';
    return 'remove_student';
  };

  const UserListItem = ({ user, actionType }: { user: User, actionType: 'add' | 'remove' }) => (
    <HStack
      justify="space-between"
      p={3}
      bg="rgba(255,255,255,0.05)"
      borderRadius="lg"
      border="1px solid rgba(255,255,255,0.05)"
      _hover={{ bg: "rgba(255,255,255,0.1)" }}
    >
      <HStack>
        <Avatar size="sm" name={user.username} bg={user.role === 'Teacher' ? 'cyan.500' : 'purple.500'} />
        <Box>
          <Text fontWeight="bold" fontSize="sm">{user.username}</Text>
          <Badge
            colorScheme={user.role === 'Teacher' ? 'cyan' : user.role === 'HOD/Admin' ? 'purple' : 'blue'}
            fontSize="xs"
            variant="subtle"
          >
            {user.role}
          </Badge>
        </Box>
      </HStack>
      <IconButton
        aria-label={actionType === 'add' ? "Add user" : "Remove user"}
        icon={<Icon as={actionType === 'add' ? UserPlus : UserMinus} />}
        colorScheme={actionType === 'add' ? "green" : "red"}
        variant="ghost"
        size="sm"
        onClick={() => handleUserAction(user.id, getAction(user, actionType))}
        isDisabled={isLoading}
      />
    </HStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
      <ModalContent
        bg="#0f172a"
        color="white"
        border="1px solid rgba(255,255,255,0.1)"
        boxShadow="0 0 40px rgba(0,0,0,0.5)"
      >
        <ModalHeader borderBottom="1px solid rgba(255,255,255,0.05)">
          <Heading size="md">Manage Group: <Text as="span" color="cyan.400">{group.name}</Text></Heading>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6}>
          <InputGroup mb={6}>
            <InputLeftElement pointerEvents="none"><Icon as={Search} color="gray.500" /></InputLeftElement>
            <Input
              placeholder="Search users..."
              bg="rgba(255,255,255,0.05)"
              border="none"
              _focus={{ bg: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Tabs variant="soft-rounded" colorScheme="cyan">
            <TabList bg="rgba(255,255,255,0.05)" p={1} borderRadius="lg" mb={4}>
              <Tab w="50%" color="gray.400" _selected={{ color: 'white', bg: 'cyan.600' }}>Current Members</Tab>
              <Tab w="50%" color="gray.400" _selected={{ color: 'white', bg: 'green.600' }}>Add New</Tab>
            </TabList>

            <TabPanels>
              {/* --- Panel 1: Current Members --- */}
              <TabPanel px={0}>
                <VStack align="stretch" spacing={6}>
                  <Box>
                    <HStack mb={3}>
                      <Icon as={Briefcase} color="cyan.400" />
                      <Text fontWeight="bold" color="gray.300">Teachers ({filteredTeachers.length})</Text>
                    </HStack>
                    <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" pr={2}>
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map(u => <UserListItem key={u.id} user={u} actionType="remove" />)
                      ) : (
                        <Text color="gray.500" fontSize="sm" fontStyle="italic">No teachers found.</Text>
                      )}
                    </VStack>
                  </Box>

                  <Box>
                    <HStack mb={3}>
                      <Icon as={GraduationCap} color="purple.400" />
                      <Text fontWeight="bold" color="gray.300">Students ({filteredStudents.length})</Text>
                    </HStack>
                    <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" pr={2}>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(u => <UserListItem key={u.id} user={u} actionType="remove" />)
                      ) : (
                        <Text color="gray.500" fontSize="sm" fontStyle="italic">No students found.</Text>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* --- Panel 2: Add Users --- */}
              <TabPanel px={0}>
                <VStack align="stretch" spacing={2} maxH="400px" overflowY="auto" pr={2}>
                  {filteredNonMembers.length > 0 ? (
                    filteredNonMembers.map(u => <UserListItem key={u.id} user={u} actionType="add" />)
                  ) : (
                    <Flex h="200px" justify="center" align="center" color="gray.500">
                      <Text>No users available to add.</Text>
                    </Flex>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter borderTop="1px solid rgba(255,255,255,0.05)">
          <Button variant="ghost" onClick={onClose} color="gray.400" _hover={{ color: "white", bg: "whiteAlpha.100" }}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ManageGroupModal;
