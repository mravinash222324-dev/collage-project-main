import React from 'react';
import {
    Box,
    IconButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
    VStack,
    Text,
    Badge,
    HStack,
    Button,
    Icon,
} from '@chakra-ui/react';
import { Bell, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { AppNotification } from '../context/NotificationContext';

const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'success': return CheckCircle;
            case 'warning': return AlertTriangle;
            case 'error': return XCircle;
            default: return Info;
        }
    };

    const getColor = (type: AppNotification['type']) => {
        switch (type) {
            case 'success': return 'green.400';
            case 'warning': return 'orange.400';
            case 'error': return 'red.400';
            default: return 'blue.400';
        }
    };

    return (
        <Popover placement="bottom-end" isLazy>
            <PopoverTrigger>
                <Box position="relative" display="inline-block">
                    <IconButton
                        aria-label="Notifications"
                        icon={<Bell size={20} />}
                        variant="ghost"
                        color="gray.300"
                        _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                        borderRadius="full"
                    />
                    {unreadCount > 0 && (
                        <Badge
                            position="absolute"
                            top="-2px"
                            right="-2px"
                            colorScheme="red"
                            borderRadius="full"
                            variant="solid"
                            fontSize="0.6em"
                            px={1}
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Box>
            </PopoverTrigger>
            <PopoverContent
                bg="#1A202C"
                borderColor="whiteAlpha.200"
                color="white"
                _focus={{ boxShadow: 'none' }}
                width="350px"
                maxH="500px"
                overflow="hidden"
                display="flex"
                flexDirection="column"
            >
                <PopoverHeader borderColor="whiteAlpha.100" pt={4} pb={2}>
                    <HStack justify="space-between">
                        <Text fontWeight="bold">Notifications</Text>
                        <HStack>
                            <Button size="xs" variant="ghost" onClick={markAllAsRead} isDisabled={unreadCount === 0}>
                                Mark all read
                            </Button>
                            <IconButton
                                aria-label="Clear all"
                                icon={<Trash2 size={14} />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={clearAll}
                                isDisabled={notifications.length === 0}
                            />
                        </HStack>
                    </HStack>
                </PopoverHeader>
                <PopoverArrow bg="#1A202C" />
                <PopoverCloseButton color="gray.400" mt={1} />

                <PopoverBody p={0} overflowY="auto" maxH="400px" css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#4A5568' } }}>
                    {notifications.length === 0 ? (
                        <Box p={8} textAlign="center">
                            <Text color="gray.500">No notifications</Text>
                        </Box>
                    ) : (
                        <VStack align="stretch" spacing={0}>
                            {notifications.map((notif) => (
                                <Box
                                    key={notif.id}
                                    p={3}
                                    bg={notif.read ? 'transparent' : 'whiteAlpha.50'}
                                    borderBottom="1px solid"
                                    borderColor="whiteAlpha.50"
                                    _hover={{ bg: 'whiteAlpha.100' }}
                                    transition="background 0.2s"
                                    cursor="pointer"
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <HStack align="start" spacing={3}>
                                        <Icon as={getIcon(notif.type)} color={getColor(notif.type)} mt={1} size={16} />
                                        <Box flex="1">
                                            <HStack justify="space-between" mb={1}>
                                                <Text fontSize="sm" fontWeight="bold" color={notif.read ? 'gray.400' : 'white'}>
                                                    {notif.title}
                                                </Text>
                                                <HStack>
                                                    <Text fontSize="xs" color="gray.600">
                                                        {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                    <IconButton
                                                        aria-label="Delete"
                                                        icon={<Trash2 size={12} />}
                                                        size="xs"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeNotification(notif.id);
                                                        }}
                                                    />
                                                </HStack>
                                            </HStack>
                                            <Text fontSize="xs" color="gray.400" noOfLines={2}>
                                                {notif.message}
                                            </Text>
                                        </Box>
                                        {!notif.read && (
                                            <Box w="8px" h="8px" bg="blue.400" borderRadius="full" mt={2} />
                                        )}
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
