/**
 * Senior Dev Mind — API Test Script
 * Verifies all RAG endpoints are functional after refactoring.
 */

const BASE_URL = "http://localhost:6444";

async function testEndpoint(endpoint, method = "GET", body = null) {
  console.log(`Testing ${method} ${endpoint}...`);
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json();

    if (res.ok) {
      console.log(`✅ ${endpoint} passed`);
    } else {
      console.error(`❌ ${endpoint} failed: ${res.statusText}`);
      console.error(data);
    }
    return data;
  } catch (err) {
    console.error(`❌ ${endpoint} error: ${err.message}`);
  }
}

async function runTests() {
  console.log("🚀 Starting API Tests...\n");

  await testEndpoint("/health");
  await testEndpoint("/stats");
  await testEndpoint("/rules?limit=1");
  await testEndpoint("/context/smart?task=test+task&limit=1");
  await testEndpoint("/context?task=test+task&limit=1");
  
  await testEndpoint("/search/text", "POST", { query: "test", limit: 1 });
  await testEndpoint("/memory/save", "POST", { 
    task: "test api", 
    summary: ["refactored server.mjs", "added tests"],
    tags: ["test"]
  });

  // Test Gateway Proxy (The Akrizu Engine)
  await testEndpoint("/v1/chat/completions", "POST", {
    model: "test-model",
    messages: [
      { role: "user", content: "How should I structure an MVP?" }
    ],
    stream: false
  });

  console.log("\n🏁 API Tests Complete.");
}

runTests();
