import React, { useState } from 'react';
import { teamApi } from '../config/api';
import { User, X, Plus, AlertCircle } from 'lucide-react';
import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    VStack,
    HStack,
    Heading,
    Icon,
    useToast,
    Badge,
    FormControl,
    FormLabel,
    IconButton
} from '@chakra-ui/react';

interface TeamMember {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface TeamManagementProps {
    projectId: number;
    currentMembers: TeamMember[];
    isLeader: boolean;
    onMemberUpdated: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ projectId, currentMembers, isLeader, onMemberUpdated }) => {
    const [newUsername, setNewUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Reset error/success states on new submission attempts usually, using toast instead for cleaner UI

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setIsLoading(true);

        try {
            await teamApi.addMember(projectId, newUsername);
            toast({
                title: 'Member Added',
                description: `${newUsername} has been added to the team.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setNewUsername('');
            onMemberUpdated(); // Refresh the parent's data
        } catch (err: any) {
            toast({
                title: 'Error Adding Member',
                description: err.response?.data?.detail || 'Failed to add member. Please check the username.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveMember = async (userId: number, username: string) => {
        // In a real app, maybe use a custom confirmation modal, but window.confirm is quick for now
        if (!window.confirm(`Are you sure you want to remove ${username} from the team?`)) return;

        setIsLoading(true);

        try {
            await teamApi.removeMember(projectId, userId);
            toast({
                title: 'Member Removed',
                description: `${username} has been removed.`,
                status: 'info',
                duration: 3000,
                isClosable: true,
            });
            onMemberUpdated();
        } catch (err: any) {
            toast({
                title: 'Error Removing Member',
                description: err.response?.data?.detail || 'Failed to remove member.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            p={6}
            bg="whiteAlpha.50"
            borderRadius="xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
        >
            <Flex align="center" gap={3} mb={6}>
                <Box p={2} bg="cyan.900" borderRadius="lg">
                    <Icon as={User} color="cyan.300" boxSize={6} />
                </Box>
                <Heading
                    size="md"
                    bgGradient="linear(to-r, cyan.200, purple.200)"
                    bgClip="text"
                >
                    Team Management
                </Heading>
            </Flex>

            <VStack spacing={6} align="stretch">

                {/* Member List */}
                <Box>
                    <Text color="cyan.200" mb={3} fontWeight="600" fontSize="sm" textTransform="uppercase" letterSpacing="wide">
                        Current Members
                    </Text>
                    <VStack spacing={3} align="stretch">
                        {currentMembers.map((member) => (
                            <Flex
                                key={member.id}
                                align="center"
                                justify="space-between"
                                bg="whiteAlpha.100"
                                p={3}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="transparent"
                                transition="all 0.2s"
                                _hover={{ borderColor: 'cyan.500', bg: 'whiteAlpha.200' }}
                            >
                                <HStack spacing={3}>
                                    <Flex
                                        w={8}
                                        h={8}
                                        borderRadius="full"
                                        bgGradient="linear(to-br, cyan.500, blue.600)"
                                        align="center"
                                        justify="center"
                                        fontSize="xs"
                                        fontWeight="bold"
                                        color="white"
                                    >
                                        {member.username.substring(0, 2).toUpperCase()}
                                    </Flex>
                                    <Box>
                                        <Text color="gray.100" fontWeight="500">{member.username}</Text>
                                        {member.role === 'Student' && (
                                            <Badge colorScheme="purple" fontSize="0.6em">Student</Badge>
                                        )}
                                    </Box>
                                </HStack>

                                {isLeader && (
                                    <IconButton
                                        aria-label="Remove Member"
                                        icon={<X size={16} />}
                                        size="sm"
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => handleRemoveMember(member.id, member.username)}
                                        isLoading={isLoading}
                                    />
                                )}
                            </Flex>
                        ))}
                    </VStack>
                </Box>

                {/* Add Member Form - Only for Leader */}
                {isLeader && (
                    <Box
                        bg="blackAlpha.40"
                        p={4}
                        borderRadius="lg"
                        border="1px dashed"
                        borderColor="whiteAlpha.200"
                    >
                        <Text color="cyan.200" mb={3} fontWeight="600" fontSize="sm">
                            Add New Member
                        </Text>
                        <form onSubmit={handleAddMember}>
                            <VStack spacing={3} align="start">
                                <FormControl>
                                    <FormLabel fontSize="xs" color="gray.400">Student Username</FormLabel>
                                    <HStack>
                                        <Input
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Enter exact username"
                                            bg="whiteAlpha.100"
                                            border="none"
                                            color="white"
                                            _focus={{ bg: 'whiteAlpha.200', ring: 1, ringColor: 'cyan.400' }}
                                            isDisabled={isLoading}
                                        />
                                        <Button
                                            type="submit"
                                            colorScheme="cyan"
                                            leftIcon={<Plus size={18} />}
                                            isLoading={isLoading}
                                            isDisabled={!newUsername.trim()}
                                        >
                                            Add
                                        </Button>
                                    </HStack>
                                </FormControl>
                                <Text fontSize="xs" color="gray.500">
                                    <Icon as={AlertCircle} size={12} mr={1} verticalAlign="middle" />
                                    User must be a registered student and not in another team.
                                </Text>
                            </VStack>
                        </form>
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default TeamManagement;
