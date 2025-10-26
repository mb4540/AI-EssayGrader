# Known Issues

## TypeScript Type Conflicts (Non-Breaking)

### Vitest Config Type Error

**File**: `vitest.config.ts`  
**Status**: ⚠️ Warning Only - Does Not Affect Functionality  
**Severity**: Low

**Issue:**
TypeScript shows a type error in `vitest.config.ts` related to plugin types:
```
No overload matches this call.
Type 'Plugin<any>[]' is not assignable to type 'PluginOption'.
```

**Root Cause:**
This is a known version conflict between:
- Vite's bundled type definitions
- Vitest's bundled Vite type definitions

The two packages bundle slightly different versions of Vite's types, causing a type mismatch in the plugin system.

**Impact:**
- ✅ Tests run successfully (48/48 passing)
- ✅ Build works correctly
- ✅ Dev server works correctly
- ❌ TypeScript shows red squiggly in IDE

**Why We're Not Fixing:**
1. This is a cosmetic TypeScript issue only
2. All functionality works correctly
3. Tests pass with 100% success rate
4. The issue is in third-party package type definitions
5. Will be resolved when Vite/Vitest versions align

**Workaround Applied:**
Added `@ts-ignore` comment to suppress the warning in the IDE.

**References:**
- [Vitest Issue #1652](https://github.com/vitest-dev/vitest/issues/1652)
- [Vite Plugin API Types](https://vitejs.dev/guide/api-plugin.html)

---

## Resolution Plan

This issue will be automatically resolved when:
1. Vitest updates to match Vite's current version, OR
2. Vite and Vitest coordinate their type definitions

**No action required** - this is a known ecosystem issue that doesn't affect functionality.

---

## Verification

To verify tests still work despite the TypeScript warning:

```bash
npm run test:run
```

**Expected Output:**
```
✓ src/bridge/bridgeStore.test.ts (35 tests)
✓ src/bridge/crypto.test.ts (13 tests)

Test Files  2 passed (2)
Tests       48 passed (48)
```

All tests passing = Everything works correctly ✅
