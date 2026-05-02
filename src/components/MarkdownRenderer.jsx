import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import InteractiveWidget from './InteractiveWidget';
import ArchitectureExplorer from './ArchitectureExplorer';
import MermaidBlock from './MermaidBlock';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownRenderer.css';

// Module-level constants — avoid re-creating on every render
const remarkPluginsArray = [remarkGfm, remarkMath];
const rehypePluginsArray = [
  rehypeRaw,
  rehypeKatex,
  [rehypeHighlight, { plainText: ['interactive', 'mermaid', 'architecture'] }],
  rehypeSlug,
];

/**
 * Extract raw SVG blocks from markdown BEFORE React parsing.
 * SVGs use attributes like font-family, text-anchor etc. that React
 * rejects. We replace them with placeholder divs, then inject the
 * original SVG HTML via DOM manipulation in useEffect (NOT via
 * React component overrides, which caused scroll-blocking bugs).
 */
function extractSvgBlocks(markdown) {
  const svgMap = new Map();
  let counter = 0;
  const processed = markdown.replace(/<svg[\s\S]*?<\/svg>/gi, (match) => {
    const id = `svg-placeholder-${counter++}`;
    svgMap.set(id, match);
    return `<div data-svg-placeholder="${id}"></div>`;
  });
  return { processed, svgMap };
}

const SIZE_PRESETS = [
  { label: 'S', value: '300', title: '300px' },
  { label: 'M', value: '500', title: '500px' },
  { label: 'L', value: '700', title: '700px' },
  { label: '100%', value: 'full', title: '全宽' },
];

/**
 * Parse image URL hash for sizing: ![alt](url#width=500)
 * Also supports: ![alt](url#small) / #medium / #large / #full
 */
function parseImageProps(src) {
  if (!src) return { cleanSrc: src, style: {}, currentSize: null };
  const [cleanSrc, hash] = src.split('#');
  if (!hash) return { cleanSrc, style: {}, currentSize: null };

  const presets = { small: '300px', medium: '500px', large: '700px', full: '100%' };
  if (presets[hash]) return { cleanSrc, style: { maxWidth: presets[hash] }, currentSize: hash };

  const wm = hash.match(/width[=:](\d+)/);
  if (wm) return { cleanSrc, style: { maxWidth: `${wm[1]}px` }, currentSize: wm[1] };

  return { cleanSrc, style: {}, currentSize: null };
}

function replaceImageSize(markdownContent, originalSrc, newSize) {
  const { cleanSrc } = parseImageProps(originalSrc);
  const escaped = cleanSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escaped}(#[^)]*)?\\)`, 'g');
  const newHash = newSize === 'full' ? '#full' : `#width=${newSize}`;
  return markdownContent.replace(regex, `$1${cleanSrc}${newHash})`);
}

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="md-lightbox" onClick={onClose}>
      <div className="md-lightbox__backdrop" />
      <div className="md-lightbox__content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt || ''} />
        {alt && <p className="md-lightbox__caption">{alt}</p>}
        <button className="md-lightbox__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  );
}

function EditableImage({ src, alt, style, editable, onResize, onLightbox, ...props }) {
  const { cleanSrc, style: parsedStyle, currentSize } = parseImageProps(src);
  const mergedStyle = { ...style, ...parsedStyle };

  return (
    <span className="md-figure">
      {editable && (
        <span className="md-figure__toolbar">
          {SIZE_PRESETS.map(p => (
            <button
              key={p.value}
              className={`md-figure__size-btn${currentSize === p.value ? ' md-figure__size-btn--active' : ''}`}
              onClick={() => onResize(src, p.value)}
              title={p.title}
            >
              {p.label}
            </button>
          ))}
        </span>
      )}
      <img
        src={cleanSrc}
        alt={alt || ''}
        loading="lazy"
        {...props}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          cursor: editable ? 'default' : 'zoom-in',
          ...mergedStyle,
        }}
        onClick={() => !editable && onLightbox({ src: cleanSrc, alt })}
      />
      {alt && <span className="md-figure__caption">{alt}</span>}
    </span>
  );
}

export default function MarkdownRenderer({ content, editable = false, onContentChange }) {
  const [lightboxImg, setLightboxImg] = useState(null);
  const containerRef = useRef(null);

  // Extract SVG blocks before markdown parsing
  const { processed, svgMap } = useMemo(
    () => extractSvgBlocks(content || ''),
    [content]
  );

  // After React renders, inject raw SVG HTML into placeholder divs via DOM
  useEffect(() => {
    if (!containerRef.current || svgMap.size === 0) return;
    const placeholders = containerRef.current.querySelectorAll('[data-svg-placeholder]');
    placeholders.forEach((el) => {
      const id = el.getAttribute('data-svg-placeholder');
      const svgHtml = svgMap.get(id);
      if (svgHtml) {
        el.innerHTML = svgHtml;
        el.classList.add('md-svg-block');
      }
    });
  }, [processed, svgMap]);

  const handleResize = useCallback((originalSrc, newSize) => {
    if (!onContentChange) return;
    const newContent = replaceImageSize(content, originalSrc, newSize);
    onContentChange(newContent);
  }, [content, onContentChange]);

  return (
    <div className="markdown-body" ref={containerRef}>
      <ReactMarkdown
        remarkPlugins={remarkPluginsArray}
        rehypePlugins={rehypePluginsArray}
        urlTransform={(url) => url}
        components={{
          img({ src, alt, ...props }) {
            const { cleanSrc, style } = parseImageProps(src);
            return (
              <EditableImage
                src={src}
                alt={alt}
                style={style}
                editable={editable}
                onResize={handleResize}
                onLightbox={setLightboxImg}
                {...props}
              />
            );
          },
          pre({ children, ...props }) {
            const child = Array.isArray(children) ? children[0] : children;
            const rawClass = child?.props?.className || '';
            // className can be a string or an array (depending on rehype version)
            const className = Array.isArray(rawClass) ? rawClass.join(' ') : String(rawClass);

            // Interactive widget
            if (className.includes('language-interactive')) {
              const code = typeof child.props.children === 'string'
                ? child.props.children
                : String(child.props.children || '');
              return <InteractiveWidget config={code.trim()} />;
            }

            // Mermaid diagram
            if (className.includes('language-mermaid')) {
              const code = typeof child.props.children === 'string'
                ? child.props.children
                : String(child.props.children || '');
              return <MermaidBlock code={code.trim()} />;
            }

            // Architecture explorer
            if (className.includes('language-architecture')) {
              return <ArchitectureExplorer />;
            }

            return (
              <div className="code-block-wrapper">
                <button
                  className="code-copy-btn"
                  onClick={(e) => {
                    const code = e.target.closest('.code-block-wrapper').querySelector('code');
                    navigator.clipboard.writeText(code.textContent);
                    e.target.textContent = '✓ Copied!';
                    setTimeout(() => { e.target.textContent = 'Copy'; }, 2000);
                  }}
                >
                  Copy
                </button>
                <pre {...props}>{children}</pre>
              </div>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>

      {lightboxImg && (
        <ImageLightbox
          src={lightboxImg.src}
          alt={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
}
