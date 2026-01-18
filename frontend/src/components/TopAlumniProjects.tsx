import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Center,
  Container,
  Flex,
  Badge,
  HStack,
  SimpleGrid,
  Icon,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";

const { Star, Trophy, Crown, Medal, TrendingUp, Search, X } = Lucide;

// --- Interfaces & Animation Variants ---
interface Project {
  id: number;
  title: string;
  student: {
    username: string;
  };
  innovation_score: number;
  relevance_score: number;
  abstract_text: string;
  submitted_at: string;
  category?: string;
  final_report?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

// --- Ranking Badge Component ---
const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const getRankConfig = () => {
    switch (rank) {
      case 1:
        return { color: "#FFD700", icon: Trophy, label: "CHAMPION" }; // Gold
      case 2:
        return { color: "#C0C0C0", icon: Crown, label: "RUNNER UP" }; // Silver
      case 3:
        return { color: "#CD7F32", icon: Medal, label: "3rd PLACE" }; // Bronze
      default:
        return { color: "cyan.400", icon: null, label: `${rank}th` };
    }
  };

  const config = getRankConfig();

  return (
    <HStack
      bg="rgba(0,0,0,0.4)"
      px={3}
      py={1}
      borderRadius="full"
      border="1px solid"
      borderColor={config.color}
      spacing={2}
    >
      {config.icon && <Icon as={config.icon} color={config.color} w={3} h={3} />}
      <Text fontSize="2xs" fontWeight="900" color={config.color} letterSpacing="wider">
        {config.label}
      </Text>
    </HStack>
  );
};

