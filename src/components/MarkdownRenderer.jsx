import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownRenderer.css';

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Add copy button to code blocks
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
