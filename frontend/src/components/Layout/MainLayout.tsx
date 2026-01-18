import type { ReactNode } from 'react';
import {
  Box, Flex, Icon, useDisclosure, Drawer, DrawerContent,
  IconButton, Text, VStack, Avatar, HStack
} from '@chakra-ui/react';
import {
  FiHome, FiFileText, FiMessageSquare, FiTrendingUp,
  FiMenu, FiCpu, FiAward, FiSettings, FiActivity, FiArchive
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

interface LinkItemProps {
  name: string;
  icon: any;
  path: string;
  roles: string[];
}

// ✅ Updated LinkItems to include Admin, Progress, and Archive
const LinkItems: LinkItemProps[] = [
  // Student Links
  { name: 'My Projects', icon: FiHome, path: '/student-dashboard', roles: ['Student'] },
  { name: 'New Submission', icon: FiCpu, path: '/submit', roles: ['Student'] },

  // Teacher / Admin Links
  { name: 'Review Submissions', icon: FiFileText, path: '/teacher-dashboard', roles: ['Teacher', 'HOD/Admin'] },
  { name: 'Track Progress', icon: FiActivity, path: '/teacher/approved-projects', roles: ['Teacher', 'HOD/Admin'] },
  { name: 'Analytics', icon: FiTrendingUp, path: '/analytics', roles: ['Teacher', 'HOD/Admin'] },
  { name: 'Archived Projects', icon: FiArchive, path: '/archive', roles: ['Teacher', 'HOD/Admin'] },

  // Admin Only
  { name: 'Admin Panel', icon: FiSettings, path: '/admin', roles: ['HOD/Admin'] },

  // Shared Links (Everyone)
  { name: 'AI Assistant', icon: FiMessageSquare, path: '/ai-chat', roles: ['Student', 'Teacher', 'HOD/Admin'] },
  { name: 'Top Alumni Projects', icon: FiAward, path: '/top-projects', roles: ['Student', 'Teacher', 'HOD/Admin'] },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box minH="100vh" bg="#0f172a">
      <SidebarContent onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* Mobile Nav */}
      <MobileNav onOpen={onOpen} />
      {/* Main Content Area */}
      <Box ml={{ base: 0, md: 60 }} p="4" transition="all 0.3s">
        {children}
      </Box>
    </Box>
  );
}

const SidebarContent = ({ onClose, ...rest }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('userRole') || '';
  const username = localStorage.getItem('username') || 'User';

  return (
    <Box
      transition="3s ease"
      bg="rgba(15, 23, 42, 0.6)"
      backdropFilter="blur(20px)"
      borderRight="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      zIndex={100}
      {...rest}>
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
          AI-PMS
        </Text>
        <IconButton display={{ base: 'flex', md: 'none' }} onClick={onClose} variant="outline" aria-label="close menu" icon={<FiMenu />} color="white" />
      </Flex>
      <VStack align="stretch" spacing={1} mt={4}>
        {LinkItems.map((link) => (
          link.roles.includes(userRole) && (
            <NavItem
              key={link.name}
              icon={link.icon}
              isActive={location.pathname === link.path}
              onClick={() => { navigate(link.path); onClose(); }}
            >
              {link.name}
            </NavItem>
          )
        ))}
      </VStack>

      {/* User Profile Section at Bottom */}
      <Box position="absolute" bottom="0" w="full" p={4} borderTop="1px solid rgba(255,255,255,0.05)">
        <HStack cursor="pointer" onClick={() => {
          localStorage.clear();
          navigate('/');
        }}>
          <Avatar size="sm" name={username} bg="blue.500" />
          <VStack align="start" spacing={0} ml={2}>
            <Text fontSize="sm" fontWeight="bold" color="white">{username}</Text>
            <Text fontSize="xs" color="gray.400">Logout</Text>
          </VStack>
        </HStack>
      </Box>
    </Box>
  );
};

const NavItem = ({ icon, children, isActive, ...rest }: any) => {
  return (
    <Flex
      align="center"
      p="3"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      bg={isActive ? 'blue.500' : 'transparent'}
      color={isActive ? 'white' : 'gray.400'}
      boxShadow={isActive ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'}
      _hover={{
        bg: isActive ? 'blue.600' : 'whiteAlpha.100',
        color: 'white',
      }}
      transition="all 0.2s"
      {...rest}>
      {icon && (
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
};

const MobileNav = ({ onOpen, ...rest }: any) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg="transparent"
      borderBottomWidth="1px"
      borderBottomColor="whiteAlpha.100"
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      display={{ base: 'flex', md: 'none' }}
      {...rest}>
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="ghost"
        aria-label="open menu"
        icon={<FiMenu />}
        color="white"
      />
      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
        color="white">
        AI-PMS
      </Text>
    </Flex>
  );
};