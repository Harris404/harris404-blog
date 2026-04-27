/**
 * Markdown content for each layer in the ArchitectureExplorer.
 * Content is based on the Transformer notes but curated per-layer (not per-section).
 */

// ─── Multi-Head Attention (§4 content only) ──────
export const MULTI_HEAD_CONTENT = `
一个注意力头只能从一种视角理解句子，多头则同时从多种视角学习：

<svg width="100%" viewBox="0 0 680 460" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
<defs>
  <marker id="arrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
</defs>
<rect x="240" y="20" width="200" height="38" rx="8" fill="#f1efe8" stroke="#888780" stroke-width="0.5"/>
<text x="340" y="44" text-anchor="middle" font-size="14" font-weight="500" fill="#2c2c2a">输入 X（d=512）</text>
<line x1="290" y1="58" x2="68" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="310" y1="58" x2="148" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="330" y1="58" x2="228" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="350" y1="58" x2="308" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="370" y1="58" x2="452" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="390" y1="58" x2="532" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="410" y1="58" x2="612" y2="120" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<rect x="30" y="120" width="76" height="56" rx="6" fill="#eeedfe" stroke="#7f77dd" stroke-width="0.5"/>
<text x="68" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#3c3489">头 1</text>
<text x="68" y="160" text-anchor="middle" font-size="11" fill="#534ab7">指代关系</text>
<rect x="110" y="120" width="76" height="56" rx="6" fill="#e1f5ee" stroke="#1d9e75" stroke-width="0.5"/>
<text x="148" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#085041">头 2</text>
<text x="148" y="160" text-anchor="middle" font-size="11" fill="#0f6e56">动作关系</text>
<rect x="190" y="120" width="76" height="56" rx="6" fill="#faece7" stroke="#d85a30" stroke-width="0.5"/>
<text x="228" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#4a1b0c">头 3</text>
<text x="228" y="160" text-anchor="middle" font-size="11" fill="#993c1d">修饰关系</text>
<rect x="270" y="120" width="76" height="56" rx="6" fill="#e6f1fb" stroke="#185fa5" stroke-width="0.5"/>
<text x="308" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#0c447c">头 4</text>
<text x="308" y="160" text-anchor="middle" font-size="11" fill="#185fa5">位置关系</text>
<text x="393" y="155" text-anchor="middle" font-size="18" fill="#888">···</text>
<rect x="414" y="120" width="76" height="56" rx="6" fill="#eaf3de" stroke="#3b6d11" stroke-width="0.5"/>
<text x="452" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#173404">头 6</text>
<text x="452" y="160" text-anchor="middle" font-size="11" fill="#3b6d11">句法关系</text>
<rect x="494" y="120" width="76" height="56" rx="6" fill="#faeeda" stroke="#ba7517" stroke-width="0.5"/>
<text x="532" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#633806">头 7</text>
<text x="532" y="160" text-anchor="middle" font-size="11" fill="#854f0b">时序关系</text>
<rect x="574" y="120" width="76" height="56" rx="6" fill="#fbeaf0" stroke="#d4537e" stroke-width="0.5"/>
<text x="612" y="142" text-anchor="middle" font-size="13" font-weight="500" fill="#4b1528">头 8</text>
<text x="612" y="160" text-anchor="middle" font-size="11" fill="#993556">语义关系</text>
<text x="68" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<text x="148" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<text x="228" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<text x="308" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<text x="452" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<text x="532" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<text x="612" y="192" text-anchor="middle" font-size="11" fill="#888">64 维</text>
<line x1="68" y1="196" x2="200" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="148" y1="196" x2="240" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="228" y1="196" x2="280" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="308" y1="196" x2="320" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="452" y1="196" x2="400" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="532" y1="196" x2="440" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<line x1="612" y1="196" x2="480" y2="250" stroke="#aaa" stroke-width="0.5" marker-end="url(#arrow3)"/>
<rect x="160" y="250" width="360" height="44" rx="8" fill="#f1efe8" stroke="#888780" stroke-width="0.5"/>
<text x="340" y="268" text-anchor="middle" font-size="14" font-weight="500" fill="#2c2c2a">Concat(Z₀, Z₁, ..., Z₇)</text>
<text x="340" y="285" text-anchor="middle" font-size="11" fill="#666">8 × 64 = 512 维，各头信息仍独立</text>
<line x1="340" y1="294" x2="340" y2="338" stroke="#185fa5" stroke-width="1.5" marker-end="url(#arrow3)"/>
<rect x="200" y="338" width="280" height="44" rx="8" fill="#e6f1fb" stroke="#185fa5" stroke-width="0.5"/>
<text x="340" y="356" text-anchor="middle" font-size="14" font-weight="500" fill="#0c447c">× W^O（inter-head communication）</text>
<text x="340" y="374" text-anchor="middle" font-size="11" fill="#185fa5">融合各头信息，不同头互相影响</text>
<line x1="340" y1="382" x2="340" y2="420" stroke="#0f6e56" stroke-width="1.5" marker-end="url(#arrow3)"/>
<rect x="200" y="420" width="280" height="28" rx="8" fill="#e1f5ee" stroke="#0f6e56" stroke-width="0.5"/>
<text x="340" y="439" text-anchor="middle" font-size="14" font-weight="500" fill="#085041">最终输出 Z（512 维）</text>
</svg>

每个头前面的 **Linear 层**负责投影：把 512 维压缩到 64 维，让每个头从不同角度观察 Q、K、V，8个头×64维=512维，总量不变。

**$W^O$ 的作用（inter-head communication）：** Concat 只是把 8 个头拼在一起，信息还是分开的。乘以 $W^O$ 后，不同头的信息互相融合，头0的发现可以影响头1的输出。

\`\`\`python
head_i = Attention(Q @ W_Q_i, K @ W_K_i, V @ W_V_i)
MultiHead(Q, K, V) = Concat(head_1, ..., head_8) @ W_O
\`\`\`

论文参数：\`d_model=512, h=8, dk=dv=64\`

所有权重矩阵（$W^Q$, $W^K$, $W^V$, $W^O$）都是**训练出来的**，没有人告诉每个头负责哪种关系，模型自己学会的。

| 方面 | 单头 | 多头 |
|------|------|------|
| 关系视角 | 只能学一种 | 同时学多种 |
| 计算量 | 512² = 262,144 | 8×64² = 32,768 |
| 稳定性 | 一头学偏全盘受影响 | 其他头可以补救 |
`;

