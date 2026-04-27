import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;
let mermaidCounter = 0;

function initMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: '#FDF5EE',
      primaryBorderColor: '#C45A32',
      primaryTextColor: '#2D2B28',
      secondaryColor: '#F0EDE8',
      tertiaryColor: '#FAF9F5',
      lineColor: '#B5AFA7',
      textColor: '#2D2B28',
      fontSize: '13px',
      fontFamily: '"Inter", sans-serif',
    },
    flowchart: {
      curve: 'basis',
      padding: 12,
      htmlLabels: true,
    },
    securityLevel: 'loose',
  });
  mermaidInitialized = true;
}

export default function MermaidBlock({ code }) {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const idRef = useRef(`mermaid-${++mermaidCounter}`);

  useEffect(() => {
    if (!code?.trim()) return;
    initMermaid();

    let cancelled = false;

    async function render() {
      try {
        const { svg: renderedSvg } = await mermaid.render(idRef.current, code.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Mermaid render error');
          setSvg('');
        }
        // Clean up error element mermaid might have added
        const errEl = document.getElementById('d' + idRef.current);
        if (errEl) errEl.remove();
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="mermaid-error">
        <span className="mermaid-error__badge">Mermaid Error</span>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div className="mermaid-block">
      <div
        ref={containerRef}
        className="mermaid-block__svg"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
