/**
 * Resolve absolute plans write directory for plan-and-deliver core planners.
 * Contract: Phase A plans subfolder rollout — honor optional plansBasePath handover
 * with flat plans root fallback.
 */

import path from 'node:path';

const FLAT_PLANS_ROOT_RE = /^(.*\/\.sedea\/operations\/[^/]+\/plans)$/;
const NESTED_PLANS_WRITE_DIR_RE =
  /^(.*\/\.sedea\/operations\/[^/]+\/plans\/\d{4}-\d{2}\/[^/]+)$/;

/**
 * @param {string} absolutePath
 * @returns {boolean}
 */
export function isValidPlansWriteDir(absolutePath) {
  if (typeof absolutePath !== 'string' || !path.isAbsolute(absolutePath)) return false;
  const normalized = path.resolve(absolutePath).replace(/\\/g, '/');
  return FLAT_PLANS_ROOT_RE.test(normalized) || NESTED_PLANS_WRITE_DIR_RE.test(normalized);
}

/**
 * Derive the flat `.sedea/operations/<scope>/plans` root from any absolute path under operations.
 * @param {string} absolutePath
 * @returns {string|null}
 */
export function deriveFlatPlansRootFromPath(absolutePath) {
  if (typeof absolutePath !== 'string' || absolutePath.length === 0) return null;
  const normalized = path.resolve(absolutePath).replace(/\\/g, '/');
  const match = normalized.match(/^(.*\/\.sedea\/operations\/[^/]+\/plans)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * True when writeDir is a nested dispatch folder (`plans/YYYY-MM/<dispatch-slug>/`).
 * @param {string} writeDir
 * @returns {boolean}
 */
export function isNestedPlansWriteDir(writeDir) {
  if (typeof writeDir !== 'string') return false;
  const normalized = path.resolve(writeDir).replace(/\\/g, '/');
  return NESTED_PLANS_WRITE_DIR_RE.test(normalized);
}

/**
 * Resolve plans write directory for core planner skills.
 *
 * Priority:
 * 1. `plansBasePath` explicit handover (absolute, valid under operations plans tree)
 * 2. `targetPlanPath` dirname when absolute
 * 3. `parentPlanPath` dirname when absolute
 * 4. `flatPlansRoot` fallback (typically from plan-state / hosting resolve)
 *
 * @param {{
 *   plansBasePath?: string|null,
 *   targetPlanPath?: string|null,
 *   parentPlanPath?: string|null,
 *   flatPlansRoot?: string|null,
 * }} [options]
 * @returns {{
 *   writeDir: string|null,
 *   source: 'plansBasePath'|'targetPlanPath'|'parentPlanPath'|'flatPlansRoot'|'none',
 *   plansBasePath: string|null,
 * }}
 */
export function resolvePlansWriteDir(options = {}) {
  const {
    plansBasePath = null,
    targetPlanPath = null,
    parentPlanPath = null,
    flatPlansRoot = null,
  } = options;

  if (typeof plansBasePath === 'string' && plansBasePath.length > 0) {
    const resolved = path.resolve(plansBasePath);
    if (isValidPlansWriteDir(resolved)) {
      return {
        writeDir: resolved,
        source: 'plansBasePath',
        plansBasePath: resolved,
      };
    }
  }

  if (typeof targetPlanPath === 'string' && targetPlanPath.length > 0) {
    const resolved = path.resolve(targetPlanPath);
    if (path.isAbsolute(resolved)) {
      const dir = path.dirname(resolved);
      if (isValidPlansWriteDir(dir)) {
        return {
          writeDir: dir,
          source: 'targetPlanPath',
          plansBasePath: isNestedPlansWriteDir(dir) ? dir : null,
        };
      }
    }
  }

  if (typeof parentPlanPath === 'string' && parentPlanPath.length > 0) {
    const resolved = path.resolve(parentPlanPath);
    if (path.isAbsolute(resolved)) {
      const dir = path.dirname(resolved);
      if (isValidPlansWriteDir(dir)) {
        return {
          writeDir: dir,
          source: 'parentPlanPath',
          plansBasePath: isNestedPlansWriteDir(dir) ? dir : null,
        };
      }
    }
  }

  if (typeof flatPlansRoot === 'string' && flatPlansRoot.length > 0) {
    const resolved = path.resolve(flatPlansRoot);
    if (isValidPlansWriteDir(resolved)) {
      return {
        writeDir: resolved,
        source: 'flatPlansRoot',
        plansBasePath: null,
      };
    }
  }

  return { writeDir: null, source: 'none', plansBasePath: null };
}
