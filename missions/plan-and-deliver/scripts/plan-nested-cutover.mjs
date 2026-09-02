/**
 * Phase C nested plans layout cutover gate.
 * Contract: PR 1 ships mechanism; PR 2 sets activeFrom in scope config.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';

/**
 * @param {string} hostingRoot
 * @param {string} operationsScope
 * @returns {Promise<{ configPath: string, activeFrom: string|null }>}
 */
export async function readNestedPlansCutoverConfig(hostingRoot, operationsScope) {
  const configPath = path.join(
    hostingRoot,
    '.sedea',
    'operations',
    operationsScope,
    'plans-nested-cutover.yaml',
  );
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const doc = parseDocument(raw);
    const activeFrom = doc.get('activeFrom');
    if (activeFrom === null || activeFrom === undefined) {
      return { configPath, activeFrom: null };
    }
    const value = String(activeFrom).trim();
    return { configPath, activeFrom: value.length > 0 ? value : null };
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      return { configPath, activeFrom: null };
    }
    throw err;
  }
}

/**
 * True when nested layout cutover is active for the given local calendar day.
 * @param {{ activeFrom: string|null }} config
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isNestedPlansLayoutCutoverActive(config, now = new Date()) {
  if (!config?.activeFrom) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(config.activeFrom);
  if (!match) return false;
  const activeStart = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return todayStart >= activeStart;
}
