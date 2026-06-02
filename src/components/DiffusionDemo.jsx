import { useState, useMemo } from 'react';
import './DiffusionDemo.css';

// Step-by-step influence-diffusion visualiser (LTM / ICM).
// Driven by a JSON config in a ```diffusion fenced block:
// {
//   "mode": "ltm" | "icm",
//   "viewBox": "0 0 680 310",
//   "nodes":  [{ "id":"v1", "x":70, "y":180 }, ...],
//   "edges":  [{ "id":"e12", "x1":.., "y1":.., "x2":.., "y2":.. }, ...],
//   "labels": [{ "x":.., "y":.., "t":"0.5" }, ...],          // edge weights / θ / seed
//   "steps":  [{ "active":["v1"], "hl":"v1",
//               "edges": { "e12":"pass"|"fail" },             // ICM only
//               "en":"...", "zh":"..." }, ...]
// }

// Node / edge palette (refined teal-on-warm-gray).
const COLOR = {
  activeFill: '#8FD9BD', activeStroke: '#0F6E56',
  idleFill: '#ECEAE3', idleStroke: '#BDBBB2',
  nodeText: '#243B34',
  halo: '#E08A2B',
  edgeIdle: '#B4B2A9', edgePass: '#0F6E56', edgeFail: '#C7C5BC',
  labelText: '#5F5E5A',
};

export default function DiffusionDemo({ config }) {
  const [cur, setCur] = useState(0);

  const cfg = useMemo(() => {
    try { return JSON.parse(config); } catch { return null; }
  }, [config]);

  if (!cfg || !Array.isArray(cfg.steps) || cfg.steps.length === 0) {
    return <pre className="diffusion-error">diffusion: invalid config</pre>;
  }

  const step = cfg.steps[Math.max(0, Math.min(cur, cfg.steps.length - 1))];
  const activeSet = new Set(step.active || []);
  const isICM = cfg.mode === 'icm';
  const last = cfg.steps.length - 1;

  const edgeStyle = (id) => {
    const st = (step.edges || {})[id];
    if (st === 'pass') return { stroke: COLOR.edgePass, strokeWidth: 2.6, strokeDasharray: 'none', opacity: 1 };
    if (st === 'fail') return { stroke: COLOR.edgeFail, strokeWidth: 1.5, strokeDasharray: '5 4', opacity: 0.45 };
    return { stroke: COLOR.edgeIdle, strokeWidth: 1.5, strokeDasharray: 'none', opacity: 1 };
  };

  return (
    <div className="diffusion">
      <svg width="100%" viewBox={cfg.viewBox || '0 0 680 310'} role="img" className="diffusion__svg">
        <defs>
          <marker id="diff-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* edges */}
        {(cfg.edges || []).map((e) => {
          const s = edgeStyle(e.id);
          return (
            <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={s.stroke} strokeWidth={s.strokeWidth} strokeDasharray={s.strokeDasharray}
              opacity={s.opacity} markerEnd="url(#diff-arrow)" />
          );
        })}

        {/* text labels (edge weights, thresholds, seed) */}
        {(cfg.labels || []).map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor="middle" fontSize="12"
            fontFamily="sans-serif" fill={COLOR.labelText}>{l.t}</text>
        ))}

        {/* highlight halo on the node activated this step */}
        {step.hl && (() => {
          const n = (cfg.nodes || []).find((x) => x.id === step.hl);
          if (!n) return null;
          return <circle cx={n.x} cy={n.y} r="28" fill="none" stroke={COLOR.halo} strokeWidth="2.5" />;
        })()}

        {/* nodes */}
        {(cfg.nodes || []).map((n) => {
          const on = activeSet.has(n.id);
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r="22"
                fill={on ? COLOR.activeFill : COLOR.idleFill}
                stroke={on ? COLOR.activeStroke : COLOR.idleStroke} strokeWidth="1" />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                fontSize="14" fontWeight="500" fontFamily="sans-serif" fill={COLOR.nodeText}>{n.id}</text>
            </g>
          );
        })}
      </svg>

      {/* controls */}
      <div className="diffusion__controls">
        <button className="diffusion__btn" onClick={() => setCur((c) => Math.max(0, c - 1))} disabled={cur === 0}>← Prev</button>
        <button className="diffusion__btn" onClick={() => setCur((c) => Math.min(last, c + 1))} disabled={cur === last}>Next →</button>
        <span className="diffusion__step">Step {cur} / {last}</span>
      </div>

      {/* legend */}
      <div className="diffusion__legend">
        <span><span className="diffusion__dot" style={{ background: COLOR.activeFill, borderColor: COLOR.activeStroke }} />active / 已激活</span>
        <span><span className="diffusion__dot" style={{ background: COLOR.idleFill, borderColor: COLOR.idleStroke }} />inactive / 未激活</span>
        {isICM && <span><span className="diffusion__line diffusion__line--pass" />edge fired ✓ / 触发成功</span>}
        {isICM && <span><span className="diffusion__line diffusion__line--fail" />edge failed ✗ / 失败作废</span>}
      </div>

      {/* caption */}
      <div className="diffusion__caption">
        {step.en && <div className="diffusion__cap-en">{step.en}</div>}
        {step.zh && <div className="diffusion__cap-zh">{step.zh}</div>}
      </div>
    </div>
  );
}
