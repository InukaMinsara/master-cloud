"""
MASTER CLOUD — MASTER AI ORIGINAL
Original Decoder-Only Transformer Architecture from Scratch.

Zero pre-trained weights. Initialized randomly and trained end-to-end.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class MasterAiConfig:
    vocab_size: int = 1024
    d_model: int = 256
    n_layers: int = 6
    n_heads: int = 4
    d_ff: int = 1024
    max_seq_len: int = 256
    dropout: float = 0.1
    tie_weights: bool = True


class MultiHeadCausalSelfAttention(nn.Module):
    def __init__(self, config: MasterAiConfig):
        super().__init__()
        assert config.d_model % config.n_heads == 0, "d_model must be divisible by n_heads"
        self.d_model = config.d_model
        self.n_heads = config.n_heads
        self.head_dim = config.d_model // config.n_heads

        self.q_proj = nn.Linear(config.d_model, config.d_model, bias=False)
        self.k_proj = nn.Linear(config.d_model, config.d_model, bias=False)
        self.v_proj = nn.Linear(config.d_model, config.d_model, bias=False)
        self.out_proj = nn.Linear(config.d_model, config.d_model, bias=False)

        self.dropout = nn.Dropout(config.dropout)

        # Causal attention mask (lower-triangular)
        self.register_buffer(
            "causal_mask",
            torch.tril(torch.ones(config.max_seq_len, config.max_seq_len)).view(
                1, 1, config.max_seq_len, config.max_seq_len
            ),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size, seq_len, _ = x.shape

        # Linear projections
        q = self.q_proj(x)
        k = self.k_proj(x)
        v = self.v_proj(x)

        # Split into multiple heads: (batch, n_heads, seq_len, head_dim)
        q = q.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        k = k.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        v = v.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)

        # Scaled dot-product attention
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)

        # Apply causal mask (mask future tokens with -inf)
        mask = self.causal_mask[:, :, :seq_len, :seq_len]
        scores = scores.masked_fill(mask == 0, float("-inf"))

        attn_weights = F.softmax(scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Output context
        context = torch.matmul(attn_weights, v)
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)

        return self.out_proj(context)


class FeedForwardNetwork(nn.Module):
    def __init__(self, config: MasterAiConfig):
        super().__init__()
        self.fc1 = nn.Linear(config.d_model, config.d_ff)
        self.activation = nn.GELU()
        self.fc2 = nn.Linear(config.d_ff, config.d_model)
        self.dropout = nn.Dropout(config.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.dropout(self.fc2(self.activation(self.fc1(x))))


class TransformerBlock(nn.Module):
    def __init__(self, config: MasterAiConfig):
        super().__init__()
        self.ln1 = nn.LayerNorm(config.d_model)
        self.attn = MultiHeadCausalSelfAttention(config)
        self.ln2 = nn.LayerNorm(config.d_model)
        self.ffn = FeedForwardNetwork(config)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Pre-LayerNorm architecture with residual skip-connections
        x = x + self.attn(self.ln1(x))
        x = x + self.ffn(self.ln2(x))
        return x


class MasterAiCore(nn.Module):
    """
    Original MASTER AI CORE Generative Language Model.
    Proprietary architecture designed and trained completely from scratch.
    """

    def __init__(self, config: MasterAiConfig):
        super().__init__()
        self.config = config

        self.tok_embeddings = nn.Embedding(config.vocab_size, config.d_model)
        self.pos_embeddings = nn.Embedding(config.max_seq_len, config.d_model)
        self.dropout = nn.Dropout(config.dropout)

        self.blocks = nn.ModuleList([TransformerBlock(config) for _ in range(config.n_layers)])
        self.final_ln = nn.LayerNorm(config.d_model)
        self.lm_head = nn.Linear(config.d_model, config.vocab_size, bias=False)

        if config.tie_weights:
            self.lm_head.weight = self.tok_embeddings.weight

        # Initialize weights with standard Gaussian
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if hasattr(module, "bias") and module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.LayerNorm):
            nn.init.ones_(module.weight)
            nn.init.zeros_(module.bias)

    def count_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def forward(
        self,
        input_ids: torch.Tensor,
        targets: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        batch_size, seq_len = input_ids.shape
        assert seq_len <= self.config.max_seq_len, f"Sequence length {seq_len} exceeds max {self.config.max_seq_len}"

        positions = torch.arange(0, seq_len, dtype=torch.long, device=input_ids.device)

        # Combine token embeddings and positional encodings
        x = self.tok_embeddings(input_ids) + self.pos_embeddings(positions)
        x = self.dropout(x)

        # Pass through Transformer blocks
        for block in self.blocks:
            x = block(x)

        x = self.final_ln(x)
        logits = self.lm_head(x)

        loss = None
        if targets is not None:
            # Flatten across batch and sequence dimensions for CrossEntropyLoss
            loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))

        return logits, loss

    @torch.no_grad()
    def generate(
        self,
        input_ids: torch.Tensor,
        max_new_tokens: int = 50,
        temperature: float = 0.7,
        top_k: int = 40,
        eos_id: Optional[int] = None,
    ) -> torch.Tensor:
        """Autoregressive text generation."""
        self.eval()
        for _ in range(max_new_tokens):
            # Crop to context window if needed
            idx_cond = (
                input_ids
                if input_ids.size(1) <= self.config.max_seq_len
                else input_ids[:, -self.config.max_seq_len :]
            )

            logits, _ = self(idx_cond)
            # Focus on last token prediction
            logits = logits[:, -1, :] / max(1e-5, temperature)

            # Optional Top-K sampling
            if top_k > 0:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float("-inf")

            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)

            input_ids = torch.cat((input_ids, idx_next), dim=1)

            if eos_id is not None and (idx_next == eos_id).all():
                break

        return input_ids
