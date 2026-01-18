// frontend/src/components/CreateGroupModal.tsx
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
    FormControl,
    FormLabel,
    Input,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import axios from 'axios';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: (newGroup: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    onClose,
    onGroupCreated,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({
                title: 'Error',
                description: 'Group name is required.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('accessToken');
        try {
            const response = await axios.post(
                `${API_URL}/admin/dashboard/`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: 'Success',
                description: 'Group created successfully.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onGroupCreated(response.data);
            setName('');
            setDescription('');
            onClose();
        } catch (error: any) {
            console.error('Failed to create group:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to create group.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
            <ModalContent bg="#0f172a" color="white" border="1px solid rgba(255,255,255,0.1)">
                <ModalHeader>Create New Group</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel color="gray.400">Group Name</FormLabel>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Class A - 2024"
                                bg="rgba(255,255,255,0.05)"
                                border="none"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel color="gray.400">Description</FormLabel>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                bg="rgba(255,255,255,0.05)"
                                border="none"
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} color="gray.400">
                        Cancel
                    </Button>
                    <Button
                        colorScheme="cyan"
                        onClick={handleSubmit}
                        isLoading={loading}
                    >
                        Create Group
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CreateGroupModal;
