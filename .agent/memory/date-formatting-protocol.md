# Technical Knowledge: Date Formatting (Mmm,DD, YYYY)
**Category**: JavaScript / UI
**Date**: 2026-02-22

## Problem
Formatting a date object or string into a specific format: abbreviated month, comma, day, comma, space, and year (e.g., "Feb,20, 2025").

## Senior Dev Solution
Use `toLocaleString` with individual options to extract parts, then use a template literal for the exact pattern.

### Implementation
```javascript
/**
 * Formats a date to "Mmm,DD, YYYY"
 * @param {Date|string} inputDate 
 * @returns {string} - e.g. "Feb,20, 2025"
 */
function formatAkrizuDate(inputDate) {
  const date = new Date(inputDate);
  
  // 1. Extract parts
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  
  // 2. Format exactly as "Feb,20, 2025"
  return `${month},${day}, ${year}`;
}

// Usage:
console.log(formatAkrizuDate('2025-02-20')); // "Feb,20, 2025"
```

## Technical Analysis
- **Locale Control**: Explicitly setting `'en-US'` ensures month abbreviations are consistent regardless of system settings.
- **Edge Cases**: Manual template literal concatenation provides more control over spacing/commas than generic Intl.DateTimeFormat objects for non-standard requirements.