// ─── Feed Forward Network (§6) ──────
export const FFN_CONTENT = `
**为什么需要 FFN？** Attention 层负责建立词与词之间的关系（横向），但每个词自身的语义理解还不够深入。FFN 对每个词**独立地**做非线性变换，让模型挖掘更丰富的语义特征（纵向）。可以把 Attention 理解为"看别人"，FFN 理解为"想清楚自己"。

公式：

$$FFN(x) = W_2 \\sigma(W_1 x + b_1) + b_2$$

其中 $\\sigma$ 是激活函数（ReLU 或 GELU），$W_1$ 将维度从 512 扩展到 2048，$W_2$ 再压缩回 512。

为什么隐藏层是 4d？这是通过大量实验得出的经验值——太小学不到足够特征，太大参数爆炸容易过拟合，4倍在表达能力和计算效率之间最平衡。

<svg width="60%" viewBox="0 0 500 450" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
  <defs>
    <marker id="arw4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
    </marker>
  </defs>
<text x="230" y="28" text-anchor="middle" font-size="14" fill="#888">Feed Forward Network 结构</text>
  <rect x="20" y="50" width="110" height="64" rx="10" fill="#f0eeff" stroke="#7070cc" stroke-width="1"/>
  <text x="75" y="78" text-anchor="middle" font-size="13" font-weight="500" fill="#4040aa">输入 x</text>
  <text x="75" y="98" text-anchor="middle" font-size="12" fill="#6060aa">d = 512</text>
  <line x1="130" y1="82" x2="158" y2="82" stroke="#bbb" stroke-width="1" marker-end="url(#arw4)"/>
  <text x="144" y="74" text-anchor="middle" font-size="10" fill="#aaa">× W₁</text>
  <rect x="158" y="38" width="130" height="88" rx="10" fill="#fff8e8" stroke="#d4a030" stroke-width="1"/>
  <text x="223" y="66" text-anchor="middle" font-size="13" font-weight="500" fill="#8a6010">隐藏层</text>
  <text x="223" y="86" text-anchor="middle" font-size="12" fill="#aa8020">4d = 2048</text>
  <text x="223" y="104" text-anchor="middle" font-size="11" fill="#aa8020">高维特征空间</text>
  <line x1="223" y1="126" x2="223" y2="154" stroke="#bbb" stroke-width="1" marker-end="url(#arw4)"/>
  <rect x="148" y="154" width="150" height="52" rx="10" fill="#e6faf5" stroke="#0f9e75" stroke-width="1"/>
  <text x="223" y="176" text-anchor="middle" font-size="13" font-weight="500" fill="#0a7a5c">激活函数 σ</text>
  <text x="223" y="195" text-anchor="middle" font-size="11" fill="#0f9e75">ReLU / GELU</text>
  <line x1="298" y1="180" x2="328" y2="130" stroke="#bbb" stroke-width="1" marker-end="url(#arw4)"/>
  <text x="318" y="162" text-anchor="middle" font-size="10" fill="#aaa">× W₂</text>
  <rect x="328" y="100" width="110" height="60" rx="10" fill="#f0eeff" stroke="#7070cc" stroke-width="1"/>
  <text x="383" y="126" text-anchor="middle" font-size="13" font-weight="500" fill="#4040aa">输出</text>
  <text x="383" y="146" text-anchor="middle" font-size="12" fill="#6060aa">d = 512</text>
<text x="210" y="240" text-anchor="middle" font-size="11" fill="#888">扩张：捕捉更丰富的语义特征</text>
<text x="210" y="258" text-anchor="middle" font-size="11" fill="#888">压缩：归回模型处理的维度</text>
  <rect x="20" y="290" width="180" height="80" rx="8" fill="#fff0f0" stroke="#d46060" stroke-width="1"/>
  <text x="110" y="314" text-anchor="middle" font-size="13" font-weight="500" fill="#aa3030">ReLU</text>
  <text x="110" y="334" text-anchor="middle" font-size="11" fill="#cc4040">x &lt; 0 → 直接变 0</text>
  <text x="110" y="352" text-anchor="middle" font-size="11" fill="#cc4040">神经元可能"死亡" ⚠</text>
  <rect x="220" y="290" width="180" height="80" rx="8" fill="#e6faf5" stroke="#0f9e75" stroke-width="1"/>
  <text x="310" y="314" text-anchor="middle" font-size="13" font-weight="500" fill="#0a7a5c">GELU</text>
  <text x="310" y="334" text-anchor="middle" font-size="11" fill="#0f9e75">x &lt; 0 → 平滑趋近 0</text>
  <text x="310" y="352" text-anchor="middle" font-size="11" fill="#0f9e75">梯度更稳定</text>
</svg>

激活函数的作用：引入非线性，否则两层线性变换 $W_2(W_1 x)$ 等价于一层 $Wx$，叠加没有意义。
`;

