import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import {
  MULTI_HEAD_CONTENT,
  FFN_CONTENT,
  RESIDUAL_CONTENT,
  LAYER_NORM_CONTENT,
  DROPOUT_CONTENT,
  INPUT_CONTENT,
  OUTPUT_CONTENT,
} from '../data/encoderLayerContent';
import './ArchitectureExplorer.css';

const LAYERS = [
  {
    id: 'input',
    label: '输入词向量 x',
    sublabel: 'Input Embedding + Positional Encoding',
    color: { fill: '#fdf8e1', stroke: '#c8a92a', text: '#7a6010' },
    y: 48, height: 48,
    content: INPUT_CONTENT,
  },
  {
    id: 'layernorm1',
    label: 'Layer Norm',
    sublabel: 'Pre-Norm 先归一化',
    color: { fill: '#fff8e8', stroke: '#d4a030', text: '#8a6010' },
    y: 118, height: 48,
    content: LAYER_NORM_CONTENT,
  },
  {
    id: 'attention',
    label: 'Multi-Head Self-Attention',
    sublabel: '8个头并行，每个词同时关注所有词',
    color: { fill: '#e6faf5', stroke: '#0f9e75', text: '#0a7a5c' },
    y: 188, height: 50,
    content: MULTI_HEAD_CONTENT,
  },
  {
    id: 'dropout1',
    label: 'Dropout',
    sublabel: '随机关掉神经元，防过拟合',
    color: { fill: '#f5f5f5', stroke: '#ccc', text: '#666' },
    y: 260, height: 48,
    content: DROPOUT_CONTENT,
  },
  {
    id: 'addnorm1',
    label: '残差连接 (Add)',
    sublabel: 'x + f(x)，残差直连保留原始信息',
    color: { fill: '#fff8e8', stroke: '#d4a030', text: '#8a6010' },
    y: 330, height: 48,
    content: RESIDUAL_CONTENT,
  },
  {
    id: 'ffn',
    label: 'Feed Forward Network',
    sublabel: '512 → 2048 → 512，每个词独立处理',
    color: { fill: '#f0eeff', stroke: '#7070cc', text: '#4040aa' },
    y: 400, height: 54,
    content: FFN_CONTENT,
  },
  {
    id: 'output',
    label: '输出（传入下一层）',
    sublabel: '重复 N=6 次',
    color: { fill: '#fdf8e1', stroke: '#c8a92a', text: '#7a6010' },
    y: 490, height: 44,
    content: OUTPUT_CONTENT,
  },
];

const RESIDUALS = [
  { from: 48 + 24, to: 330 + 24, x: 110, label: '残差连接 x 直达', side: 'left' },
  { from: 330 + 24, to: 490 + 22, x: 450, label: '第二个残差连接', side: 'right' },
];

/**
 * Inline markdown renderer for layer content.
 * Uses the same plugins as the main MarkdownRenderer (minus architecture handler to avoid recursion).
 */
function LayerMarkdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex, [rehypeHighlight, { plainText: ['text'] }]]}
      urlTransform={(url) => url}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ArchitectureExplorer() {
  const [activeLayer, setActiveLayer] = useState(null);

  const handleLayerClick = useCallback((layerId) => {
    setActiveLayer(prev => prev === layerId ? null : layerId);
  }, []);

  const handleBack = useCallback(() => {
    setActiveLayer(null);
  }, []);

  const activeLayerData = useMemo(
    () => activeLayer ? LAYERS.find(l => l.id === activeLayer) : null,
    [activeLayer]
  );

  return (
    <div className="ae-container">
      <div className="ae-header">
        <span className="ae-badge">Interactive</span>
        <h4 className="ae-title">Encoder 内部结构（Pre-Norm）</h4>
        <p className="ae-desc">点击每个模块查看完整内容</p>
      </div>

      <div className="ae-body">
        {/* SVG Architecture Diagram */}
        <div className={`ae-svg-wrap ${activeLayer ? 'ae-svg-wrap--compact' : ''}`}>
          <svg
            viewBox="0 0 560 560"
            xmlns="http://www.w3.org/2000/svg"
            className="ae-svg"
          >
            <text x="280" y="28" textAnchor="middle" fontSize="13" fill="#888">
              点击模块查看完整内容 ↓
            </text>

            {/* Residual connections */}
            {RESIDUALS.map((r, i) => (
              <g key={i}>
                <line
                  x1={r.x} y1={r.from} x2={r.x} y2={r.to}
                  stroke="#0f9e75" strokeWidth="1.5"
                />
                <line
                  x1={r.x} y1={r.to}
                  x2={r.side === 'left' ? r.x + 18 : r.x - 18} y2={r.to}
                  stroke="#0f9e75" strokeWidth="1.5"
                  markerEnd="url(#ae-arw-g)"
                />
                <text
                  x={r.side === 'left' ? r.x - 16 : r.x + 16}
                  y={(r.from + r.to) / 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#0f9e75"
                  transform={`rotate(${r.side === 'left' ? -90 : 90},${r.side === 'left' ? r.x - 16 : r.x + 16},${(r.from + r.to) / 2})`}
                >
                  {r.label}
                </text>
              </g>
            ))}

            <defs>
              <marker id="ae-arw" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
              </marker>
              <marker id="ae-arw-g" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="#0f9e75" strokeWidth="1.5" strokeLinecap="round"/>
              </marker>
              <filter id="ae-glow">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4A90D9" floodOpacity="0.4"/>
              </filter>
            </defs>

            {LAYERS.map((layer, i) => {
              const isActive = activeLayer === layer.id;
              const boxX = 130;
              const boxW = 300;
              return (
                <g
                  key={layer.id}
                  className="ae-layer-group"
                  onClick={() => handleLayerClick(layer.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={boxX} y={layer.y}
                    width={boxW} height={layer.height}
                    rx="10"
                    fill={layer.color.fill}
                    stroke={isActive ? '#4A90D9' : layer.color.stroke}
                    strokeWidth={isActive ? 2.5 : 1}
                    filter={isActive ? 'url(#ae-glow)' : undefined}
                    className="ae-layer-rect"
                  />
                  <text
                    x={280}
                    y={layer.y + (layer.height > 48 ? 22 : 18)}
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="500"
                    fill={layer.color.text}
                    pointerEvents="none"
                  >
                    {layer.label}
                  </text>
                  {layer.sublabel && (
                    <text
                      x={280}
                      y={layer.y + (layer.height > 48 ? 40 : 36)}
                      textAnchor="middle"
                      fontSize="10"
                      fill={layer.color.text}
                      opacity="0.7"
                      pointerEvents="none"
                    >
                      {layer.sublabel}
                    </text>
                  )}
                  {i < LAYERS.length - 1 && (
                    <line
                      x1={280} y1={layer.y + layer.height}
                      x2={280} y2={LAYERS[i + 1].y}
                      stroke="#bbb" strokeWidth="1"
                      markerEnd="url(#ae-arw)"
                      pointerEvents="none"
                    />
                  )}
                </g>
              );
            })}

            <text x="446" y={188 + 18} fontSize="10" fill="#aaa" pointerEvents="none">
              词与词的关系 ↓
            </text>
          </svg>
        </div>

        {/* Detail Panel — renders embedded markdown content */}
        {activeLayerData && (
          <div className="ae-detail" key={activeLayerData.id}>
            <button className="ae-back-btn" onClick={handleBack}>
              ← 返回架构总览
            </button>
            <div className="ae-detail-header">
              <div
                className="ae-detail-dot"
                style={{ background: activeLayerData.color.stroke }}
              />
              <h3 className="ae-detail-title">{activeLayerData.label}</h3>
            </div>

            <div className="ae-detail-content markdown-body">
              <LayerMarkdown content={activeLayerData.content} />
            </div>
          </div>
        )}
      </div>

      <div className="ae-footer">
        <span className="ae-footer-hint">
          {activeLayer
            ? `当前查看：${activeLayerData?.label} · 点击其他模块切换`
            : 'Encoder 共 6 层，每层包含以上所有模块'}
        </span>
      </div>
    </div>
  );
}
