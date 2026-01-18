import React from 'react';
import { Box, Heading, Text, Button, Icon, Container } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxW="container.md" h="100vh" centerContent justifyContent="center">
            <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                textAlign="center"
                p={10}
                bg="rgba(255, 255, 255, 0.03)"
                backdropFilter="blur(10px)"
                borderRadius="2xl"
                border="1px solid rgba(255, 255, 255, 0.05)"
                boxShadow="0 0 40px rgba(0, 0, 0, 0.5)"
            >
                <Icon as={AlertTriangle} w={24} h={24} color="orange.400" mb={6} />

                <Heading
                    as="h1"
                    size="4xl"
                    bgGradient="linear(to-r, orange.400, red.500)"
                    bgClip="text"
                    mb={4}
                >
                    404
                </Heading>

                <Heading size="lg" color="white" mb={4}>
                    Page Not Found
                </Heading>

                <Text fontSize="lg" color="gray.400" mb={8}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </Text>

                <Button
                    leftIcon={<Home size={20} />}
                    colorScheme="cyan"
                    size="lg"
                    onClick={() => navigate(-1)}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)' }}
                >
                    Go Back
                </Button>
            </MotionBox>
        </Container>
    );
};

export default NotFound;
