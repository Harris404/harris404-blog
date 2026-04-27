import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import './SearchBar.css';

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'summary', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'category', weight: 0.1 },
  ],
  threshold: 0.35,
  includeMatches: true,
  minMatchCharLength: 2,
};

export default function SearchBar({ articles }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const fuse = useMemo(() => new Fuse(articles, FUSE_OPTIONS), [articles]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return fuse.search(query).slice(0, 8);
  }, [query, fuse]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Keyboard navigation in results
  const handleKeyDown = useCallback((e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      const result = results[selectedIdx];
      if (result) {
        navigate(`/article/${result.item.id}`);
        setIsOpen(false);
        setQuery('');
      }
    }
  }, [results, selectedIdx]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIdx(-1);
  };

  const highlightMatch = (text, matches, key) => {
    if (!matches) return text;
    const match = matches.find(m => m.key === key);
    if (!match || !match.indices.length) return text;
    
    const parts = [];
    let lastEnd = 0;
    for (const [start, end] of match.indices) {
      if (start > lastEnd) parts.push(text.slice(lastEnd, start));
      parts.push(<mark key={start}>{text.slice(start, end + 1)}</mark>);
      lastEnd = end + 1;
    }
    if (lastEnd < text.length) parts.push(text.slice(lastEnd));
    return parts;
  };

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-bar__input-wrap">
        <svg className="search-bar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder="Search articles... (⌘K)"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button className="search-bar__clear" onClick={() => { setQuery(''); setSelectedIdx(-1); }}>
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((result, idx) => (
            <Link
              key={result.item.id}
              to={`/article/${result.item.id}`}
              className={`search-result ${idx === selectedIdx ? 'search-result--selected' : ''}`}
              onClick={() => { setIsOpen(false); setQuery(''); }}
            >
              <span className={`search-result__cat search-result__cat--${result.item.category?.toLowerCase()}`}>
                {result.item.category}
              </span>
              <span className="search-result__title">
                {highlightMatch(result.item.title, result.matches, 'title')}
              </span>
              <span className="search-result__summary">
                {result.item.summary?.substring(0, 60) || ''}
              </span>
            </Link>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="search-results">
          <div className="search-result search-result--empty">
            No articles found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
