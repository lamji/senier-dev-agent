const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Function to append log entries
const logToFile = (task, response) => {
  const logDir = path.join(__dirname, '../.logs');
  const logFile = path.join(logDir, `${getCurrentDate()}-rag-api-call.md`);
  const logEntry = `**RAG API Call Log - ${new Date().toISOString()}**
- **Task**: ${task}
- **Response Summary**: ${JSON.stringify(response).substring(0, 200)}...

`;

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logEntry);
  } else {
    fs.writeFileSync(logFile, `# RAG API Call Logs

${logEntry}`);
  }
  console.log('Log entry added for RAG API call');
};

// Function to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Function to call RAG API with a summarized task
const callRagApi = async (task) => {
  try {
    const response = await axios.get(`http://localhost:6444/context/compressed?task=${encodeURIComponent(task)}&limit=3`);
    console.log('RAG API Response:', response.data);
    // Process only the compressed field
    if (response.data.compressed) {
      console.log('Compressed Context:', response.data.compressed);
      logToFile(task, response.data); // Log the API call
      return response.data.compressed;
    }
    return null;
  } catch (error) {
    console.error('Error calling RAG API:', error.message);
    logToFile(task, { error: error.message }); // Log the error
    return null;
  }
};

// Example usage
const main = async () => {
  const task = 'Retrieve agent data context';
  console.log(`Calling RAG API for task: ${task}`);
  const context = await callRagApi(task);
  if (context) {
    console.log('Successfully retrieved context for task:', task);
  } else {
    console.log('Failed to retrieve context or no compressed field found.');
  }
};

main();
