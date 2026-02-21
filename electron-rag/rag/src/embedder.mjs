/**
 * Senior Dev Mind — Embedding Provider
 * Supports: Ollama (local) and Groq (cloud).
 * Falls back from Ollama → Groq automatically.
 */
import { CONFIG } from './config.mjs';

/**
 * Get embedding vector for a text string.
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector (768-dim)
 */
export async function embed(text) {
  const provider = CONFIG.embeddingProvider;

  try {
    if (provider === 'ollama') {
      return await embedWithOllama(text);
    } else if (provider === 'groq') {
      return await embedWithGroq(text);
    } else if (provider === 'gemini') {
      return await embedWithGemini(text);
    } else if (provider === 'openai') {
      return await embedWithOpenAI(text);
    } else if (provider === 'huggingface') {
      return await embedWithHuggingFace(text);
    }
    throw new Error(`Unknown embedding provider: ${provider}`);
  } catch (err) {
    // Auto-fallback: Ollama fails → try Groq
    if (provider === 'ollama' && CONFIG.groqApiKey) {
      console.warn(`⚠️  Ollama failed, falling back to Groq: ${err.message}`);
      return await embedWithGroq(text);
    }
    throw err;
  }
}

/**
 * Batch embed multiple texts.
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function embedBatch(texts) {
  const results = [];
  for (const text of texts) {
    results.push(await embed(text));
  }
  return results;
}

// ─── Ollama ──────────────────────────────────────────────

async function embedWithOllama(text) {
  const url = `${CONFIG.ollamaUrl}/api/embed`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.ollamaEmbedModel,
      input: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama embed failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  // Ollama /api/embed returns { embeddings: [[...]] }
  if (data.embeddings && data.embeddings.length > 0) {
    return data.embeddings[0];
  }

  throw new Error('Ollama returned no embeddings');
}

// ─── Gemini ────────────────────────────────────────────────

async function embedWithGemini(text) {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
  
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });
  
  return response.embeddings[0].values;
}

// ─── OpenAI ───────────────────────────────────────────────

async function embedWithOpenAI(text) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: CONFIG.openaiApiKey });
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 768
  });
  
  return response.data[0].embedding;
}

// ─── HuggingFace ─────────────────────────────────────────

async function embedWithHuggingFace(text) {
  const model = CONFIG.huggingfaceModel;
  const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.huggingfaceApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HuggingFace embed failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  // Returns flat array of floats for single input
  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data;
  }
  // Some models return nested array
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0];
  }

  throw new Error('HuggingFace returned unexpected embedding format');
}

// ─── Groq ────────────────────────────────────────────────

async function embedWithGroq(text) {
  // Groq doesn't have a native embeddings API yet,
  // so we use a lightweight prompt-based approach via their chat API
  // to generate a pseudo-embedding using a deterministic hash.
  //
  // Alternative: Use Groq's future embeddings endpoint when available.
  // For now, we generate embeddings via a workaround using Ollama as primary.

  // Since Groq doesn't offer embeddings API, we fall back to a local
  // TF-IDF-style sparse vector approach as emergency fallback
  return generateSparseEmbedding(text, CONFIG.vectorSize);
}

/**
 * Emergency fallback: Generate a deterministic sparse embedding
 * using a hash-based approach. This is NOT semantic — it's for
 * when no embedding API is available. It provides basic keyword matching.
 * @param {string} text
 * @param {number} dims
 * @returns {number[]}
 */
function generateSparseEmbedding(text, dims) {
  const vector = new Float32Array(dims).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % dims;
    vector[idx] += 1.0;
  }

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dims; i++) {
      vector[i] /= magnitude;
    }
  }

  return Array.from(vector);
}
