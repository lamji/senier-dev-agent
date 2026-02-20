# Troubleshooting Guide (Critical Reference)

This document is the **first stop** when debugging runtime, connection, or process issues.
All AI models MUST consult this file BEFORE attempting any fix independently.

---

## 1. Zombie Process & Port Blocking

### Symptom
- `Port 3000 is in use by process <PID>`
- `Unable to acquire lock at .next/dev/lock`
- `npm run dev` starts on port 3001 instead of 3000

### Root Cause
A previous AI session or crashed terminal left a `node` process running. Next.js also creates a `.next/dev/lock` file that persists after unclean shutdowns.

### Fix (PowerShell — Step by Step)

**Step 1: Identify blocking process**
```powershell
# Find anything on port 3000
netstat -ano | findstr "LISTENING" | findstr ":3000"
```
Note the PID from the last column.

**Step 2: Kill the specific process**
```powershell
Stop-Process -Id <PID> -Force
```

**Step 3: Kill ALL node/npm processes (Nuclear Option)**
```powershell
Get-Process -IncludeUserName | Where-Object { $_.ProcessName -match "node|npm" } | Stop-Process -Force -ErrorAction SilentlyContinue
```

**Step 4: CMD fallback (if PowerShell fails)**
```cmd
taskkill /F /IM node.exe /T
```

**Step 5: Delete the Next.js dev lock file**
```powershell
Remove-Item -Path "<project-root>/.next/dev/lock" -Force -ErrorAction SilentlyContinue
```

### Prevention
- AI must **NEVER** run `npm run dev`. Only the USER starts the dev server.
- AI is only allowed to run: `npm run lint`, `npm run build`, `npm run test:api`.

---

## 2. MongoDB Atlas Connection Failure (ECONNREFUSED / SRV Lookup)

### Symptom
- `querySrv ECONNREFUSED _mongodb._tcp.cluster0.xxxxx.mongodb.net`
- All API routes returning `500 Internal Server Error`
- Connection string works in **MongoDB Compass** but fails in **Node.js / Mongoose**

### Root Cause
`mongodb+srv://` requires DNS SRV record resolution. Node.js uses the OS DNS resolver, which on many **Windows** networks fails to resolve SRV records (e.g., `_mongodb._tcp.cluster0.xxxxx.mongodb.net`). MongoDB Compass works because it uses its own DNS resolution stack, not the OS one.

**Key insights**:
- `family: 4` does NOT fix this — it only affects TCP sockets, not DNS SRV lookups.
- `dns.setServers()` does NOT fix this — the MongoDB driver uses its own internal DNS resolution path.
- The ONLY reliable fix is to **bypass SRV entirely** by using a standard `mongodb://` connection string.

### Fix
Run the diagnostic script which auto-resolves SRV via Google DNS and updates `.env.local`:
```bash
npm run diagnose:mongo
```

This script:
1. Resolves the SRV record using Google DNS (8.8.8.8) to get the actual shard hostnames
2. Resolves the TXT record to get `replicaSet` and `authSource` params
3. Builds a standard `mongodb://` connection string with all 3 shards
4. Tests the connection with Mongoose
5. Auto-updates `.env.local` if successful

### What the standard URI looks like
```
mongodb://user:pass@shard-00.host:27017,shard-01.host:27017,shard-02.host:27017/dbname?ssl=true&authSource=admin&replicaSet=atlas-xxxxx-shard-0
```

### Common 500 Error Scenario
If the API returns `[API] Server error` (Status 500), check the server terminal logs:
- `querySrv ECONNREFUSED _mongodb._tcp.cluster0...` = **DNS SRV resolution failure** → Run `npm run diagnose:mongo`.
- `ECONNREFUSED 127.0.0.1:27017` = No local MongoDB running and no `MONGODB_URI` in `.env.local`.
- `authentication failed` = Wrong username/password in the connection string.
- `authSource cannot appear more than once` = Duplicate query params in URI → Re-run `npm run diagnose:mongo`.

### Key Rule
**NEVER blame MongoDB Atlas** if the connection string is confirmed working in Compass.
The issue is always in the Node.js runtime environment. Check DNS resolution first.

---

## 3. NextAuth Configuration Error

### Symptom
- Browser redirects to `/api/auth/error?error=Configuration`
- Page shows: "There is a problem with the server configuration."

### Root Cause
`NEXTAUTH_SECRET` environment variable is missing. This happens when:
- `.env.local` file does not exist (only `.env.example` exists)
- The variable name is misspelled
- The file has encoding issues

### Fix
Ensure `.env.local` exists at the project root with:
```env
NEXTAUTH_SECRET=<any-random-string>
NEXTAUTH_URL=http://localhost:3000
```

### Verification
After creating `.env.local`, restart the dev server and check:
```
GET /api/auth/providers  -> should return 200 with provider list
GET /api/auth/session    -> should return 200 with empty session
```

---

## 4. Axios API Calls Returning `undefined: undefined`

### Symptom
- `[API] Error undefined: undefined` in console
- API calls fail silently with no status code or response body
- The error interceptor in `lib/axios/index.ts` fires with `error?.response` being `undefined`

### Root Cause
The Axios `baseURL` was set to the wrong host/port (e.g., `http://localhost:5000/api`).
Since Next.js API routes are served from the same origin, the request went to a dead port.
When a server is completely unreachable, Axios returns an error with **no response object** — hence `undefined`.

### Fix
For Next.js projects, Axios `baseURL` must be an empty string `""` so all API calls are relative:
```typescript
const api = axios.create({
  baseURL: "",  // Relative to current origin
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
```

### Key Rule
**NEVER** use absolute URLs for Next.js API routes. They are always relative to the current origin.

---

## 5. Quick Diagnostic Checklist

When ANY API error occurs, run through this checklist IN ORDER:

1. **Is `.env.local` present?** Check that all required env vars exist.
2. **Is the dev server running?** Confirm port 3000 is active.
3. **Is Axios hitting the right URL?** Check `baseURL` in `lib/axios/index.ts`.
4. **Does MongoDB connect?** Look for `[DB] Connecting to MongoDB...` in terminal logs.
5. **Is `family: 4` set?** Required for Windows + Mongoose 9.x + Atlas SRV.
6. **Run `npm run test:api`** with the dev server active to test all endpoints systematically.

---

## 6. Emergency Recovery Commands (Copy-Paste Ready)

```powershell
# Kill all node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear Next.js lock
Remove-Item -Path ".next/dev/lock" -Force -ErrorAction SilentlyContinue

# Check what's on port 3000
netstat -ano | findstr ":3000"

# Kill specific PID
Stop-Process -Id <PID> -Force

# CMD fallback
taskkill /F /IM node.exe

# Test all API endpoints (dev server must be running)
npm run test:api
```
