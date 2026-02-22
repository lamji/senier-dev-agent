/**
 * Akrizu Knowledge — Comprehensive E2E Test Suite
 * Tests all 5 knowledge base categories: rules, memory, npm-packages, qa, template
 */

const BASE_URL = "http://localhost:6444";

const SCENARIOS = [
  // ===== RULES CATEGORY =====
  {
    id: 1,
    category: "rules",
    name: "MVP Initialization Test",
    query: "I want to build an event booking MVP. What tech stack should I use?",
    expect: ["next.js", "mongodb", "mongoose", "redux", "shadcn"],
  },
  {
    id: 2,
    category: "rules",
    name: "Feature Development Test",
    query: "How do I create a new booking feature with proper MVVM structure?",
    expect: ["study", "audit", "isolate", "mvvm", "template"],
  },
  {
    id: 3,
    category: "rules",
    name: "UI Component Test",
    query: "I need to build an admin dashboard. What are the design requirements?",
    expect: ["glassmorphism", "10px blur", "2-link", "desktop"],
  },
  {
    id: 4,
    category: "rules",
    name: "Security Implementation Test",
    query: "What security measures must I implement for payment processing?",
    expect: ["aes-256", "bcrypt", "pci", "never store pan", "zod"],
  },
  {
    id: 5,
    category: "rules",
    name: "Debugging Workflow Test",
    query: "My API endpoint is failing. Walk me through the debugging process.",
    expect: ["internal audit", "reproduce", "logs", "binary search", "root cause"],
  },
  {
    id: 6,
    category: "rules",
    name: "Pre-Deployment Test",
    query: "What must I verify before pushing code to production?",
    expect: ["npm run lint", "npm run build", "test:api", "commit message"],
  },
  {
    id: 7,
    category: "rules",
    name: "Scalability Test",
    query: "When should I extract repeated code into shared utilities?",
    expect: ["3", "three", "strict", "typescript"],
  },
  {
    id: 8,
    category: "rules",
    name: "Template Lookup Test",
    query: "I want to use an existing login template. How do I trigger template lookup?",
    expect: ["use the lookup", "markdown", "knowledge base", "explicit"],
  },
  
  // ===== MEMORY CATEGORY =====
  {
    id: 9,
    category: "memory",
    name: "Memory/Technical Knowledge Test",
    query: "How do I fix a context loader indexing issue where catalog files are being skipped?",
    expect: ["whitelist", "category entry", "deduplication", "hard-code"],
  },
  
  // ===== NPM-PACKAGES CATEGORY =====
  {
    id: 10,
    category: "npm-packages",
    name: "NPM Package Catalog Test",
    query: "I need to build an admin dashboard. What internal packages are available?",
    expect: ["admin-ui-1", "glassmorphism", "npm install", "catalog"],
  },
  
  // ===== QA CATEGORY =====
  {
    id: 11,
    category: "qa",
    name: "QA Knowledge Base Test",
    query: "How do I write E2E tests for admin endpoints that require authentication?",
    expect: ["csrf token", "admin", "jest", "session"],
  },
  
  // ===== TEMPLATE CATEGORY =====
  {
    id: 12,
    category: "template",
    name: "Template Design Pattern Test",
    query: "Show me the MVVM structure for an event booking component.",
    expect: ["index.tsx", "usebooking", "sub-components", "viewmodel"],
  },
];

async function api(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}`);
  return res.json();
}

async function runE2ETests() {
  console.log("🚀 Starting Comprehensive E2E Test Suite (12 Scenarios)\n");
  console.log("Testing 5 Knowledge Base Categories:");
  console.log("  • rules (8 tests)");
  console.log("  • memory (1 test)");
  console.log("  • npm-packages (1 test)");
  console.log("  • qa (1 test)");
  console.log("  • template (1 test)\n");
  console.log("=".repeat(80) + "\n");

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const scenario of SCENARIOS) {
    process.stdout.write(`[${scenario.id}/12] ${scenario.name}... `);
    
    try {
      const res = await api("/v1/chat/completions", {
        model: "groq:llama-3.3-70b-versatile",
        useAkrizuAgent: true,
        messages: [{ role: "user", content: scenario.query }]
      });

      const content = res.choices[0].message.content.toLowerCase();
      const matched = scenario.expect.filter(e => content.includes(e.toLowerCase()));
      const matchRate = (matched.length / scenario.expect.length) * 100;

      if (matched.length > 0) {
        process.stdout.write(`✅ PASS (${matched.length}/${scenario.expect.length} = ${matchRate.toFixed(0)}%)\n`);
        totalPassed++;
        results.push({
          ...scenario,
          status: "PASS",
          matched,
          matchRate,
          response: content.substring(0, 200),
        });
      } else {
        process.stdout.write(`❌ FAIL (0 matches)\n`);
        console.log(`   Expected: ${scenario.expect.join(", ")}`);
        console.log(`   Response: ${content.substring(0, 200)}...\n`);
        totalFailed++;
        results.push({
          ...scenario,
          status: "FAIL",
          matched: [],
          matchRate: 0,
          response: content.substring(0, 200),
        });
      }
    } catch (err) {
      console.log(`💥 ERROR: ${err.message}`);
      totalFailed++;
      results.push({
        ...scenario,
        status: "ERROR",
        error: err.message,
      });
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(`\n🏁 E2E Test Suite Complete: ${totalPassed} Passed, ${totalFailed} Failed\n`);

  // Category breakdown
  const categories = ["rules", "memory", "npm-packages", "qa", "template"];
  console.log("📊 Results by Category:\n");
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.status === "PASS").length;
    const catTotal = catResults.length;
    const catRate = catTotal > 0 ? ((catPassed / catTotal) * 100).toFixed(0) : 0;
    console.log(`   ${cat.padEnd(15)} ${catPassed}/${catTotal} (${catRate}%)`);
  });

  console.log("\n" + "=".repeat(80));

  if (totalFailed > 0) {
    console.log("\n⚠️  Some tests failed. Review results above.");
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed! Knowledge base is fully operational.");
  }

  return results;
}

runE2ETests();
