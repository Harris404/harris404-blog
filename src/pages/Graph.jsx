import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useArticles from '../hooks/useArticles';
import './Graph.css';

const CATEGORY_COLORS = {
  Paper: { main: '#C45A32', light: 'rgba(196, 90, 50, 0.12)', glow: 'rgba(196, 90, 50, 0.35)' },
  Knowledge: { main: '#4A90D9', light: 'rgba(74, 144, 217, 0.12)', glow: 'rgba(74, 144, 217, 0.35)' },
  Code: { main: '#2ECC71', light: 'rgba(46, 204, 113, 0.12)', glow: 'rgba(46, 204, 113, 0.35)' },
};

const DEFAULT_CAT = { main: '#888', light: 'rgba(128,128,128,0.12)', glow: 'rgba(128,128,128,0.3)' };

// Draw crisp SVG-style icons on Canvas
function drawCategoryIcon(ctx, category, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 16; // normalize to 16px base

  if (category === 'Paper') {
    // Document icon with folded corner
    ctx.beginPath();
    ctx.moveTo(-5*s, -7*s);
    ctx.lineTo(2*s, -7*s);
    ctx.lineTo(5*s, -4*s);
    ctx.lineTo(5*s, 7*s);
    ctx.lineTo(-5*s, 7*s);
    ctx.closePath();
    ctx.stroke();
    // Fold
    ctx.beginPath();
    ctx.moveTo(2*s, -7*s);
    ctx.lineTo(2*s, -4*s);
    ctx.lineTo(5*s, -4*s);
    ctx.stroke();
    // Lines
    ctx.beginPath();
    ctx.moveTo(-3*s, -1*s); ctx.lineTo(3*s, -1*s);
    ctx.moveTo(-3*s, 2*s); ctx.lineTo(3*s, 2*s);
    ctx.moveTo(-3*s, 5*s); ctx.lineTo(1*s, 5*s);
    ctx.stroke();
  } else if (category === 'Knowledge') {
    // Lightbulb icon
    ctx.beginPath();
    ctx.arc(0, -2*s, 5*s, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -2*s, 5*s, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    // Bulb top
    ctx.beginPath();
    ctx.arc(0, -3*s, 4.5*s, -Math.PI * 0.75, -Math.PI * 0.25, false);
    ctx.stroke();
    // Filament lines at bottom
    ctx.beginPath();
    ctx.moveTo(-2.5*s, 3*s); ctx.lineTo(2.5*s, 3*s);
    ctx.moveTo(-2*s, 5*s); ctx.lineTo(2*s, 5*s);
    ctx.moveTo(-1.5*s, 7*s); ctx.lineTo(1.5*s, 7*s);
    ctx.stroke();
  } else if (category === 'Code') {
    // Code brackets < / >
    ctx.beginPath();
    ctx.moveTo(-2*s, -5*s); ctx.lineTo(-5.5*s, 0); ctx.lineTo(-2*s, 5*s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2*s, -5*s); ctx.lineTo(5.5*s, 0); ctx.lineTo(2*s, 5*s);
    ctx.stroke();
    // Slash in middle
    ctx.beginPath();
    ctx.moveTo(1.5*s, -4*s); ctx.lineTo(-1.5*s, 4*s);
    ctx.stroke();
  } else {
    // Default: circle with dot
    ctx.beginPath();
    ctx.arc(0, 0, 4*s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 1.5*s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function buildGraph(articles) {
  const nodes = articles.map(a => ({
    id: a.id, title: a.title,
    category: a.category || 'Knowledge',
    series_id: a.series_id,
    tags: a.tags || [], summary: a.summary || '',
    x: 0, y: 0, vx: 0, vy: 0,
  }));

  const edges = [];
  const idSet = new Set(articles.map(a => a.id));

  // Series edges
  const seriesGroups = {};
  articles.forEach(a => {
    if (a.series_id) {
      if (!seriesGroups[a.series_id]) seriesGroups[a.series_id] = [];
      seriesGroups[a.series_id].push(a.id);
    }
  });
  Object.values(seriesGroups).forEach(ids => {
    for (let i = 0; i < ids.length - 1; i++)
      edges.push({ source: ids[i], target: ids[i + 1], type: 'series' });
  });

  // Related edges
  articles.forEach(a => {
    (Array.isArray(a.related_ids) ? a.related_ids : []).forEach(rid => {
      if (idSet.has(rid) && !edges.some(e =>
        (e.source === a.id && e.target === rid) || (e.source === rid && e.target === a.id)
      )) edges.push({ source: a.id, target: rid, type: 'related' });
    });
  });

  // Tag-based edges
  const tagMap = {};
  articles.forEach(a => (a.tags || []).forEach(tag => {
    if (!tagMap[tag]) tagMap[tag] = [];
    tagMap[tag].push(a.id);
  }));
  Object.values(tagMap).forEach(ids => {
    if (ids.length > 1 && ids.length <= 6) {
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++)
          if (!edges.some(e =>
            (e.source === ids[i] && e.target === ids[j]) || (e.source === ids[j] && e.target === ids[i])
          )) edges.push({ source: ids[i], target: ids[j], type: 'tag' });
    }
  });

  return { nodes, edges };
}

function simulate(nodes, edges, width, height) {
  const cx = width / 2, cy = height / 2;
  const radius = Math.min(width, height) * 0.3;
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    n.x = cx + radius * Math.cos(angle) + (Math.random() - 0.5) * 30;
    n.y = cy + radius * Math.sin(angle) + (Math.random() - 0.5) * 30;
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const edgeStrength = { series: 0.08, related: 0.04, tag: 0.02 };
  const idealDist = { series: 140, related: 200, tag: 240 };

  return function tick() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 1200 / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }
    edges.forEach(e => {
      const a = nodeMap[e.source], b = nodeMap[e.target];
      if (!a || !b) return;
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - (idealDist[e.type] || 150)) * (edgeStrength[e.type] || 0.04);
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    });
    nodes.forEach(n => {
      n.vx += (cx - n.x) * 0.004;
      n.vy += (cy - n.y) * 0.004;
      n.vx *= 0.82; n.vy *= 0.82;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(50, Math.min(width - 50, n.x));
      n.y = Math.max(50, Math.min(height - 50, n.y));
    });
  };
}

