// frontend/src/components/UpdateRoleModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Select,
  useToast,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Icon,
  Box,
} from '@chakra-ui/react';
import axios from 'axios';
import * as Lucide from "lucide-react";

const { Shield, Check } = Lucide;

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface UpdateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const UpdateRoleModal: React.FC<UpdateRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [newRole, setNewRole] = useState(user?.role || 'Student');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setNewRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await axios.patch(
        `${API_URL}/admin/dashboard/users/${user.id}/update-role/`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onUserUpdated(response.data);
      toast({
        title: 'Role Updated',
        description: `${user.username}'s role updated to ${newRole}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
      <ModalContent
        bg="#0f172a"
        color="white"
        border="1px solid rgba(255,255,255,0.1)"
        boxShadow="0 0 40px rgba(0,0,0,0.5)"
        borderRadius="xl"
      >
        <ModalHeader borderBottom="1px solid rgba(255,255,255,0.05)">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg">Update User Role</Text>
            <Text fontSize="sm" color="gray.400" fontWeight="normal">For user: <Text as="span" color="cyan.400" fontWeight="bold">{user.username}</Text></Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: "white" }} />

        <ModalBody py={8}>
          <FormControl>
            <FormLabel color="gray.300" mb={3}>Select New Role</FormLabel>
            <Box position="relative">
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                bg="rgba(255,255,255,0.05)"
                borderColor="rgba(255,255,255,0.1)"
                color="white"
                h="50px"
                _hover={{ borderColor: "cyan.500" }}
                _focus={{ borderColor: "cyan.500", boxShadow: "0 0 0 1px #0BC5EA" }}
                icon={<Icon as={Shield} />}
              >
                <option style={{ color: 'black' }} value="Student">Student</option>
                <option style={{ color: 'black' }} value="Teacher">Teacher</option>
                <option style={{ color: 'black' }} value="HOD/Admin">HOD/Admin</option>
              </Select>
            </Box>
            <Text fontSize="xs" color="gray.500" mt={3}>
              * Changing a role will update the user's permissions immediately.
            </Text>
          </FormControl>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(255,255,255,0.05)">
          <Button variant="ghost" mr={3} onClick={onClose} color="gray.400" _hover={{ color: "white", bg: "whiteAlpha.100" }}>
            Cancel
          </Button>
          <Button
            colorScheme="cyan"
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<Icon as={Check} />}
            boxShadow="0 0 15px rgba(6, 182, 212, 0.4)"
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateRoleModal;