#!/usr/bin/env node
/**
 * Unit tests for nested YYYY-MM dispatch plan discovery in plan-state.mjs.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, afterEach } from 'node:test';
import {
  collectPlanSearchDirs,
  findPlanBySlug,
  listAllPlans,
  resetPlanStateContextForTests,
} from './plan-state.mjs';

const PLAN_FRONTMATTER = `---
name: Test plan
todos: []
isProject: false
---

# Test plan

## 1. Single concern

Test fixture.
`;

async function makeFixtureHostingRoot() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-nested-discovery-'));
  const hostingRoot = path.join(tmpDir, 'hosting');
  const plansDir = path.join(hostingRoot, '.sedea', 'operations', 'user', 'plans');
  await fs.mkdir(plansDir, { recursive: true });
  await fs.mkdir(path.join(hostingRoot, '.sedea', 'centers', 'sedea'), { recursive: true });

  await fs.writeFile(path.join(plansDir, 'flat_fixture_a1b2.plan.md'), PLAN_FRONTMATTER, 'utf8');

  const roadmapDir = path.join(plansDir, 'roadmap-topics');
  await fs.mkdir(roadmapDir, { recursive: true });
  await fs.writeFile(path.join(roadmapDir, 'roadmap_fixture_c3d4.plan.md'), PLAN_FRONTMATTER, 'utf8');

  const nestedDispatchDir = path.join(plansDir, '2026-08', 'dispatch-nest_e5f6');
  await fs.mkdir(nestedDispatchDir, { recursive: true });
  await fs.writeFile(
    path.join(nestedDispatchDir, 'nested_fixture_b2c3.plan.md'),
    PLAN_FRONTMATTER,
    'utf8',
  );

  // Non-YYYY-MM directory at plans root — must not register as nested dispatch dir.
  const ignoredDir = path.join(plansDir, 'not-a-month-bucket');
  await fs.mkdir(ignoredDir, { recursive: true });
  await fs.writeFile(path.join(ignoredDir, 'ignored_fixture_d4e5.plan.md'), PLAN_FRONTMATTER, 'utf8');

  return hostingRoot;
}

afterEach(() => {
  delete process.env.PLAN_STATE_HOSTING_ROOT;
  resetPlanStateContextForTests();
});

test('collectPlanSearchDirs registers flat, roadmap-topics, and nested dispatch dirs', async () => {
  const hostingRoot = await makeFixtureHostingRoot();
  const plansDir = path.join(hostingRoot, '.sedea', 'operations', 'user', 'plans');
  const dirs = [];
  await collectPlanSearchDirs(plansDir, dirs);

  assert.deepEqual(
    dirs.sort(),
    [
      plansDir,
      path.join(plansDir, 'roadmap-topics'),
      path.join(plansDir, '2026-08', 'dispatch-nest_e5f6'),
    ].sort(),
  );
});

test('listAllPlans unions flat-root, roadmap-topics, and nested dispatch plans', async () => {
  const hostingRoot = await makeFixtureHostingRoot();
  process.env.PLAN_STATE_HOSTING_ROOT = hostingRoot;

  const plans = await listAllPlans();
  const slugs = plans.map((p) => p.slug).sort();

  assert.deepEqual(slugs, [
    'flat_fixture_a1b2',
    'nested_fixture_b2c3',
    'roadmap_fixture_c3d4',
  ]);
});

test('findPlanBySlug resolves nested dispatch plans globally', async () => {
  const hostingRoot = await makeFixtureHostingRoot();
  process.env.PLAN_STATE_HOSTING_ROOT = hostingRoot;

  const nested = await findPlanBySlug('nested_fixture_b2c3');
  assert.ok(nested);
  assert.equal(
    nested.planPath,
    path.join(
      hostingRoot,
      '.sedea',
      'operations',
      'user',
      'plans',
      '2026-08',
      'dispatch-nest_e5f6',
      'nested_fixture_b2c3.plan.md',
    ),
  );

  const flat = await findPlanBySlug('flat_fixture_a1b2');
  assert.ok(flat);
  assert.equal(
    flat.planPath,
    path.join(hostingRoot, '.sedea', 'operations', 'user', 'plans', 'flat_fixture_a1b2.plan.md'),
  );

  const missing = await findPlanBySlug('does_not_exist_z9z9');
  assert.equal(missing, null);
});
