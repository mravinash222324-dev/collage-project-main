import React from 'react';
import { Box, Container, Heading } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import StudentAssignmentView from './StudentAssignmentView';

const MotionBox = motion(Box);

const Assignments: React.FC = () => {
    return (
        <Container maxW="container.xl" py={8}>
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Heading mb={6} bgGradient="linear(to-r, cyan.400, blue.400)" bgClip="text">
                    All Assignments
                </Heading>
                <Box
                    bg="rgba(28, 38, 78, 0.5)"
                    backdropFilter="blur(20px)"
                    borderRadius="xl"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    p={6}
                    boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                >
                    <StudentAssignmentView />
                </Box>
            </MotionBox>
        </Container>
    );
};

export default Assignments;
