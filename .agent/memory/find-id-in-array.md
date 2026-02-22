# Technical Knowledge: Finding ID in Array
**Category**: JavaScript / Logic
**Date**: 2026-02-22

## Problem
Finding the index or the existence of a specific ID within an array of objects.

## Senior Dev Solution
Use `Array.prototype.findIndex()` for getting the position, or `Array.prototype.some()` for existence checks. Avoid manual `for` loops for basic searches.

### Implementation
```javascript
const items = [
  { id: "a1", name: "Item 1" },
  { id: "b2", name: "Item 2" },
  { id: "c3", name: "Item 3" }
];

const targetId = "b2";

// 1. Get the Index
const index = items.findIndex(item => item.id === targetId);
// Returns 1

// 2. Get the Object
const item = items.find(item => item.id === targetId);
// Returns { id: "b2", name: "Item 2" }

// 3. Check Existence
const exists = items.some(item => item.id === targetId);
// Returns true
```

## Technical Analysis
- `findIndex` returns `-1` if not found.
- `find` returns `undefined` if not found.
- These methods are O(n). For extremely large arrays in performance-critical paths, consider using a `Map` or `Set`.
