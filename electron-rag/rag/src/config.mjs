/**
 * Senior Dev Mind — Configuration Loader
 * Loads .env and provides typed config with validation.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

export const CONFIG = {
  // Qdrant
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY || '',
  collection: process.env.QDRANT_COLLECTION || 'senior_dev_mind',
  vectorSize: parseInt(process.env.VECTOR_SIZE || '768', 10),

  // Embedding
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'ollama',

  // Ollama
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',

  // Groq
  groqApiKey: process.env.GROQ_API_KEY || '',

  // Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // HuggingFace
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  huggingfaceModel: process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',

  // Knowledge Base
  knowledgeBasePath: resolve(__dirname, '..', process.env.KNOWLEDGE_BASE_PATH || '../.agent'),

  // Server
  serverPort: parseInt(process.env.RAG_SERVER_PORT || '6444', 10),
};

/** Validate critical config */
export function validateConfig() {
  const errors = [];
  if (!CONFIG.qdrantUrl) errors.push('QDRANT_URL is required');
  if (!CONFIG.collection) errors.push('QDRANT_COLLECTION is required');
  if (CONFIG.embeddingProvider === 'groq' && !CONFIG.groqApiKey) {
    errors.push('GROQ_API_KEY is required when using Groq provider');
  }
  if (CONFIG.embeddingProvider === 'gemini' && !CONFIG.geminiApiKey) {
    errors.push('GEMINI_API_KEY is required when using Gemini provider');
  }
  if (CONFIG.embeddingProvider === 'openai' && !CONFIG.openaiApiKey) {
    errors.push('OPENAI_API_KEY is required when using OpenAI provider');
  }
  if (CONFIG.embeddingProvider === 'huggingface' && !CONFIG.huggingfaceApiKey) {
    errors.push('HUGGINGFACE_API_KEY is required when using HuggingFace provider');
  }
  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }
  return true;
}
