// frontend/src/components/ProjectKanban.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Container,
  Badge,
  useToast,
  Flex,
  Spinner,
  IconButton,
  Center,
} from '@chakra-ui/react';
import * as Lucide from "lucide-react";
import { motion } from 'framer-motion';
import Layout from './Layout';

const { ArrowLeft, GripVertical, Sparkles } = Lucide;

const MotionBox = motion(Box);

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  created_at: string;
}

const COLUMN_COLORS: any = {
  'To Do': 'red.400',
  'In Progress': 'yellow.400',
  'Done': 'green.400',
};

const COLUMN_BG: any = {
  'To Do': 'rgba(245, 101, 101, 0.1)', // red.400 with opacity
  'In Progress': 'rgba(236, 201, 75, 0.1)', // yellow.400 with opacity
  'Done': 'rgba(72, 187, 120, 0.1)', // green.400 with opacity
};

const ProjectKanban: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch Tasks
  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { navigate('/'); return; }
      const response = await axios.get(`http://127.0.0.1:8000/projects/${projectId}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (err) {
      toast({ title: 'Failed to load tasks', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // AI Generate Tasks
  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `http://127.0.0.1:8000/projects/${projectId}/tasks/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(response.data); // API returns the list of created tasks
      toast({ title: 'AI Tasks Generated!', status: 'success' });
    } catch (err) {
      toast({ title: 'Generation Failed', description: 'Only the project owner can do this.', status: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  // Drag and Drop Logic
  const onDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow dropping
  };

  const onDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    // 1. Optimistic UI Update (Instant)
    const id = parseInt(taskId);
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    // 2. API Call
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `http://127.0.0.1:8000/tasks/${id}/update/`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // Revert on failure
      setTasks(originalTasks);
      toast({ title: 'Move failed', status: 'error' });
    }
  };

  // Helper to render a column
  const renderColumn = (status: Task['status'], title: string) => {
    const columnTasks = tasks.filter(t => t.status === status);

    return (
      <VStack
        flex="1"
        bg={COLUMN_BG[status]}
        p={4}
        borderRadius="xl"
        minH="60vh"
        align="stretch"
        borderTop="4px solid"
        borderColor={COLUMN_COLORS[status]}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, status)}
        transition="background 0.2s"
        _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
        boxShadow="lg"
        className="glass-card"
      >
        <HStack justify="space-between" mb={4}>
          <Heading size="md" color="gray.200">{title}</Heading>
          <Badge borderRadius="full" px={2} colorScheme={status === 'Done' ? 'green' : 'gray'}>
            {columnTasks.length}
          </Badge>
        </HStack>

        {columnTasks.map(task => (
          <MotionBox
            key={task.id}
            draggable
            onDragStart={(e: any) => onDragStart(e, task.id)}
            layoutId={`task-${task.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            p={4}
            bg="rgba(255, 255, 255, 0.05)"
            borderRadius="md"
            boxShadow="md"
            cursor="grab"
            _active={{ cursor: 'grabbing' }}
            borderLeft="3px solid"
            borderColor={COLUMN_COLORS[status]}
            whileHover={{ y: -2, bg: 'rgba(255, 255, 255, 0.1)' }}
          >
            <HStack align="start" justify="space-between">
              <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                {task.title}
              </Text>
              <GripVertical size={16} color="gray" />
            </HStack>
            <Text fontSize="xs" color="gray.400" mt={2}>
              {new Date(task.created_at).toLocaleDateString()}
            </Text>
          </MotionBox>
        ))}

        {columnTasks.length === 0 && (
          <Center h="100px" border="2px dashed" borderColor="gray.600" borderRadius="md">
            <Text fontSize="sm" color="gray.500">Drop items here</Text>
          </Center>
        )}
      </VStack>
    );
  };

  if (loading) return (
    <Layout userRole="Student">
      <Flex h="80vh" align="center" justify="center">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    </Layout>
  );

  return (
    <Layout userRole="Student">
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <HStack>
            <IconButton
              icon={<ArrowLeft />}
              aria-label="Back"
              variant="ghost"
              colorScheme="blue"
              onClick={() => navigate(-1)}
              color="gray.400"
              _hover={{ color: "white", bg: "whiteAlpha.200" }}
            />
            <Heading size="lg" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
              Project Board
            </Heading>
          </HStack>

          {tasks.length === 0 ? (
            <Button
              leftIcon={<Sparkles size={18} />}
              colorScheme="pink"
              onClick={handleGenerateTasks}
              isLoading={generating}
              loadingText="AI Planning..."
            >
              Generate AI Plan
            </Button>
          ) : (
            <HStack>
              <Text fontSize="sm" color="gray.400">Drag cards to move them</Text>
            </HStack>
          )}
        </Flex>

        {/* Kanban Board */}
        <HStack align="start" spacing={6} overflowX="auto" pb={4} alignItems="stretch">
          {renderColumn('To Do', 'To Do')}
          {renderColumn('In Progress', 'In Progress')}
          {renderColumn('Done', 'Done')}
        </HStack>

      </Container>
    </Layout>
  );
};

export default ProjectKanban;