-- D1 Database Schema for Blog Articles
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Knowledge',
  tags TEXT DEFAULT '[]',
  summary TEXT DEFAULT '',
  content TEXT NOT NULL,
  series_id TEXT DEFAULT NULL,
  series_order INTEGER DEFAULT NULL,
  related_ids TEXT DEFAULT '[]',
  is_public INTEGER NOT NULL DEFAULT 1,   -- 1 = public, 0 = private (admin-only)
  views INTEGER NOT NULL DEFAULT 0,       -- public page-view counter
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Series metadata (name + icon). articles.series_id references series.id.
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed with sample articles
INSERT OR IGNORE INTO articles (id, title, date, category, tags, summary, content) VALUES
('understanding-transformer-architecture', 'Understanding the Transformer Architecture: A Deep Dive', '2026-03-20', 'Knowledge', '["Transformer","Attention","Deep Learning"]', 'A comprehensive walkthrough of the Transformer architecture, from self-attention mechanisms to positional encoding.', '# Understanding the Transformer Architecture

The Transformer architecture, introduced in the seminal paper *"Attention Is All You Need"* (Vaswani et al., 2017), has revolutionized natural language processing and beyond.

## Key Components

### 1. Self-Attention Mechanism

The self-attention mechanism allows each token in a sequence to attend to every other token.

### 2. Multi-Head Attention

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
```

## Why Transformers Work So Well

| Aspect | RNN | Transformer |
|--------|-----|-------------|
| Parallelization | Sequential | Fully parallel |
| Long-range deps | Vanishing gradients | Direct connections |
| Scalability | Limited | Excellent |
');
