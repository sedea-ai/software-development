/**
 * Squad Leader nested dispatch intake — derive unique dispatch slug and plansBasePath.
 * Contract: Phase C PRD §5.2 — kebab title + 4hex suffix under plans/YYYY-MM/<slug>/.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { formatPlansMonthBucketFromTimestamp } from './plan-sidecar-month-bucket.mjs';
import { isValidPlansWriteDir } from './plan-resolve-plans-write-dir.mjs';
import {
  isNestedPlansLayoutCutoverActive,
  readNestedPlansCutoverConfig,
} from './plan-nested-cutover.mjs';

const MONTH_BUCKET_DIR = /^\d{4}-\d{2}$/;

/**
 * @param {string} title
 * @returns {string}
 */
export function toKebabDispatchTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('dispatch title is required');
  }
  const kebab = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (kebab.length === 0) {
    throw new Error('dispatch title must contain at least one alphanumeric character');
  }
  return kebab.slice(0, 64);
}

/**
 * @param {() => Buffer} [randomFn]
 * @returns {string}
 */
export function randomDispatchHexSuffix(randomFn = () => randomBytes(2)) {
  return randomFn().toString('hex').slice(0, 4);
}

/**
 * @param {string} kebabTitle
 * @param {string} hexSuffix
 * @returns {string}
 */
export function formatDispatchSlug(kebabTitle, hexSuffix) {
  return `${kebabTitle}_${hexSuffix}`;
}

/**
 * @param {string} plansDir absolute `.sedea/operations/<scope>/plans`
 * @returns {Promise<Set<string>>}
 */
export async function listExistingDispatchSlugs(plansDir) {
  const taken = new Set();
  let monthEntries;
  try {
    monthEntries = await fs.readdir(plansDir, { withFileTypes: true });
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      return taken;
    }
    throw err;
  }
  for (const monthEntry of monthEntries) {
    if (!monthEntry.isDirectory() || !MONTH_BUCKET_DIR.test(monthEntry.name)) continue;
    const monthDir = path.join(plansDir, monthEntry.name);
    let dispatchEntries;
    try {
      dispatchEntries = await fs.readdir(monthDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const dispatchEntry of dispatchEntries) {
      if (dispatchEntry.isDirectory()) {
        taken.add(dispatchEntry.name);
      }
    }
  }
  return taken;
}

/**
 * @param {string} kebabTitle
 * @param {Set<string>} existingSlugs
 * @param {() => Buffer} [randomFn]
 * @param {number} [maxAttempts]
 * @returns {string}
 */
export function deriveUniqueDispatchSlug(
  kebabTitle,
  existingSlugs,
  randomFn = () => randomBytes(2),
  maxAttempts = 32,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const slug = formatDispatchSlug(kebabTitle, randomDispatchHexSuffix(randomFn));
    if (!existingSlugs.has(slug)) {
      return slug;
    }
  }
  throw new Error(`could not derive unique dispatch slug for "${kebabTitle}" after ${maxAttempts} attempts`);
}

/**
 * @param {{
 *   hostingRoot: string,
 *   operationsScope: string,
 *   dispatchSlug: string,
 *   now?: Date,
 * }} args
 * @returns {string}
 */
export function computePlansBasePath({ hostingRoot, operationsScope, dispatchSlug, now = new Date() }) {
  const monthBucket = formatPlansMonthBucketFromTimestamp(now);
  const resolved = path.resolve(
    hostingRoot,
    '.sedea',
    'operations',
    operationsScope,
    'plans',
    monthBucket,
    dispatchSlug,
  );
  if (!isValidPlansWriteDir(resolved)) {
    throw new Error(`computed plansBasePath is invalid: ${resolved}`);
  }
  return resolved;
}

/**
 * @param {{
 *   title: string,
 *   hostingRoot: string,
 *   operationsScope?: string,
 *   now?: Date,
 *   requireCutover?: boolean,
 *   randomFn?: () => Buffer,
 * }} args
 * @returns {Promise<{
 *   cutoverActive: boolean,
 *   dispatchSlug: string,
 *   dispatchTitleKebab: string,
 *   plansMonthBucket: string,
 *   plansBasePath: string,
 *   flatPlansRoot: string,
 * }>}
 */
export async function deriveDispatchIntake(args) {
  const {
    title,
    hostingRoot,
    operationsScope = 'user',
    now = new Date(),
    requireCutover = true,
    randomFn = () => randomBytes(2),
  } = args;

  const cutoverConfig = await readNestedPlansCutoverConfig(hostingRoot, operationsScope);
  const cutoverActive = isNestedPlansLayoutCutoverActive(cutoverConfig, now);
  if (requireCutover && !cutoverActive) {
    throw new Error(
      `nested plans layout cutover is not active (config: ${cutoverConfig.configPath}; activeFrom: ${cutoverConfig.activeFrom ?? 'null'})`,
    );
  }

  const dispatchTitleKebab = toKebabDispatchTitle(title);
  const flatPlansRoot = path.resolve(
    hostingRoot,
    '.sedea',
    'operations',
    operationsScope,
    'plans',
  );
  const existingSlugs = await listExistingDispatchSlugs(flatPlansRoot);
  const dispatchSlug = deriveUniqueDispatchSlug(dispatchTitleKebab, existingSlugs, randomFn);
  const plansMonthBucket = formatPlansMonthBucketFromTimestamp(now);
  const plansBasePath = computePlansBasePath({
    hostingRoot,
    operationsScope,
    dispatchSlug,
    now,
  });

  return {
    cutoverActive,
    dispatchSlug,
    dispatchTitleKebab,
    plansMonthBucket,
    plansBasePath,
    flatPlansRoot,
  };
}
