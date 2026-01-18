import React from 'react';
import {
    Box,
    Heading,
    Text,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Container,
    VStack,
    Icon,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
import { HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const Help: React.FC = () => {
    return (
        <Container maxW="container.lg" py={10}>
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <VStack spacing={8} align="stretch">
                    <Box textAlign="center" mb={8}>
                        <Icon as={HelpCircle} w={16} h={16} color="cyan.400" mb={4} />
                        <Heading size="2xl" bgGradient="linear(to-r, cyan.400, blue.500)" bgClip="text">
                            Help Center
                        </Heading>
                        <Text fontSize="xl" color="gray.400" mt={4}>
                            Guides, FAQs, and support for the Project Management System.
                        </Text>
                    </Box>

                    <Tabs variant="soft-rounded" colorScheme="cyan" align="center">
                        <TabList mb={8} bg="whiteAlpha.100" p={2} borderRadius="full" display="inline-flex">
                            <Tab color="gray.400" _selected={{ color: 'white', bg: 'cyan.600' }} px={8}>Student Guide</Tab>
                            <Tab color="gray.400" _selected={{ color: 'white', bg: 'purple.600' }} px={8}>Teacher Guide</Tab>
                        </TabList>

                        <TabPanels>
                            {/* Student Guide */}
                            <TabPanel>
                                <VStack spacing={6} align="stretch">
                                    <Accordion allowMultiple>
                                        <AccordionItem border="none" mb={4} bg="whiteAlpha.50" borderRadius="xl">
                                            <h2>
                                                <AccordionButton _expanded={{ bg: 'whiteAlpha.100', color: 'cyan.400' }} borderRadius="xl">
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        How do I submit a project?
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                            </h2>
                                            <AccordionPanel pb={4} color="gray.300">
                                                Navigate to the "New Project" section in your dashboard. Fill in the title, abstract, and other details. The AI will analyze your submission before it is sent to your teacher for approval.
                                            </AccordionPanel>
                                        </AccordionItem>

                                        <AccordionItem border="none" mb={4} bg="whiteAlpha.50" borderRadius="xl">
                                            <h2>
                                                <AccordionButton _expanded={{ bg: 'whiteAlpha.100', color: 'cyan.400' }} borderRadius="xl">
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        How do I join a group?
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                            </h2>
                                            <AccordionPanel pb={4} color="gray.300">
                                                Currently, groups are managed by the admin or teacher. Please contact your professor to be added to a specific project group.
                                            </AccordionPanel>
                                        </AccordionItem>

                                        <AccordionItem border="none" mb={4} bg="whiteAlpha.50" borderRadius="xl">
                                            <h2>
                                                <AccordionButton _expanded={{ bg: 'whiteAlpha.100', color: 'cyan.400' }} borderRadius="xl">
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        What is the AI Viva?
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                            </h2>
                                            <AccordionPanel pb={4} color="gray.300">
                                                The AI Viva is a simulation to prepare you for your final defense. You can access it from your dashboard. The AI will ask you questions based on your project abstract.
                                            </AccordionPanel>
                                        </AccordionItem>
                                    </Accordion>
                                </VStack>
                            </TabPanel>

                            {/* Teacher Guide */}
                            <TabPanel>
                                <VStack spacing={6} align="stretch">
                                    <Accordion allowMultiple>
                                        <AccordionItem border="none" mb={4} bg="whiteAlpha.50" borderRadius="xl">
                                            <h2>
                                                <AccordionButton _expanded={{ bg: 'whiteAlpha.100', color: 'purple.400' }} borderRadius="xl">
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        How do I approve projects?
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                            </h2>
                                            <AccordionPanel pb={4} color="gray.300">
                                                Go to the "Approvals" tab in your dashboard. You will see a list of pending submissions. You can review the AI analysis and then click "Approve" or "Reject".
                                            </AccordionPanel>
                                        </AccordionItem>

                                        <AccordionItem border="none" mb={4} bg="whiteAlpha.50" borderRadius="xl">
                                            <h2>
                                                <AccordionButton _expanded={{ bg: 'whiteAlpha.100', color: 'purple.400' }} borderRadius="xl">
                                                    <Box flex="1" textAlign="left" fontWeight="bold">
                                                        How do I create an assignment?
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                            </h2>
                                            <AccordionPanel pb={4} color="gray.300">
                                                Navigate to the "Assignments" tab. Click "Create Assignment", set the title, description, and deadline. You can also specify if it's a timed assignment.
                                            </AccordionPanel>
                                        </AccordionItem>
                                    </Accordion>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </VStack>
            </MotionBox>
        </Container>
    );
};

export default Help;
