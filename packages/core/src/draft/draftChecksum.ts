/**
 * Draft Checksum Helper (#498)
 *
 * Calculates and verifies checksums for PayrollDraft objects consistently
 * across dashboard and service clients. Mirrors the conventions established
 * by `inspector/intentChecksum.ts` so the two feel identical to consumers
 * working across the SDK.

 * ** Privacy:** the checksum is computed over the canonical draft representation
 * only. Sensitive fields (notes, recipient ids) are included as they appear
 * in the draft but are never logged or returned by this module.
 */

import { sha256Digest } from "../crypto/hashUtils";
import type { PayrollDraft } from "./types";

/**
 * Convert a PayrollDraft into a canonical, deterministic JSON string.
 *
 * Keys are sorted recursively and undefined properties are stripped to
 * prevent key ordering or serialization drift. Array order is preserved
 * because draft entry order is semantically meaningful.
 *
 * @param draft - The PayrollDraft to canonicalize.
 * @returns Deterministic JSON string representation.
 */
export function canonicalizeDraft(draft: PayrollDraft): string {
  return JSON.stringify(draft, (key, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (typeof value === "function" || value === undefined) {
      return undefined;
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const sortedObj: Record<string, unknown> = {};
      const keys = Object.keys(value).sort();
      for (const k of keys) {
        if ((value as Record<string, unknown>)[k] !== undefined) {
          sortedObj[k] = (value as Record<string, unknown>)[k];
        }
      }
      return sortedObj;
    }
    return value;
  });
}

/**
 * Simple, fast synchronous 32-bit FNV-1a hash for synchronous checksums.
 */
function fnv1a32Hex(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Synchronous draft checksum helper using Node crypto or fallback hash.
 *
 * @param draft - The PayrollDraft to hash.
 * @returns Deterministic hex checksum string.
 */
export function computeDraftChecksum(draft: PayrollDraft): string {
  const canonical = canonicalizeDraft(draft);
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    try {
      const crypto = require("crypto");
      return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
    } catch {
      // Fall through to JS implementation
    }
  }
  return fnv1a32Hex(canonical);
}

/**
 * Asynchronous draft checksum helper using standard Web Crypto API SHA-256.
 *
 * @param draft - The PayrollDraft to hash.
 * @returns Promise resolving to a 64-character lowercase SHA-256 hex string.
 */
export async function computeDraftChecksumAsync(draft: PayrollDraft): Promise<string> {
  const canonical = canonicalizeDraft(draft);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  return sha256Digest(data);
}

/**
 * Verifies that a PayrollDraft matches an expected checksum.
 * Prevents accidental modifications or serialization drift across clients.
 *
 * @param draft - The current draft to verify.
 * @param expectedChecksum - The checksum to verify against.
 * @returns `true` if the checksum matches, `false` if modified or tampered.
 */
export function verifyDraftChecksum(draft: PayrollDraft, expectedChecksum: string): boolean {
  if (!expectedChecksum || typeof expectedChecksum !== "string") {
    return false;
  }
  const actual = computeDraftChecksum(draft);
  return actual.toLowerCase().trim() === expectedChecksum.toLowerCase().trim();
}
