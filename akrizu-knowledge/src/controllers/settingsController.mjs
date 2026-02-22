import fs from "fs";
import path from "path";
import { CONFIG } from "../config.mjs";

const ENV_FILE_PATH = path.resolve(process.cwd(), ".env");

/**
 * Reads current settings for the UI.
 */
export const getSettings = (req, res) => {
  res.json({
    qdrantUrl: CONFIG.qdrantUrl,
    qdrantApiKey: CONFIG.qdrantApiKey ? "****" : null,
    groqApiKey: CONFIG.groqApiKey ? "****" : null,
    ollamaUrl: CONFIG.ollamaUrl,
    embeddingProvider: CONFIG.embeddingProvider,
    knowledgeBasePath: CONFIG.knowledgeBasePath,
    ragServerPort: CONFIG.serverPort
  });
};

/**
 * Updates settings and persists to .env file.
 */
export const updateSettings = async (req, res) => {
  try {
    const { qdrantUrl, qdrantApiKey, groqApiKey } = req.body;

    // Read existing .env
    let envContent = "";
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, "utf8");
    }

    // Helper to update or append
    const updateEnv = (key, value) => {
      const regex = new RegExp(`${key}=.*`);
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    if (qdrantUrl) {
      updateEnv("QDRANT_URL", qdrantUrl);
      CONFIG.qdrantUrl = qdrantUrl;
    }
    
    if (qdrantApiKey) {
      updateEnv("QDRANT_API_KEY", qdrantApiKey);
      CONFIG.qdrantApiKey = qdrantApiKey;
    }

    if (groqApiKey) {
      updateEnv("GROQ_API_KEY", groqApiKey);
      CONFIG.groqApiKey = groqApiKey;
    }

    // Write back to .env
    fs.writeFileSync(ENV_FILE_PATH, envContent, "utf8");

    // Update live config (Note: Some parts of the app might need a restart to pick this up fully)
    CONFIG.qdrantUrl = qdrantUrl;
    if (qdrantApiKey) CONFIG.qdrantApiKey = qdrantApiKey;

    res.json({ status: "ok", message: "Settings updated and saved to .env. A restart may be required for some changes." });
  } catch (err) {
    console.error("Settings Update Error:", err);
    res.status(500).json({ error: "Failed to update settings", details: err.message });
  }
};
