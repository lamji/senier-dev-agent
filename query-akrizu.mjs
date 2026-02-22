import fetch from 'node-fetch';

const BASE_URL = "http://localhost:6444";

async function queryAkrizu(question) {
  try {
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "groq:llama-3.3-70b-versatile",
        useAkrizuAgent: true,
        messages: [{ role: "user", content: question }]
      })
    });
    if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}`);
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

async function main() {
  console.log("🤖 Querying Akrizu about bug fixing process...\n");
  
  const response = await queryAkrizu(
    "How do you fix bugs? Walk me through your complete debugging process step by step."
  );
  
  console.log("📝 Akrizu Response:\n");
  console.log(response);
}

main();
