// frontend/src/index.tsx or main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme, type ThemeConfig } from '@chakra-ui/react';
import App from './App';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Custom theme
const theme = extendTheme({
  config,
  colors: {
    teal: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5', // main neon teal
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748', // main bg
      800: '#1A202C',
      900: '#171923',
    },
  },
  shadows: {
    outline: '0 0 0 3px rgba(79, 209, 197, 0.6)', // neon glow for focused elements
    neon: '0 0 10px rgba(79, 209, 197, 0.6)', // custom shadow
  },
  
});
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
