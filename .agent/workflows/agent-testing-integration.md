---
description: How AI Agents Integrate E2E Testing — Automated RAG Validation Workflow
---

# Agent Testing Integration Guide

**Purpose**: Show how AI agents (Windsurf, Cursor, etc.) automatically run E2E tests by calling the RAG server in the background.

**Status**: ✅ Production Ready

---

## How It Works

### Agent Testing Flow

```
Agent Task Request
    ↓
[Agent reads AGENTS.md]
    ↓
[Agent summarizes task in 5 words]
    ↓
[Agent fetches RAG context]
    GET http://localhost:6444/context/compressed?task=YOUR_TASK&limit=3
    ↓
[Task involves knowledge base modification?]
    ├─ YES → Run E2E Tests (Background)
    │         ↓
    │    [Call RAG server with test scenarios]
    │    POST http://localhost:6444/v1/chat/completions
    │         ↓
    │    [Validate 12 test scenarios]
    │         ↓
    │    [100% pass rate?]
    │    ├─ YES → Proceed with task
    │    └─ NO  → Report failures, suggest fixes
    │
    └─ NO → Proceed directly with task
```

---

## Agent Implementation

### Step 1: Agent Reads Workflow Rules

When an agent starts, it reads `.agent/workflows/AGENTS.md`:

```markdown
## 🧪 E2E TESTING PROTOCOL

Before completing tasks that modify knowledge base or RAG configuration:

### Testing Trigger
Run E2E tests when:
- Modifying `.agent/` files
- Updating RAG configuration
- After re-ingestion
- Before major deployments

### Testing Command
npm run test:e2e
```

### Step 2: Agent Detects Task Type

Agent checks if task involves:
- Modifying `.agent/rules/`, `.agent/memory/`, `.agent/template/`, `.agent/qa/`, `.agent/npm-packages/`
- Updating RAG configuration
- Re-ingesting knowledge base
- Major deployments

**If YES** → Run E2E tests in background

### Step 3: Agent Calls RAG Server (Background)

Agent makes silent HTTP request to RAG server:

```javascript
// Background E2E Testing Function
async function validateRagBeforeTask(taskDescription) {
  console.log('🧪 Validating RAG system before task...');
  
  const testScenarios = [
    {
      name: 'MVP Initialization',
      query: 'I want to build an event booking MVP. What tech stack should I use?',
      expect: ['next.js', 'mongodb', 'mongoose', 'redux', 'shadcn']
    },
    {
      name: 'Feature Development',
      query: 'How do I create a new booking feature with proper MVVM structure?',
      expect: ['study', 'audit', 'isolate', 'mvvm', 'template']
    },
    // ... (10 more scenarios)
  ];

  let passed = 0;
  let failed = 0;
  const failedTests = [];

  for (const scenario of testScenarios) {
    try {
      const response = await fetch('http://localhost:6444/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'groq:llama-3.3-70b-versatile',
          useAkrizuAgent: true,
          messages: [{ role: 'user', content: scenario.query }]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content.toLowerCase();
      const matched = scenario.expect.filter(e => content.includes(e.toLowerCase()));

      if (matched.length > 0) {
        passed++;
      } else {
        failed++;
        failedTests.push({
          name: scenario.name,
          expected: scenario.expect,
          matched: matched
        });
      }
    } catch (err) {
      failed++;
      failedTests.push({
        name: scenario.name,
        error: err.message
      });
    }
  }

  const passRate = (passed / testScenarios.length) * 100;
  
  return {
    passRate,
    passed,
    failed,
    failedTests,
    isReady: passRate === 100
  };
}
```

### Step 4: Agent Evaluates Results

