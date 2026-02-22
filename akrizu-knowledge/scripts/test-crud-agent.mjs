/**
 * Senior Dev Mind — CRUD & Agent Knowledge Test
 * Fulfills `api-test-protocol.md`:
 * 1. Create (Memory Save)
 * 2. Read (Search)
 * 3. Chat (Context Retrieval & Knowledge Verification)
 */

const BASE_URL = "http://localhost:6444";

async function test(label, fn) {
  console.log(`\n🔍 ${label}...`);
  try {
    await fn();
    console.log(`✅ Passed: ${label}`);
  } catch (err) {
    console.error(`❌ Failed: ${label}`);
    console.error(err.message);
    process.exit(1);
  }
}

async function api(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body ? JSON.stringify(options.body) : null,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${res.status}] ${text || res.statusText}`);
  }
  return res.json();
}

async function runTests() {
  console.log("🚀 Starting Agent CRUD & Knowledge Tests...\n");

  const testSecret = `CRUD_VERIFY_SECRET_${Math.random().toString(36).substring(7)}_${Date.now()}`;
  const testTask = `Unique CRUD Test: ${testSecret}`;
  const testSummary = "This is a temporary memory entry to verify CRUD and RAG indexing. SECRET_KEY: " + testSecret;

  // 1. CREATE (Memory Save)
  await test("CREATE: Save Memory to RAG", async () => {
    const res = await api("/memory/save", {
      method: "POST",
      body: { task: testTask, summary: testSummary, tags: ["test-crud-strict"] }
    });
    if (res.status !== "ok") throw new Error(res.message);
  });

  // Wait for ingestion sync
  console.log("⏳ Waiting for vector indexing (5s)...");
  await new Promise(r => setTimeout(r, 5000));

  // 2. READ (Search Text)
  await test("READ: Search for Test Memory", async () => {
    const res = await api("/search/text", {
      method: "POST",
      body: { query: testTask, limit: 1 }
    });
    if (!res.results || res.results.length === 0) throw new Error("Search returned 0 results");
    
    const actualContent = res.results[0].content;
    console.log("🔍 Actual Content Found:", actualContent);
    console.log("🔍 Expected Keyword:", testSummary);

    if (!actualContent.includes(testSummary)) {
      throw new Error("Found result but content mismatch");
    }
  });

  // 3. CHAT: Knowledge Retrieval (.agent Verification)
  await test("CHAT: Verify .agent Rules Retrieval", async () => {
    // Specifically ask about the "Golden Rule" / "Anti-Myopia" rule from .agent/rules
    const res = await api("/v1/chat/completions", {
      method: "POST",
      body: {
        model: "groq:llama-3.3-70b-versatile",
        useAkrizuAgent: true,
        messages: [
          { role: "user", content: "What is the Anti-Myopia Golden Rule mentioned in .agent/rules/rule-compliance-guardrail.md?" }
        ]
      }
    });

    const content = res.choices[0].message.content;
    console.log("🤖 AI Response:", content);

    // Verify it knows about the core concept of saving to memory/Individual topic files
    if (!content.toLowerCase().includes("memory") && !content.toLowerCase().includes("topic-based")) {
       throw new Error("AI response did not reference the mandatory .agent memory protocol");
    }
  });

  console.log("\n🏁 All Agent CRUD & Knowledge Tests Passed!");
}

runTests();
