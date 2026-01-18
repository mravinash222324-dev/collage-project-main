import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import ForceGraph3D from 'react-force-graph-3d';
import { Box, Spinner, Text, VStack, Button, HStack, Progress, Flex, IconButton } from '@chakra-ui/react';
import axios from 'axios';
import { RefreshCw, X, Cpu, Database } from 'lucide-react';

interface ProjectGraphProps {
    project: {
        id: number;
        title: string;
        abstract: string;
        status: string;
        progress: number;
        innovation_score?: number;
        feasibility_score?: number;
    };
    tasks: { title: string }[];
    onClose?: () => void;
}

const ProjectGraph: React.FC<ProjectGraphProps> = ({ project, tasks, onClose }) => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const fgRef = useRef<any>();

    useEffect(() => {
        fetchGraphData();
    }, [project.id]);

    const fetchGraphData = async () => {
        setLoading(true);
        try {
            const payload = {
                title: project.title,
                abstract: project.abstract,
                tasks: tasks.map(t => t.title)
            };

            const res = await axios.post('http://127.0.0.1:8001/generate-project-graph', payload);

            if (res.data && res.data.nodes) {
                setGraphData(res.data);
            }
        } catch (error) {
            console.error("Failed to generate graph", error);
        } finally {
            setLoading(false);
        }
    };

    const getNodeColor = (group: number) => {
        switch (group) {
            case 1: return "#4299E1"; // Core Concept (Blue)
            case 2: return "#F6E05E"; // Task (Yellow)
            case 3: return "#9F7AEA"; // Technology (Purple)
            case 4: return "#48BB78"; // Milestone (Green)
            default: return "#A0AEC0";
        }
    };


    return ReactDOM.createPortal(
        <Box
            h="100vh"
            w="100vw"
            bg="black"
            position="fixed"
            top={0}
            left={0}
            zIndex={9999}
            overflow="hidden"
        >
            {/* --- HUD: Top Bar --- */}
            <Flex
                position="absolute"
                top={0}
                left={0}
                right={0}
                p={6}
                justify="space-between"
                align="start"
                zIndex={50}
                bgGradient="linear(to-b, blackAlpha.800, transparent)"
                pointerEvents="none"
            >
                {/* Project Stats (Health Bar Style) */}
                <VStack align="start" spacing={1} pointerEvents="auto">
                    <HStack>
                        <Cpu color="#D6BCFA" size={24} />
                        <Text color="purple.200" fontWeight="bold" fontSize="2xl" letterSpacing="widest" fontFamily="monospace">
                            NEURAL NEXUS v2.0
                        </Text>
                    </HStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">{project.title}</Text>
                    <HStack spacing={4} mt={2}>
                        <Box w="150px">
                            <Text fontSize="xs" color="blue.300" mb={1}>SYSTEM INTEGRITY</Text>
                            <Progress value={project.progress} size="xs" colorScheme="blue" isAnimated hasStripe />
                        </Box>
                        <Box w="150px">
                            <Text fontSize="xs" color="green.300" mb={1}>FEASIBILITY</Text>
                            <Progress value={(project.feasibility_score || 0) * 10} size="xs" colorScheme="green" />
                        </Box>
                        <Box w="150px">
                            <Text fontSize="xs" color="purple.300" mb={1}>INNOVATION</Text>
                            <Progress value={(project.innovation_score || 0) * 10} size="xs" colorScheme="purple" />
                        </Box>
                    </HStack>
                </VStack>

                {/* Controls */}
                <HStack pointerEvents="auto" spacing={4}>
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="purple"
                        onClick={fetchGraphData}
                        leftIcon={<RefreshCw size={16} />}
                        bg="blackAlpha.600"
                        backdropFilter="blur(5px)"
                    >
                        REBOOT SYSTEM
                    </Button>
                    {onClose && (
                        <IconButton
                            aria-label="Close Simulation"
                            icon={<X size={20} />}
                            colorScheme="red"
                            variant="solid"
                            onClick={onClose}
                            isRound
                        />
                    )}
                </HStack>
            </Flex>

            {/* --- HUD: Loading Overlay --- */}
            {loading && (
                <VStack
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    justify="center"
                    bg="black"
                    zIndex={40}
                >
                    <Spinner size="xl" color="purple.500" thickness="4px" speed="0.65s" />
                    <Text color="purple.400" fontFamily="monospace" fontSize="xl" mt={4} className="blink">
                        INITIALIZING NEURAL LINK...
                    </Text>
                </VStack>
            )}

            {/* --- 3D Graph --- */}
            {!loading && (
                <ForceGraph3D
                    ref={fgRef}
                    graphData={graphData}
                    nodeLabel="id"
                    nodeColor={(node: any) => getNodeColor(node.group)}
                    nodeVal={(node: any) => node.val}
                    nodeResolution={32}
                    nodeOpacity={0.9}
                    linkColor={() => "rgba(100, 100, 255, 0.2)"}
                    linkWidth={1}
                    backgroundColor="#000005"
                    showNavInfo={false}
                    onNodeClick={(node: any) => {
                        setSelectedNode(node);
                        // Aim at node from outside it
                        const distance = 60;
                        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

                        fgRef.current.cameraPosition(
                            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                            node, // lookAt ({ x, y, z })
                            2000  // ms transition duration
                        );
                    }}
                    onBackgroundClick={() => setSelectedNode(null)}
                />
            )}

            {/* --- HUD: Bottom Info --- */}
            <Flex
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                p={6}
                justify="space-between"
                align="end"
                zIndex={50}
                pointerEvents="none"
                bgGradient="linear(to-t, blackAlpha.900, transparent)"
            >
                {/* Selected Node Details */}
                <Box w="400px" pointerEvents="auto">
                    {selectedNode ? (
                        <Box
                            bg="rgba(20, 20, 40, 0.8)"
                            border="1px solid"
                            borderColor="purple.500"
                            p={4}
                            borderRadius="md"
                            backdropFilter="blur(10px)"
                            boxShadow="0 0 20px rgba(128, 90, 213, 0.3)"
                        >
                            <HStack mb={2}>
                                <Database size={18} color="#D6BCFA" />
                                <Text color="purple.300" fontWeight="bold" fontFamily="monospace">
                                    DATA NODE: {selectedNode.id}
                                </Text>
                            </HStack>
                            <Text color="gray.300" fontSize="sm">
                                Group: {selectedNode.group === 1 ? "Core Concept" : selectedNode.group === 2 ? "Task" : selectedNode.group === 3 ? "Technology" : "Milestone"}
                            </Text>
                            <Text color="gray.400" fontSize="xs" mt={2}>
                                Connectivity Value: {selectedNode.val}
                            </Text>
                        </Box>
                    ) : (
                        <Text color="whiteAlpha.500" fontSize="sm" fontFamily="monospace">
                            [SYSTEM IDLE] Select a node to analyze data packet.
                        </Text>
                    )}
                </Box>

                {/* Controls Hint */}
                <HStack spacing={4} color="whiteAlpha.600" fontSize="xs" fontFamily="monospace">
                    <Text>ROTATION: [L-CLICK]</Text>
                    <Text>PAN: [R-CLICK]</Text>
                    <Text>ZOOM: [SCROLL]</Text>
                </HStack>
            </Flex>
        </Box>,
        document.body
    );
};

export default ProjectGraph;
