/**
 * Senior Dev Mind — Document Chunker
 * Reads .md files from the knowledge base, splits by ## sections,
 * and attaches rich metadata (tags, category, priority, source).
 */
import { readFileSync, statSync } from 'fs';
import { basename, dirname, relative, extname } from 'path';
import { glob } from 'glob';
import { CONFIG } from './config.mjs';

// ─── Category Detection ─────────────────────────────────

const CATEGORY_MAP = {
  'rules': 'rule',
  'workflows': 'workflow',
  'template': 'template',
};

function detectCategory(filePath) {
  const rel = relative(CONFIG.knowledgeBasePath, filePath).replace(/\\/g, '/');
  for (const [folder, category] of Object.entries(CATEGORY_MAP)) {
    if (rel.startsWith(folder)) return category;
  }
  return 'memory';
}

// ─── Tag Detection (Keyword-Based) ──────────────────────

const TAG_KEYWORDS = {
  backend: ['api', 'endpoint', 'server', 'route', 'controller', 'nestjs', 'express'],
  frontend: ['ui', 'component', 'jsx', 'tsx', 'css', 'tailwind', 'shadcn', 'react', 'next.js', 'nextjs'],
  api: ['rest', 'fetch', 'axios', 'http', 'crud', 'get', 'post', 'put', 'delete', 'endpoint'],
  auth: ['nextauth', 'login', 'session', 'token', 'jwt', 'middleware', 'auth', 'password'],
  database: ['mongodb', 'mongoose', 'schema', 'collection', 'query', 'index', 'atlas'],
  debugging: ['debug', 'trace', 'error', 'fix', 'bug', 'troubleshoot', 'log', 'issue'],
  mvvm: ['mvvm', 'viewmodel', 'model', 'view', 'presentation', 'separation'],
  redux: ['redux', 'slice', 'store', 'dispatch', 'action', 'reducer', 'toolkit'],
  testing: ['test', 'lint', 'build', 'verify', 'validate', 'jest', 'vitest'],
  security: ['security', 'pci', 'encryption', 'xss', 'csrf', 'cors', 'sanitize', 'rate limit'],
  admin: ['admin', 'dashboard', 'sidebar', 'table', 'manage'],
  booking: ['booking', 'event', 'reservation', 'schedule', 'calendar'],
  performance: ['performance', 'lazy', 'dynamic import', 'optimization', 'cache', 'ssr', 'server component'],
  ui_ux: ['glassmorphism', 'animation', 'framer', 'hover', 'micro-interaction', 'responsive', 'premium'],
  structure: ['folder', 'directory', 'structure', 'organization', 'architecture', 'project-structure'],
  scalability: ['scalability', 'scale', 'growth', 'modular', 'barrel', 'dry', '3-use'],
};

function detectTags(content) {
  const lower = content.toLowerCase();
  const tags = new Set();
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        tags.add(tag);
        break;
      }
    }
  }
  return [...tags];
}

// ─── Priority Detection ─────────────────────────────────

function detectPriority(content, category) {
  const lower = content.toLowerCase();
  if (lower.includes('critical') || lower.includes('hard rule') || lower.includes('must') || lower.includes('mandatory')) {
    return 'critical';
  }
  if (lower.includes('important') || lower.includes('required') || lower.includes('should')) {
    return 'high';
  }
  if (category === 'template') return 'medium';
  return 'normal';
}

// ─── Section Splitter ────────────────────────────────────

/**
 * Split a markdown file into chunks by ## headers.
 * Each chunk includes the parent # header for context.
 * @param {string} content - Full markdown content
 * @param {string} filePath - Source file path
 * @returns {Array<{section: string, content: string, lineStart: number}>}
 */
function splitBySection(content, filePath) {
  const lines = content.split('\n');
  const chunks = [];
  let currentH1 = basename(filePath, extname(filePath));
  let currentSection = 'Introduction';
  let currentLines = [];
  let lineStart = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip YAML frontmatter
    if (i === 0 && line.trim() === '---') {
      const endIdx = lines.indexOf('---', 1);
      if (endIdx > 0) {
        i = endIdx;
        continue;
      }
    }

    // Detect # headers (top-level title)
    if (line.match(/^# /)) {
      currentH1 = line.replace(/^# /, '').trim();
      continue;
    }

    // Detect ## headers (section split point)
    if (line.match(/^## /)) {
      // Save previous chunk
      if (currentLines.length > 0) {
        const text = currentLines.join('\n').trim();
        if (text.length > 30) { // Skip tiny fragments
          chunks.push({
            section: currentSection,
            content: `# ${currentH1}\n## ${currentSection}\n${text}`,
            lineStart,
          });
        }
      }
      currentSection = line.replace(/^## /, '').trim();
      currentLines = [];
      lineStart = i + 1;
      continue;
    }

    currentLines.push(line);
  }

  // Push last chunk
  if (currentLines.length > 0) {
    const text = currentLines.join('\n').trim();
    if (text.length > 30) {
      chunks.push({
        section: currentSection,
        content: `# ${currentH1}\n## ${currentSection}\n${text}`,
        lineStart,
      });
    }
  }

  // If no sections found, return entire file as one chunk
  if (chunks.length === 0 && content.trim().length > 30) {
    chunks.push({
      section: 'Full Document',
      content: content.trim(),
      lineStart: 1,
    });
  }

  return chunks;
}

// ─── Main Chunking Pipeline ──────────────────────────────

/**
 * Scan the knowledge base and produce tagged chunks ready for embedding.
 * @returns {Array<{id: string, content: string, metadata: object}>}
 */
export async function chunkKnowledgeBase() {
  const basePath = CONFIG.knowledgeBasePath.replace(/\\/g, '/');
  const pattern = `${basePath}/**/*.md`;

  const files = await glob(pattern, { nodir: true, windowsPathsNoEscape: true });

  console.log(`📂 Found ${files.length} markdown files in knowledge base`);

  const allChunks = [];
  let chunkId = 0;

  for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const relPath = relative(CONFIG.knowledgeBasePath, normalizedPath).replace(/\\/g, '/');
    const content = readFileSync(normalizedPath, 'utf-8');
    const category = detectCategory(normalizedPath);
    const stat = statSync(normalizedPath);

    const sections = splitBySection(content, normalizedPath);

    for (const section of sections) {
      const tags = detectTags(section.content);
      const priority = detectPriority(section.content, category);

      allChunks.push({
        id: `chunk-${chunkId++}`,
        content: section.content,
        metadata: {
          source_file: relPath,
          section: section.section,
          category,
          tags,
          priority,
          line_start: section.lineStart,
          file_size: stat.size,
          last_modified: stat.mtime.toISOString(),
          char_count: section.content.length,
        },
      });
    }
  }

  console.log(`✂️  Chunked into ${allChunks.length} sections across ${files.length} files`);
  return allChunks;
}