// --- Main Component ---
const TopAlumniProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchTopProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/alumni/top-projects/');
      setProjects(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch top projects. The server may be offline.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProjects();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setIsSearching(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/alumni/search/?q=${encodeURIComponent(searchQuery)}`);
      setProjects(response.data);
      setError('');
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    fetchTopProjects();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <Center h="calc(100vh - 72px)" color="white">
        <VStack spacing={4}>
          <Spinner size="xl" color="cyan.400" thickness="4px" />
          <Text fontSize="xl" letterSpacing="widest" fontWeight="thin">CURATING ELITE TALENT...</Text>
        </VStack>
      </Center>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Center h="calc(100vh - 72px)" color="red.400" fontSize="xl">
        <Text>{error}</Text>
      </Center>
    );
  }

  return (
    <Box
      w="100%"
      minH="100vh"
      position="relative"
      color="white"
      pt={{ base: 8, md: 16 }}
      pb={{ base: 16, md: 24 }}
      overflow="hidden"
      bg="#02040a"
    >
      {/* Background Decorative Elements */}
      <MotionBox position="absolute" top="-10%" right="-5%" w="120" h="120" rounded="full" bgGradient="radial(cyan.900, transparent)" filter="blur(150px)" opacity={0.15} zIndex={0} animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity }} />
      <MotionBox position="absolute" bottom="5%" left="-5%" w="120" h="120" rounded="full" bgGradient="radial(blue.900, transparent)" filter="blur(150px)" opacity={0.15} zIndex={0} animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.1, 0.15] }} transition={{ duration: 12, repeat: Infinity }} />

      <Container maxW="container.xl" zIndex={2} position="relative">
        <VStack spacing={12} align="center">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <VStack spacing={3}>
              <Badge colorScheme="cyan" variant="outline" px={4} py={1} borderRadius="full" letterSpacing="widest" textTransform="uppercase" fontSize="xs" fontWeight="bold">
                Elite Alumni Showcase
              </Badge>
              <Heading as="h1" size="3xl" textAlign="center" bgGradient="linear(to-r, white, cyan.300, blue.500)" bgClip="text" fontWeight="900" letterSpacing="tighter">
                Alumni Project Archive
              </Heading>
              <Text color="gray.400" fontSize="lg" maxW="2xl" textAlign="center" fontWeight="medium">
                Explore the complete collection of student projects, innovation, and research.
              </Text>
            </VStack>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ width: '100%', maxWidth: '600px', position: 'relative', zIndex: 10 }}
          >
            <InputGroup size="lg">
              <Input
                placeholder="Search by topic (e.g., 'voting machine', 'AI health')..."
                bg="rgba(13, 17, 23, 0.9)"
                border="2px solid"
                borderColor="cyan.500"
                color="white"
                _placeholder={{ color: 'gray.400' }}
                _hover={{ borderColor: 'cyan.300', bg: 'rgba(13, 17, 23, 1)' }}
                _focus={{ borderColor: 'cyan.200', boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                rounded="full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                h="3.5rem"
                fontSize="md"
                px={6}
              />
              <InputRightElement width={isSearching ? "6rem" : "4rem"} h="3.5rem">
                {isSearching ? (
                  <Button h="1.75rem" size="sm" onClick={handleClearSearch} variant="ghost" color="gray.400" _hover={{ color: "white" }}>
                    Clear
                  </Button>
                ) : (
                  <IconButton
                    aria-label="Search"
                    icon={<Icon as={Search} />}
                    h="2.5rem"
                    w="2.5rem"
                    mr={1}
                    rounded="full"
                    colorScheme="cyan"
                    variant="ghost"
                    onClick={handleSearch}
                  />
                )}
              </InputRightElement>
            </InputGroup>
            <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
              Powered by AI Semantic Search &bull; Finds projects by meaning, not just keywords
            </Text>
          </motion.div>

          {projects.length === 0 ? (
            <Center h="30vh">
              <VStack spacing={6}>
                <Icon as={TrendingUp} w={16} h={16} color="gray.800" />
                <Text fontSize="xl" color="gray.600" fontWeight="bold">No projects have reached the spotlight yet.</Text>
              </VStack>
            </Center>
          ) : (
            <MotionSimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              spacing={8}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              w="full"
            >
              {projects.map((project, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                // Card styling based on rank
                const getBorderColor = () => {
                  if (rank === 1) return "rgba(255, 215, 0, 0.4)";
                  if (rank === 2) return "rgba(192, 192, 192, 0.4)";
                  if (rank === 3) return "rgba(205, 127, 50, 0.4)";
                  return "rgba(255, 255, 255, 0.1)";
                };

                return (
                  <MotionBox
                    key={project.id}
                    variants={itemVariants}
                    position="relative"
                    gridColumn={rank === 1 ? { base: "span 1", lg: "span 3" } : { base: "span 1", lg: "span 1" }}
                    mx={rank === 1 ? { base: 0, lg: "auto" } : 0}
                    maxW={rank === 1 ? { base: "full", lg: "container.md" } : "full"}
                    w="full"
                    cursor="default"
                  >
                    {/* Rank Glow Effect for Top 3 */}
                    {isTop3 && (
                      <Box
                        position="absolute"
                        inset="-1px"
                        bgGradient={
                          rank === 1 ? "linear(to-br, gold, transparent, gold)" :
                            rank === 2 ? "linear(to-br, silver, transparent, silver)" :
                              "linear(to-br, #CD7F32, transparent, #CD7F32)"
                        }
                        borderRadius="3xl"
                        filter="blur(10px)"
                        opacity={0.2}
                        zIndex={-1}
                      />
                    )}

                    <Box
                      p={rank === 1 ? 10 : 8}
                      bg="rgba(13, 17, 23, 0.8)"
                      backdropFilter="blur(20px)"
                      border="1.5px solid"
                      borderColor={getBorderColor()}
                      borderRadius="3xl"
                      height="full"
                      transition="all 0.5s cubic-bezier(0.19, 1, 0.22, 1)"
                      _hover={{
                        transform: 'translateY(-10px)',
                        borderColor: isTop3 ? (rank === 1 ? "gold" : rank === 2 ? "silver" : "#CD7F32") : "cyan.500",
                        boxShadow: `0 30px 60px -12px ${isTop3 ? (rank === 1 ? "rgba(218,165,32,0.3)" : "rgba(0,183,255,0.15)") : "rgba(0,0,0,0.5)"}`,
                      }}
                    >
                      <VStack align="stretch" spacing={6} h="full">
                        <HStack justify="space-between" align="center">
                          <RankBadge rank={rank} />
                          <HStack spacing={1.5} opacity={0.8}>
                            <Icon as={TrendingUp} color="cyan.400" w={3.5} h={3.5} />
                            <Text fontSize="2xs" color="cyan.400" fontWeight="900" letterSpacing="widest">TRENDING</Text>
                          </HStack>
                        </HStack>

                        <VStack align="stretch" spacing={3}>
                          <Heading size={rank === 1 ? "lg" : "md"} color="white" lineHeight="1.2" fontWeight="800">
                            {project.title}
                          </Heading>
                          <Text fontSize="sm" color="gray.400" fontWeight="bold" letterSpacing="wide">
                            {project.student?.username || 'Elite Student'}
                          </Text>
                        </VStack>

                        <Text color="gray.300" fontSize={rank === 1 ? "md" : "sm"} noOfLines={4} flex="1" lineHeight="1.6">
                          {project.abstract_text}
                        </Text>

                        <VStack spacing={5} align="stretch" pt={4} borderTop="1px solid rgba(255,255,255,0.05)">
                          <SimpleGrid columns={2} spacing={4}>
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="2xs" color="gray.500" fontWeight="900" letterSpacing="widest">RELEVANCE</Text>
                              <Text fontWeight="800" color="cyan.400" fontSize="xl">{project.relevance_score?.toFixed(1) || '0.0'}</Text>
                            </VStack>
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="2xs" color="gray.500" fontWeight="900" letterSpacing="widest">INNOVATION</Text>
                              <Text fontWeight="800" color="purple.400" fontSize="xl">{project.innovation_score?.toFixed(1) || '0.0'}</Text>
                            </VStack>
                          </SimpleGrid>

                          <Flex justify="space-between" align="center">
                            <Badge colorScheme="whiteAlpha" variant="subtle" fontSize="2xs" borderRadius="lg" px={2} py={0.5} textTransform="none" fontWeight="bold">
                              {project.category || 'Tech'}
                            </Badge>
                            <Text fontSize="xs" color="gray.600" fontWeight="bold">
                              {project.submitted_at ? new Date(project.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Recent'}
                            </Text>
                          </Flex>

                          {project.final_report && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="cyan"
                              width="full"
                              leftIcon={<Icon as={Lucide.FileText} size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(project.final_report, '_blank');
                              }}
                              _hover={{ bg: 'rgba(0, 255, 255, 0.1)' }}
                            >
                              View Documentation
                            </Button>
                          )}
                        </VStack>
                      </VStack>
                    </Box>
                  </MotionBox>
                );
              })}
            </MotionSimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default TopAlumniProjects;