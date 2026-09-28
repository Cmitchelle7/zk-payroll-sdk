# Draft Checksum Helper

Calculate and verify checksums for `PayrollDraft` objects consistently across dashboard and service clients.

## Usage

```typescript
import {
  canonicalizeDraft,
  computeDraftChecksum,
  computeDraftChecksumAsync,
  verifyDraftChecksum,
} from "@zk-payroll/core";

// compute and compare signatures
const cs = computeDraftChecksum(draft);

const ok = verifyDraftChecksum(draft, cs);
```

## API

| Function                      | Returns                 | Description                                    |
| ----------------------------- | ----------------------- | ----------------------------------------------- |
| `canonicalizeDraft(draft)`      | `string`                 | Canonical, deterministic JSON representation     |
| `computeDraftChecksum(draft)`  | `string`                 | Sync SHA-256 hex (Node) or FNV-1a fallback     |
| `computeDraftChecksumAsync` | `Promise<string>`        | Async SHA-256 hex (Web Crypto)                  |
| `verifyDraftChecksum`         | `boolean`                | Trim + lowercase tolerant match             |

## Privacy

The checksum is computed over the canonical draft representation only. Sensitive
fields (notes, recipient ids) are included as they appear in the draft but are
never logged or returned by this module.

## Consistency guarantees

- Keys are sorted recursively, so key order does not affect the checksum
- Array order is preserved because draft entry order is semantically meaningful
- `undefined` optional fields are stripped from the canonical form
- `bigint` values are stringified before hashing

## Error handling

`verifyDraftChecksum` returns `false` for any of the following:

- a mismatching checksum
- an empty or non-string expected value

Callers should treat `false` as a signal to reject the draft and re-fetch from the source of truth.
