# 🧠 The Senior Dev Mind: Fine-Tuning Handbook

This document serves as the official blueprint for "baking" the Senior Developer Identity into a Large Language Model.

---

## 🏗️ 1. The Strategy: Weights over Context
Instead of relying on a long system prompt that gets truncated or ignored over time (Context Drift), we use **Supervised Fine-Tuning (SFT)**. 
- **The Goal**: Native adherence to the "Verification Wall," "Identity Audit," and "300-Line Limit."
- **The Base**: Llama-3 8B (Ideal balance of intelligence and local performance).
- **The Tool**: Unsloth (LoRA/QLoRA) — Optimized for 2x faster training.

---

## 📊 2. Data Architecture
The model is trained on the dataset located at `.agent/fine-tuning-file.json`.

| Data Source | Purpose | Example Pattern |
| :--- | :--- | :--- |
| `rules/*.md` | The Laws | "Never exceed 300 lines of code." |
| `memory/corrections.md` | "The Sins" | "Fixing the doubled bracket syntax error." |
| `workflows/*.md` | Automation Logic | "How to execute the `create-feature` flow." |
| `memory/logs.md` | Record Stewardship | "Log formatting and changelog standards." |

---

## 🛠️ 3. Execution Pipeline (The Colab Path)

### Phase A: Setup & Environment
1.  Open a new Google Colab notebook.
2.  **Runtime Settings**: Set to **Python 3** with **T4 GPU** (Hardware Accelerator).
3.  **Upload**: Drag `fine-tuning-file.json` into the Files sidebar.

### Phase B: Installation (The Robust Script)
The manual installation of xformers often fails due to CUDA version mismatches. Use the auto-detecting Unsloth installer:
```python
!pip install --upgrade pip
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps "trl<0.9.0" peft accelerate bitsandbytes
```

### Phase C: The Training Loop
We use **Alpaca Format** for the instructions. The model runs for **60 steps**, which is optimized for our current ~133 instruction pairs.
- **Learning Rate**: 2e-4
- **Optim**: AdamW 8bit (Saves memory)
- **Batch Size**: 2 (with 4 gradient accumulation steps)

---

## 💾 4. Deployment: Ollama Integration

### 1. The GGUF Export
Once training finishes in Colab, run the export command:
```python
model.save_pretrained_gguf("model_gguf", tokenizer, quantization_method = "q4_k_m")
```
Download the resulting `unsloth.Q4_K_M.gguf` file.

### 2. The Modelfile
Locally, create a file named `Modelfile`:
```dockerfile
FROM ./unsloth.Q4_K_M.gguf

SYSTEM """
You are Antigravity, the Senior Developer Mind.
You MUST follow the Identity Audit (Step 0) at the start of every response.
You MUST enforce the 300-line limit and the Verification Wall.
Your tone is professional, meticulous, and process-oriented.
"""

PARAMETER stop "<|end_of_text|>"
PARAMETER stop "### Instruction:"
```

### 3. Creation
Run the command:
`ollama create senior-dev -f Modelfile`

---

## 🚨 5. Recovery & Troubleshooting

### ❌ Error: "Failed building wheel for xformers"
- **Cause**: Version mismatch between xformers and Colab's PyTorch.
- **Fix**: Re-run the installation without the version pin (as shown in Phase B).

### ❌ Error: "Out of Memory (OOM)"
- **Cause**: Batch size too high for T4 GPU (16GB RAM).
- **Fix**: Reduce `per_device_train_batch_size` to `1`.

---

## ✅ Verification Checklist
- [ ] 133 Instruction pairs parsed.
- [ ] Training Loss starts ~2.5, ends <1.0.
- [ ] GGUF Exported successfully.
- [ ] Model verified to follow "Step 0 Identity Audit" natively.
