import React from 'react';
import { Box, Heading, Text, Button, Icon, VStack } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    title = "Something went wrong",
    message = "We couldn't load the data. Please try again.",
    onRetry
}) => {
    return (
        <Box
            textAlign="center"
            py={10}
            px={6}
            bg="whiteAlpha.50"
            borderRadius="xl"
            border="1px dashed"
            borderColor="red.500"
        >
            <VStack spacing={4}>
                <Icon as={AlertTriangle} boxSize={'50px'} color={'red.500'} />
                <Heading as="h2" size="xl" mt={6} mb={2} color="white">
                    {title}
                </Heading>
                <Text color={'gray.400'}>
                    {message}
                </Text>
                {onRetry && (
                    <Button
                        colorScheme="red"
                        variant="outline"
                        onClick={onRetry}
                        mt={4}
                    >
                        Retry
                    </Button>
                )}
            </VStack>
        </Box>
    );
};

export default ErrorState;
