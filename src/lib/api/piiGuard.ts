// PII Guard - Development safeguard to prevent PII from being sent to cloud
// This module scans API payloads for prohibited keys and patterns

const PII_KEYS = new Set([
  'name',
  'localId',
  'studentName',
  'student_name',
  'fullName',
  'district_student_id',
  'firstName',
  'lastName',
  'first_name',
  'last_name',
]);

export class PIIViolationError extends Error {
  constructor(public forbiddenKeys: string[]) {
    super(`PII keys not allowed in cloud requests: ${forbiddenKeys.join(', ')}`);
    this.name = 'PIIViolationError';
  }
}

/**
 * Deep scan for PII keys in nested objects
 */
function scanForPII(obj: any, path: string = ''): string[] {
  const violations: string[] = [];

  if (obj === null || obj === undefined) return violations;

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;

      // Check if key itself is PII
      if (PII_KEYS.has(key)) {
        violations.push(fullPath);
      }

      // Recursively check nested objects
      if (typeof value === 'object' && value !== null) {
        violations.push(...scanForPII(value, fullPath));
      }
    }
  }

  return violations;
}

/**
 * Validate that a payload does not contain PII
 * Throws PIIViolationError if PII is detected
 */
export function validateNoPII(payload: Record<string, unknown>): void {
  const violations = scanForPII(payload);
  if (violations.length > 0) {
    throw new PIIViolationError(violations);
  }
}

/**
 * Check if development mode PII guard is enabled
 */
export function isPIIGuardEnabled(): boolean {
  // Enable in development by default (when not in production)
  // Can be disabled by setting window.__DISABLE_PII_GUARD = true
  const isProduction = process.env.NODE_ENV === 'production';
  const isDisabled = typeof window !== 'undefined' && (window as any).__DISABLE_PII_GUARD === true;
  return !isProduction && !isDisabled;
}

/**
 * Wrap fetch to automatically check for PII (development only)
 */
export function guardedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Only guard in development mode
  if (isPIIGuardEnabled() && options?.body) {
    try {
      const body = JSON.parse(options.body as string);
      validateNoPII(body);
    } catch (err) {
      if (err instanceof PIIViolationError) {
        console.error('🚨 PII GUARD: Blocked request with PII', {
          url,
          violations: err.forbiddenKeys,
        });
        throw err;
      }
      // Not JSON or other error, continue
    }
  }

  return fetch(url, options);
}