```javascript
// After running tests
const testResults = await validateRagBeforeTask(taskDescription);

if (testResults.isReady) {
  console.log(`✅ RAG validation passed (${testResults.passRate}%)`);
  console.log('Proceeding with task...');
  // Execute task
} else {
  console.log(`⚠️  RAG validation failed (${testResults.passRate}%)`);
  console.log(`Failed tests: ${testResults.failed}`);
  
  // Report failures
  for (const test of testResults.failedTests) {
    console.log(`  ❌ ${test.name}`);
    if (test.error) {
      console.log(`     Error: ${test.error}`);
    } else {
      console.log(`     Expected: ${test.expected.join(', ')}`);
      console.log(`     Matched: ${test.matched.join(', ')}`);
    }
  }
  
  // Suggest fixes
  console.log('\n🔧 Suggested Actions:');
  console.log('1. Check RAG server: curl http://localhost:6444/health');
  console.log('2. Re-ingest knowledge: npm run sync (from rag/ directory)');
  console.log('3. Re-run tests: npm run test:e2e');
}
```

---

## Real-World Example: Agent Updates Rule File

### Scenario
Agent needs to update `.agent/rules/coding-standard.md` with a new rule.

### Workflow Execution

#### 1. Agent Detects Task
```
Agent: "I need to update coding-standard.md with new rule"
System: "Task involves modifying .agent/rules/ → Running E2E tests"
```

#### 2. Agent Runs Background Tests
```javascript
console.log('🧪 Running E2E tests before modification...');

// Silent HTTP calls to RAG server
// Test 1: MVP Initialization → ✅ PASS
// Test 2: Feature Development → ✅ PASS
// Test 3: UI Component → ✅ PASS
// ... (9 more tests)
// Test 12: Template Design → ✅ PASS

console.log('✅ All 12 E2E tests passed (100%)');
console.log('RAG system is ready for modification');
```

#### 3. Agent Proceeds with Task
```
Agent: "Updating coding-standard.md..."
[Makes changes to rule file]
Agent: "Modification complete"
```

#### 4. Agent Re-validates After Change
```javascript
console.log('🧪 Re-running E2E tests after modification...');

// Silent HTTP calls to RAG server (again)
// Test 1: MVP Initialization → ✅ PASS
// Test 2: Feature Development → ✅ PASS
// ... (10 more tests)

console.log('✅ All 12 E2E tests still passing (100%)');
console.log('Knowledge base integrity verified');
```

#### 5. Agent Saves Technical Win
```
Agent: "Saving technical accomplishment to .agent/memory/..."
Created: `.agent/memory/coding-standard-update.md`
Content:
  - Summary: Updated coding-standard.md with new rule
  - Problem: Need to enforce new pattern
  - Solution: Added rule to coding-standard.md
  - Technical Analysis: E2E tests validated change
```

#### 6. Agent Reports Completion
```
✅ Task Complete: Updated coding-standard.md
- Pre-task E2E validation: 12/12 passed (100%)
- Post-task E2E validation: 12/12 passed (100%)
- Knowledge base integrity: ✅ Verified
- Technical win saved: .agent/memory/coding-standard-update.md
```

---

## Integration with Different Agents

### Windsurf Agent

Add to `.windsurfrules`:

```markdown
## E2E Testing Integration

Before modifying knowledge base or RAG configuration:

1. **Detect Task Type**: Check if task involves `.agent/` modifications
2. **Run Background Tests**: Call RAG server with 12 test scenarios
3. **Validate Results**: Ensure 100% pass rate
4. **Proceed or Report**: 
   - If 100% pass: Proceed with task
   - If <100% pass: Report failures and suggest fixes
5. **Post-Task Validation**: Re-run tests after modifications
6. **Save Results**: Document in task completion summary

See `.agent/workflows/e2e-testing-protocol.md` for details.
```

### Cursor Agent

Add to `.cursorrules`:

```markdown
## E2E Testing Protocol

When modifying `.agent/` files or RAG configuration:

1. Run E2E tests: `npm run test:e2e` (from akrizu-knowledge/)
2. Validate 100% pass rate
3. Make modifications
4. Re-run tests
5. Report results

Reference: `.agent/workflows/e2e-testing-protocol.md`
```

### Custom Agents

Implement the `validateRagBeforeTask()` function and call it before knowledge base modifications.

---

## Background Testing Benefits

