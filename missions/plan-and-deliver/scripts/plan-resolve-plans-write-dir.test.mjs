#!/usr/bin/env node
/**
 * Unit tests for plan-resolve-plans-write-dir.mjs and resolve-plans-write-dir integration.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  deriveFlatPlansRootFromPath,
  isNestedPlansWriteDir,
  isValidPlansWriteDir,
  resolvePlansWriteDir,
} from './plan-resolve-plans-write-dir.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = __dirname;

function runPlanState(args, cwd) {
  return execFileSync(process.execPath, [path.join(SCRIPTS, 'plan-state.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('isValidPlansWriteDir accepts flat and nested dispatch folders', () => {
  assert.equal(isValidPlansWriteDir('/repo/.sedea/operations/user/plans'), true);
  assert.equal(
    isValidPlansWriteDir('/repo/.sedea/operations/user/plans/2026-08/my-dispatch-abc1'),
    true,
  );
  assert.equal(isValidPlansWriteDir('/repo/.sedea/operations/user/plans/2026-08'), false);
  assert.equal(isValidPlansWriteDir('/repo/.sedea/operations/user/docs'), false);
  assert.equal(isValidPlansWriteDir('relative/plans'), false);
});

test('deriveFlatPlansRootFromPath extracts scope plans root', () => {
  assert.equal(
    deriveFlatPlansRootFromPath('/repo/.sedea/operations/user/plans/foo.plan.md'),
    '/repo/.sedea/operations/user/plans',
  );
  assert.equal(
    deriveFlatPlansRootFromPath('/repo/.sedea/operations/user/plans/2026-08/dispatch/foo.plan.md'),
    '/repo/.sedea/operations/user/plans',
  );
});

test('resolvePlansWriteDir honors explicit plansBasePath', () => {
  const nested = '/repo/.sedea/operations/user/plans/2026-05/my-dispatch';
  const result = resolvePlansWriteDir({
    plansBasePath: nested,
    targetPlanPath: '/repo/.sedea/operations/user/plans/flat.plan.md',
  });
  assert.equal(result.writeDir, nested);
  assert.equal(result.source, 'plansBasePath');
  assert.equal(result.plansBasePath, nested);
});

test('resolvePlansWriteDir falls back to targetPlanPath dirname', () => {
  const target = '/repo/.sedea/operations/user/plans/2026-07/dispatch-slug/2_child.plan.md';
  const result = resolvePlansWriteDir({ targetPlanPath: target });
  assert.equal(result.writeDir, '/repo/.sedea/operations/user/plans/2026-07/dispatch-slug');
  assert.equal(result.source, 'targetPlanPath');
  assert.equal(result.plansBasePath, '/repo/.sedea/operations/user/plans/2026-07/dispatch-slug');
});

test('resolvePlansWriteDir falls back to parentPlanPath dirname', () => {
  const parent = '/repo/.sedea/operations/user/plans/parent_a1b2.plan.md';
  const result = resolvePlansWriteDir({ parentPlanPath: parent });
  assert.equal(result.writeDir, '/repo/.sedea/operations/user/plans');
  assert.equal(result.source, 'parentPlanPath');
  assert.equal(result.plansBasePath, null);
});

test('resolvePlansWriteDir uses flatPlansRoot last', () => {
  const flat = '/repo/.sedea/operations/user/plans';
  const result = resolvePlansWriteDir({ flatPlansRoot: flat });
  assert.equal(result.writeDir, flat);
  assert.equal(result.source, 'flatPlansRoot');
  assert.equal(result.plansBasePath, null);
});

test('isNestedPlansWriteDir detects dispatch folders only', () => {
  assert.equal(isNestedPlansWriteDir('/repo/.sedea/operations/user/plans/2026-08/dispatch'), true);
  assert.equal(isNestedPlansWriteDir('/repo/.sedea/operations/user/plans'), false);
});

test('plan-state resolve-plans-write-dir emits JSON', () => {
  const out = runPlanState(
    [
      'resolve-plans-write-dir',
      '--json',
      '--plans-base-path',
      '/tmp/host/.sedea/operations/user/plans/2026-09/dispatch-x',
    ],
    '/tmp',
  );
  const parsed = JSON.parse(out.trim());
  assert.equal(parsed.source, 'plansBasePath');
  assert.equal(parsed.writeDir, '/tmp/host/.sedea/operations/user/plans/2026-09/dispatch-x');
  assert.equal(parsed.plansBasePath, parsed.writeDir);
});
