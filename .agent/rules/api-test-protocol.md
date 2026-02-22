# MANDATORY API Test Protocol (CRUD Verification)
**Category**: QA / Maintenance
**Script Path**: `scripts/test-crud-agent.mjs`

## STRICT REQUIREMENTS
- **Always test all api**: Every new or modified endpoint MUST be verified using the mandatory CRUD script.
- **Verification Loop**: 
  1. **CREATE**: Save a unique memory entry.
  2. **READ**: Verify semantic vector indexing via search.
  3. **CHAT**: Verify AI can retrieve the specific project knowledge including .agent rules.
- **Legacy Note**: Do NOT use old `Jest` based protocols from the unofficial "QA Handbook". Only the modern `test-crud-agent.mjs` is authoritative.