#!/usr/bin/env node
/**
 * Unit tests for plan-nested-cutover.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  isNestedPlansLayoutCutoverActive,
  readNestedPlansCutoverConfig,
} from './plan-nested-cutover.mjs';

async function writeCutoverConfig(root, scope, activeFrom) {
  const dir = path.join(root, '.sedea', 'operations', scope);
  await fs.mkdir(dir, { recursive: true });
  const value = activeFrom === null ? 'null' : `"${activeFrom}"`;
  await fs.writeFile(
    path.join(dir, 'plans-nested-cutover.yaml'),
    `# Phase C nested plans layout cutover\nactiveFrom: ${value}\n`,
    'utf8',
  );
}

test('readNestedPlansCutoverConfig returns null activeFrom when file missing', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-cutover-'));
  const config = await readNestedPlansCutoverConfig(root, 'user');
  assert.equal(config.activeFrom, null);
  assert.match(config.configPath, /plans-nested-cutover\.yaml$/);
});

test('isNestedPlansLayoutCutoverActive honors activeFrom date in local TZ', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-cutover-'));
  await writeCutoverConfig(root, 'user', '2026-09-01');
  const config = await readNestedPlansCutoverConfig(root, 'user');
  assert.equal(isNestedPlansLayoutCutoverActive(config, new Date('2026-08-31T23:59:59')), false);
  assert.equal(isNestedPlansLayoutCutoverActive(config, new Date('2026-09-01T08:00:00')), true);
});

test('isNestedPlansLayoutCutoverActive is false when activeFrom is null', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-cutover-'));
  await writeCutoverConfig(root, 'user', null);
  const config = await readNestedPlansCutoverConfig(root, 'user');
  assert.equal(isNestedPlansLayoutCutoverActive(config, new Date('2099-01-01')), false);
});
