"""
MASTER CLOUD — MASTER AI CORE v1.0
Original Upgraded Decoder-Only Autoregressive Transformer Architecture.

Implemented completely from scratch using PyTorch tensor primitives:
- RMSNorm (Root Mean Square Layer Normalization) with optional LayerNorm ablation
- RoPE (Rotary Position Embeddings) with flexible context length (256 -> 2048) & optional learned_abs ablation
- SwiGLU (SiLU Gated Linear Unit) feed-forward network with optional GELU ablation
- Causal GQA (Grouped Query Attention) supporting kv_heads <= n_heads and autoregressive KV Cache
- Weight tying (optional) + residual output-projection depth scaling
- Optional gradient checkpointing for memory-efficient training on constrained hardware
- Stateless ONNX-friendly forward signature `[B, T] -> logits [B, T, V]` (opset 14/17 safe)
"""

import math
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.checkpoint import checkpoint as grad_checkpoint


@dataclass
class MasterAiV1Config:
    vocab_size: int = 7875
    d_model: int = 384
    n_layers: int = 8
    n_heads: int = 8
    n_kv_heads: int = 2
    d_ff: int = 1024
    max_seq_len: int = 512
    dropout: float = 0.10
    tie_weights: bool = True
    rope_theta: float = 10000.0
    norm_eps: float = 1e-6
    norm_type: str = "rmsnorm"       # "rmsnorm" | "layernorm"
    pos_encoding: str = "rope"       # "rope" | "learned_abs"
    ffn_type: str = "swiglu"         # "swiglu" | "gelu"
    use_grad_checkpoint: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MasterAiV1Config":
        valid_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in valid_fields}
        return cls(**filtered)


class RMSNorm(nn.Module):
    """Original Root Mean Square Normalization without mean centering."""

    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        var = x.pow(2).mean(dim=-1, keepdim=True)
        normed = x * torch.rsqrt(var + self.eps)
        return normed * self.weight


def make_norm(dim: int, norm_type: str, eps: float) -> nn.Module:
    if norm_type == "layernorm":
        return nn.LayerNorm(dim, eps=eps)
    return RMSNorm(dim, eps=eps)


