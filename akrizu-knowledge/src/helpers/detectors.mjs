// Simple keyword detector for MVP-related tasks
export const isMvpTask = (task = "") => /\bmvp\b|init-mvp|minimum viable product/i.test(task);

// Simple keyword detector for debugging-related tasks
export const isDebugTask = (task = "") =>
  /\b(debug|error|fix|bug|issue|fail|broken|hover)\b/i.test(task);

// Simple keyword detector for creation/build tasks
export const isCreateTask = (task = "") =>
  /\b(create|build|add|make|scaffold|implement)\b/i.test(task);

// Simple keyword detector for admin/package tasks
export const isAdminTask = (task = "") =>
  /\b(admin|package|npm|library)\b/i.test(task);

// Detector for casual greetings and non-technical chat
export const isCasualChat = (message = "") => {
  const casualRegex = /^(hi|hello|hey|hola|yo|good morning|good afternoon|good evening|how are you|test|ping)(\s|$|[.!?])/i;
  // If it's very short (1-2 words) and matches common greetings, it's casual
  const words = message.trim().split(/\s+/);
  if (words.length <= 3 && casualRegex.test(message.trim())) return true;
  return false;
};
