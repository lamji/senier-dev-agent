const data = {
  model: "groq:llama-3.3-70b-versatile",
  useAkrizuAgent: true,
  messages: [{ role: "user", content: "ao we have npm package for admin ui?" }]
};

fetch("http://localhost:6444/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(json => console.log(json.choices[0].message.content))
  .catch(err => console.error(err));
