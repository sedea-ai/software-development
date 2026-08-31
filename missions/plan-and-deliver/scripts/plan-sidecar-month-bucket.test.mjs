#!/usr/bin/env node
/**
 * Unit tests for plan-sidecar-month-bucket.mjs and init-sidecar integration.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  applyPlansMonthBucketOnFirstWrite,
  derivePlansMonthBucket,
  extractPlansMonthBucketFromPath,
  formatPlansMonthBucketFromTimestamp,
  isFlatRootPlanPath,
} from './plan-sidecar-month-bucket.mjs';
import { Document, YAMLMap, YAMLSeq } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = __dirname;

function runPlanState(args, cwd) {
  return execFileSync(
    process.execPath,
    [path.join(SCRIPTS, 'plan-state.mjs'), ...args],
    { cwd, encoding: 'utf8' },
  );
}

test('extractPlansMonthBucketFromPath reads nested YYYY-MM segment', () => {
  assert.equal(
    extractPlansMonthBucketFromPath(
      '/repo/.sedea/operations/user/plans/2026-08/dispatch-abc1/foo.plan.md',
    ),
    '2026-08',
  );
  assert.equal(
    extractPlansMonthBucketFromPath('/repo/.sedea/operations/user/plans/foo.plan.md'),
    null,
  );
});

test('isFlatRootPlanPath detects direct plans/ children', () => {
  assert.equal(
    isFlatRootPlanPath('/repo/.sedea/operations/user/plans/foo_a1b2.plan.md'),
    true,
  );
  assert.equal(
    isFlatRootPlanPath('/repo/.sedea/operations/user/plans/2026-08/dispatch/foo.plan.md'),
    false,
  );
});

test('derivePlansMonthBucket omits flat-root plans', () => {
  assert.equal(
    derivePlansMonthBucket('/repo/.sedea/operations/user/plans/foo_a1b2.plan.md'),
    null,
  );
});

test('derivePlansMonthBucket uses path for nested layout', () => {
  assert.equal(
    derivePlansMonthBucket(
      '/repo/.sedea/operations/user/plans/2026-03/dispatch-slug/child.plan.md',
    ),
    '2026-03',
  );
});

test('derivePlansMonthBucket uses timestamp fallback for non-flat nested paths', () => {
  const fixed = new Date('2026-08-15T12:00:00');
  assert.equal(
    derivePlansMonthBucket('/repo/.sedea/operations/user/plans/dispatch-only/child.plan.md', {
      now: fixed,
    }),
    '2026-08',
  );
});

test('derivePlansMonthBucket honors plansBasePath when plan path is flat', () => {
  assert.equal(
    derivePlansMonthBucket('/repo/.sedea/operations/user/plans/child.plan.md', {
      plansBasePath: '/repo/.sedea/operations/user/plans/2026-05/my-dispatch',
    }),
    '2026-05',
  );
});

test('formatPlansMonthBucketFromTimestamp uses local calendar month', () => {
  assert.equal(
    formatPlansMonthBucketFromTimestamp(new Date('2026-01-31T23:00:00')),
    '2026-01',
  );
});

test('applyPlansMonthBucketOnFirstWrite is idempotent', () => {
  const doc = new Document({});
  doc.contents = new YAMLMap();
  doc.set('worktrees', new YAMLSeq());
  const planPath = '/repo/.sedea/operations/user/plans/2026-07/slug-a/child.plan.md';
  assert.equal(applyPlansMonthBucketOnFirstWrite(doc, planPath), true);
  assert.equal(doc.get('plansMonthBucket'), '2026-07');
  assert.equal(applyPlansMonthBucketOnFirstWrite(doc, planPath), false);
});

test('init-sidecar writes nested bucket and flat-root omit', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-sidecar-bucket-'));
  const sedeaRoot = path.join(tmpDir, 'hosting');
  const plansDir = path.join(sedeaRoot, '.sedea', 'operations', 'user', 'plans', '2026-09', 'dispatch-a1b2');
  await fs.mkdir(plansDir, { recursive: true });
  const planPath = path.join(plansDir, 'nested_child_a1b2.plan.md');
  await fs.writeFile(planPath, '# nested\n', 'utf8');

  const nestedOut = runPlanState(
    ['init-sidecar', '--plan-path', planPath, '--parent', 'parent_slug'],
    sedeaRoot,
  );
  assert.match(nestedOut, /plansMonthBucket: 2026-09/);
  const nestedSidecar = await fs.readFile(planPath.replace('.plan.md', '.state.yaml'), 'utf8');
  assert.match(nestedSidecar, /plansMonthBucket: 2026-09/);

  const flatDir = path.join(sedeaRoot, '.sedea', 'operations', 'user', 'plans');
  const flatPlan = path.join(flatDir, 'flat_child_b2c3.plan.md');
  await fs.writeFile(flatPlan, '# flat\n', 'utf8');
  const flatOut = runPlanState(
    ['init-sidecar', '--plan-path', flatPlan, '--parent', 'null'],
    sedeaRoot,
  );
  assert.match(flatOut, /flat-root — no plansMonthBucket/);
  const flatSidecar = await fs.readFile(flatPlan.replace('.plan.md', '.state.yaml'), 'utf8');
  assert.doesNotMatch(flatSidecar, /plansMonthBucket:/);
});
