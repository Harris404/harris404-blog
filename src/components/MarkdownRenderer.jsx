import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownRenderer.css';

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeSlug]}
        urlTransform={(url) => url}
        components={{
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt || ''}
                loading="lazy"
                {...props}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              />
            );
          },
          pre({ children, ...props }) {
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
        {content}
      </ReactMarkdown>
    </div>
  );
}
