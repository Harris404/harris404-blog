const sampleArticles = [
  {
    id: 'understanding-transformer-architecture',
    title: 'Understanding the Transformer Architecture: A Deep Dive',
    date: '2026-03-20',
    category: 'LLM',
    tags: ['Transformer', 'Attention', 'Deep Learning'],
    summary: 'A comprehensive walkthrough of the Transformer architecture, from self-attention mechanisms to positional encoding.',
    content: `# Understanding the Transformer Architecture

The Transformer architecture, introduced in the seminal paper *"Attention Is All You Need"* (Vaswani et al., 2017), has revolutionized natural language processing and beyond.

## Key Components

### 1. Self-Attention Mechanism

The self-attention mechanism allows each token in a sequence to attend to every other token, creating rich contextual representations.

$$
\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V
$$

The three matrices — **Query (Q)**, **Key (K)**, and **Value (V)** — are derived from the input embeddings through learned linear projections.

### 2. Multi-Head Attention

Instead of performing a single attention function, the Transformer uses **multi-head attention** to jointly attend to information from different representation subspaces:

\`\`\`python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
    
    def forward(self, x):
        batch_size = x.size(0)
        
        # Linear projections
        Q = self.W_q(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        attn = F.softmax(scores, dim=-1)
        output = torch.matmul(attn, V)
        
        return self.W_o(output.transpose(1, 2).contiguous().view(batch_size, -1, self.num_heads * self.d_k))
\`\`\`

### 3. Positional Encoding

Since Transformers don't have any notion of sequence order, **positional encoding** is added to give the model information about the position of tokens.

### 4. Feed-Forward Network

Each layer contains a position-wise feed-forward network:

\`\`\`python
class FeedForward(nn.Module):
    def __init__(self, d_model, d_ff=2048, dropout=0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x):
        return self.linear2(self.dropout(F.gelu(self.linear1(x))))
\`\`\`

## Why Transformers Work So Well

| Aspect | RNN | Transformer |
|--------|-----|-------------|
| Parallelization | ❌ Sequential | ✅ Fully parallel |
| Long-range deps | ❌ Vanishing gradients | ✅ Direct connections |
| Training speed | Slow | Fast |
| Scalability | Limited | Excellent |

> **Key Insight**: The self-attention mechanism allows the model to directly connect any two positions in the sequence, regardless of their distance — making it vastly superior for capturing long-range dependencies.

## Conclusion

The Transformer architecture laid the foundation for modern LLMs like GPT, BERT, and beyond. Understanding these core components is essential for anyone working in AI/ML today.
`
  },
  {
    id: 'rlhf-explained',
    title: 'RLHF: How Language Models Learn from Human Feedback',
    date: '2026-03-15',
    category: 'Paper',
    tags: ['RLHF', 'Alignment', 'PPO'],
    summary: 'Breaking down Reinforcement Learning from Human Feedback — the technique that made ChatGPT possible.',
    content: `# RLHF: Reinforcement Learning from Human Feedback

RLHF is the key technique behind aligning large language models with human preferences. Let's break down the three-stage pipeline.

## The Three Stages

### Stage 1: Supervised Fine-Tuning (SFT)

Start with a pre-trained language model and fine-tune it on high-quality demonstration data:

\`\`\`python
# Simplified SFT training loop
for batch in sft_dataloader:
    input_ids, labels = batch
    outputs = model(input_ids, labels=labels)
    loss = outputs.loss
    loss.backward()
    optimizer.step()
\`\`\`

### Stage 2: Reward Model Training

Train a separate model to predict human preferences:

1. Generate pairs of outputs from the SFT model
2. Have humans rank which output is better  
3. Train the reward model to predict these rankings

\`\`\`python
class RewardModel(nn.Module):
    def __init__(self, base_model):
        super().__init__()
        self.backbone = base_model
        self.reward_head = nn.Linear(hidden_size, 1)
    
    def forward(self, input_ids):
        hidden = self.backbone(input_ids).last_hidden_state[:, -1]
        return self.reward_head(hidden)
\`\`\`

### Stage 3: PPO Optimization

Use Proximal Policy Optimization to fine-tune the SFT model using the reward model:

> The key challenge is balancing reward maximization with staying close to the original SFT model (to prevent reward hacking).

## Key Papers

- *Training language models to follow instructions with human feedback* (Ouyang et al., 2022)
- *Learning to summarize from human feedback* (Stiennon et al., 2020)

## Alternatives to RLHF

| Method | Pros | Cons |
|--------|------|------|
| RLHF (PPO) | Well-studied | Complex pipeline |
| DPO | Simpler, no RM needed | Less flexible |
| RLAIF | No human data needed | May inherit biases |

## Conclusion

RLHF was the breakthrough that transformed LLMs from next-token predictors into helpful assistants. Understanding this pipeline is crucial for anyone building or deploying language models.
`
  },
  {
    id: 'python-async-patterns',
    title: 'Advanced Python Async Patterns for LLM Applications',
    date: '2026-03-10',
    category: 'Code',
    tags: ['Python', 'Async', 'LLM', 'Performance'],
    summary: 'Practical async patterns for building high-performance LLM applications in Python.',
    content: `# Advanced Python Async Patterns for LLM Applications

When building LLM-powered applications, efficient I/O handling is crucial. Here are battle-tested async patterns.

## Pattern 1: Concurrent API Calls with Semaphores

\`\`\`python
import asyncio
import aiohttp

class LLMClient:
    def __init__(self, api_key: str, max_concurrent: int = 5):
        self.api_key = api_key
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def complete(self, prompt: str) -> str:
        async with self.semaphore:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": "gpt-4",
                        "messages": [{"role": "user", "content": prompt}]
                    }
                ) as resp:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
    
    async def batch_complete(self, prompts: list[str]) -> list[str]:
        """Process multiple prompts concurrently."""
        tasks = [self.complete(p) for p in prompts]
        return await asyncio.gather(*tasks)
\`\`\`

## Pattern 2: Streaming Responses

\`\`\`python
async def stream_response(prompt: str):
    """Stream LLM responses token by token."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            json={
                "model": "gpt-4",
                "messages": [{"role": "user", "content": prompt}],
                "stream": True
            },
        ) as resp:
            async for line in resp.content:
                chunk = line.decode().strip()
                if chunk.startswith("data: ") and chunk != "data: [DONE]":
                    token = json.loads(chunk[6:])
                    delta = token["choices"][0].get("delta", {})
                    if "content" in delta:
                        yield delta["content"]
\`\`\`

## Pattern 3: Retry with Exponential Backoff

\`\`\`python
import asyncio
from functools import wraps

def async_retry(max_retries=3, base_delay=1.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
        return wrapper
    return decorator

@async_retry(max_retries=3)
async def robust_completion(client, prompt):
    return await client.complete(prompt)
\`\`\`

## Performance Tips

- **Use connection pooling** — reuse \`aiohttp.ClientSession\` across requests
- **Set appropriate timeouts** — prevent hanging requests from blocking your app
- **Monitor concurrency** — too many concurrent calls can trigger rate limits

> **Pro Tip**: Always use semaphores to limit concurrency when making API calls. Most LLM providers have rate limits, and exceeding them will result in \`429 Too Many Requests\` errors.
`
  },
  {
    id: 'attention-mechanisms-survey',
    title: 'A Survey of Attention Mechanisms: From Bahdanau to Flash Attention',
    date: '2026-03-05',
    category: 'Paper',
    tags: ['Attention', 'Flash Attention', 'Survey'],
    summary: 'Tracing the evolution of attention mechanisms from their origin to modern efficient variants.',
    content: `# A Survey of Attention Mechanisms

## Historical Timeline

### Bahdanau Attention (2014)
The original attention mechanism for neural machine translation. Instead of compressing the entire source sentence into a fixed-length vector, the model can "attend" to relevant parts of the input.

### Luong Attention (2015)
Simplified Bahdanau's approach with a more straightforward computation:
- **Dot product**: \`score(h_t, h_s) = h_t · h_s\`
- **General**: \`score(h_t, h_s) = h_t · W · h_s\`
- **Concat**: \`score(h_t, h_s) = v · tanh(W[h_t; h_s])\`

### Transformer Self-Attention (2017)
The breakthrough that changed everything — self-attention over the input sequence itself.

### Flash Attention (2022)
An I/O-aware exact attention algorithm that significantly reduces memory usage:

\`\`\`python
# Flash Attention achieves the same result as standard attention
# but with much better memory efficiency

# Standard attention: O(N²) memory
# Flash Attention: O(N) memory

# Usage with PyTorch 2.0+
from torch.nn.functional import scaled_dot_product_attention

output = scaled_dot_product_attention(
    query, key, value,
    attn_mask=None,
    dropout_p=0.0,
    is_causal=True  # for autoregressive models
)
\`\`\`

## Comparison Table

| Method | Complexity | Memory | Speed |
|--------|-----------|--------|-------|
| Standard | O(N²) | O(N²) | Baseline |
| Linear Attention | O(N) | O(N) | 2-4x faster |
| Flash Attention | O(N²) | O(N) | 2-4x faster |
| Flash Attention 2 | O(N²) | O(N) | ~2x over FA1 |

## Key Takeaway

> The evolution of attention mechanisms shows a clear trend: maintaining the expressiveness of full attention while dramatically improving computational and memory efficiency.
`
  },
  {
    id: 'building-rag-pipeline',
    title: 'Building a Production-Ready RAG Pipeline from Scratch',
    date: '2026-02-28',
    category: 'Code',
    tags: ['RAG', 'LangChain', 'Vector DB', 'Production'],
    summary: 'Step-by-step guide to building a Retrieval-Augmented Generation pipeline that works in production.',
    content: `# Building a Production-Ready RAG Pipeline

Retrieval-Augmented Generation (RAG) is the most practical way to give LLMs access to your own data. Here's how to build one properly.

## Architecture Overview

\`\`\`
Documents → Chunking → Embedding → Vector Store
                                         ↓
User Query → Embedding → Similarity Search → Context
                                                ↓
                              LLM Prompt (Query + Context) → Answer
\`\`\`

## Step 1: Document Chunking

\`\`\`python
from dataclasses import dataclass

@dataclass
class Chunk:
    text: str
    metadata: dict
    embedding: list[float] = None

def chunk_document(text: str, chunk_size: int = 512, overlap: int = 50) -> list[Chunk]:
    """Split document into overlapping chunks."""
    chunks = []
    sentences = text.split('. ')
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence.split())
        if current_length + sentence_length > chunk_size and current_chunk:
            chunk_text = '. '.join(current_chunk) + '.'
            chunks.append(Chunk(text=chunk_text, metadata={}))
            # Keep overlap
            overlap_start = max(0, len(current_chunk) - 2)
            current_chunk = current_chunk[overlap_start:]
            current_length = sum(len(s.split()) for s in current_chunk)
        current_chunk.append(sentence)
        current_length += sentence_length
    
    if current_chunk:
        chunks.append(Chunk(text='. '.join(current_chunk), metadata={}))
    
    return chunks
\`\`\`

## Step 2: Embedding & Retrieval

\`\`\`python
import numpy as np
from openai import OpenAI

client = OpenAI()

def get_embeddings(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def retrieve(query: str, chunks: list[Chunk], top_k: int = 5) -> list[Chunk]:
    query_embedding = get_embeddings([query])[0]
    scores = [(chunk, cosine_similarity(query_embedding, chunk.embedding)) for chunk in chunks]
    scores.sort(key=lambda x: x[1], reverse=True)
    return [chunk for chunk, _ in scores[:top_k]]
\`\`\`

## Step 3: Generation

\`\`\`python
def generate_answer(query: str, context_chunks: list[Chunk]) -> str:
    context = "\\n\\n".join(c.text for c in context_chunks)
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": f"Answer based on this context:\\n{context}"},
            {"role": "user", "content": query}
        ]
    )
    return response.choices[0].message.content
\`\`\`

## Production Tips

1. **Use hybrid search** — combine vector similarity with BM25 keyword search
2. **Re-rank results** — use a cross-encoder to re-rank retrieved chunks
3. **Add metadata filtering** — filter by date, source, category before retrieval
4. **Monitor quality** — track retrieval precision and user satisfaction

> **Warning**: Don't just increase chunk size to include more context. Smaller, more focused chunks with good overlap typically outperform large chunks.
`
  }
];

export default sampleArticles;
