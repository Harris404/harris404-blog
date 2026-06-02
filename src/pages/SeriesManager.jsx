import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useArticles from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import EmojiPicker from '../components/EmojiPicker';
import './SeriesManager.css';

const API_BASE = '/api/articles';

export default function SeriesManager() {
  const { articles, loading, seriesMeta, updateSeries } = useArticles();
  const { token } = useAuth();
  const navigate = useNavigate();

  // All existing series
  const [seriesMap, setSeriesMap] = useState({});
  const [activeSeries, setActiveSeries] = useState(null);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  // Editable name + icon for the active series
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📚');
  const [metaSaved, setMetaSaved] = useState(false);

  // When the active series changes, seed the edit fields from its metadata.
  useEffect(() => {
    if (!activeSeries) return;
    const m = seriesMeta[activeSeries] || {};
    setEditName(m.name || activeSeries);
    setEditIcon(m.icon || '📚');
    setMetaSaved(false);
  }, [activeSeries, seriesMeta]);

  const handleSaveMeta = async () => {
    if (!activeSeries) return;
    setSaving(true);
    try {
      await updateSeries(activeSeries, { name: editName.trim() || activeSeries, icon: editIcon || '📚' }, token);
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save series meta:', err);
      alert('保存失败：' + (err.message || ''));
    }
    setSaving(false);
  };

  // Build series map from articles
  useEffect(() => {
    if (loading) return;
    const map = {};
    articles.forEach(a => {
      if (a.series_id) {
        if (!map[a.series_id]) map[a.series_id] = [];
        map[a.series_id].push({ ...a });
      }
    });
    // Sort each series by order
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => (a.series_order ?? 999) - (b.series_order ?? 999));
    });
    setSeriesMap(map);
    if (activeSeries && !map[activeSeries]) setActiveSeries(null);
  }, [articles, loading, activeSeries]);

  // Available articles (not in active series)
  const availableArticles = articles.filter(a =>
    !activeSeries || a.series_id !== activeSeries
  );

  const seriesArticles = activeSeries ? (seriesMap[activeSeries] || []) : [];

  // Create new series
  const handleCreateSeries = () => {
    const name = newSeriesName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
    if (seriesMap[id]) {
      setActiveSeries(id);
    } else {
      setSeriesMap(prev => ({ ...prev, [id]: [] }));
      setActiveSeries(id);
    }
    setNewSeriesName('');
  };

  // Add article to active series
  const addToSeries = useCallback(async (articleId) => {
    if (!activeSeries) return;
    const order = seriesArticles.length; // hub=0, then 1,2,3...
    setSaving(true);
    try {
      await fetch(`${API_BASE}/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ series_id: activeSeries, series_order: order }),
      });
      // Update local
      setSeriesMap(prev => {
        const article = articles.find(a => a.id === articleId);
        if (!article) return prev;
        const updated = [...(prev[activeSeries] || []), { ...article, series_id: activeSeries, series_order: order }];
        return { ...prev, [activeSeries]: updated };
      });
    } catch (err) {
      console.error('Failed to add article to series:', err);
    }
    setSaving(false);
  }, [activeSeries, seriesArticles.length, articles, token]);

  // Remove article from series
  const removeFromSeries = useCallback(async (articleId) => {
    if (!activeSeries) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ series_id: null, series_order: null }),
      });
      setSeriesMap(prev => {
        const updated = (prev[activeSeries] || []).filter(a => a.id !== articleId);
        // Re-order
        updated.forEach((a, i) => { a.series_order = i; });
        return { ...prev, [activeSeries]: updated };
      });
    } catch (err) {
      console.error('Failed to remove from series:', err);
    }
    setSaving(false);
  }, [activeSeries, token]);

  // Drag-and-drop reorder
  const handleDragStart = (idx) => setDragIdx(idx);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setSeriesMap(prev => {
      const list = [...(prev[activeSeries] || [])];
      const [moved] = list.splice(dragIdx, 1);
      list.splice(idx, 0, moved);
      list.forEach((a, i) => { a.series_order = i; });
      setDragIdx(idx);
      return { ...prev, [activeSeries]: list };
    });
  };

  const handleDragEnd = useCallback(async () => {
    setDragIdx(null);
    if (!activeSeries) return;
    // Save new order to API
    const list = seriesMap[activeSeries] || [];
    setSaving(true);
    try {
      await Promise.all(list.map((a, i) =>
        fetch(`${API_BASE}/${a.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ series_order: i }),
        })
      ));
    } catch (err) {
      console.error('Failed to save order:', err);
    }
    setSaving(false);
  }, [activeSeries, seriesMap, token]);

  // Delete entire series (removes series_id from all articles)
  const deleteSeries = useCallback(async () => {
    if (!activeSeries) return;
    if (!confirm(`确定删除系列 "${activeSeries}"？文章不会被删除，只是取消系列关联。`)) return;
    setSaving(true);
    const list = seriesMap[activeSeries] || [];
    try {
      await Promise.all(list.map(a =>
        fetch(`${API_BASE}/${a.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ series_id: null, series_order: null }),
        })
      ));
      setSeriesMap(prev => {
        const next = { ...prev };
        delete next[activeSeries];
        return next;
      });
      setActiveSeries(null);
    } catch (err) {
      console.error('Failed to delete series:', err);
    }
    setSaving(false);
  }, [activeSeries, seriesMap, token]);

  if (loading) {
    return <div className="series-manager"><p>Loading...</p></div>;
  }

  const seriesKeys = Object.keys(seriesMap);

  return (
    <div className="series-manager">
      <div className="sm-header">
        <h1 className="sm-title">系列管理</h1>
        <p className="sm-desc">创建系列，拖拽调整文章顺序。第一篇（#0）为总览页。</p>
      </div>

      {/* Create / Select Series */}
      <div className="sm-section">
        <h3 className="sm-section__title">选择或创建系列</h3>
        <div className="sm-create-row">
          <input
            className="sm-input"
            type="text"
            placeholder="新系列名称..."
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
          />
          <button className="sm-btn sm-btn--primary" onClick={handleCreateSeries} disabled={!newSeriesName.trim()}>
            + 创建
          </button>
        </div>
        <div className="sm-series-list">
          {seriesKeys.length === 0 && <p className="sm-empty">暂无系列，请先创建</p>}
          {seriesKeys.map(key => (
            <button
              key={key}
              className={`sm-series-chip ${activeSeries === key ? 'sm-series-chip--active' : ''}`}
              onClick={() => setActiveSeries(key)}
            >
              {(seriesMeta[key]?.icon) || '📚'} {(seriesMeta[key]?.name) || key}
              <span className="sm-series-chip__count">{seriesMap[key].length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Series Editor */}
      {activeSeries && (
        <>
          <div className="sm-section">
            <div className="sm-section__header">
              <h3 className="sm-section__title">
                {editIcon || '📚'} {editName || activeSeries}
                {saving && <span className="sm-saving">保存中...</span>}
              </h3>
              <button className="sm-btn sm-btn--danger" onClick={deleteSeries}>删除系列</button>
            </div>

            {/* Rename + icon */}
            <div className="sm-meta-edit">
              <div className="sm-meta-edit__row">
                <input
                  className="sm-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="系列显示名称"
                />
                <button className="sm-btn sm-btn--primary" onClick={handleSaveMeta} disabled={saving}>
                  {metaSaved ? '✓ 已保存' : '保存名称/图标'}
                </button>
              </div>
              <EmojiPicker value={editIcon} onChange={setEditIcon} />
            </div>

            {seriesArticles.length === 0 ? (
              <p className="sm-empty">从下方列表中添加文章到此系列</p>
            ) : (
              <div className="sm-ordered-list">
                {seriesArticles.map((article, idx) => (
                  <div
                    key={article.id}
                    className={`sm-order-item ${dragIdx === idx ? 'sm-order-item--dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="sm-order-handle">⠿</span>
                    <span className="sm-order-num">{idx === 0 ? '📄' : `#${idx}`}</span>
                    <span className="sm-order-title">{article.title}</span>
                    <span className={`sm-order-badge ${idx === 0 ? 'sm-order-badge--hub' : ''}`}>
                      {idx === 0 ? '总览' : `第${idx}篇`}
                    </span>
                    <button
                      className="sm-order-remove"
                      onClick={() => removeFromSeries(article.id)}
                      title="移出系列"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Articles */}
          <div className="sm-section">
            <h3 className="sm-section__title">可添加的文章</h3>
            <div className="sm-available-list">
              {availableArticles.length === 0 && <p className="sm-empty">所有文章都在系列中了</p>}
              {availableArticles.map(article => (
                <div key={article.id} className="sm-available-item">
                  <div className="sm-available-info">
                    <span className={`sm-available-cat sm-available-cat--${article.category?.toLowerCase()}`}>
                      {article.category}
                    </span>
                    <span className="sm-available-title">{article.title}</span>
                  </div>
                  <button className="sm-btn sm-btn--small" onClick={() => addToSeries(article.id)}>
                    + 添加
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
