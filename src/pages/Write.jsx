import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import useArticles from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import './Write.css';

// SVG Icons
const ImageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const UploadCloudIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);

const DRAFT_KEY = 'blog-draft';

const CODE_LANGUAGES = [
  'python', 'javascript', 'typescript', 'jsx', 'tsx',
  'bash', 'sql', 'java', 'c', 'cpp', 'rust', 'go',
  'html', 'css', 'json', 'yaml', 'markdown',
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const EMPTY_FORM = { title: '', category: 'Knowledge', tags: '', content: '' };

function loadDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : { ...EMPTY_FORM };
  } catch {
    return { ...EMPTY_FORM };
  }
}

export default function Write() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addArticle, updateArticle } = useArticles();
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Check if we're in edit mode (article data passed via router state)
  const editArticle = location.state?.article || null;
  const isEditing = !!editArticle;

  const [form, setForm] = useState(() => {
    if (editArticle) {
      return {
        title: editArticle.title,
        category: editArticle.category,
        tags: Array.isArray(editArticle.tags) ? editArticle.tags.join(', ') : (editArticle.tags || ''),
        content: editArticle.content,
      };
    }
    return loadDraft();
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (!isEditing) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    }
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

  // Insert text at current cursor position (no selection wrapping)
  const insertTextAtCursor = (text) => {
    const ta = textareaRef.current;
    const pos = ta ? ta.selectionStart : form.content.length;
    const newContent = form.content.substring(0, pos) + text + form.content.substring(pos);
    update('content', newContent);
    setTimeout(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(pos + text.length, pos + text.length);
      }
    }, 0);
  };

  // Upload image to /api/upload
  const uploadImage = useCallback(async (file) => {
    // Validate type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert(`不支持的文件类型: ${file.type}\n支持: JPG, PNG, GIF, WebP, SVG`);
      return;
    }
    // Validate size
    if (file.size > MAX_IMAGE_SIZE) {
      alert(`文件太大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，最大 5MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Insert markdown image at cursor
      const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      insertTextAtCursor(`\n![${altText}](${data.url})\n`);
    } catch (err) {
      alert(`图片上传失败: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [token, form.content]);

  // Handle image file input change
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) uploadImage(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // Handle markdown file upload
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
        if (!isEditing) localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
        return next;
      });
    };
    reader.readAsText(file);
  };

  // Drag and drop support
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => ALLOWED_IMAGE_TYPES.includes(f.type));
    if (imageFile) {
      uploadImage(imageFile);
    }
  }, [uploadImage]);

  // Clipboard paste support
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadImage(file);
        return;
      }
    }
  }, [uploadImage]);

  const handlePublish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Please provide a title and content');
      return;
    }

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const summary = form.content.substring(0, 160).replace(/[#*`]/g, '').trim();

    if (isEditing) {
      // Update existing article — date updates to today
      await updateArticle(editArticle.id, {
        title: form.title.trim(),
        category: form.category,
        tags,
        content: form.content,
        summary,
        date: new Date().toISOString().split('T')[0],
      }, token);
      navigate(`/article/${editArticle.id}`);
    } else {
      // Create new article
      const article = await addArticle({
        title: form.title.trim(),
        category: form.category,
        tags,
        content: form.content,
        summary,
      }, token);
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/article/${article.id}`);
    }
  };

  return (
    <div className="write-page">
      <header className="write-header">
        <h1>{isEditing ? 'Edit Article' : 'Write'}</h1>
        <p className="write-desc">
          {isEditing ? `Editing "${editArticle.title}"` : 'Write in Markdown or upload a .md file'}
        </p>
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

          <button onClick={() => insertAt('`', '`')} title="Inline Code">&lt;/&gt;</button>
          <div className="toolbar-dropdown">
            <button className="toolbar-dropdown__trigger">Code ▾</button>
            <div className="toolbar-dropdown__menu toolbar-dropdown__menu--wide">
              {CODE_LANGUAGES.map(lang => (
                <button key={lang} onClick={() => insertAt(`\n\`\`\`${lang}\n`, '\n```\n')}>
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <span className="toolbar-sep" />

          <button onClick={() => insertAt('[', '](url)')} title="Link">Link</button>
          <button
            className={`toolbar-btn-img${uploading ? ' uploading' : ''}`}
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            title="Upload Image"
          >
            {uploading ? (
              <span className="upload-spinner" />
            ) : (
              <ImageIcon />
            )}
            {uploading ? 'Uploading…' : 'Img'}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <button onClick={() => insertAt('> ')} title="Blockquote">Quote</button>
          <button onClick={() => insertAt('\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n')} title="Table">Table</button>
          <button onClick={() => insertAt('- ')} title="List">List</button>
          <button onClick={() => insertAt('\n---\n')} title="Divider">—</button>

          <span className="toolbar-sep" />

          <button onClick={() => insertAt('$', '$')} title="Inline Math">𝑥²</button>
          <button onClick={() => insertAt('\n$$\n', '\n$$\n')} title="Block Math">∑</button>
        </div>

        <div className="write-toolbar__right">
          <button className={!previewMode ? 'active' : ''} onClick={() => setPreviewMode(false)}>Edit</button>
          <button className={previewMode ? 'active' : ''} onClick={() => setPreviewMode(true)}>Preview</button>
        </div>
      </div>

      <div
        className={`write-editor${dragOver ? ' write-editor--dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!previewMode ? (
          <>
            <textarea
              ref={textareaRef}
              id="write-content"
              className="write-textarea"
              placeholder="Write your article in Markdown..."
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              onPaste={handlePaste}
            />
            {dragOver && (
              <div className="write-dropzone">
                <div className="write-dropzone__content">
                  <UploadCloudIcon />
                  <span>拖放图片到此处上传</span>
                </div>
              </div>
            )}
            {uploading && (
              <div className="write-upload-bar">
                <span className="upload-spinner" />
                <span>正在上传图片…</span>
              </div>
            )}
          </>
        ) : (
          <div className="write-preview">
            {form.content ? <MarkdownRenderer content={form.content} /> : <p className="write-empty">Nothing to preview yet</p>}
          </div>
        )}
      </div>

      <div className="write-actions">
        {isEditing && (
          <button className="write-cancel" onClick={() => navigate(-1)}>Cancel</button>
        )}
        <button className="write-publish" onClick={handlePublish}>
          {isEditing ? 'Update' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
