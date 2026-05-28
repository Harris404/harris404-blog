import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

const MermaidIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="5" rx="1" />
    <rect x="2" y="17" width="7" height="5" rx="1" />
    <rect x="15" y="17" width="7" height="5" rx="1" />
    <line x1="12" y1="7" x2="12" y2="12" />
    <line x1="12" y1="12" x2="5.5" y2="17" />
    <line x1="12" y1="12" x2="18.5" y2="17" />
  </svg>
);

const InteractiveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
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

const IMAGE_SIZES = [
  { label: 'S', value: '300', title: '小 (300px)' },
  { label: 'M', value: '500', title: '中 (500px)' },
  { label: 'L', value: '700', title: '大 (700px)' },
  { label: '100%', value: '100%', title: '全宽' },
];

const EMPTY_FORM = { title: '', category: 'Knowledge', tags: '', content: '' };

// Predefined tag taxonomy for AI/ML content
const TAG_TAXONOMY = [
  // Architecture
  'Transformer', 'Attention', 'CNN', 'RNN', 'GAN', 'Diffusion', 'VAE', 'Autoencoder',
  // NLP / LLM
  'LLM', 'BERT', 'GPT', 'Fine-Tuning', 'Tokenization', 'Embedding', 'Prompt Engineering',
  // Training
  'RLHF', 'DPO', 'PPO', 'Pre-training', 'Transfer Learning', 'Multi-Task',
  // Techniques
  'RAG', 'Agent', 'Chain-of-Thought', 'In-Context Learning', 'Quantization', 'Distillation', 'LoRA',
  // Multimodal
  'Multimodal', 'Vision-Language', 'CLIP', 'Image Generation', 'Speech',
  // General ML
  'Deep Learning', 'Machine Learning', 'Optimization', 'Loss Function', 'Regularization',
  'Batch Normalization', 'Self-Supervised Learning', 'Contrastive Learning',
  // Applications
  'NLP', 'Computer Vision', 'Recommendation', 'Search', 'Code Generation',
  // System
  'Inference', 'Deployment', 'Distributed Training', 'Model Serving',
  // Math
  'Linear Algebra', 'Probability', 'Information Theory', 'Calculus',
];

/**
 * Generate a clean summary from markdown content.
 * Strips: headers, code blocks, blockquotes, images, HTML, LaTeX, tables, etc.
 * Returns the first meaningful text, max 180 chars.
 */
