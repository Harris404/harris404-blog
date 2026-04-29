import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './InteractiveWidget.css';

/**
 * InteractiveWidget — renders a declarative interactive demo from JSON config.
 *
 * Markdown syntax (inside a ```interactive code fence):
 * {
 *   "title": "Scaled Dot-Product Attention",
 *   "inputs": [
 *     { "id": "dk", "type": "slider", "label": "d_k", "min": 1, "max": 512, "default": 64, "step": 1 },
 *     { "id": "scaled", "type": "toggle", "label": "÷√d_k", "default": true }
 *   ],
 *   "compute": "..js expression that uses input ids as variables, must assign `result` object...",
 *   "outputs": [
 *     { "type": "bar", "data": "result.weights", "labels": [...], "colorExpr": "result.saturated ? '#e74c3c' : '#4A90D9'" },
 *     { "type": "text", "value": "result.message" },
 *     { "type": "number", "label": "...", "value": "result.someNumber", "precision": 2 }
 *   ]
 * }
 */

function safeEval(code, vars) {
  try {
    const keys = Object.keys(vars);
    const values = Object.values(vars);
    // Create function with input variables as parameters
    // Pre-declare `result` so compute code can assign to it in strict mode
    const fn = new Function(...keys, `"use strict"; let result; ${code}; return typeof result !== 'undefined' ? result : {};`);
    return fn(...values);
  } catch (err) {
    return { _error: err.message };
  }
}

// ─── Bar Chart (Canvas) ─────────────────────────────
function BarChart({ data = [], labels = [], color = '#4A90D9', height = 160 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const maxVal = Math.max(...data, 0.001);
    const barW = Math.min(48, (w - 40) / data.length - 8);
    const gap = (w - barW * data.length) / (data.length + 1);
    const chartTop = 20;
    const chartBottom = h - 30;
    const chartH = chartBottom - chartTop;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = chartTop + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    data.forEach((val, i) => {
      const x = gap + i * (barW + gap);
      const barH = (val / maxVal) * chartH;
      const y = chartBottom - barH;

      // Bar gradient
      const grad = ctx.createLinearGradient(x, y, x, chartBottom);
      grad.addColorStop(0, color);
      grad.addColorStop(1, adjustAlpha(color, 0.5));
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, barH, 4);
      ctx.fill();

      // Value label
      ctx.fillStyle = color;
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(val.toFixed(3), x + barW / 2, y - 3);

      // Category label
      ctx.fillStyle = '#8A857D';
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i] || `#${i}`, x + barW / 2, chartBottom + 4);
    });
  }, [data, labels, color, height]);

  return <canvas ref={canvasRef} className="iw-bar-canvas" />;
}

// ─── Heatmap (for attention matrices etc.) ─────────
function HeatmapChart({ data = [], labels = [], color = '#4A90D9', height = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const isMatrix = Array.isArray(data[0]);
    const rows = isMatrix ? data : [data];
    const cols = rows[0].length;
    const maxVal = Math.max(...rows.flat(), 0.001);
    const cellW = Math.min(48, (w - 60) / cols);
    const cellH = Math.min(36, (h - 20) / rows.length);
    const startX = 30;
    const startY = 10;

    ctx.clearRect(0, 0, w, h);

    rows.forEach((row, ri) => {
      row.forEach((val, ci) => {
        const x = startX + ci * (cellW + 2);
        const y = startY + ri * (cellH + 2);
        const intensity = val / maxVal;
        ctx.fillStyle = `rgba(${hexToRgb(color)}, ${0.1 + intensity * 0.9})`;
        roundRect(ctx, x, y, cellW, cellH, 3);
        ctx.fill();

        ctx.fillStyle = intensity > 0.5 ? '#fff' : '#5C5954';
        ctx.font = '500 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toFixed(2), x + cellW / 2, y + cellH / 2);
      });
    });
  }, [data, labels, color, height]);

  return <canvas ref={canvasRef} className="iw-bar-canvas" />;
}

