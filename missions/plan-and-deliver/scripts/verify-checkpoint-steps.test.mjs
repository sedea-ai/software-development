#!/usr/bin/env node
/**
 * Unit tests for verify-checkpoint-steps.mjs scaffold.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = __dirname;
const hostingRoot = process.env.HOSTING_ROOT
  ? path.resolve(process.env.HOSTING_ROOT)
  : path.resolve(SCRIPTS, '../../../../../..');

function runScript(args = []) {
  return execFileSync(process.execPath, [path.join(SCRIPTS, 'verify-checkpoint-steps.mjs'), ...args], {
    cwd: hostingRoot,
    encoding: 'utf8',
  });
}

function runScriptExit(args = []) {
  try {
    execFileSync(process.execPath, [path.join(SCRIPTS, 'verify-checkpoint-steps.mjs'), ...args], {
      cwd: hostingRoot,
      stdio: 'pipe',
    });
    return 0;
  } catch (err) {
    return err.status ?? 1;
  }
}

function section(body, startHeading, endHeading) {
  const start = body.indexOf(startHeading);
  const end = body.indexOf(endHeading, start + startHeading.length);
  assert.notEqual(start, -1, `missing section: ${startHeading}`);
  assert.notEqual(end, -1, `missing section boundary: ${endHeading}`);
  return body.slice(start, end);
}

test('default warn-only exits 0 and scans governance files', () => {
  const out = runScript();
  assert.match(out, /verify-checkpoint-steps:/);
  assert.match(out, /(\d+ governance file\(s\) scanned|warn-only)/);
  assert.doesNotMatch(out, /^ERROR:/m);
});

test('coding-session fast-paths built-in pin rejection into After deploy', async () => {
  const skillPath = path.resolve(SCRIPTS, '../skills/coding-session/SKILL.md');
  const body = await fs.readFile(skillPath, 'utf8');
  const chain = section(
    body,
    '### Post-merge Checkpoint chain (binding)',
    '## Pre-worktree validation (plan completeness)',
  );
  const cleanup = section(
    body,
    '### Post-merge workspace cleanup',
    '### After deploy deploy-walk handoff',
  );

  assert.match(chain, /terminal \*\*`skipped` \/ `not-applicable`\*\*/);
  assert.match(chain, /Do \*\*not\*\* run gitlink, submodule, registry, remote-tip, or alignment inspection/);
  assert.match(chain, /Continue immediately to step \*\*3\*\* in the \*\*same assistant turn\*\*/);
  assert.doesNotMatch(cleanup, /on the \*\*next\*\* turn/i);
  assert.match(cleanup, /do not StreamFinal after cleanup \*\*`--apply`\*\*/i);
});

test('--enforce exits 1 on fixture violation', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-checkpoint-steps-'));
  const skillDir = path.join(tmpDir, '.sedea/centers/sedea/missions/fixture/skills/fixture');
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    '# Fixture\n\nTell me when you are done reviewing the PR.\n',
    'utf8',
  );
  const pathsFile = path.join(tmpDir, 'paths.txt');
  await fs.writeFile(
    pathsFile,
    '.sedea/centers/sedea/missions/fixture/skills/fixture/SKILL.md\n',
    'utf8',
  );

  let exitCode = 0;
  try {
    execFileSync(
      process.execPath,
      [path.join(SCRIPTS, 'verify-checkpoint-steps.mjs'), '--enforce', '--paths-file', pathsFile],
      { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (err) {
    exitCode = err.status ?? 1;
    assert.match(String(err.stderr ?? err.stdout), /tell-me-when/i);
  }
  assert.equal(exitCode, 1);
});

test('documentation table rows are exempt', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-checkpoint-steps-doc-'));
  const skillDir = path.join(tmpDir, '.sedea/centers/sedea/missions/fixture/skills/fixture');
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    '| Anti-pattern | Why |\n| tell me when | Forbidden |\n',
    'utf8',
  );
  const pathsFile = path.join(tmpDir, 'paths.txt');
  await fs.writeFile(
    pathsFile,
    '.sedea/centers/sedea/missions/fixture/skills/fixture/SKILL.md\n',
    'utf8',
  );
  const out = execFileSync(
    process.execPath,
    [path.join(SCRIPTS, 'verify-checkpoint-steps.mjs'), '--paths-file', pathsFile],
    { cwd: tmpDir, encoding: 'utf8' },
  );
  assert.match(out, /0 pattern hit/);
});

test('warn-only exits 0 even when hits exist on hosting repo', () => {
  assert.equal(runScriptExit(), 0);
});

test('--enforce passes required binding anchors on software-development center', async () => {
  const centerRoot = path.resolve(SCRIPTS, '../../..');
  const out = execFileSync(
    process.execPath,
    [path.join(SCRIPTS, 'verify-checkpoint-steps.mjs'), '--enforce'],
    { cwd: centerRoot, encoding: 'utf8' },
  );
  assert.match(out, /0 pattern hit/);
  const planBody = await fs.readFile(
    path.join(centerRoot, 'missions/plan-and-deliver/plan.mdc'),
    'utf8',
  );
  assert.match(planBody, /Child registry is not completion evidence/);
});