// ─── 残差连接（Residual Add） ──────
export const RESIDUAL_CONTENT = `
### 残差连接（Residual Connection）

在 Pre-Norm 架构中，Layer Norm 已经在 Sublayer 之前独立存在，所以这一步**只做残差连接（Add）**。

<svg width="55%" viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
  <defs>
    <marker id="arw-res" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
    </marker>
    <marker id="arw-res-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#0f9e75" stroke-width="1.5" stroke-linecap="round"/>
    </marker>
  </defs>
  <text x="260" y="18" text-anchor="middle" font-size="13" fill="#888">Pre-Norm 残差连接流程</text>
  <rect x="130" y="30" width="200" height="44" rx="10" fill="#fdf8e1" stroke="#c8a92a" stroke-width="1"/>
  <text x="230" y="57" text-anchor="middle" font-size="14" font-weight="500" fill="#7a6010">输入 x</text>
  <line x1="230" y1="74" x2="230" y2="100" stroke="#bbb" stroke-width="1" marker-end="url(#arw-res)"/>
  <line x1="100" y1="52" x2="100" y2="232" stroke="#0f9e75" stroke-width="1.5"/>
  <line x1="100" y1="232" x2="128" y2="232" stroke="#0f9e75" stroke-width="1.5" marker-end="url(#arw-res-g)"/>
  <text x="64" y="148" text-anchor="middle" font-size="11" fill="#0f9e75" transform="rotate(-90,64,148)">skip connection</text>
  <rect x="130" y="100" width="200" height="40" rx="10" fill="#fff8e8" stroke="#d4a030" stroke-width="1"/>
  <text x="230" y="125" text-anchor="middle" font-size="13" font-weight="500" fill="#8a6010">Layer Norm（在前面）</text>
  <line x1="230" y1="140" x2="230" y2="160" stroke="#bbb" stroke-width="1" marker-end="url(#arw-res)"/>
  <rect x="130" y="160" width="200" height="40" rx="10" fill="#f0eeff" stroke="#7070cc" stroke-width="1"/>
  <text x="230" y="185" text-anchor="middle" font-size="14" font-weight="500" fill="#4040aa">Sublayer f(x)</text>
  <line x1="230" y1="200" x2="230" y2="220" stroke="#bbb" stroke-width="1" marker-end="url(#arw-res)"/>
  <rect x="130" y="220" width="200" height="44" rx="8" fill="#e6faf5" stroke="#0f9e75" stroke-width="1.5"/>
  <text x="230" y="240" text-anchor="middle" font-size="14" font-weight="700" fill="#0a7a5c">Add: x + f(x)</text>
  <text x="230" y="256" text-anchor="middle" font-size="11" fill="#0f9e75">只做残差相加，不归一化</text>
  <line x1="230" y1="264" x2="230" y2="290" stroke="#bbb" stroke-width="1" marker-end="url(#arw-res)"/>
  <text x="350" y="240" font-size="11" fill="#0f9e75">← 原始 x + 新信息</text>
  <rect x="130" y="290" width="200" height="30" rx="8" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="230" y="310" text-anchor="middle" font-size="13" fill="#666">输出</text>
</svg>

直接用 f(x) 替换 x 会丢失原始语义。用 \`x + f(x)\` 的好处：

\`\`\`python
output = x + Sublayer(x)

# 对 x 求导：
# d(output)/dx = 1 + d(Sublayer)/dx
#                ↑
#      永远有这个 +1！← 梯度的保底机制
\`\`\`

无论 Sublayer 的梯度多小甚至为 0，总有 **+1** 直接传回去，确保早期层始终能收到梯度信号，不会停止学习。

**为什么残差连接对深层模型至关重要？** ResNet 的核心发现：没有残差连接时，超过 20 层的网络几乎无法训练。Transformer 每 6 层需要 12 次残差连接（每层 Attention + FFN 各一次），是模型能够训练的关键基础设施。
`;

