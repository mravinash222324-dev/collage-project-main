import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// 1. Initialize with Dark Theme for visibility
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark', 
  securityLevel: 'loose',
  fontFamily: 'sans-serif',
});

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const renderChart = async () => {
      // 2. Define a "Safe Fallback" graph if the prop is empty or broken
      let codeToRender = chart;
      if (!codeToRender || codeToRender.length < 10 || codeToRender.includes("Error")) {
        console.warn("Invalid chart data, using fallback.");
        codeToRender = `
          graph TD
            A[User] -->|Login| B(System)
            B --> C{Check Data}
            C -->|Valid| D[Dashboard]
            C -->|Invalid| E[Error]
        `;
      }

      try {
        // Unique ID for this render
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        
        // 3. Render the SVG
        const { svg: renderedSvg } = await mermaid.render(id, codeToRender);
        setSvg(renderedSvg);
        setIsLoaded(true);
      } catch (err) {
        console.error("Mermaid Render Failed:", err);
        // Even if render fails, show a simple text fallback
        setSvg('<div style="color: #888; padding: 20px;">Diagram could not be rendered.</div>');
        setIsLoaded(true);
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div 
      className="mermaid-container"
      style={{
        width: '100%',
        overflowX: 'auto',
        textAlign: 'center',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.05)', // Light background for contrast
        borderRadius: '8px',
        minHeight: '100px'
      }}
    >
      {!isLoaded && <div style={{color: 'white'}}>Loading Diagram...</div>}
      {isLoaded && <div dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  );
};

export default MermaidDiagram;