/**
 * Akrizu Knowledge — Global Rule Verification Suite
 * Verifies all 19 rule files in `.agent/rules` are correctly indexed 
 * and followed by the RAG Gateway.
 */

const BASE_URL = "http://localhost:6444";

const SCENARIOS = [
  { file: "admin-ui-kit.md", q: "What are the Core Principles of the OrbitNest Admin UI Kit? Mention glassmorphism specs, business logic placement, and interactive state requirements.", expect: ["zero business logic", "glassmorphism", "10px blur", "rounded", "hover", "transition"] },
  { file: "api-test-protocol.md", q: "What is the MANDATORY API test protocol script path and what three verification steps does it enforce?", expect: ["test-crud-agent.mjs", "create", "read", "chat", "all api"] },
  { file: "coding-standard.md", q: "What is the absolute maximum file length? What must happen when JSX or ViewModels exceed this limit? Where should fragmented code go?", expect: ["300 lines", "sub-components", "sub-helpers", "fragmentation", "refactor"] },
  { file: "create-feature.md", q: "According to the Feature Creation Protocol, what are the 4 mandatory steps before implementing a new feature? What files should I check first?", expect: ["study", "audit", "logs", "isolation", "mvvm", "template"] },
  { file: "debugging-process.md", q: "Before blaming external services (DB, API, DNS), what internal environment checks MUST I perform first according to the debugging checklist?", expect: ["internal", "ipv4", "ipv6", "env", "compass", "variable shadowing"] },
  { file: "git-push.md", q: "What three commands must be run and pass before pushing code to main? What commit message format is mandatory?", expect: ["lint", "build", "test", "feat:", "fix:", "type prefix"] },
  { file: "mvp-protocol.md", q: "What is the MANDATORY tech stack for MVP development? List the framework, database, ORM, state management, and UI library. What image tool is FORBIDDEN?", expect: ["next.js", "mongodb", "mongoose", "redux", "shadcn", "never generate_image", "unsplash"] },
  { file: "mvp-workflows.md", q: "What are the exact initialization commands for a new MVP project including Next.js setup and Shadcn installation?", expect: ["npx create-next-app", "npm install", "shadcn", "init", "typescript"] },
  { file: "npm-publish-protocol.md", q: "What versioning system is mandatory for internal npm packages? What files must be included before publishing?", expect: ["semantic", "versioning", "readme", "build", "changelog"] },
  { file: "package-selection.md", q: "Before adding ANY new npm dependency, where must I check first for existing internal solutions?", expect: ["npm-packages", "catalog", "internal", "template"] },
  { file: "project-structure.md", q: "Describe the MVVM directory structure. Where do hooks, models, views, and components belong?", expect: ["hooks", "models", "views", "components", "lib", "presentations"] },
  { file: "refined-rules.md", q: "What are the 3 PRIORITY rules that prevent 'Careless Fast-Tracking'? What commands must show green output before declaring a task done?", expect: ["build", "lint", "verification", "physical evidence", ".logs", ".corrections"] },
  { file: "rule-compliance-guardrail.md", q: "What is the 'Golden Rule' or 'Anti-Myopia' protocol? Where must significant solutions be saved?", expect: [".agent", "memory", "saving", "knowledge"] },
  { file: "scalability-protocol.md", q: "According to the '3-Use Rule', when must logic be extracted into shared resources? What TypeScript mode is non-negotiable?", expect: ["3", "three", "strict", "no any", "shared"] },
  { file: "security-standards.md", q: "What encryption standards are mandatory for data at rest and passwords? What payment data is FORBIDDEN to store?", expect: ["aes-256", "bcrypt", "pci", "never store pan", "cvv", "zod"] },
  { file: "template-creation-protocol.md", q: "After completing a significant feature, what MUST be created in .agent/template? What should the readme.md document?", expect: [".agent/template", "readme", "mvvm mapping", "dependencies", "exact code"] },
  { file: "template-lookup.md", q: "What keywords trigger template lookup? Are template files executable code or knowledge base markdown? When should I NOT copy templates?", expect: ["use the lookup", "check templates", "markdown", "knowledge base", "explicitly"] },
  { file: "trace-logs-explain-fix.md", q: "What is the mandatory naming convention for granular debugging logs? Where should they be stored?", expect: [".logs", "date", "feature", "[date]-[feature]", "append only"] },
  { file: "troubleshooting.md", q: "How do I identify and kill a zombie process blocking port 6444 or 3000? What commands should I use?", expect: ["port", "netstat", "kill", "zombie", "taskkill", "pid"] }
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

async function runVerification() {
  console.log("🚀 Starting Refined Rule Verification (19 Tests)...\n");
  let passed = 0;
  let failed = 0;

  for (const s of SCENARIOS) {
    process.stdout.write(`Testing [${s.file}]... `);
    try {
      const res = await api("/v1/chat/completions", {
        model: "groq:llama-3.3-70b-versatile",
        useAkrizuAgent: true,
        messages: [{ role: "user", content: s.q }]
      });

      const content = res.choices[0].message.content.toLowerCase();
      const matched = s.expect.filter(e => content.includes(e.toLowerCase()));

      if (matched.length > 0) {
        process.stdout.write(`✅ Passed (${matched.length} matches)\n`);
        passed++;
      } else {
        process.stdout.write(`❌ FAILED\n`);
        console.log("   Question:", s.q);
        console.log("   AI Response:", res.choices[0].message.content.substring(0, 200).replace(/\n/g, " ") + "...");
        console.log("   Expected (any of):", s.expect.join(", "));
        failed++;
      }
    } catch (err) {
      console.log("💥 Error:", err.message);
      failed++;
    }
  }

  console.log(`\n🏁 Verification Complete: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    console.log("\n⚠️  Action Required: Run 'npm run sync' to re-ingest rules if results were poor.");
    process.exit(1);
  }
}

runVerification();
