import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import useArticles from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import './Write.css';

const DRAFT_KEY = 'blog-draft';

const CODE_LANGUAGES = [
  'python', 'javascript', 'typescript', 'jsx', 'tsx',
  'bash', 'sql', 'java', 'c', 'cpp', 'rust', 'go',
  'html', 'css', 'json', 'yaml', 'markdown',
];

function loadDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : { title: '', category: 'Knowledge', tags: '', content: '' };
  } catch {
    return { title: '', category: 'Knowledge', tags: '', content: '' };
  }
}

export default function Write() {
  const navigate = useNavigate();
  const { addArticle } = useArticles();
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [form, setForm] = useState(loadDraft);
  const [previewMode, setPreviewMode] = useState(false);
  const [showCodeLang, setShowCodeLang] = useState(false);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  };

  const insertAt = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = form.content.substring(start, end);
    const newContent = form.content.substring(0, start) + before + selected + after + form.content.substring(end);
    update('content', newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const firstLine = content.split('\n')[0];
      let title = form.title;
      if (firstLine.startsWith('# ')) title = firstLine.replace(/^#\s+/, '');
      setForm(prev => {
        const next = { ...prev, content, title };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        return next;
      });
    };
    reader.readAsText(file);
  };

  const handlePublish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Please provide a title and content');
      return;
    }

    const article = await addArticle({
      title: form.title.trim(),
      category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      content: form.content,
      summary: form.content.substring(0, 160).replace(/[#*`]/g, '').trim(),
    }, token);

    localStorage.removeItem(DRAFT_KEY);
    navigate(`/article/${article.id}`);
  };

  return (
    <div className="write-page">
      <header className="write-header">
        <h1>Write</h1>
        <p className="write-desc">Write in Markdown or upload a <code>.md</code> file</p>
      </header>

      <div className="write-meta">
        <input
          className="write-input write-input--title"
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
        <div className="write-meta__row">
          <select className="write-select" value={form.category} onChange={(e) => update('category', e.target.value)}>
            <option value="Knowledge">Knowledge</option>
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
          <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="write-toolbar">
        <div className="write-toolbar__left">
          {/* Headings dropdown */}
          <div className="toolbar-dropdown">
            <button className="toolbar-dropdown__trigger">H ▾</button>
            <div className="toolbar-dropdown__menu">
              <button onClick={() => insertAt('# ')}>H1</button>
              <button onClick={() => insertAt('## ')}>H2</button>
              <button onClick={() => insertAt('### ')}>H3</button>
              <button onClick={() => insertAt('#### ')}>H4</button>
            </div>
          </div>

          <button onClick={() => insertAt('**', '**')} title="Bold"><b>B</b></button>
          <button onClick={() => insertAt('*', '*')} title="Italic"><i>I</i></button>
          <button onClick={() => insertAt('~~', '~~')} title="Strikethrough"><s>S</s></button>

          <span className="toolbar-sep" />

          {/* Code with language selector */}
          <button onClick={() => insertAt('`', '`')} title="Inline Code">&lt;/&gt;</button>
          <div className="toolbar-dropdown">
            <button className="toolbar-dropdown__trigger" onClick={() => setShowCodeLang(!showCodeLang)}>
              Code ▾
            </button>
            <div className="toolbar-dropdown__menu toolbar-dropdown__menu--wide">
              {CODE_LANGUAGES.map(lang => (
                <button key={lang} onClick={() => { insertAt(`\n\`\`\`${lang}\n`, '\n```\n'); setShowCodeLang(false); }}>
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <span className="toolbar-sep" />

          <button onClick={() => insertAt('[', '](url)')} title="Link">Link</button>
          <button onClick={() => insertAt('![alt](', ')')} title="Image">Img</button>
          <button onClick={() => insertAt('> ')} title="Blockquote">Quote</button>
          <button onClick={() => insertAt('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n')} title="Table">Table</button>
          <button onClick={() => insertAt('- ')} title="List">List</button>
          <button onClick={() => insertAt('\n---\n')} title="Divider">—</button>
        </div>

        <div className="write-toolbar__right">
          <button className={!previewMode ? 'active' : ''} onClick={() => setPreviewMode(false)}>Edit</button>
          <button className={previewMode ? 'active' : ''} onClick={() => setPreviewMode(true)}>Preview</button>
        </div>
      </div>

      <div className="write-editor">
        {!previewMode ? (
          <textarea
            ref={textareaRef}
            id="write-content"
            className="write-textarea"
            placeholder="Write your article in Markdown..."
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
          />
        ) : (
          <div className="write-preview">
            {form.content ? <MarkdownRenderer content={form.content} /> : <p className="write-empty">Nothing to preview yet</p>}
          </div>
        )}
      </div>

      <div className="write-actions">
        <button className="write-publish" onClick={handlePublish}>Publish</button>
      </div>
    </div>
  );
}
