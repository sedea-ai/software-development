#!/usr/bin/env node
/**
 * Unit tests for plan-dispatch-intake.mjs and dispatch-intake CLI integration.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  computePlansBasePath,
  deriveDispatchIntake,
  deriveUniqueDispatchSlug,
  formatDispatchSlug,
  listExistingDispatchSlugs,
  randomDispatchHexSuffix,
  toKebabDispatchTitle,
} from './plan-dispatch-intake.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = __dirname;

function runPlanState(args, cwd) {
  return execFileSync(process.execPath, [path.join(SCRIPTS, 'plan-state.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

async function makeHostingRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-dispatch-intake-'));
  const plansDir = path.join(root, '.sedea', 'operations', 'user', 'plans');
  await fs.mkdir(path.join(plansDir, '2026-08', 'existing-dispatch_a1b2'), { recursive: true });
  return root;
}

async function writeActiveCutover(root) {
  const dir = path.join(root, '.sedea', 'operations', 'user');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'plans-nested-cutover.yaml'),
    'activeFrom: "2020-01-01"\n',
    'utf8',
  );
}

test('toKebabDispatchTitle normalizes punctuation and casing', () => {
  assert.equal(toKebabDispatchTitle('  Plans Subfolder Organization  '), 'plans-subfolder-organization');
  assert.equal(toKebabDispatchTitle('Squad Leader — Nested Intake!'), 'squad-leader-nested-intake');
});

test('deriveUniqueDispatchSlug avoids existing dispatch folders', () => {
  let call = 0;
  const slug = deriveUniqueDispatchSlug(
    'new-feature',
    new Set(['new-feature_abcd']),
    () => {
      call += 1;
      return call === 1 ? Buffer.from([0xab, 0xcd]) : Buffer.from([0xef, 0x01]);
    },
  );
  assert.equal(slug, 'new-feature_ef01');
  assert.equal(formatDispatchSlug('new-feature', randomDispatchHexSuffix(() => Buffer.from([0xab, 0xcd]))), 'new-feature_abcd');
});

test('computePlansBasePath builds nested dispatch folder under local month bucket', () => {
  const now = new Date('2026-05-15T12:00:00');
  const plansBasePath = computePlansBasePath({
    hostingRoot: '/repo/hosting',
    operationsScope: 'user',
    dispatchSlug: 'plans-subfolder_dc31',
    now,
  });
  assert.equal(
    plansBasePath,
    '/repo/hosting/.sedea/operations/user/plans/2026-05/plans-subfolder_dc31',
  );
});

test('listExistingDispatchSlugs scans YYYY-MM dispatch dirs only', async () => {
  const root = await makeHostingRoot();
  const plansDir = path.join(root, '.sedea', 'operations', 'user', 'plans');
  await fs.mkdir(path.join(plansDir, 'ignored-dir'), { recursive: true });
  const slugs = await listExistingDispatchSlugs(plansDir);
  assert.deepEqual([...slugs].sort(), ['existing-dispatch_a1b2']);
});

test('deriveDispatchIntake rejects when cutover inactive', async () => {
  const root = await makeHostingRoot();
  await assert.rejects(
    () =>
      deriveDispatchIntake({
        title: 'Feature Alpha',
        hostingRoot: root,
        now: new Date('2026-08-30T12:00:00'),
      }),
    /cutover is not active/,
  );
});

test('deriveDispatchIntake returns slug and plansBasePath when cutover active', async () => {
  const root = await makeHostingRoot();
  await writeActiveCutover(root);
  const result = await deriveDispatchIntake({
    title: 'Feature Alpha',
    hostingRoot: root,
    now: new Date('2026-08-30T12:00:00'),
    randomFn: () => Buffer.from([0x12, 0x34]),
  });
  assert.equal(result.dispatchSlug, 'feature-alpha_1234');
  assert.equal(result.plansMonthBucket, '2026-08');
  assert.equal(
    result.plansBasePath,
    path.join(root, '.sedea/operations/user/plans/2026-08/feature-alpha_1234'.replace(/\//g, path.sep)),
  );
});

test('plan-state dispatch-intake CLI emits JSON payload', async () => {
  const root = await makeHostingRoot();
  await writeActiveCutover(root);
  const stdout = runPlanState(
    [
      'dispatch-intake',
      '--title',
      'CLI Feature',
      '--hosting-root',
      root,
      '--operations-scope',
      'user',
      '--json',
      '--hex-suffix',
      'c0ff',
    ],
    root,
  );
  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.dispatchSlug, 'cli-feature_c0ff');
  assert.equal(parsed.cutoverActive, true);
  assert.match(parsed.plansBasePath, /2026-\d{2}\/cli-feature_c0ff$/);
});
