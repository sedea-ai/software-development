#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test, afterEach } from 'node:test';
import {
  resetPlanStateContextForTests,
  resolveRegisteredCenterRepo,
} from './plan-state.mjs';

async function fixture(registry) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'plan-center-registry-'));
  await fs.mkdir(path.join(root, '.sedea', 'centers'), { recursive: true });
  await fs.writeFile(
    path.join(root, '.sedea', 'centers', 'centers.yaml'),
    registry,
    'utf8',
  );
  return root;
}

afterEach(() => resetPlanStateContextForTests());

test('resolves an enabled registered center without requiring its checkout', async () => {
  const root = await fixture(`centers:\n  - slug: sedea-builtin-center-gen2\n    source: git@github.com:sedea-ai/sedea-builtin-center-gen2.git\n    enabled: true\n`);
  assert.equal(await resolveRegisteredCenterRepo('sedea-builtin-center-gen2', root), 'sedea-ai/sedea-builtin-center-gen2');
});

test('fails closed for unknown, disabled, and built-in slugs', async () => {
  const root = await fixture(`centers:\n  - slug: disabled\n    source: git@github.com:org/disabled.git\n    enabled: false\n`);
  assert.equal(await resolveRegisteredCenterRepo('unknown', root), null);
  assert.equal(await resolveRegisteredCenterRepo('disabled', root), null);
  assert.equal(await resolveRegisteredCenterRepo('sedea', root), null);
});

test('ignores malformed registry remotes', async () => {
  const root = await fixture(`centers:\n  - slug: malformed\n    source: file:///tmp/not-github\n    enabled: true\n`);
  assert.equal(await resolveRegisteredCenterRepo('malformed', root), null);
});