function generateSummary(content) {
  if (!content) return '';
  const lines = content.split('\n');
  let inCodeBlock = false;
  const textLines = [];

  for (const line of lines) {
    // Skip code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip headers, images, HTML, horizontal rules, tables
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('![')) continue;
    if (/^<\/?[a-zA-Z]/.test(trimmed)) continue;  // HTML tags
    if (trimmed.startsWith('---') || trimmed.startsWith('***')) continue;
    if (trimmed.startsWith('|')) continue;

    // Strip blockquote markers
    let cleaned = trimmed.replace(/^>\s*/g, '');
    if (!cleaned) continue;

    // Strip list markers (- , * , 1. , etc.)
    cleaned = cleaned.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');

    // Strip markdown formatting
    cleaned = cleaned
      .replace(/\*\*(.*?)\*\*/g, '$1')     // bold
      .replace(/\*(.*?)\*/g, '$1')         // italic
      .replace(/`(.*?)`/g, '$1')           // inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')  // links
      .replace(/~~(.*?)~~/g, '$1')         // strikethrough
      .replace(/!\[.*?\]\(.*?\)/g, '')     // inline images
      .replace(/<img[^>]*>/g, '')          // HTML images
      .replace(/<[^>]+>/g, '')             // other HTML
      .replace(/\$\$[^$]*\$\$/g, '')       // block LaTeX
      .replace(/\$[^$]+\$/g, '')           // inline LaTeX
      .replace(/\{[^}]*\}/g, '')           // LaTeX braces
      .replace(/\\[a-zA-Z]+/g, '')         // LaTeX commands
      .replace(/[🟢🟡🔴📚📄📖🗺️✅❌💡⚡🔥🎯]\s*/g, '') // emoji
      .replace(/\s+/g, ' ')               // collapse whitespace
      .trim();

    if (cleaned.length > 10) {
      textLines.push(cleaned);
      if (textLines.join(' ').length >= 180) break;
    }
  }

  const combined = textLines.join(' ').trim();
  if (combined.length > 180) {
    return combined.substring(0, 177) + '…';
  }
  return combined;
}

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
  const { articles, addArticle, updateArticle, refreshArticles } = useArticles();
  const { token, handleApiError } = useAuth();
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
  const [imageSize, setImageSize] = useState('100%');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Build tag suggestions: combine taxonomy with existing article tags
  const allKnownTags = useMemo(() => {
    const fromArticles = articles.flatMap(a =>
      Array.isArray(a.tags) ? a.tags : []
    );
    const combined = [...new Set([...TAG_TAXONOMY, ...fromArticles])];
    return combined.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [articles]);

  // Filter tag suggestions based on current input
  const tagSuggestions = useMemo(() => {
    const currentTags = form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const lastTag = form.tags.split(',').pop()?.trim().toLowerCase() || '';

    if (!lastTag || lastTag.length < 1) return [];

    return allKnownTags
      .filter(tag =>
        tag.toLowerCase().includes(lastTag) &&
        !currentTags.includes(tag.toLowerCase())
      )
      .slice(0, 8);
  }, [form.tags, allKnownTags]);

  const selectTagSuggestion = (tag) => {
    const parts = form.tags.split(',');
    parts[parts.length - 1] = ' ' + tag;
    const newTags = parts.join(',') + ', ';
    update('tags', newTags);
    setShowTagSuggestions(false);
  };

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
    const scrollTop = ta.scrollTop;
    const selected = form.content.substring(start, end);
    const newContent = form.content.substring(0, start) + before + selected + after + form.content.substring(end);
    update('content', newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.scrollTop = scrollTop;
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
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

      // Insert HTML img tag with size at cursor
      const altText = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const widthAttr = imageSize === '100%' ? 'width="100%"' : `width="${imageSize}"`;
      insertTextAtCursor(`\n<img src="${data.url}" alt="${altText}" ${widthAttr} />\n`);
    } catch (err) {
      if (handleApiError(err)) {
        alert('登录已过期，请重新登录后再上传图片。');
      } else {
        alert(`图片上传失败: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  }, [token, form.content, handleApiError]);

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

    // Generate smart summary: skip headings, code blocks, and extract first real paragraph
    const summary = generateSummary(form.content);

    try {
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
    } catch (err) {
      console.error('Publish failed:', err);
      if (handleApiError(err)) {
        alert('登录已过期，请重新登录后再发布。草稿已保留。');
        return;
      }
      alert(`发布失败: ${err.message || '未知错误，请检查登录状态'}`);
    }
  };


  const [activeTab, setActiveTab] = useState('write');
  const [newSeriesName, setNewSeriesName] = useState('');
  const [seriesItems, setSeriesItems] = useState([]);
  const [seriesSaving, setSeriesSaving] = useState(false);
  const [seriesCreated, setSeriesCreated] = useState(null);

  // Build series map for display
  const seriesMap = useMemo(() => {
    const map = {};
    articles.forEach(a => {
      if (a.series_id) {
        if (!map[a.series_id]) map[a.series_id] = [];
        map[a.series_id].push(a);
      }
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => (a.series_order ?? 999) - (b.series_order ?? 999));
    });
    return map;
  }, [articles]);

  // Articles not yet in the new series being created
  const availableForSeries = articles.filter(a => !seriesItems.some(s => s.id === a.id));

  const addToNewSeries = (article) => {
    setSeriesItems(prev => [...prev, article]);
  };

  const removeFromNewSeries = (id) => {
    setSeriesItems(prev => prev.filter(a => a.id !== id));
  };

  const moveInSeries = (idx, dir) => {
    setSeriesItems(prev => {
      const list = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= list.length) return prev;
      [list[idx], list[target]] = [list[target], list[idx]];
      return list;
    });
  };

  const handleCreateSeries = async () => {
    const name = newSeriesName.trim();
    if (!name || seriesItems.length === 0) return;
    const seriesId = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');

    setSeriesSaving(true);
    try {
      await Promise.all(seriesItems.map((a, i) =>
        fetch(`/api/articles/${a.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ series_id: seriesId, series_order: i }),
        })
      ));
      if (refreshArticles) refreshArticles();
      setSeriesCreated(seriesId);
      setNewSeriesName('');
      setSeriesItems([]);
    } catch (err) {
      console.error('Failed to create series:', err);
      alert('Failed to create series');
    }
    setSeriesSaving(false);
  };

  return (
    <div className="write-page">
      <header className="write-header">
        <div className="write-tabs">
          <span
            className={`write-tab ${activeTab === 'write' ? 'write-tab--active' : ''}`}
            onClick={() => setActiveTab('write')}
            role="button" tabIndex={0}
          >Write</span>
          <span
            className={`write-tab ${activeTab === 'series' ? 'write-tab--active' : ''}`}
            onClick={() => { setActiveTab('series'); setSeriesCreated(null); }}
            role="button" tabIndex={0}
          >Series</span>
        </div>
        <p className="write-desc">
          {activeTab === 'write'
            ? (isEditing ? `Editing "${editArticle.title}"` : 'Write in Markdown or upload a .md file')
            : 'Create a new series and add notes to it'
          }
        </p>
      </header>

      {activeTab === 'series' ? (
        /* ═══ Series Creator Tab ═══ */
        <div className="series-creator">
          {seriesCreated && (
            <div className="sc-success">
              ✅ Series <strong>{seriesCreated}</strong> created successfully!
              <a href={`/series/${seriesCreated}`} className="sc-success__link">View series →</a>
            </div>
          )}

          {/* Name input */}
          <div className="sc-section">
            <label className="sc-label">Series Name</label>
            <input
              className="sc-input"
              type="text"
              placeholder="e.g. Transformer 系列"
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
            />
          </div>

          {/* Selected articles (ordered) */}
          <div className="sc-section">
            <label className="sc-label">Notes in Series <span className="sc-label__count">({seriesItems.length})</span></label>
            {seriesItems.length === 0 ? (
              <p className="sc-empty">Add notes from the list below. Order matters — drag or use arrows to reorder.</p>
            ) : (
              <div className="sc-ordered">
                {seriesItems.map((article, idx) => (
                  <div key={article.id} className="sc-order-item">
                    <span className="sc-order-num">#{idx + 1}</span>
                    <span className="sc-order-title">{article.title}</span>
                    <div className="sc-order-actions">
                      <button onClick={() => moveInSeries(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
                      <button onClick={() => moveInSeries(idx, 1)} disabled={idx === seriesItems.length - 1} title="Move down">↓</button>
                      <button onClick={() => removeFromNewSeries(article.id)} className="sc-order-remove" title="Remove">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available articles */}
          <div className="sc-section">
            <label className="sc-label">Available Notes</label>
            <div className="sc-available">
              {availableForSeries.length === 0 ? (
                <p className="sc-empty">All notes have been added.</p>
              ) : (
                availableForSeries.map(article => (
                  <div key={article.id} className="sc-avail-item">
                    <div className="sc-avail-info">
                      <span className={`sc-avail-cat sc-avail-cat--${article.category?.toLowerCase()}`}>{article.category}</span>
                      <span className="sc-avail-title">{article.title}</span>
                    </div>
                    <button className="sc-avail-add" onClick={() => addToNewSeries(article)}>+ Add</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Existing series (read-only) */}
          {Object.keys(seriesMap).length > 0 && (
            <div className="sc-section">
              <label className="sc-label">Existing Series</label>
              <div className="sc-existing">
                {Object.entries(seriesMap).map(([key, items]) => (
                  <a key={key} href={`/series/${key}`} className="sc-existing-chip">
                    📚 {key} <span className="sc-existing-count">{items.length}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Create button */}
          <div className="write-actions">
            <button
              className="write-publish"
              onClick={handleCreateSeries}
              disabled={!newSeriesName.trim() || seriesItems.length === 0 || seriesSaving}
            >
              {seriesSaving ? 'Creating...' : 'Create Series'}
            </button>
          </div>
        </div>
      ) : (
        /* ═══ Write Tab (existing) ═══ */
        <>
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
          <div className="write-tag-wrap">
            <input
              className="write-input"
              type="text"
              placeholder="Tags (comma separated, type to search)"
              value={form.tags}
              onChange={(e) => { update('tags', e.target.value); setShowTagSuggestions(true); }}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
            />
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div className="write-tag-suggestions">
                {tagSuggestions.map(tag => (
                  <button
                    key={tag}
                    className="write-tag-suggestion"
                    onMouseDown={(e) => { e.preventDefault(); selectTagSuggestion(tag); }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          <div className="toolbar-img-group">
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
            <select
              className="toolbar-img-size"
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              title="图片大小"
            >
              {IMAGE_SIZES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
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

          <span className="toolbar-sep" />

          <button
            onClick={() => insertAt('\n```mermaid\ngraph TD\n    A[Start] --> B[Step 1]\n    B --> C[Step 2]\n    C --> D[End]\n```\n')}
            title="插入 Mermaid 流程图"
          >
            <MermaidIcon /> Mermaid
          </button>
          <button
            onClick={() => insertAt(`\n\`\`\`interactive\n${JSON.stringify({
              title: "交互式演示",
              inputs: [
                { id: "x", type: "slider", label: "参数 x", min: 0, max: 100, default: 50 },
                { id: "enabled", type: "toggle", label: "开关", default: true }
              ],
              compute: "const val = enabled ? x * 2 : x; const result = { val, message: val > 100 ? '⚠️ 超过阈值' : '✅ 正常' };",
              outputs: [
                { type: "number", label: "计算结果", value: "result.val", precision: 0 },
                { type: "text", value: "result.message", style: "result.val > 100 ? 'warning' : 'success'" }
              ]
            }, null, 2)}\n\`\`\`\n`)}
            title="插入交互式演示组件"
          >
            <InteractiveIcon /> Interactive
          </button>
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
            {form.content ? (
              <MarkdownRenderer
                content={form.content}
                editable={true}
                onContentChange={(newContent) => update('content', newContent)}
              />
            ) : (
              <p className="write-empty">Nothing to preview yet</p>
            )}
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
        </>
      )}
    </div>
  );
}
