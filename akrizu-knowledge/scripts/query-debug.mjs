/**
 * Query Akrizu about bug fixing process
 */

const BASE_URL = "http://localhost:6444";

async function api(endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log("🤖 Querying Akrizu about bug fixing process...\n");
  
  try {
    const res = await api("/v1/chat/completions", {
      model: "groq:llama-3.3-70b-versatile",
      useAkrizuAgent: true,
      messages: [{ 
        role: "user", 
        content: "How do you fix bugs? Walk me through your complete debugging process step by step." 
      }]
    });
    
    console.log("📝 Akrizu Response:\n");
    console.log(res.choices[0].message.content);
    console.log("\n" + "=".repeat(80) + "\n");
    
    // Second query about hover button fix
    console.log("🤖 Querying Akrizu about hover button fix...\n");
    const res2 = await api("/v1/chat/completions", {
      model: "groq:llama-3.3-70b-versatile",
      useAkrizuAgent: true,
      messages: [{ 
        role: "user", 
        content: "The button in login has hover effect, how can you remove that?" 
      }]
    });
    
    console.log("📝 Akrizu Response:\n");
    console.log(res2.choices[0].message.content);
    
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
