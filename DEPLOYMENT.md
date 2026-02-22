# Akrizu RAG System — VPS Deployment Guide

Complete step-by-step guide for deploying the Akrizu Knowledge RAG system to a Linux VPS.

**Estimated Time**: 5-6 hours (including security hardening)  
**Difficulty**: Intermediate  
**Prerequisites**: Basic Linux and Docker knowledge

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Initial Setup](#vps-initial-setup)
3. [Install Required Software](#install-required-software)
4. [Security Hardening (Pre-Deployment)](#security-hardening-pre-deployment)
5. [Deploy Infrastructure (Qdrant + Ollama)](#deploy-infrastructure-qdrant--ollama)
6. [Deploy RAG Application](#deploy-rag-application)
7. [Configure Nginx Reverse Proxy](#configure-nginx-reverse-proxy)
8. [Setup SSL with Certbot](#setup-ssl-with-certbot)
9. [Initial Data Ingestion](#initial-data-ingestion)
10. [Verification & Testing](#verification--testing)
11. [Maintenance & Operations](#maintenance--operations)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- VPS with Ubuntu 22.04 LTS (2GB RAM minimum, 4GB recommended)
- Domain name (optional but recommended for SSL)
- SSH access to VPS
- Local copy of the Akrizu codebase

### VPS Providers (Recommended)
- **Hetzner**: $4-10/month (Best value, EU-based, excellent performance)
- **DigitalOcean**: $12-24/month ([referral link](https://m.do.co/c/your-referral))
- **Linode**: $12-24/month
- **AWS Lightsail**: $10-20/month
- **Vultr**: $12-24/month

### Local Requirements
- Git
- SSH client
- Text editor

---

## VPS Initial Setup

### 1. Create Non-Root User

```bash
# SSH into VPS as root
ssh root@your-vps-ip

# Create new user
adduser akrizu

# Add to sudo group
usermod -aG sudo akrizu

# Switch to new user
su - akrizu
```

### 2. Setup SSH Key Authentication

**On your local machine:**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to VPS
ssh-copy-id akrizu@your-vps-ip
```

**On VPS:**
```bash
# Test SSH key login
exit
ssh akrizu@your-vps-ip

# Disable password authentication (optional but recommended)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 3. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

---

## Install Required Software

### 1. Install Node.js 20.x

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 2. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
ssh akrizu@your-vps-ip
```

### 3. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 4. Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### 5. Install Certbot (for SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Security Hardening (Pre-Deployment)

### 1. Fix NPM Vulnerabilities

**On your local machine:**
```bash
cd /path/to/senior-dev-agent/rag
npm audit fix
git add package-lock.json
git commit -m "fix: resolve npm security vulnerabilities"
git push
```

### 2. Add API Authentication

Create `rag/src/middleware/auth.mjs`:
```javascript
/**
 * API Key Authentication Middleware
 */
export function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKeys = process.env.API_KEYS?.split(',') || [];
  
  if (!apiKey || !validKeys.includes(apiKey)) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid API key required in X-API-Key header'
    });
  }
  next();
}
```

Update `rag/src/server.mjs`:
```javascript
import { validateApiKey } from './middleware/auth.mjs';

// Add auth to protected endpoints
app.use('/search/*', validateApiKey);
app.use('/context', validateApiKey);
app.post('/memory/save', validateApiKey);
```

### 3. Add Rate Limiting

```bash
cd rag
npm install express-rate-limit
```

Create `rag/src/middleware/rateLimiter.mjs`:
```javascript
import rateLimit from 'express-rate-limit';

export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const contextLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});
```

Update `rag/src/server.mjs`:
```javascript
import { searchLimiter, contextLimiter } from './middleware/rateLimiter.mjs';

app.use('/search/*', searchLimiter);
app.use('/context', contextLimiter);
```

### 4. Restrict CORS

Update `rag/src/server.mjs`:
```javascript
// Replace the open CORS with:
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
```

### 5. Add Input Validation

```bash
cd rag
npm install zod
```

Create `rag/src/validation/schemas.mjs`:
```javascript
import { z } from 'zod';

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
  category: z.enum(['rule', 'workflow', 'template', 'memory']).optional(),
});

export const contextSchema = z.object({
  task: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(10).optional(),
});
```

Update controllers to use validation (example for `searchController.mjs`):
```javascript
import { searchSchema } from '../validation/schemas.mjs';

export async function searchText(req, res) {
  try {
    const validated = searchSchema.parse(req.body);
    // ... rest of logic
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request', details: err.errors });
    }
    // ... rest of error handling
  }
}
```

**Commit and push all security changes:**
```bash
git add .
git commit -m "feat: add authentication, rate limiting, and input validation"
git push
```

---

## Deploy Infrastructure (Qdrant + Ollama)

### 1. Setup Firewall

```bash
# On VPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 2. Deploy Qdrant (Docker)

```bash
# Create directory for Qdrant data
mkdir -p ~/akrizu/qdrant-data

# Create docker-compose.yml
nano ~/akrizu/docker-compose.yml
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    restart: unless-stopped
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant-data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
```

**Start Qdrant:**
```bash
cd ~/akrizu
docker-compose up -d

# Verify
docker ps
curl http://localhost:6333/
```

### 3. Install Ollama (Native)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
sudo systemctl start ollama
sudo systemctl enable ollama

# Pull embedding model
ollama pull nomic-embed-text

# Verify
curl http://localhost:11434/api/tags
```

---

## Deploy RAG Application

### 1. Clone Repository

```bash
cd ~
git clone https://github.com/your-username/senior-dev-agent.git
cd senior-dev-agent/rag
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
nano .env
```

**.env file:**
```bash
# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=senior_dev_mind
VECTOR_SIZE=768

# Embedding
EMBEDDING_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text

# Groq (for compression and fallback)
GROQ_API_KEY=your_groq_api_key_here

# Server
RAG_SERVER_PORT=6444

# Security
API_KEYS=your-secret-api-key-1,your-secret-api-key-2
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Knowledge Base
KNOWLEDGE_BASE_PATH=../.agent
```

**Generate secure API keys:**
```bash
# Generate random API keys
openssl rand -hex 32  # Use this for API_KEYS
```

### 4. Create PM2 Ecosystem File

```bash
nano ecosystem.config.cjs
```

**ecosystem.config.cjs:**
```javascript
module.exports = {
  apps: [
    {
      name: 'akrizu-gateway',
      script: './src/server.mjs',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'akrizu-sync',
      script: './src/sync.mjs',
      args: '--watch',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/sync-error.log',
      out_file: './logs/sync-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### 5. Create Log Directory

```bash
mkdir -p logs
```

### 6. Start Services with PM2

```bash
# Start all services
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (run with sudo)

# Check status
pm2 status
pm2 logs
```

---

## Configure Nginx Reverse Proxy

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/akrizu
```

**/etc/nginx/sites-available/akrizu:**
```nginx
server {
    listen 80;
    server_name rag.yourdomain.com;  # Replace with your domain

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=rag_limit:10m rate=10r/s;
    limit_req zone=rag_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:6444;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### 2. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/akrizu /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Setup SSL with Certbot

### 1. Obtain SSL Certificate

```bash
sudo certbot --nginx -d rag.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

### 2. Verify SSL

```bash
# Check certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

### 3. Setup Auto-Renewal

Certbot automatically creates a systemd timer. Verify:
```bash
sudo systemctl status certbot.timer
```

---

## Initial Data Ingestion

### 1. Ingest Knowledge Base

```bash
cd ~/senior-dev-agent/rag

# Check system status
npm run status

# Ingest all knowledge
npm run ingest
```

**Expected output:**
```
📂 Found 55 markdown files in knowledge base
✂️  Chunked into 364 sections across 55 files
🔮 Embedding 364 chunks...
   ✅ Embedded: 364/364
📤 Upserting 364 points...
✅ Sync complete — 364 points in "senior_dev_mind"
```

### 2. Verify Ingestion

```bash
# Check collection stats
npm run query -- "test query"

# Or via API
curl https://rag.yourdomain.com/stats \
  -H "X-API-Key: your-secret-api-key-1"
```

---

## Verification & Testing

### 1. Health Check

```bash
curl https://rag.yourdomain.com/health \
  -H "X-API-Key: your-secret-api-key-1"
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-22T12:00:00.000Z",
  "uptime": 3600
}
```

### 2. Test Search Endpoint

```bash
curl -X POST https://rag.yourdomain.com/search/text \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-1" \
  -d '{
    "query": "How do I build an MVP?",
    "limit": 3
  }'
```

### 3. Test Context Endpoint

```bash
curl -X POST https://rag.yourdomain.com/context \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-1" \
  -d '{
    "task": "Create a booking API endpoint",
    "limit": 5
  }'
```

### 4. Test Rate Limiting

```bash
# Run this multiple times quickly
for i in {1..110}; do
  curl https://rag.yourdomain.com/health \
    -H "X-API-Key: your-secret-api-key-1"
done
```

**Expected**: After 100 requests, you should see:
```json
{"error": "Too many requests, please try again later."}
```

### 5. Test Authentication

```bash
# Without API key (should fail)
curl https://rag.yourdomain.com/search/text \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Expected:**
```json
{
  "error": "Unauthorized",
  "message": "Valid API key required in X-API-Key header"
}
```

### 6. Run E2E Tests

**On your local machine:**
```bash
cd /path/to/senior-dev-agent/akrizu-knowledge

# Update BASE_URL in scripts/e2e-comprehensive-test.mjs
# Change: const BASE_URL = "http://localhost:6444";
# To: const BASE_URL = "https://rag.yourdomain.com";

# Add API key header to fetch calls
# Add: headers: { "X-API-Key": "your-secret-api-key-1" }

# Run tests
node scripts/e2e-comprehensive-test.mjs
```

---

## Maintenance & Operations

### 1. Monitoring

**Check PM2 status:**
```bash
pm2 status
pm2 logs akrizu-gateway --lines 50
pm2 logs akrizu-sync --lines 50
```

**Check Nginx logs:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Check Docker containers:**
```bash
docker ps
docker logs qdrant
```

### 2. Backup Qdrant Data

**Manual backup:**
```bash
# Stop Qdrant
cd ~/akrizu
docker-compose stop qdrant

# Backup data
tar -czf qdrant-backup-$(date +%Y%m%d).tar.gz qdrant-data/

# Restart Qdrant
docker-compose start qdrant
```

**Automated daily backup (cron):**
```bash
crontab -e
```

Add:
```cron
0 2 * * * cd ~/akrizu && tar -czf ~/backups/qdrant-$(date +\%Y\%m\%d).tar.gz qdrant-data/ && find ~/backups -name "qdrant-*.tar.gz" -mtime +7 -delete
```

### 3. Update Application

```bash
cd ~/senior-dev-agent
git pull

cd rag
npm install

# Restart services
pm2 restart all
```

### 4. Re-ingest Knowledge Base

```bash
cd ~/senior-dev-agent/rag
npm run sync
```

### 5. Log Rotation

PM2 handles log rotation automatically. Configure in `ecosystem.config.cjs`:
```javascript
log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
max_memory_restart: '500M',
```

---

## Troubleshooting

### Issue: Port 6444 Already in Use

```bash
# Find process using port
sudo lsof -i :6444

# Kill process
sudo kill -9 <PID>

# Or restart PM2
pm2 restart all
```

### Issue: Qdrant Not Accessible

```bash
# Check Docker status
docker ps

# Check logs
docker logs qdrant

# Restart Qdrant
cd ~/akrizu
docker-compose restart qdrant
```

### Issue: Ollama Not Responding

```bash
# Check Ollama status
sudo systemctl status ollama

# Restart Ollama
sudo systemctl restart ollama

# Check logs
sudo journalctl -u ollama -f
```

### Issue: SSL Certificate Renewal Failed

```bash
# Check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Manual renewal
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Issue: High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart specific app
pm2 restart akrizu-gateway

# Or restart all
pm2 restart all
```

### Issue: 502 Bad Gateway

```bash
# Check if RAG server is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
sudo systemctl reload nginx
```

---

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] Password authentication disabled
- [ ] Firewall (UFW) configured
- [ ] API authentication implemented
- [ ] Rate limiting enabled
- [ ] CORS restricted to specific domains
- [ ] Input validation with Zod
- [ ] SSL/TLS certificate installed
- [ ] Security headers configured in Nginx
- [ ] NPM vulnerabilities fixed
- [ ] Regular backups scheduled
- [ ] Log monitoring setup

---

## Quick Reference

### Essential Commands

```bash
# PM2
pm2 status                    # Check all services
pm2 logs                      # View all logs
pm2 restart all               # Restart all services
pm2 stop all                  # Stop all services
pm2 delete all                # Remove all services

# Docker
docker ps                     # List containers
docker logs qdrant            # View Qdrant logs
docker-compose restart        # Restart all containers

# Nginx
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload Nginx
sudo systemctl status nginx   # Check Nginx status

# Certbot
sudo certbot renew            # Renew SSL certificate
sudo certbot certificates     # List certificates

# System
sudo ufw status               # Check firewall
htop                          # Monitor resources
df -h                         # Check disk space
```

### API Endpoints

- **Health**: `GET /health`
- **Stats**: `GET /stats`
- **Search**: `POST /search/text`
- **Context**: `POST /context`
- **Memory**: `POST /memory/save`

All endpoints require `X-API-Key` header.

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-username/senior-dev-agent/issues
- Documentation: See `rag/GUIDE.md` and `rag/README.md`

---

**Last Updated**: 2026-02-22  
**Version**: 1.0.0
