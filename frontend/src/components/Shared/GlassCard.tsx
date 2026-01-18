import { Box, type BoxProps } from '@chakra-ui/react';
import React from 'react';

export const GlassCard: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box
      bg="rgba(18, 24, 43, 0.6)"
      backdropFilter="blur(12px)"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="2xl"
      p={6}
      boxShadow="xl"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-2px)', borderColor: 'brand.400' }}
      {...props}
    >
      {children}
    </Box>
  );
};