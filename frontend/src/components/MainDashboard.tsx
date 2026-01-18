// frontend/src/components/MermaidDiagram.tsx
import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import {
  Box,
  Center,
  Spinner,
  Text,
} from '@chakra-ui/react';

interface MermaidDiagramProps {
  chart: string; // Mermaid code
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!chart) return;

    setLoading(true);
    setError('');
    setSvg('');

    try {
      mermaid.initialize({ startOnLoad: false });
      mermaid.render('generatedDiagram', chart)
        .then(({ svg }) => {
          setSvg(svg);
        })
        .catch((err) => {
          console.error('Mermaid Render Error:', err);
          setError('Failed to render diagram.');
        })
        .finally(() => setLoading(false));
    } catch (err) {
      console.error('Mermaid Init Error:', err);
      setError('Diagram generation failed.');
      setLoading(false);
    }
  }, [chart]);

  return (
    <Box w="full" mt={4}>
      {loading && (
        <Center h="200px">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      )}

      {error && (
        <Center h="200px">
          <Text color="red.300">{error}</Text>
        </Center>
      )}

      {/* ⭐ Updated BOX with better styling, padding, full-width SVG, min height etc. */}
      {!error && svg && (
        <Box
          dangerouslySetInnerHTML={{ __html: svg }}
          w="full"
          overflowX="auto"
          p={6}                      // Increased padding
          bg="whiteAlpha.100"
          borderRadius="xl"
          border="1px dashed"
          borderColor="cyan.700"
          sx={{
            'svg': {
              width: '100% !important',      // Force full width
              maxWidth: 'none !important',
              height: 'auto',
              minHeight: '400px !important'  // Ensure large readable diagrams
            }
          }}
        />
      )}
    </Box>
  );
};

export default MermaidDiagram;