def build_rope_cache(
    max_seq_len: int,
    head_dim: int,
    theta: float = 10000.0,
    device: Optional[torch.device] = None,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """Precompute cosine and sine rotary tables of shape [max_seq_len, head_dim // 2]."""
    half_dim = head_dim // 2
    inv_freq = 1.0 / (theta ** (torch.arange(0, half_dim, dtype=torch.float32, device=device) / half_dim))
    positions = torch.arange(max_seq_len, dtype=torch.float32, device=device)
    freqs = torch.outer(positions, inv_freq)  # [T, half_dim]
    return torch.cos(freqs), torch.sin(freqs)


def apply_rope(
    q: torch.Tensor,
    k: torch.Tensor,
    cos: torch.Tensor,
    sin: torch.Tensor,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Apply split-half Rotary Position Embeddings cleanly (ONNX-traceable arithmetic).
    q shape: [B, Hq, T, D], k shape: [B, Hkv, T, D], cos/sin shape: [T, D // 2].
    """
    half = q.shape[-1] // 2
    cos_b = cos.unsqueeze(0).unsqueeze(0).to(dtype=q.dtype)  # [1, 1, T, D//2]
    sin_b = sin.unsqueeze(0).unsqueeze(0).to(dtype=q.dtype)

    q1, q2 = q[..., :half], q[..., half:]
    k1, k2 = k[..., :half], k[..., half:]

    q_rot = torch.cat([q1 * cos_b - q2 * sin_b, q2 * cos_b + q1 * sin_b], dim=-1)
    k_rot = torch.cat([k1 * cos_b - k2 * sin_b, k2 * cos_b + k1 * sin_b], dim=-1)
    return q_rot, k_rot


class CausalGQAttention(nn.Module):
    """Causal Grouped Query Attention with optional KV Cache for fast decoding."""

    def __init__(self, cfg: MasterAiV1Config):
        super().__init__()
        if cfg.d_model % cfg.n_heads != 0:
            raise ValueError(f"d_model ({cfg.d_model}) must be divisible by n_heads ({cfg.n_heads})")
        if cfg.n_heads % cfg.n_kv_heads != 0:
            raise ValueError(f"n_heads ({cfg.n_heads}) must be divisible by n_kv_heads ({cfg.n_kv_heads})")

        self.n_heads = cfg.n_heads
        self.n_kv_heads = cfg.n_kv_heads
        self.kv_repeat = cfg.n_heads // cfg.n_kv_heads
        self.head_dim = cfg.d_model // cfg.n_heads
        self.scale = 1.0 / math.sqrt(self.head_dim)
        self.pos_encoding = cfg.pos_encoding

        self.q_proj = nn.Linear(cfg.d_model, cfg.n_heads * self.head_dim, bias=False)
        self.k_proj = nn.Linear(cfg.d_model, cfg.n_kv_heads * self.head_dim, bias=False)
        self.v_proj = nn.Linear(cfg.d_model, cfg.n_kv_heads * self.head_dim, bias=False)
        self.o_proj = nn.Linear(cfg.n_heads * self.head_dim, cfg.d_model, bias=False)
        self.attn_dropout = nn.Dropout(cfg.dropout)
        self.resid_dropout = nn.Dropout(cfg.dropout)

    def forward(
        self,
        x: torch.Tensor,
        cos: Optional[torch.Tensor],
        sin: Optional[torch.Tensor],
        causal_mask: torch.Tensor,
        past_kv: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
        use_cache: bool = False,
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        bsz, seq_len, _ = x.shape

        q = self.q_proj(x).view(bsz, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(bsz, seq_len, self.n_kv_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(bsz, seq_len, self.n_kv_heads, self.head_dim).transpose(1, 2)

        if self.pos_encoding == "rope" and cos is not None and sin is not None:
            q, k = apply_rope(q, k, cos, sin)

        if past_kv is not None:
            prev_k, prev_v = past_kv
            k = torch.cat([prev_k, k], dim=2)
            v = torch.cat([prev_v, v], dim=2)

        present_kv = (k, v) if use_cache else None

        if self.kv_repeat > 1:
            k_full = k.unsqueeze(2).expand(bsz, self.n_kv_heads, self.kv_repeat, k.shape[2], self.head_dim)
            k_full = k_full.reshape(bsz, self.n_heads, k.shape[2], self.head_dim)
            v_full = v.unsqueeze(2).expand(bsz, self.n_kv_heads, self.kv_repeat, v.shape[2], self.head_dim)
            v_full = v_full.reshape(bsz, self.n_heads, v.shape[2], self.head_dim)
        else:
            k_full, v_full = k, v

        scores = torch.matmul(q, k_full.transpose(-2, -1)) * self.scale
        scores = scores + causal_mask

        probs = F.softmax(scores, dim=-1)
        probs = self.attn_dropout(probs)
        ctx = torch.matmul(probs, v_full)  # [B, H, Tq, D]
        ctx = ctx.transpose(1, 2).contiguous().view(bsz, seq_len, self.n_heads * self.head_dim)
        out = self.resid_dropout(self.o_proj(ctx))
        return out, present_kv


class SwiGLUFeedForward(nn.Module):
    """Original SwiGLU MLP: W_down(SiLU(W_gate(x)) * W_up(x))."""

    def __init__(self, cfg: MasterAiV1Config):
        super().__init__()
        self.w_gate = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.w_up = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.w_down = nn.Linear(cfg.d_ff, cfg.d_model, bias=False)
        self.dropout = nn.Dropout(cfg.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.dropout(self.w_down(F.silu(self.w_gate(x)) * self.w_up(x)))


class GeluFeedForward(nn.Module):
    """Standard GELU MLP retained strictly for controlled architecture ablation."""

    def __init__(self, cfg: MasterAiV1Config):
        super().__init__()
        self.w_in = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.w_out = nn.Linear(cfg.d_ff, cfg.d_model, bias=False)
        self.dropout = nn.Dropout(cfg.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.dropout(self.w_out(F.gelu(self.w_in(x))))


class TransformerBlockV1(nn.Module):
    def __init__(self, cfg: MasterAiV1Config):
        super().__init__()
        self.norm1 = make_norm(cfg.d_model, cfg.norm_type, cfg.norm_eps)
        self.attn = CausalGQAttention(cfg)
        self.norm2 = make_norm(cfg.d_model, cfg.norm_type, cfg.norm_eps)
        self.ffn = GeluFeedForward(cfg) if cfg.ffn_type == "gelu" else SwiGLUFeedForward(cfg)

    def forward(
        self,
        x: torch.Tensor,
        cos: Optional[torch.Tensor],
        sin: Optional[torch.Tensor],
        causal_mask: torch.Tensor,
        past_kv: Optional[Tuple[torch.Tensor, torch.Tensor]] = None,
        use_cache: bool = False,
    ) -> Tuple[torch.Tensor, Optional[Tuple[torch.Tensor, torch.Tensor]]]:
        attn_out, present_kv = self.attn(
            self.norm1(x), cos, sin, causal_mask, past_kv=past_kv, use_cache=use_cache
        )
        x = x + attn_out
        x = x + self.ffn(self.norm2(x))
        return x, present_kv


class MasterAiV1(nn.Module):
    """
    Original Upgraded MASTER AI CORE v1.0 Decoder-Only Language Model.
    """

    def __init__(self, cfg: MasterAiV1Config):
        super().__init__()
        self.cfg = cfg
        self.tok_emb = nn.Embedding(cfg.vocab_size, cfg.d_model)
        self.emb_dropout = nn.Dropout(cfg.dropout)

        if cfg.pos_encoding == "learned_abs":
            self.abs_pos_emb: Optional[nn.Embedding] = nn.Embedding(cfg.max_seq_len, cfg.d_model)
        else:
            self.abs_pos_emb = None

        self.layers = nn.ModuleList([TransformerBlockV1(cfg) for _ in range(cfg.n_layers)])
        self.final_norm = make_norm(cfg.d_model, cfg.norm_type, cfg.norm_eps)
        self.lm_head = nn.Linear(cfg.d_model, cfg.vocab_size, bias=False)

        if cfg.tie_weights:
            self.lm_head.weight = self.tok_emb.weight

        head_dim = cfg.d_model // cfg.n_heads
        cos_buf, sin_buf = build_rope_cache(cfg.max_seq_len, head_dim, cfg.rope_theta)
        self.register_buffer("rope_cos", cos_buf, persistent=False)
        self.register_buffer("rope_sin", sin_buf, persistent=False)

        self.apply(self._init_weights)
        # Depth-scaled residual projection initialization for stable deep convergence
        resid_std = 0.02 / math.sqrt(2.0 * cfg.n_layers)
        for name, p in self.named_parameters():
            if name.endswith(("o_proj.weight", "w_down.weight", "w_out.weight")):
                nn.init.normal_(p, mean=0.0, std=resid_std)

    @staticmethod
    def _init_weights(module: nn.Module) -> None:
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def count_parameters(self, trainable_only: bool = True) -> int:
        # Avoid double-counting tied lm_head/tok_emb weights
        seen = set()
        total = 0
        for p in self.parameters():
            if trainable_only and not p.requires_grad:
                continue
            pid = p.data_ptr()
            if pid not in seen:
                seen.add(pid)
                total += p.numel()
        return total

    def _build_causal_mask(
        self,
        q_len: int,
        k_len: int,
        offset: int,
        device: torch.device,
        dtype: torch.dtype,
    ) -> torch.Tensor:
        q_pos = torch.arange(offset, offset + q_len, device=device).unsqueeze(1)
        k_pos = torch.arange(k_len, device=device).unsqueeze(0)
        allowed = k_pos <= q_pos
        mask = torch.zeros((q_len, k_len), device=device, dtype=dtype)
        mask = mask.masked_fill(~allowed, -1e9)
        return mask.unsqueeze(0).unsqueeze(0)  # [1, 1, Tq, Tk]

    def forward_hidden(
        self,
        input_ids: torch.Tensor,
        past_kvs: Optional[List[Tuple[torch.Tensor, torch.Tensor]]] = None,
        use_cache: bool = False,
    ) -> Tuple[torch.Tensor, Optional[List[Tuple[torch.Tensor, torch.Tensor]]]]:
        bsz, seq_len = input_ids.shape
        offset = past_kvs[0][0].shape[2] if (past_kvs is not None and len(past_kvs) > 0) else 0
        total_len = offset + seq_len
        if total_len > self.cfg.max_seq_len:
            raise ValueError(f"Sequence length {total_len} exceeds max_seq_len={self.cfg.max_seq_len}")

        h = self.tok_emb(input_ids)
        if self.abs_pos_emb is not None:
            pos_ids = torch.arange(offset, total_len, device=input_ids.device).unsqueeze(0)
            h = h + self.abs_pos_emb(pos_ids)
        h = self.emb_dropout(h)

        cos = self.rope_cos[offset:total_len] if self.cfg.pos_encoding == "rope" else None
        sin = self.rope_sin[offset:total_len] if self.cfg.pos_encoding == "rope" else None
        causal_mask = self._build_causal_mask(seq_len, total_len, offset, input_ids.device, h.dtype)

        new_kvs: List[Tuple[torch.Tensor, torch.Tensor]] = []
        for idx, layer in enumerate(self.layers):
            layer_past = past_kvs[idx] if past_kvs is not None else None
            if self.cfg.use_grad_checkpoint and self.training and not use_cache:
                def custom_forward(hidden: torch.Tensor, l_mod: TransformerBlockV1 = layer) -> torch.Tensor:
                    out, _ = l_mod(hidden, cos, sin, causal_mask, past_kv=None, use_cache=False)
                    return out

                h = grad_checkpoint(custom_forward, h, use_reentrant=False)
                present = None
            else:
                h, present = layer(h, cos, sin, causal_mask, past_kv=layer_past, use_cache=use_cache)
            if use_cache and present is not None:
                new_kvs.append(present)

        return self.final_norm(h), (new_kvs if use_cache else None)

    def forward(
        self,
        input_ids: torch.Tensor,
        past_kvs: Optional[List[Tuple[torch.Tensor, torch.Tensor]]] = None,
        use_cache: bool = False,
    ) -> Tuple[torch.Tensor, Optional[List[Tuple[torch.Tensor, torch.Tensor]]]]:
        normed, new_kvs = self.forward_hidden(input_ids, past_kvs=past_kvs, use_cache=use_cache)
        logits = self.lm_head(normed)
        return logits, new_kvs

    @torch.no_grad()
    def generate(
        self,
        prompt_ids: List[int],
        max_new_tokens: int = 128,
        temperature: float = 0.7,
        top_k: int = 40,
        top_p: float = 0.9,
        repetition_penalty: float = 1.12,
        stop_token_ids: Optional[List[int]] = None,
        use_kv_cache: bool = True,
    ) -> List[int]:
        """Autoregressive generation with KV caching, top-k, top-p, and stop conditions."""
        self.eval()
        device = next(self.parameters()).device
        stops = set(stop_token_ids or [3, 10])  # EOS_ID=3, ENDTURN_ID=10
        seq = list(prompt_ids[-max(1, self.cfg.max_seq_len - 1) :])
        generated: List[int] = []

        past_kvs = None
        if use_kv_cache:
            inp = torch.tensor([seq], dtype=torch.long, device=device)
            logits, past_kvs = self.forward(inp, past_kvs=None, use_cache=True)
            next_logits = logits[0, -1, :]
        else:
            next_logits = None

        for _ in range(max_new_tokens):
            if len(seq) >= self.cfg.max_seq_len:
                break
            if not use_kv_cache or next_logits is None:
                inp = torch.tensor([seq[-self.cfg.max_seq_len :]], dtype=torch.long, device=device)
                logits, _ = self.forward(inp, past_kvs=None, use_cache=False)
                next_logits = logits[0, -1, :]

            # Apply mild repetition penalty over recent tokens
            scores = next_logits.clone()
            if repetition_penalty != 1.0:
                recent = set(seq[-64:])
                for tid in recent:
                    if scores[tid] > 0:
                        scores[tid] /= repetition_penalty
                    else:
                        scores[tid] *= repetition_penalty

            if temperature <= 0.0:
                next_id = int(torch.argmax(scores).item())
            else:
                scores = scores / max(1e-5, temperature)
                if top_k > 0 and top_k < scores.shape[0]:
                    kth = torch.topk(scores, top_k).values[-1]
                    scores = scores.masked_fill(scores < kth, -1e9)
                probs = F.softmax(scores, dim=-1)
                if 0.0 < top_p < 1.0:
                    sorted_probs, sorted_idx = torch.sort(probs, descending=True)
                    cum_probs = torch.cumsum(sorted_probs, dim=-1)
                    drop = cum_probs - sorted_probs > top_p
                    sorted_probs = sorted_probs.masked_fill(drop, 0.0)
                    sorted_probs = sorted_probs / sorted_probs.sum().clamp(min=1e-9)
                    sampled_idx = int(torch.multinomial(sorted_probs, num_samples=1).item())
                    next_id = int(sorted_idx[sampled_idx].item())
                else:
                    next_id = int(torch.multinomial(probs, num_samples=1).item())

            generated.append(next_id)
            seq.append(next_id)
            if next_id in stops:
                break

            if use_kv_cache:
                step_inp = torch.tensor([[next_id]], dtype=torch.long, device=device)
                logits, past_kvs = self.forward(step_inp, past_kvs=past_kvs, use_cache=True)
                next_logits = logits[0, -1, :]
            else:
                next_logits = None

        return generated


class MasterAiV1OnnxWrapper(nn.Module):
    """Clean stateless ONNX-export wrapper returning `[B, T, V]` logits."""

    def __init__(self, core: MasterAiV1):
        super().__init__()
        self.core = core

    def forward(self, input_ids: torch.Tensor) -> torch.Tensor:
        logits, _ = self.core(input_ids, past_kvs=None, use_cache=False)
        return logits


def memory_efficient_lm_loss_backward(
    model: MasterAiV1,
    x: torch.Tensor,
    y: torch.Tensor,
    ignore_index: int,
    grad_scale: float = 1.0,
    chunk_tokens: int = 32,
) -> float:
    """
    Exact chunked cross-entropy + backward pass reducing peak logits/softmax RAM ~16x
    without altering gradients (important for large-vocab training on low-commit CPU).
    """
    hidden, _ = model.forward_hidden(x, use_cache=False)
    valid = int((y != ignore_index).sum().item())
    if valid == 0:
        return 0.0
    h_det = hidden.detach().requires_grad_(True)
    tot_loss = 0.0
    V = model.cfg.vocab_size
    T = h_det.shape[1]
    for s in range(0, T, chunk_tokens):
        hc = h_det[:, s : s + chunk_tokens, :]
        yc = y[:, s : s + chunk_tokens]
        if int((yc != ignore_index).sum().item()) == 0:
            continue
        lc = model.lm_head(hc)
        loss_c = F.cross_entropy(lc.reshape(-1, V), yc.reshape(-1), ignore_index=ignore_index, reduction="sum")
        tot_loss += float(loss_c.item())
        (loss_c * (grad_scale / valid)).backward()
        del lc, loss_c
    if h_det.grad is not None:
        hidden.backward(h_det.grad)
    del hidden, h_det
    return tot_loss / valid