### For Agents
- ✅ **Confidence**: Know RAG system is working before making changes
- ✅ **Early Detection**: Catch issues before they propagate
- ✅ **Automatic Validation**: No manual testing required
- ✅ **Continuous Quality**: Every task validates the system

### For Users
- ✅ **Reliability**: Knowledge base always validated
- ✅ **Transparency**: See test results in task completion
- ✅ **Automatic Fixes**: Agents suggest fixes for failures
- ✅ **Audit Trail**: Test results saved in memory

### For System
- ✅ **Self-Healing**: Agents detect and report issues
- ✅ **Quality Assurance**: Continuous validation
- ✅ **Knowledge Integrity**: Changes validated before acceptance
- ✅ **Performance Monitoring**: Track RAG health over time

---

## Testing Triggers

### Automatic Testing (Background)
Agents MUST run E2E tests when:
- ✅ Modifying `.agent/rules/` files
- ✅ Modifying `.agent/memory/` files
- ✅ Modifying `.agent/template/` files
- ✅ Modifying `.agent/qa/` files
- ✅ Modifying `.agent/npm-packages/` files
- ✅ Updating RAG configuration
- ✅ After re-ingestion (`npm run sync`)
- ✅ Before major deployments

### Manual Testing (User Request)
Users can request testing:
```
User: "Run E2E tests"
Agent: "Running E2E test suite..."
[Runs 12 scenarios]
Agent: "Results: 12/12 passed (100%)"
```

---

## Failure Handling

### If Tests Fail

#### Step 1: Agent Reports Failure
```
⚠️  E2E Test Validation Failed
- Pass Rate: 75% (9/12 passed)
- Failed Tests:
  ❌ Test 3: UI Component
  ❌ Test 7: Scalability
```

#### Step 2: Agent Suggests Fixes
```
🔧 Recommended Actions:
1. Check RAG server health:
   curl http://localhost:6444/health

2. Re-ingest knowledge base:
   cd rag && npm run sync

3. Re-run tests:
   cd akrizu-knowledge && npm run test:e2e

4. If still failing, review:
   - .agent/rules/knowledge-chunking-protocol.md
   - Failed test scenarios in e2e-testing-protocol.md
```

#### Step 3: Agent Retries
```
Agent: "Re-ingesting knowledge base..."
[Runs: npm run sync]

Agent: "Re-running E2E tests..."
[Runs: npm run test:e2e]

Result: 12/12 passed (100%)
Agent: "✅ Tests now passing. Proceeding with task."
```

---

## Monitoring RAG Health

### Agent Health Check
```javascript
async function checkRagHealth() {
  try {
    const response = await fetch('http://localhost:6444/health');
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✅ RAG server is healthy');
      return true;
    } else {
      console.log('⚠️  RAG server status:', data.status);
      return false;
    }
  } catch (err) {
    console.log('❌ RAG server is not responding');
    return false;
  }
}
```

### Agent Statistics
```javascript
async function getRagStats() {
  const response = await fetch('http://localhost:6444/stats');
  const data = await response.json();
  
  console.log('📊 RAG Statistics:');
  console.log(`   Points: ${data.points_count}`);
  console.log(`   Vectors: ${data.vectors_count}`);
  console.log(`   Collection: ${data.collection_name}`);
  console.log(`   Status: ${data.status}`);
}
```

---

## Summary

**Agent Testing Integration**:
- ✅ Agents automatically run E2E tests before knowledge base modifications
- ✅ Silent background HTTP calls to RAG server
- ✅ 12 test scenarios covering all knowledge categories
- ✅ 100% pass rate validation
- ✅ Automatic failure detection and fix suggestions
- ✅ Post-task re-validation
- ✅ Technical wins saved to memory

**Agent Workflow**:
1. Read task request
2. Detect if knowledge base modification
3. Run E2E tests (background)
4. Validate 100% pass rate
5. Proceed with task (or report failures)
6. Re-validate after changes
7. Save technical wins

**Result**: Continuous quality assurance with zero manual testing overhead.

---

**Last Updated**: 2026-02-22  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