// ─── Layer Norm ──────
export const LAYER_NORM_CONTENT = `
Transformer 用的是 **Layer Norm**，不是 CNN 常用的 Batch Norm：

<svg width="100%" viewBox="0 0 680 310" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
  <text x="340" y="22" text-anchor="middle" font-size="14" fill="#666">Batch Norm vs Layer Norm</text>
  <rect x="20" y="38" width="300" height="260" rx="10" fill="#fff8f8" stroke="#e8b0b0" stroke-width="1"/>
  <text x="170" y="62" text-anchor="middle" font-size="13" font-weight="500" fill="#aa3030">Batch Norm ❌</text>
  <text x="170" y="80" text-anchor="middle" font-size="11" fill="#cc4040">沿 Batch 维度归一化</text>
<rect x="90" y="100" width="32" height="26" rx="3" fill="#f4a0a0"/><text x="106" y="118" text-anchor="middle" font-size="10" fill="#fff">归一</text>
<rect x="90" y="130" width="32" height="26" rx="3" fill="#f4a0a0"/><text x="106" y="148" text-anchor="middle" font-size="10" fill="#fff">归一</text>
<rect x="90" y="160" width="32" height="26" rx="3" fill="#f4a0a0"/><text x="106" y="178" text-anchor="middle" font-size="10" fill="#fff">归一</text>
<rect x="90" y="190" width="32" height="26" rx="3" fill="#f4a0a0"/><text x="106" y="208" text-anchor="middle" font-size="10" fill="#fff">归一</text>
  <rect x="126" y="100" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="126" y="130" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="126" y="160" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="126" y="190" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="162" y="100" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="162" y="130" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="162" y="160" width="32" height="26" rx="3" fill="#eee"/>
  <rect x="162" y="190" width="32" height="26" rx="3" fill="#eee"/>
  <text x="78" y="115" text-anchor="end" font-size="10" fill="#aaa">Token 1</text>
  <text x="78" y="145" text-anchor="end" font-size="10" fill="#aaa">Token 2</text>
  <text x="78" y="175" text-anchor="end" font-size="10" fill="#aaa">Token 3</text>
  <text x="78" y="205" text-anchor="end" font-size="10" fill="#aaa">Token 4</text>
  <text x="106" y="96" text-anchor="middle" font-size="10" fill="#aa3030">Feat 1</text>
  <text x="142" y="96" text-anchor="middle" font-size="10" fill="#aaa">Feat 2</text>
  <text x="178" y="96" text-anchor="middle" font-size="10" fill="#aaa">Feat 3</text>
  <line x1="106" y1="222" x2="106" y2="235" stroke="#f4a0a0" stroke-width="2"/>
  <text x="170" y="252" text-anchor="middle" font-size="11" fill="#cc4040">跨样本归一化</text>
  <text x="170" y="268" text-anchor="middle" font-size="11" fill="#cc4040">Batch 小时效果差 ⚠</text>
  <text x="170" y="284" text-anchor="middle" font-size="11" fill="#cc4040">样本间互相依赖</text>
  <rect x="360" y="38" width="300" height="260" rx="10" fill="#f0fdf8" stroke="#9fd8c4" stroke-width="1"/>
  <text x="510" y="62" text-anchor="middle" font-size="13" font-weight="500" fill="#0a7a5c">Layer Norm</text>
  <text x="510" y="80" text-anchor="middle" font-size="11" fill="#0f9e75">沿 Feature 维度归一化</text>
<rect x="414" y="100" width="32" height="26" rx="3" fill="#5cc9a0"/><text x="430" y="118" text-anchor="middle" font-size="10" fill="#fff">归一</text>
<rect x="450" y="100" width="32" height="26" rx="3" fill="#5cc9a0"/><text x="466" y="118" text-anchor="middle" font-size="10" fill="#fff">归一</text>
<rect x="486" y="100" width="32" height="26" rx="3" fill="#5cc9a0"/><text x="502" y="118" text-anchor="middle" font-size="10" fill="#fff">归一</text>
  <rect x="414" y="130" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="450" y="130" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="486" y="130" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="414" y="160" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="450" y="160" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="486" y="160" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="414" y="190" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="450" y="190" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <rect x="486" y="190" width="32" height="26" rx="3" fill="#d4f0e8"/>
  <text x="402" y="115" text-anchor="end" font-size="10" fill="#0f9e75">Token 1 →</text>
  <text x="402" y="145" text-anchor="end" font-size="10" fill="#aaa">Token 2</text>
  <text x="402" y="175" text-anchor="end" font-size="10" fill="#aaa">Token 3</text>
  <text x="402" y="205" text-anchor="end" font-size="10" fill="#aaa">Token 4</text>
  <text x="430" y="96" text-anchor="middle" font-size="10" fill="#0a7a5c">Feat 1</text>
  <text x="466" y="96" text-anchor="middle" font-size="10" fill="#0a7a5c">Feat 2</text>
  <text x="502" y="96" text-anchor="middle" font-size="10" fill="#0a7a5c">Feat 3</text>
  <text x="510" y="252" text-anchor="middle" font-size="11" fill="#0a7a5c">每个 Token 独立归一化</text>
  <text x="510" y="268" text-anchor="middle" font-size="11" fill="#0a7a5c">不依赖其他样本</text>
  <text x="510" y="284" text-anchor="middle" font-size="11" fill="#888">LN(x) = (x−μ)/σ · γ + β</text>
</svg>

Layer Norm 公式：

$$LN(x) = \\frac{x - \\mu}{\\sigma} \\cdot \\gamma + \\beta$$

\`\`\`text
x - μ   → 减去均值（中心化）
÷ σ     → 除以标准差（方差归一化到 1）
× γ + β → 可学习参数，让模型自己决定最优分布
\`\`\`

### Post-Norm vs Pre-Norm：顺序有影响吗？

这是一个"先 Add 还是先 Norm"的设计选择：

<svg width="100%" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif">
  <defs>
    <marker id="arw3n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
    </marker>
    <marker id="arw3gn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#0f9e75" stroke-width="1.5" stroke-linecap="round"/>
    </marker>
  </defs>
<text x="180" y="28" text-anchor="middle" font-size="14" fill="#888">Post-Norm（原始论文）</text>
  <rect x="90" y="50" width="180" height="44" rx="10" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="180" y="77" text-anchor="middle" font-size="14" fill="#444">Input x</text>
  <line x1="70" y1="72" x2="70" y2="280" stroke="#bbb" stroke-width="1"/>
  <line x1="70" y1="280" x2="88" y2="280" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <text x="52" y="185" text-anchor="middle" font-size="11" fill="#aaa">skip</text>
  <line x1="180" y1="94" x2="180" y2="118" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <rect x="90" y="118" width="180" height="52" rx="10" fill="#f0eeff" stroke="#7070cc" stroke-width="1"/>
  <text x="180" y="140" text-anchor="middle" font-size="14" font-weight="500" fill="#4040aa">Sublayer</text>
  <text x="180" y="158" text-anchor="middle" font-size="11" fill="#6060aa">Attention / FFN</text>
  <line x1="180" y1="170" x2="180" y2="194" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <rect x="90" y="194" width="180" height="44" rx="10" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="180" y="221" text-anchor="middle" font-size="14" fill="#444">Add（x + f(x)）</text>
  <line x1="180" y1="238" x2="180" y2="262" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <rect x="70" y="262" width="220" height="60" rx="6" fill="none" stroke="#d46060" stroke-width="1" stroke-dasharray="5 3"/>
  <rect x="90" y="268" width="180" height="48" rx="10" fill="#fff8e8" stroke="#d4a030" stroke-width="1"/>
  <text x="180" y="288" text-anchor="middle" font-size="14" font-weight="500" fill="#8a6010">Layer Norm</text>
  <text x="180" y="306" text-anchor="middle" font-size="11" fill="#aa8020">归一化在最后</text>
  <line x1="180" y1="316" x2="180" y2="352" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
<text x="180" y="370" text-anchor="middle" font-size="11" fill="#d46060">梯度需穿越 LayerNorm ⚠</text>
  <rect x="90" y="378" width="180" height="44" rx="10" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="180" y="405" text-anchor="middle" font-size="14" fill="#444">Output</text>
  <line x1="360" y1="20" x2="360" y2="480" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="4 4"/>
<text x="540" y="28" text-anchor="middle" font-size="14" fill="#888">Pre-Norm（GPT-3 / LLaMA）</text>
  <rect x="450" y="50" width="180" height="44" rx="10" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="540" y="77" text-anchor="middle" font-size="14" fill="#444">Input x</text>
  <line x1="432" y1="72" x2="432" y2="360" stroke="#0f9e75" stroke-width="1.5"/>
  <line x1="432" y1="360" x2="448" y2="360" stroke="#0f9e75" stroke-width="1.5" marker-end="url(#arw3gn)"/>
  <text x="412" y="220" text-anchor="middle" font-size="11" fill="#0f9e75">skip</text>
  <text x="412" y="234" text-anchor="middle" font-size="11" fill="#0f9e75">直达!</text>
  <line x1="540" y1="94" x2="540" y2="118" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <rect x="450" y="118" width="180" height="48" rx="10" fill="#fff8e8" stroke="#d4a030" stroke-width="1"/>
  <text x="540" y="138" text-anchor="middle" font-size="14" font-weight="500" fill="#8a6010">Layer Norm</text>
  <text x="540" y="156" text-anchor="middle" font-size="11" fill="#aa8020">归一化在最前</text>
  <line x1="540" y1="166" x2="540" y2="190" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <rect x="450" y="190" width="180" height="52" rx="10" fill="#f0eeff" stroke="#7070cc" stroke-width="1"/>
  <text x="540" y="212" text-anchor="middle" font-size="14" font-weight="500" fill="#4040aa">Sublayer</text>
  <text x="540" y="230" text-anchor="middle" font-size="11" fill="#6060aa">Attention / FFN</text>
  <line x1="540" y1="242" x2="540" y2="312" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
  <rect x="430" y="312" width="220" height="60" rx="6" fill="none" stroke="#0f9e75" stroke-width="1" stroke-dasharray="5 3"/>
  <rect x="450" y="318" width="180" height="44" rx="10" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="540" y="345" text-anchor="middle" font-size="14" fill="#444">Add（x + f(x)）</text>
  <line x1="540" y1="362" x2="540" y2="400" stroke="#bbb" stroke-width="1" marker-end="url(#arw3n)"/>
<text x="540" y="418" text-anchor="middle" font-size="11" fill="#0f9e75">梯度沿残差直接流过</text>
  <rect x="450" y="426" width="180" height="44" rx="10" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="540" y="453" text-anchor="middle" font-size="14" fill="#444">Output</text>
</svg>

- **Post-Norm**（原始论文）：先 Sublayer → Add → Layer Norm。梯度需穿越 LayerNorm，深层时训练不稳定
- **Pre-Norm**（GPT-3、LLaMA）：先 Layer Norm → Sublayer → Add。梯度沿残差直连流过，训练更稳定
`;

