import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import useArticles from '../hooks/useArticles';
import './Write.css';

const DRAFT_KEY = 'blog-draft';

function loadDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : { title: '', category: 'LLM', tags: '', content: '' };
  } catch {
    return { title: '', category: 'LLM', tags: '', content: '' };
  }
}

export default function Write() {
  const navigate = useNavigate();
  const { addArticle } = useArticles();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(loadDraft);
  const [previewMode, setPreviewMode] = useState(false);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const firstLine = content.split('\n')[0];
      let title = form.title;
      if (firstLine.startsWith('# ')) {
        title = firstLine.replace(/^#\s+/, '');
      }
      update('content', content);
      if (title !== form.title) {
        setForm(prev => {
          const next = { ...prev, content, title };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
          return next;
        });
      }
    };
    reader.readAsText(file);
  };

  const handlePublish = () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Please provide a title and content');
      return;
    }

    const article = addArticle({
      title: form.title.trim(),
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: form.content,
      summary: form.content.substring(0, 160).replace(/[#*`]/g, '').trim(),
    });

    localStorage.removeItem(DRAFT_KEY);
    navigate(`/article/${article.id}`);
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = document.getElementById('write-content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.substring(start, end);
    const newContent = form.content.substring(0, start) + prefix + selected + suffix + form.content.substring(end);
    update('content', newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  return (
    <div className="write-page">
      <header className="write-header">
        <h1>Write</h1>
        <p className="write-desc">Write in Markdown or upload a <code>.md</code> file</p>
      </header>

      {/* Meta */}
      <div className="write-meta">
        <input
          className="write-input write-input--title"
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
        <div className="write-meta__row">
          <select
            className="write-select"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="LLM">LLM</option>
            <option value="Paper">Paper</option>
            <option value="Code">Code</option>
          </select>
          <input
            className="write-input"
            type="text"
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
          />
          <button className="write-upload" onClick={() => fileInputRef.current.click()}>
            Upload .md
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="write-toolbar">
        <div className="write-toolbar__left">
          <button onClick={() => insertMarkdown('**', '**')} title="Bold"><b>B</b></button>
          <button onClick={() => insertMarkdown('*', '*')} title="Italic"><i>I</i></button>
          <button onClick={() => insertMarkdown('## ')} title="Heading">H2</button>
          <button onClick={() => insertMarkdown('`', '`')} title="Code">&lt;/&gt;</button>
          <button onClick={() => insertMarkdown('\n```python\n', '\n```\n')} title="Code Block">Code</button>
          <button onClick={() => insertMarkdown('[', '](url)')} title="Link">Link</button>
          <button onClick={() => insertMarkdown('> ')} title="Quote">Quote</button>
        </div>
        <div className="write-toolbar__right">
          <button
            className={!previewMode ? 'active' : ''}
            onClick={() => setPreviewMode(false)}
          >Edit</button>
          <button
            className={previewMode ? 'active' : ''}
            onClick={() => setPreviewMode(true)}
          >Preview</button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="write-editor">
        {!previewMode ? (
          <textarea
            id="write-content"
            className="write-textarea"
            placeholder="Write your article in Markdown..."
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
          />
        ) : (
          <div className="write-preview">
            {form.content ? (
              <MarkdownRenderer content={form.content} />
            ) : (
              <p className="write-empty">Nothing to preview yet</p>
            )}
          </div>
        )}
      </div>

      <div className="write-actions">
        <button className="write-publish" onClick={handlePublish}>
          Publish
        </button>
      </div>
    </div>
  );
}
