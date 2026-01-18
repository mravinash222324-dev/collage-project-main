import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Container,
  Flex,
  SimpleGrid,
  VStack,
  HStack,
  List,
  ListItem,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as Lucide from "lucide-react";

const { CheckCircle2, Clock, XCircle, FileText, Layers, Star, BarChart2 } = Lucide;

// --- Interfaces & Animation Variants ---
interface StatusCount { status: string; count: number; }
interface CategoryCount { category: string; count: number; }
interface TopProject { title: string; score: number; }
interface AnalyticsData {
  project_status_counts: StatusCount[];
  project_category_counts: CategoryCount[];
  top_innovative_projects: TopProject[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};
const MotionBox = motion(Box);

// --- Helper Component: Stat Card ---
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string, color: string }> = ({ icon, label, value, color }) => (
  <MotionBox variants={itemVariants} p={5} bg="rgba(0,0,0,0.2)" borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
    <HStack spacing={4}>
      <Flex p={3} borderRadius="full" bg={`${color}.900`} color={`${color}.300`}>
        {icon}
      </Flex>
      <VStack align="flex-start" spacing={0}>
        <Text fontSize="sm" color="gray.400">{label}</Text>
        <Text fontSize="2xl" fontWeight="bold" color="white">{value}</Text>
      </VStack>
    </HStack>
  </MotionBox>
);

// --- Main Analytics Component ---
const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/'); return; }
        const response = await axios.get('http://127.0.0.1:8000/analytics/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnalytics(response.data);
      } catch (err) {
        setError('Failed to fetch analytics. You may not have the required permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return { icon: <CheckCircle2 />, color: "green" };
      case 'pending': return { icon: <Clock />, color: "yellow" };
      case 'rejected': return { icon: <XCircle />, color: "red" };
      default: return { icon: <FileText />, color: "gray" };
    }
  };

  if (loading) {
    return (
      <Center h="calc(100vh - 72px)" color="white">
        <Spinner size="xl" color="cyan.400" thickness="4px" />
        <Text ml={4} fontSize="xl">Loading Analytics...</Text>
      </Center>
    );
  }

  return (
    <Flex w="100%" h="calc(100vh - 72px)" justify="center" position="relative" color="white">
      <MotionBox position="absolute" top="0" left="0" w="80" h="80" rounded="full" bgGradient="radial(cyan.800, transparent)" filter="blur(200px)" opacity={0.2} zIndex={-1} />
      <MotionBox position="absolute" bottom="0" right="0" w="96" h="96" rounded="full" bgGradient="radial(blue.800, transparent)" filter="blur(200px)" opacity={0.2} zIndex={-1} />

      <Container maxW="container.xl" h="100%" overflowY="auto" py={{ base: 6, md: 8 }}
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.2)', borderRadius: '24px' },
        }}>
        <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <Heading as="h1" size="2xl" mb={10} textAlign="center" bgGradient="linear(to-r, cyan.400, blue.400)" bgClip="text" fontWeight="extrabold">
            Project Analytics Dashboard
          </Heading>
        </motion.div>

        {error ? (
          <Center h="50vh"><Text color="red.400" fontSize="xl">{error}</Text></Center>
        ) : !analytics ? (
          <Center h="50vh"><Text color="gray.400" fontSize="xl">No analytics data available.</Text></Center>
        ) : (
          <MotionBox variants={containerVariants} initial="hidden" animate="visible">
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
              {/* Left Column */}
              <VStack spacing={8} align="stretch">
                <MotionBox variants={itemVariants} bg="rgba(10, 15, 40, 0.6)" border="1px solid rgba(255, 255, 255, 0.1)" borderRadius="2xl" p={6}>
                  <HStack mb={4}><BarChart2 /><Heading size="md">Status Breakdown</Heading></HStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {analytics.project_status_counts.map((item, index) => {
                      const { icon, color } = getStatusIcon(item.status);
                      return <StatCard key={index} icon={icon} label={item.status} value={item.count} color={color} />;
                    })}
                  </SimpleGrid>
                </MotionBox>
                <MotionBox variants={itemVariants} bg="rgba(10, 15, 40, 0.6)" border="1px solid rgba(255, 255, 255, 0.1)" borderRadius="2xl" p={6}>
                  <HStack mb={4}><Layers /><Heading size="md">Projects by Category</Heading></HStack>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {analytics.project_category_counts.map((item, index) => (
                      <StatCard key={index} icon={<Layers />} label={item.category} value={item.count} color="purple" />
                    ))}
                  </SimpleGrid>
                </MotionBox>
              </VStack>

              {/* Right Column */}
              <MotionBox variants={itemVariants} bg="rgba(10, 15, 40, 0.6)" border="1px solid rgba(255, 255, 255, 0.1)" borderRadius="2xl" p={6}>
                <HStack mb={4}><Star /><Heading size="md">Top 5 Innovative Projects</Heading></HStack>
                <List spacing={4}>
                  {analytics.top_innovative_projects.map((item, index) => (
                    <ListItem key={index} p={3} bg="rgba(0,0,0,0.2)" borderRadius="md">
                      <HStack justify="space-between">
                        <Text fontWeight="medium" color="cyan.200">{item.title}</Text>
                        <Text fontWeight="bold" color="yellow.300">{item.score.toFixed(1)}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </MotionBox>
            </SimpleGrid>
          </MotionBox>
        )}
      </Container>
    </Flex>
  );
};

export default AnalyticsDashboard;