// ─── Dropout ──────
export const DROPOUT_CONTENT = `
每个 Sublayer 后面还有 Dropout，**训练时随机关掉一些神经元，推理时全部恢复**：

\`\`\`text
训练时：随机关掉 10~30% 的神经元
→ 模型被迫不依赖特定参数
→ 防止过拟合（死记硬背训练数据）

推理时：所有神经元打开
→ 用完整模型做预测
\`\`\`

Dropout vs 剪枝的区别：

| | Dropout | 剪枝 |
|--|---------|------|
| 时机 | 训练时 | 训练后 |
| 是否永久 | 否，推理时恢复 | 是，永久删除 |
| 目的 | 防止过拟合 | 压缩模型大小 |
| 随机性 | 每次随机不同 | 固定删掉特定参数 |
`;

// ─── Input ──────
export const INPUT_CONTENT = `
每个词通过 **Embedding 矩阵**映射为 d=512 维向量。

位置编码（Positional Encoding）用正弦/余弦函数注入位置信息：

$$PE_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i/d}}\\right)$$

词向量 + 位置编码 = 模型的输入，既知道"是什么词"，也知道"在哪个位置"。
`;

// ─── Output ──────
export const OUTPUT_CONTENT = `
一层 Encoder 的输出作为下一层的输入，共重复 **N=6 次**。

最终输出包含了丰富的上下文语义，传给 Decoder 的每一层做 Cross-Attention。

- **Attention** 负责发现词间关系（横向）
- **FFN** 负责提取词本身的语义特征（纵向）
- 两者互补，共同构成一层 Encoder 的处理能力
`;