export default function Graph() {
  const canvasRef = useRef(null);
  const { articles, loading } = useArticles();
  const navigate = useNavigate();
  const graphRef = useRef(null);
  const animRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [filter, setFilter] = useState('All');
  const draggingRef = useRef(null);
  const hoveredRef = useRef(null);
  const frameRef = useRef(0);

  const getCanvasSize = useCallback(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return { w: 800, h: 600 };
    return { w: el.clientWidth, h: Math.max(520, window.innerHeight - 220) };
  }, []);

  useEffect(() => {
    if (loading || articles.length === 0) return;
    const filtered = filter === 'All' ? articles : articles.filter(a => a.category === filter);
    const { w, h } = getCanvasSize();
    const graph = buildGraph(filtered);
    graphRef.current = graph;
    const tick = simulate(graph.nodes, graph.edges, w, h);
    frameRef.current = 0;

    function loop() {
      tick();
      draw(w, h);
      frameRef.current++;
      if (frameRef.current < 400) animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [articles, loading, filter, getCanvasSize]);

  const draw = useCallback((w, h) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const graph = graphRef.current;
    if (!graph) return;
    const nodeMap = {};
    graph.nodes.forEach(n => { nodeMap[n.id] = n; });
    const frame = frameRef.current;

    // Background — theme-aware
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark ? '#1C1B19' : '#FAFAF8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    for (let x = 20; x < w; x += 30) {
      for (let y = 20; y < h; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw edges with curves
    graph.edges.forEach(e => {
      const a = nodeMap[e.source], b = nodeMap[e.target];
      if (!a || !b) return;

      const isHighlighted = hoveredRef.current &&
        (a.id === hoveredRef.current.id || b.id === hoveredRef.current.id);

      ctx.beginPath();
      // Quadratic curve for visual softness
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.08;
      const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.08;
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);

      if (e.type === 'series') {
        ctx.strokeStyle = isHighlighted ? 'rgba(196, 90, 50, 0.7)' : 'rgba(196, 90, 50, 0.25)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.8;
        ctx.setLineDash([]);
      } else if (e.type === 'related') {
        ctx.strokeStyle = isHighlighted ? 'rgba(74, 144, 217, 0.6)' : 'rgba(74, 144, 217, 0.18)';
        ctx.lineWidth = isHighlighted ? 2 : 1.2;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = isHighlighted ? 'rgba(150, 150, 150, 0.35)' : 'rgba(150, 150, 150, 0.08)';
        ctx.lineWidth = isHighlighted ? 1.2 : 0.6;
        ctx.setLineDash([2, 3]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw nodes
    graph.nodes.forEach(n => {
      const isHov = hoveredRef.current?.id === n.id;
      const catCol = CATEGORY_COLORS[n.category] || DEFAULT_CAT;
      const baseR = isHov ? 26 : 18;
      const pulse = isHov ? Math.sin(frame * 0.08) * 2 : 0;
      const r = baseR + pulse;

      // Outer glow ring
      if (isHov) {
        const glowGrad = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 16);
        glowGrad.addColorStop(0, catCol.glow);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 16, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      }

      // Node gradient fill
      const grad = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.3, r * 0.1, n.x, n.y, r);
      if (isHov) {
        grad.addColorStop(0, lightenColor(catCol.main, 30));
        grad.addColorStop(1, catCol.main);
      } else {
        grad.addColorStop(0, isDark ? '#2C2B27' : '#FFFFFF');
        grad.addColorStop(1, catCol.light);
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.strokeStyle = isHov ? catCol.main : adjustAlpha(catCol.main, 0.4);
      ctx.lineWidth = isHov ? 2.5 : 1.2;
      ctx.stroke();

      // Category dot
      if (!isHov) {
        ctx.beginPath();
        ctx.arc(n.x, n.y - r + 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = catCol.main;
        ctx.fill();
      }

      // Label below node
      const label = n.title.length > (isHov ? 18 : 8) 
        ? n.title.substring(0, isHov ? 18 : 8) + '…' 
        : n.title;

      ctx.font = isHov
        ? '600 12px "Inter", sans-serif'
        : '500 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isHov ? catCol.main : (isDark ? '#B8B4AE' : '#5C5954');
      ctx.fillText(label, n.x, n.y + r + 5);

      // Category icon inside node
      const iconSize = isHov ? 14 : 10;
      const iconColor = isHov ? '#fff' : catCol.main;
      drawCategoryIcon(ctx, n.category, n.x, n.y, iconSize, iconColor);
    });

    // Tooltip card
    const hov = hoveredRef.current;
    if (hov) {
      const catCol = CATEGORY_COLORS[hov.category] || DEFAULT_CAT;
      const title = hov.title;
      const summary = hov.summary?.substring(0, 80) || '';
      const tags = hov.tags?.slice(0, 3).map(t => `#${t}`).join(' ') || '';

      ctx.font = '600 12px Inter, sans-serif';
      const tw = Math.max(ctx.measureText(title).width, 180) + 28;
      const th = 20 + 18 + (summary ? 16 : 0) + (tags ? 14 : 0) + 8;
      let tx = hov.x + 34;
      let ty = hov.y - th / 2;

      // Ensure tooltip stays in bounds
      if (tx + tw > w - 10) tx = hov.x - tw - 34;
      if (ty < 10) ty = 10;
      if (ty + th > h - 10) ty = h - th - 10;

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // Card background
      ctx.fillStyle = isDark ? '#242320' : '#FFFFFF';
      roundRect(ctx, tx, ty, tw, th, 8);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Left accent bar
      ctx.fillStyle = catCol.main;
      roundRect(ctx, tx, ty, 3, th, 8);
      ctx.fill();

      // Border
      ctx.strokeStyle = isDark ? '#333230' : '#E8E5DF';
      ctx.lineWidth = 1;
      roundRect(ctx, tx, ty, tw, th, 8);
      ctx.stroke();

      // Content
      let cy_t = ty + 12;

      // Category
      ctx.fillStyle = catCol.main;
      ctx.font = '700 9px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(hov.category.toUpperCase(), tx + 12, cy_t);
      cy_t += 16;

      // Title
      ctx.fillStyle = isDark ? '#E8E5DF' : '#2D2B28';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.fillText(title.substring(0, 35) + (title.length > 35 ? '…' : ''), tx + 12, cy_t);
      cy_t += 16;

      // Summary
      if (summary) {
        ctx.fillStyle = isDark ? '#B8B4AE' : '#8A857D';
        ctx.font = '400 10px Inter, sans-serif';
        ctx.fillText(summary + (summary.length >= 80 ? '…' : ''), tx + 12, cy_t);
        cy_t += 14;
      }

      // Tags
      if (tags) {
        ctx.fillStyle = adjustAlpha(catCol.main, 0.6);
        ctx.font = '500 9px Inter, sans-serif';
        ctx.fillText(tags, tx + 12, cy_t);
      }
    }
  }, []);

  const findNode = useCallback((mx, my) => {
    const graph = graphRef.current;
    if (!graph) return null;
    for (const n of graph.nodes) {
      const dx = n.x - mx, dy = n.y - my;
      if (dx * dx + dy * dy < 24 * 24) return n;
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    if (draggingRef.current) {
      draggingRef.current.x = mx;
      draggingRef.current.y = my;
      draggingRef.current.vx = 0;
      draggingRef.current.vy = 0;
      const { w, h } = getCanvasSize();
      draw(w, h);
      return;
    }

    const node = findNode(mx, my);
    hoveredRef.current = node;
    setHovered(node);
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'default';
    const { w, h } = getCanvasSize();
    draw(w, h);
  }, [findNode, draw, getCanvasSize]);

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const node = findNode(e.clientX - rect.left, e.clientY - rect.top);
    if (node) draggingRef.current = node;
  }, [findNode]);

  const handleMouseUp = useCallback(() => { draggingRef.current = null; }, []);

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const node = findNode(e.clientX - rect.left, e.clientY - rect.top);
    if (node && !draggingRef.current) navigate(`/article/${node.id}`);
  }, [findNode, navigate]);

  // Stats
  const filtered = filter === 'All' ? articles : articles.filter(a => a.category === filter);
  const catCounts = {};
  articles.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
  const categories = ['All', ...new Set(articles.map(a => a.category).filter(Boolean))];

  if (loading) {
    return <div className="graph-page"><p className="graph-loading">Loading graph…</p></div>;
  }

  return (
    <div className="graph-page">
      <div className="graph-header">
        <div>
          <h1 className="graph-title">知识图谱</h1>
          <p className="graph-desc">
            {filtered.length} 篇文章 · 拖拽节点 · 点击跳转 · 悬停查看详情
          </p>
        </div>
        <div className="graph-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`graph-filter-btn ${filter === cat ? 'graph-filter-btn--active' : ''}`}
              onClick={() => setFilter(cat)}
              style={cat !== 'All' ? { '--cat-color': (CATEGORY_COLORS[cat] || DEFAULT_CAT).main } : {}}
            >
              {cat === 'All' ? '全部' : cat}
              {cat !== 'All' && <span className="graph-filter-count">{catCounts[cat] || 0}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="graph-legend">
        <div className="graph-legend__left">
          <span className="graph-legend__item"><span className="graph-legend__dot" style={{ background: '#C45A32' }} /> Paper</span>
          <span className="graph-legend__item"><span className="graph-legend__dot" style={{ background: '#4A90D9' }} /> Knowledge</span>
          <span className="graph-legend__item"><span className="graph-legend__dot" style={{ background: '#2ECC71' }} /> Code</span>
        </div>
        <div className="graph-legend__right">
          <span className="graph-legend__item"><span className="graph-legend__line graph-legend__line--series" /> 系列</span>
          <span className="graph-legend__item"><span className="graph-legend__line graph-legend__line--related" /> 关联</span>
          <span className="graph-legend__item"><span className="graph-legend__line graph-legend__line--tag" /> 同标签</span>
        </div>
      </div>

      <div className="graph-canvas-wrap">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        />
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
  const b = Math.min(255, (num & 0x0000FF) + percent);
  return `rgb(${r},${g},${b})`;
}

function adjustAlpha(hex, alpha) {
  const num = parseInt(hex.replace('#', ''), 16);
  return `rgba(${num >> 16},${(num >> 8) & 0xFF},${num & 0xFF},${alpha})`;
}
