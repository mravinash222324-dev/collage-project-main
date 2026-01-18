import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Outfit', sans-serif",
    body: "'Outfit', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: '#0f172a',
        color: 'white',
      },
    },
  },
  colors: {
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    blue: {
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: '12px',
      },
      variants: {
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
        },
        ghost: {
          color: 'gray.400',
          _hover: {
            bg: 'whiteAlpha.100',
            color: 'white',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        item: {
          bg: 'transparent',
          _hover: {
            bg: 'whiteAlpha.100',
          },
        },
      },
    },
  },
});

export default theme;
