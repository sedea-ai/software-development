/**
 * Derive plansMonthBucket (YYYY-MM) for operations plan sidecars at first write.
 * Contract: Phase A plans subfolder rollout — nested layout audit field; flat-root omit.
 */

const MONTH_BUCKET_SEGMENT = /^(\d{4}-\d{2})$/;

/**
 * Format a Date as YYYY-MM in the runtime local timezone (developer machine TZ).
 * @param {Date} [date]
 * @returns {string}
 */
export function formatPlansMonthBucketFromTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Extract YYYY-MM from an absolute path when it appears as .../plans/YYYY-MM/...
 * @param {string} absolutePath
 * @returns {string|null}
 */
export function extractPlansMonthBucketFromPath(absolutePath) {
  if (typeof absolutePath !== 'string' || absolutePath.length === 0) return null;
  const normalized = absolutePath.replace(/\\/g, '/');
  const marker = '/plans/';
  let idx = normalized.indexOf(marker);
  while (idx >= 0) {
    const afterPlans = normalized.slice(idx + marker.length);
    const segment = afterPlans.split('/')[0];
    if (MONTH_BUCKET_SEGMENT.test(segment)) {
      return segment;
    }
    idx = normalized.indexOf(marker, idx + marker.length);
  }
  return null;
}

/**
 * True when the plan file lives directly under a directory named `plans`.
 * @param {string} planPath absolute .plan.md path
 */
export function isFlatRootPlanPath(planPath) {
  if (typeof planPath !== 'string') return false;
  const parts = planPath.replace(/\\/g, '/').split('/');
  const plansIdx = parts.lastIndexOf('plans');
  if (plansIdx < 0) return false;
  return parts.length === plansIdx + 2;
}

/**
 * Resolve plansMonthBucket for a new sidecar first write.
 * - Nested path .../plans/YYYY-MM/... → bucket from path
 * - Flat root .../plans/<slug>.plan.md → omit (null)
 * - Other nested paths without YYYY-MM segment → timestamp fallback (local TZ)
 *
 * @param {string} planPath absolute .plan.md path
 * @param {{ now?: Date, plansBasePath?: string|null }} [options]
 * @returns {string|null} YYYY-MM to persist, or null to omit the sidecar key
 */
export function derivePlansMonthBucket(planPath, options = {}) {
  const { now = new Date(), plansBasePath = null } = options;

  const fromPlan = extractPlansMonthBucketFromPath(planPath);
  if (fromPlan) return fromPlan;

  if (typeof plansBasePath === 'string' && plansBasePath.length > 0) {
    const fromBase = extractPlansMonthBucketFromPath(plansBasePath);
    if (fromBase) return fromBase;
    return formatPlansMonthBucketFromTimestamp(now);
  }

  if (isFlatRootPlanPath(planPath)) {
    return null;
  }

  return formatPlansMonthBucketFromTimestamp(now);
}

/**
 * Apply first-write plansMonthBucket to a sidecar YAML document when absent.
 * Idempotent: never overwrites an existing key.
 *
 * @param {import('yaml').Document} doc
 * @param {string} planPath
 * @param {{ sidecarExisted?: boolean, now?: Date, plansBasePath?: string|null }} [options]
 * @returns {boolean} true when the doc was mutated
 */
export function applyPlansMonthBucketOnFirstWrite(doc, planPath, options = {}) {
  if (doc.has('plansMonthBucket')) {
    return false;
  }
  const bucket = derivePlansMonthBucket(planPath, options);
  if (bucket === null) {
    return false;
  }
  doc.set('plansMonthBucket', bucket);
  return true;
}