// ─── Main Widget Component ─────────────────────────
export default function InteractiveWidget({ config: rawConfig }) {
  // Parse config
  const config = useMemo(() => {
    try {
      return typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
    } catch {
      return null;
    }
  }, [rawConfig]);

  // Initialize input state from defaults
  const [inputs, setInputs] = useState(() => {
    if (!config?.inputs) return {};
    const initial = {};
    config.inputs.forEach(input => {
      initial[input.id] = input.default !== undefined ? input.default : (input.type === 'toggle' ? false : input.min || 0);
    });
    return initial;
  });

  const updateInput = useCallback((id, value) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  }, []);

  // Compute results
  const result = useMemo(() => {
    if (!config?.compute) return {};
    return safeEval(config.compute, inputs);
  }, [config, inputs]);

  if (!config) {
    return <div className="iw-error">⚠️ Invalid widget config</div>;
  }

  // Evaluate dynamic expressions
  const evalExpr = (expr) => {
    if (typeof expr !== 'string') return expr;
    try {
      const fn = new Function('result', 'inputs', `"use strict"; return ${expr};`);
      return fn(result, inputs);
    } catch {
      return expr;
    }
  };

  return (
    <div className="iw-container">
      {config.title && (
        <div className="iw-header">
          <span className="iw-badge">Interactive</span>
          <h4 className="iw-title">{config.title}</h4>
          {config.description && <p className="iw-desc">{config.description}</p>}
        </div>
      )}

      {/* Inputs */}
      {config.inputs && (
        <div className="iw-inputs">
          {config.inputs.map(input => (
            <div key={input.id} className={`iw-input iw-input--${input.type}`}>
              {input.type === 'slider' && (
                <>
                  <label className="iw-input__label">
                    {input.label}
                    <span className="iw-input__value">{inputs[input.id]}</span>
                  </label>
                  <input
                    type="range"
                    className="iw-slider"
                    min={input.min || 0}
                    max={input.max || 100}
                    step={input.step || 1}
                    value={inputs[input.id]}
                    onChange={(e) => updateInput(input.id, Number(e.target.value))}
                  />
                  <div className="iw-slider__range">
                    <span>{input.min || 0}</span>
                    <span>{input.max || 100}</span>
                  </div>
                </>
              )}
              {input.type === 'toggle' && (
                <label className="iw-toggle">
                  <span className="iw-toggle__label">{input.label}</span>
                  <div className={`iw-toggle__switch ${inputs[input.id] ? 'iw-toggle__switch--on' : ''}`}
                    onClick={() => updateInput(input.id, !inputs[input.id])}>
                    <div className="iw-toggle__knob" />
                  </div>
                </label>
              )}
              {input.type === 'select' && (
                <>
                  <label className="iw-input__label">{input.label}</label>
                  <select
                    className="iw-select"
                    value={inputs[input.id]}
                    onChange={(e) => updateInput(input.id, e.target.value)}
                  >
                    {(input.options || []).map(opt => (
                      <option key={opt.value || opt} value={opt.value || opt}>
                        {opt.label || opt}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {input.type === 'stepper' && (
                <div className="iw-stepper">
                  <button
                    className="iw-stepper__btn"
                    disabled={inputs[input.id] >= (input.max ?? 100)}
                    onClick={() => updateInput(input.id, Math.min((inputs[input.id] || 0) + 1, input.max ?? 100))}
                  >
                    {input.nextLabel || 'Next iteration'}
                  </button>
                  <button
                    className="iw-stepper__btn iw-stepper__btn--reset"
                    onClick={() => updateInput(input.id, input.min ?? 0)}
                  >
                    {input.resetLabel || 'Reset'}
                  </button>
                  <span className="iw-stepper__info">
                    {input.label}: {inputs[input.id]}{inputs[input.id] === (input.min ?? 0) ? ' (initial)' : inputs[input.id] >= 10 ? ' (converged)' : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {result._error && (
        <div className="iw-error">⚠️ Compute error: {result._error}</div>
      )}

      {/* Outputs */}
      {config.outputs && (
        <div className="iw-outputs">
          {config.outputs.map((output, idx) => {
            const data = evalExpr(output.data);
            const value = evalExpr(output.value);
            const color = evalExpr(output.colorExpr || output.color) || '#4A90D9';
            const labels = evalExpr(output.labels) || [];

            if (output.type === 'bar') {
              return (
                <div key={idx} className="iw-output">
                  {output.label && <div className="iw-output__label">{output.label}</div>}
                  <BarChart data={data || []} labels={labels} color={color} height={output.height || 160} />
                </div>
              );
            }

            if (output.type === 'heatmap') {
              return (
                <div key={idx} className="iw-output">
                  {output.label && <div className="iw-output__label">{output.label}</div>}
                  <HeatmapChart data={data || []} labels={labels} color={color} height={output.height || 120} />
                </div>
              );
            }

            if (output.type === 'text') {
              const style = evalExpr(output.style);
              return (
                <div key={idx} className={`iw-output-text ${style === 'warning' ? 'iw-output-text--warning' : style === 'success' ? 'iw-output-text--success' : ''}`}>
                  {value}
                </div>
              );
            }

            if (output.type === 'number') {
              const precision = output.precision ?? 4;
              return (
                <div key={idx} className="iw-output-number">
                  <span className="iw-output-number__label">{output.label || ''}</span>
                  <span className="iw-output-number__value" style={{ color }}>
                    {typeof value === 'number' ? value.toFixed(precision) : value}
                  </span>
                </div>
              );
            }

            if (output.type === 'formula') {
              return (
                <div key={idx} className="iw-output-formula">
                  {value}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Canvas Helpers ─────────────────────────────────
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

function adjustAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb}, ${alpha})`;
}

function hexToRgb(hex) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const m = hex.match(/\d+/g);
    return m ? `${m[0]},${m[1]},${m[2]}` : '0,0,0';
  }
  const num = parseInt(hex.replace('#', ''), 16);
  return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
}
