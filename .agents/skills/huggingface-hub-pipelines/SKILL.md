---
name: huggingface-hub-pipelines
description: Hugging Face Hub integration, Transformers inference optimization, PEFT/LoRA fine-tuning, and quantized model deployment.
---

# Hugging Face Hub, Transformers & PEFT Fine-Tuning

## Overview
Authoring and deploying open-weights AI models using Hugging Face's ecosystem: `transformers`, `accelerate`, `peft` (LoRA), `bitsandbytes`, and `datasets`. Covers low-latency inference pipelines, 4-bit/8-bit quantization, and model registry governance.

## Architecture
- **Model Ingestion**: Load models via `from_pretrained()` with automatic device mapping (`device_map="auto"`).
- **Quantization**: Reduce VRAM footprint using BitsAndBytes NF4 / FP4 quantization.
- **Parameter-Efficient Tuning (PEFT)**: Train low-rank adapters (LoRA/QLoRA) on frozen base models.
- **Streaming Datasets**: Stream gigabyte-scale datasets without loading entire datasets into memory.

## Implementation Patterns

### 1. 4-Bit Quantized Text Generation Pipeline
```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, pipeline

MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3"

# 4-bit NF4 Quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.bfloat16,
)

generator = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=256,
    temperature=0.2,
    repetition_penalty=1.1,
)

def generate_explanation(prompt: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    formatted_prompt = tokenizer.apply_chat_template(messages, tokenize=False)
    results = generator(formatted_prompt)
    return results[0]["generated_text"]
```

### 2. LoRA Fine-Tuning Adapter Configuration
```python
from peft import LoraConfig, get_peft_model, TaskType

lora_config = LoraConfig(
    r=16,                         # Rank
    lora_alpha=32,                # Scaling factor
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

peft_model = get_peft_model(model, lora_config)
peft_model.print_trainable_parameters()
# Output: trainable params: ~0.15% of total parameters
```

## Best Practices & Resource Hygiene
- **Always specify `device_map="auto"`**: Prevents manual CUDA allocation errors across multi-GPU setups.
- **Set `trust_remote_code=False`**: Avoid executing arbitrary remote code unless explicitly audited and trusted.
- **Dataset Streaming**: Use `load_dataset('...', streaming=True)` for datasets larger than system RAM.\n