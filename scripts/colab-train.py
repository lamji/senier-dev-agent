# 🧠 Senior Dev Mind — Google Colab Fine-Tuning Script
# 🚀 Powered by Unsloth (https://github.com/unslothai/unsloth)

# --- STEP 1: INSTALL UNSLOTH (Run this in the first cell) ---
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# !pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes

import json
from unsloth import FastLanguageModel
import torch
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import Dataset

# --- CONFIGURATION ---
max_seq_length = 2048 # Supports RoPE scaling automatically
dtype = None # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
load_in_4bit = True # Use 4bit quantization to reduce memory usage

# 1. Load the Model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3-8b-bnb-4bit", # You can change to "unsloth/mistral-7b-v0.3-bnb-4bit"
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 2. Add LoRA Adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth", # 4x longer contexts
    random_state = 3407,
)

# --- STEP 2: LOAD THE DATA ---
# IMPORTANT: Upload 'fine-tuning-file.json' to Colab before running this.
with open("fine-tuning-file.json", "r") as f:
    raw_data = json.load(f)

# Instruction Prompt Template (Standard Alpaca format)
alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, input, output) + EOS_TOKEN
        texts.append(text)
    return { "text" : texts, }

dataset = Dataset.from_list(raw_data)
dataset = dataset.map(formatting_prompts_func, batched = True,)

# --- STEP 3: TRAIN THE BRAIN ---
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Small dataset (133 pairs), 60 steps is usually enough for a proof of concept
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer.train()

# --- STEP 4: EXPORT FOR OLLAMA (GGUF) ---
# This will save the model in GGUF format which you can download and use in Ollama
model.save_pretrained_gguf("model_gguf", tokenizer, quantization_method = "q4_k_m")
print("✅ Training Complete! Download 'model_gguf/unsloth.Q4_K_M.gguf' from the files sidebar.")
