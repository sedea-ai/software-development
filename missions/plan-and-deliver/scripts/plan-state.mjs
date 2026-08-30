#!/usr/bin/env node
// Operations plan sidecar writer for Software Development plan-and-deliver (lifecycle + archive fields).
// Normative contract: `.sedea/centers/sedea/rules/8_operations-plan-sidecar-contract.mdc`
// Invoked by: coding-session skill, plan-reconcile, efficient-pr-shipping commit-and-push cadence, hosting repo automation.
// Design contract: Sedea `.sedea/operations/` plan union across dispatch-scoped plan directories.

/** Plan lifecycle dot values (American spelling `canceled`). See rule 8 § Lifecycle. */
const PLAN_BOARD_STATUSES = new Set(['not_started', 'started', 'completed', 'canceled']);

import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseDocument, Document, YAMLMap, YAMLSeq, isMap, isSeq } from 'yaml';
import { applyPlansMonthBucketOnFirstWrite } from './plan-sidecar-month-bucket.mjs';
import {
  deriveFlatPlansRootFromPath,
  resolvePlansWriteDir,
} from './plan-resolve-plans-write-dir.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Repo root containing `.sedea/` (hosting repo). */
let SEDEA_REPO_ROOT = null;
/** Absolute plan directories (all operations scopes; non-joint scopes before joint). */
let SEDEA_PLAN_DIRS = null;

// ---------- small utils ----------

function die(msg, code = 1) {
  process.stderr.write(`plan-state: ${msg}\n`);
  process.exit(code);
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function fileExists(p) {
  try {
    const s = await fs.stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirExists(p) {
  try {
    const s = await fs.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

function pathExistsSync(p) {
  try {
    fsSync.statSync(p);
    return true;
  } catch {
    return false;
  }
}

function findSedeaRepoRoot(startDir) {
  let cur = path.resolve(startDir);
  const { root } = path.parse(cur);
  while (true) {
    const sedea = path.join(cur, '.sedea');
    try {
      if (fsSync.statSync(sedea).isDirectory()) return cur;
    } catch {
      /* not found */
    }
    if (cur === root) return null;
    cur = path.dirname(cur);
  }
}

function spawnGitOutput(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      resolve({ ok: false, stdout: stdout.trim(), stderr: err.message, code: -1 });
    });
    child.on('close', (code) => {
      if (code !== 0) {
        resolve({ ok: false, stdout: stdout.trim(), stderr: stderr.trim(), code });
      } else {
        resolve({ ok: true, stdout: stdout.trim(), stderr: stderr.trim(), code: 0 });
      }
    });
  });
}

async function listOperationsScopeSegments(repoRoot) {
  const ops = path.join(repoRoot, '.sedea', 'operations');
  const targetScope = '8f4a2c1e-6b3d-4a9f-8e1c-2d5f7a9b0c4d';
  let entries;
  try {
    entries = await fs.readdir(ops, { withFileTypes: true });
  } catch {
    return [];
  }
  const scopes = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const preferred = scopes.includes(targetScope) ? [targetScope] : [];
  const remainder = scopes
    .filter((scope) => scope !== targetScope && scope !== 'joint')
    .sort((a, b) => a.localeCompare(b));
  const joint = scopes.includes('joint') ? ['joint'] : [];
  return [...preferred, ...remainder, ...joint];
}

async function buildPlanDirs(repoRoot) {
  const ops = path.join(repoRoot, '.sedea', 'operations');
  const dirs = [];
  const scopes = await listOperationsScopeSegments(repoRoot);
  for (const scope of scopes) {
    const plansDir = path.join(ops, scope, 'plans');
    await collectPlanSearchDirs(plansDir, dirs);
  }
  return dirs;
}

/** Register flat `plans/`, roadmap-topics, and nested `plans/YYYY-MM/<dispatch-slug>/` dirs. */
export async function collectPlanSearchDirs(plansDir, dirs) {
  if (!(await dirExists(plansDir))) return;
  dirs.push(plansDir);
  const roadmap = path.join(plansDir, 'roadmap-topics');
  if (await dirExists(roadmap)) dirs.push(roadmap);

  let entries;
  try {
    entries = await fs.readdir(plansDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'roadmap-topics') continue;
    if (!/^\d{4}-\d{2}$/.test(entry.name)) continue;
    const monthDir = path.join(plansDir, entry.name);
    let dispatchEntries;
    try {
      dispatchEntries = await fs.readdir(monthDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const dispatchEntry of dispatchEntries) {
      if (dispatchEntry.isDirectory()) {
        dirs.push(path.join(monthDir, dispatchEntry.name));
      }
    }
  }
}

async function ensureSedeaContext() {
  if (SEDEA_REPO_ROOT) return;
  const envRoot = process.env.PLAN_STATE_HOSTING_ROOT;
  const repoRoot =
    typeof envRoot === 'string' && envRoot.length > 0
      ? path.resolve(envRoot)
      : findSedeaRepoRoot(SCRIPT_DIR);
  if (!repoRoot) die('plan-state: could not find .sedea (walk up from script path failed)');
  SEDEA_REPO_ROOT = repoRoot;
  SEDEA_PLAN_DIRS = await buildPlanDirs(repoRoot);
}

/** @internal Test hook — reset module-scoped plan discovery cache between isolated runs. */
export function resetPlanStateContextForTests() {
  SEDEA_REPO_ROOT = null;
  SEDEA_PLAN_DIRS = null;
  _hostingOrgRepoCache = null;
}

function parseGithubRemote(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  let m = u.match(/^(?:https?:\/\/)?(?:www\.)?github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?\/?$/i);
  if (m) return `${m[1]}/${m[2]}`;
  m = u.match(/^git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/i);
  if (m) return `${m[1]}/${m[2]}`;
  return null;
}

async function gitOriginOrgRepo(repoPath) {
  const r = await spawnGitOutput(repoPath, ['config', '--get', 'remote.origin.url']);
  if (!r.ok || !r.stdout) {
    return { ok: false, error: r.stderr || `git exit ${r.code}` };
  }
  const orgRepo = parseGithubRemote(r.stdout);
  if (!orgRepo) return { ok: false, error: `unrecognized remote.origin.url: ${r.stdout}` };
  return { ok: true, orgRepo };
}

async function resolveFullRepoForReconcile(pr, worktrees, hostingRepoRoot) {
  for (const wt of worktrees) {
    if (wt.repo === pr.repo && wt.path) {
      const g = await gitOriginOrgRepo(wt.path);
      if (g.ok) return { fullRepo: g.orgRepo, error: null };
      return { fullRepo: null, error: `worktree ${wt.path}: ${g.error}` };
    }
  }
  const base = path.basename(hostingRepoRoot);
  if (pr.repo === base) {
    const g = await gitOriginOrgRepo(hostingRepoRoot);
    if (g.ok) return { fullRepo: g.orgRepo, error: null };
    return { fullRepo: null, error: g.error };
  }
  // Legacy sidecar rows keyed by worktree dirname (basename WORKTREE_ROOT) instead of
  // hosting repo label — fall back to hosting origin when gh can resolve the PR number.
  const hostingGit = await gitOriginOrgRepo(hostingRepoRoot);
  if (hostingGit.ok) {
    const res = await ghPrView(hostingGit.orgRepo, pr.number);
    if (res.state !== 'ERROR') {
      return { fullRepo: hostingGit.orgRepo, error: null };
    }
  }
  return {
    fullRepo: null,
    error: `unknown pr.repo "${pr.repo}" (no worktrees[].repo match, not hosting basename "${base}")`,
  };
}

let _hostingOrgRepoCache = null;
async function getHostingOrgRepoCached() {
  await ensureSedeaContext();
  if (_hostingOrgRepoCache !== null) return _hostingOrgRepoCache;
  const g = await gitOriginOrgRepo(SEDEA_REPO_ROOT);
  if (!g.ok) die(`plan-state: cannot read git remote.origin.url in ${SEDEA_REPO_ROOT}: ${g.error}`);
  _hostingOrgRepoCache = g.orgRepo;
  return _hostingOrgRepoCache;
}

// Parse `--flag value` / `--flag=value` into a map. Unknown single-value flags
// are retained as strings; repeated flags throw. No positional args supported.
function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) die(`unexpected positional argument: ${a}`);
    const eq = a.indexOf('=');
    let key, value;
    if (eq >= 0) {
      key = a.slice(2, eq);
      value = a.slice(eq + 1);
    } else {
      key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        value = true;
      } else {
        value = next;
        i += 1;
      }
    }
    if (key in out) die(`flag --${key} given more than once`);
    out[key] = value;
  }
  return out;
}

// ---------- plan / sidecar resolution ----------

function sidecarPathFor(planPath) {
  const slug = path.basename(planPath).replace(/\.plan\.md$/i, '');
  return path.join(path.dirname(planPath), `${slug}.state.yaml`);
}

export async function findPlanBySlug(slug) {
  await ensureSedeaContext();
  for (const dir of SEDEA_PLAN_DIRS) {
    const candidate = path.join(dir, `${slug}.plan.md`);
    if (await fileExists(candidate)) {
      const planDir = path.dirname(candidate);
      const isArchived = await resolvePlanArchived(candidate);
      return { slug, planPath: candidate, dir: planDir, isArchived };
    }
  }
  return null;
}

export async function listAllPlans() {
  await ensureSedeaContext();
  const out = [];
  for (const dir of SEDEA_PLAN_DIRS) {
    if (!(await dirExists(dir))) continue;
    const entries = await fs.readdir(dir);
    for (const name of entries) {
      if (!name.endsWith('.plan.md')) continue;
      const planPath = path.join(dir, name);
      const slug = name.replace(/\.plan\.md$/i, '');
      out.push({ slug, planPath, dir });
    }
  }
  await Promise.all(
    out.map(async (p) => {
      p.isArchived = await resolvePlanArchived(p.planPath);
    }),
  );
  return out;
}

// Load a sidecar as a YAML Document (preserves comments/formatting); returns
// a fresh Document with the conventional comment header when the file does
// not yet exist. Ensures `worktrees:` and `prs:` keys are always present as
// empty lists for predictable downstream edits.
async function loadSidecarDoc(planPath) {
  const statePath = sidecarPathFor(planPath);
  const slug = path.basename(planPath).replace(/\.plan\.md$/i, '');
  let doc;
  let existed = false;
  if (await fileExists(statePath)) {
    existed = true;
    const src = await fs.readFile(statePath, 'utf8');
    doc = parseDocument(src, { keepSourceTokens: true });
  } else {
    doc = new Document({});
    doc.commentBefore = ` Sidecar for operations plan runtime. Plan: ${slug}.plan.md`;
  }
  if (!isMap(doc.contents)) {
    // Replace malformed document with an empty map; callers will add fields.
    doc.contents = new YAMLMap();
  }
  ensureKey(doc, 'worktrees', new YAMLSeq());
  ensureKey(doc, 'prs', new YAMLSeq());
  applyPlansMonthBucketOnFirstWrite(doc, planPath);
  return { doc, statePath, slug, existed };
}

function ensureKey(doc, key, fallback) {
  const node = doc.get(key, true);
  if (node === undefined) {
    doc.set(key, fallback);
  }
}

async function saveSidecar(statePath, doc) {
  const text = doc.toString();
  await fs.writeFile(statePath, text, 'utf8');
}

// Read a sidecar into a plain JS object (defaults applied). Used by resolve /
// reconcile / prune-sessions where we only inspect values, not rewrite.
async function readSidecarPlain(planPath) {
  const statePath = sidecarPathFor(planPath);
  if (!(await fileExists(statePath))) {
    return {
      statePath,
      data: {
        worktrees: [],
        prs: [],
        session: null,
        parent: null,
        archived: false,
        status: null,
      },
    };
  }
  const src = await fs.readFile(statePath, 'utf8');
  const doc = parseDocument(src);
  const raw = (doc.toJSON() || {});
  const worktrees = Array.isArray(raw.worktrees)
    ? raw.worktrees.filter(
        (e) => e && typeof e.repo === 'string' && typeof e.path === 'string',
      )
    : [];
  const prs = Array.isArray(raw.prs)
    ? raw.prs.filter(
        (e) => e && typeof e.repo === 'string' && Number.isInteger(e.number),
      )
    : [];
  const session =
    raw.session && typeof raw.session.focusPath === 'string' && raw.session.focusPath.length > 0
      ? { focusPath: raw.session.focusPath }
      : null;
  const parent =
    typeof raw.parent === 'string' && raw.parent.trim().length > 0
      ? raw.parent.trim()
      : null;
  const archived = raw.archived === true;
  const statusRaw = typeof raw.status === 'string' ? raw.status : null;
  const status =
    statusRaw && PLAN_BOARD_STATUSES.has(statusRaw) ? statusRaw : null;
  const plansMonthBucket =
    typeof raw.plansMonthBucket === 'string' && /^\d{4}-\d{2}$/.test(raw.plansMonthBucket)
      ? raw.plansMonthBucket
      : null;
  return { statePath, data: { worktrees, prs, session, parent, archived, status, plansMonthBucket } };
}

// Sidecar archive bucket: sidecar `archived` is authoritative (rule 8).
// Legacy frontmatter `archived: true` is a read fallback until migrated away.
async function resolvePlanArchived(planPath) {
  const { data } = await readSidecarPlain(planPath);
  if (data.archived) return true;
  const fm = await readPlanFrontmatter(planPath);
  return fm?.archived === true;
}

// Effective parent slug for a plan: sidecar `parent:` if set, else plan
// frontmatter `parent:` (legacy fallback during migration). Null when neither
// location has a non-empty slug. All internal readers (archive, reparent,
// collectCandidates, cycle walk) must use this so sidecar-parent writes from
// `cmdReparent` / `cmdArchive` are honored immediately even when the plan's
// frontmatter still carries a stale value.
async function resolvePlanParent(planPath) {
  const { data } = await readSidecarPlain(planPath);
  if (data.parent !== null) return data.parent;
  return getPlanFrontmatterParentSlug(planPath);
}

// Low-level: read `parent:` directly from plan frontmatter. Kept as the
// legacy fallback path for `resolvePlanParent`. Never call this from command
// code — use `resolvePlanParent` so sidecar wins.
async function getPlanFrontmatterParentSlug(planPath) {
  const src = await fs.readFile(planPath, 'utf8');
  const m = src.match(/^(?:<!--[\s\S]*?-->\s*)?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  let doc;
  try {
    doc = parseDocument(m[1]);
  } catch {
    return null;
  }
  const parent = doc.get('parent');
  return typeof parent === 'string' && parent.trim().length > 0
    ? parent.trim()
    : null;
}

// ---------- subcommand: resolve ----------

// Return the plan (and sidecar) whose sidecar `worktrees[].path` (or, as a
// fallback, `session.focusPath` when it points at a directory on disk) covers
// the given cwd. We match by path equality or subdirectory containment.
// Output: "<slug>\t<planPath>" on stdout, exit 0 on match; exit 2 with no
// output when no match is found (rule scripts can branch on exit code).
async function cmdResolve(flags) {
  if (typeof flags.cwd !== 'string') die('resolve: --cwd <path> is required');
  const cwd = path.resolve(flags.cwd);
  const plans = await listAllPlans();
  for (const plan of plans) {
    const { data } = await readSidecarPlain(plan.planPath);
    for (const wt of data.worktrees) {
      if (pathCovers(wt.path, cwd)) {
        log(`${plan.slug}\t${plan.planPath}`);
        return;
      }
    }
    // Session fallback: only when session.focusPath is a directory (single-repo
    // worktree session). .code-workspace files live in a shared parent and would over-match.
    if (data.session) {
      const focus = data.session.focusPath;
      if (pathCovers(focus, cwd) && (await dirExists(focus))) {
        log(`${plan.slug}\t${plan.planPath}`);
        return;
      }
    }
  }
  process.exit(2);
}

function pathCovers(candidate, cwd) {
  if (!candidate) return false;
  const c = path.resolve(candidate);
  if (c === cwd) return true;
  return cwd.startsWith(c + path.sep);
}

// ---------- subcommand: set-worktrees ----------

// `set-worktrees --slug <slug> --json '[{"repo":"user-auth","path":"/abs"}]'`.
// Replaces the sidecar `worktrees:` list wholesale (one active worktree set per plan).
// Each entry is validated; absolute paths required so downstream resolve()
// can compare without re-normalising.
async function cmdSetWorktrees(flags) {
  const slug = requireString(flags, 'slug');
  const json = requireString(flags, 'json');
  const plan = await findPlanBySlug(slug);
  if (!plan) die(`set-worktrees: no plan with slug "${slug}"`);

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    die(`set-worktrees: --json must be valid JSON (${err.message})`);
  }
  if (!Array.isArray(parsed)) die('set-worktrees: --json must be a JSON array');
  const entries = parsed.map((raw, i) => {
    if (!raw || typeof raw !== 'object') die(`set-worktrees: entry #${i} is not an object`);
    const repo = raw.repo;
    const p = raw.path;
    if (typeof repo !== 'string' || repo.length === 0) die(`set-worktrees: entry #${i} missing repo`);
    if (typeof p !== 'string' || !path.isAbsolute(p)) {
      die(`set-worktrees: entry #${i} path must be absolute (got ${p})`);
    }
    return { repo, path: p };
  });

  const { doc, statePath } = await loadSidecarDoc(plan.planPath);
  const seq = new YAMLSeq();
  seq.flow = false;
  for (const e of entries) {
    const m = new YAMLMap();
    m.flow = false;
    m.set('repo', e.repo);
    m.set('path', e.path);
    seq.add(m);
  }
  doc.set('worktrees', seq);
  await saveSidecar(statePath, doc);
  log(`worktrees set on ${statePath} (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`);
}

// ---------- subcommand: init-sidecar ----------

// `init-sidecar --plan-path <abs> --parent <slug|null> [--plans-base-path <abs>]`
// Create a new sidecar stub at first plan write with parent, optional
// plansMonthBucket (derived), and empty worktrees/prs lists.
async function cmdInitSidecar(flags) {
  const planPath = path.resolve(requireString(flags, 'plan-path'));
  if (!path.isAbsolute(planPath)) die('init-sidecar: --plan-path must be absolute');
  if (!(await fileExists(planPath))) die(`init-sidecar: plan file not found: ${planPath}`);

  const statePath = sidecarPathFor(planPath);
  if (await fileExists(statePath)) die(`init-sidecar: sidecar already exists: ${statePath}`);

  if (flags.parent === undefined) die('init-sidecar: --parent is required (use null for root plans)');
  const parent =
    flags.parent === 'null' || flags.parent === null
      ? null
      : requireString(flags, 'parent');
  const plansBasePath =
    typeof flags['plans-base-path'] === 'string' ? path.resolve(flags['plans-base-path']) : null;

  const slug = path.basename(planPath).replace(/\.plan\.md$/i, '');
  const doc = new Document({});
  doc.commentBefore = ` Sidecar for operations plan runtime. Plan: ${slug}.plan.md`;
  doc.contents = new YAMLMap();
  doc.set('parent', parent);
  applyPlansMonthBucketOnFirstWrite(doc, planPath, { plansBasePath });
  ensureKey(doc, 'worktrees', new YAMLSeq());
  ensureKey(doc, 'prs', new YAMLSeq());
  await saveSidecar(statePath, doc);
  const bucket = doc.get('plansMonthBucket');
  log(
    `init-sidecar: wrote ${statePath}${bucket ? ` (plansMonthBucket: ${bucket})` : ' (flat-root — no plansMonthBucket)'}`,
  );
}

// ---------- subcommand: resolve-plans-write-dir ----------

// `resolve-plans-write-dir [--plans-base-path <abs>] [--target-plan-path <abs>]
//   [--parent-plan-path <abs>] [--flat-plans-root <abs>] [--json]`
// Resolve the absolute directory for plan file writes (handover path or flat fallback).
async function cmdResolvePlansWriteDir(flags) {
  const asJson = flags.json === true;
  const explicitFlat =
    typeof flags['flat-plans-root'] === 'string' ? path.resolve(flags['flat-plans-root']) : null;

  let flatPlansRoot = explicitFlat;
  if (!flatPlansRoot) {
    await ensureSedeaContext();
    flatPlansRoot = SEDEA_PLAN_DIRS?.[0] ?? null;
  }

  const targetPlanPath =
    typeof flags['target-plan-path'] === 'string' ? path.resolve(flags['target-plan-path']) : null;
  const parentPlanPath =
    typeof flags['parent-plan-path'] === 'string' ? path.resolve(flags['parent-plan-path']) : null;
  const plansBasePath =
    typeof flags['plans-base-path'] === 'string' ? path.resolve(flags['plans-base-path']) : null;

  const resolved = resolvePlansWriteDir({
    plansBasePath,
    targetPlanPath,
    parentPlanPath,
    flatPlansRoot,
  });

  if (!resolved.writeDir) {
    die('resolve-plans-write-dir: could not resolve a plans write directory from inputs');
  }

  const payload = {
    writeDir: resolved.writeDir,
    source: resolved.source,
    plansBasePath: resolved.plansBasePath,
    flatPlansRoot: deriveFlatPlansRootFromPath(resolved.writeDir),
  };

  if (asJson) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  log(`writeDir: ${payload.writeDir}`);
  log(`source: ${payload.source}`);
  if (payload.plansBasePath) log(`plansBasePath: ${payload.plansBasePath}`);
  if (payload.flatPlansRoot) log(`flatPlansRoot: ${payload.flatPlansRoot}`);
}

// ---------- subcommand: set-session ----------

// `set-session --slug <slug> --focus <abs>` — writes/overwrites
// `session.focusPath`. Focus must be absolute; it can be a directory (single-
// repo worktree) or a file (`.code-workspace` for multi-repo).
async function cmdSetSession(flags) {
  const slug = requireString(flags, 'slug');
  const focus = requireString(flags, 'focus');
  if (!path.isAbsolute(focus)) die(`set-session: --focus must be absolute (got ${focus})`);
  const plan = await findPlanBySlug(slug);
  if (!plan) die(`set-session: no plan with slug "${slug}"`);

  const { doc, statePath } = await loadSidecarDoc(plan.planPath);
  const session = new YAMLMap();
  session.flow = false;
  session.set('focusPath', focus);
  doc.set('session', session);
  if (doc.get('archived') !== true && !(await resolvePlanArchived(plan.planPath))) {
    const curStatus = doc.get('status');
    if (curStatus === undefined || curStatus === null || curStatus === 'not_started') {
      doc.set('status', 'started');
    }
  }
  await saveSidecar(statePath, doc);
  log(`session.focusPath set on ${statePath}`);
}

// ---------- subcommand: upsert-pr ----------

// Detect a plan's kind from frontmatter + body section signatures, per
// dev-process-conventions.mdc § Stage derivation. Used by `upsert-pr` to refuse
// linking PRs onto non-PR plans — sidecar prs[] is reconcile-tracked and only
// PR plans (mode #3) own a single PR. Returns one of:
//   'pr'             — has `## 1. Single concern`
//   'master'         — has `## 6. Delivery phases` / `PR breakdown` / dual-title
//   'phase'          — has `## 5. Delivery phases` / `PR breakdown` / dual-title
//   'roadmap_topic'  — frontmatter `kind: roadmap_topic`
//   'unknown'        — none of the above (stub, malformed, custom layout)
async function detectPlanKind(planPath) {
  const src = await fs.readFile(planPath, 'utf8');
  const fmMatch = src.match(/^(?:<!--[\s\S]*?-->\s*)?---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    try {
      const doc = parseDocument(fmMatch[1]);
      const kind = doc.get('kind');
      if (typeof kind === 'string' && kind.trim() === 'roadmap_topic') {
        return 'roadmap_topic';
      }
    } catch {
      // fall through to body sniff
    }
  }
  const body = fmMatch ? src.slice(fmMatch[0].length) : src;
  if (/^## 1\. Single concern\b/m.test(body)) return 'pr';
  if (/^## 6\. (?:Delivery phases|PR breakdown)\b/m.test(body)) return 'master';
  if (/^## 5\. (?:Delivery phases|PR breakdown)\b/m.test(body)) return 'phase';
  return 'unknown';
}

// `upsert-pr --slug <slug> --repo <basename> --number <n>` — appends
// `{repo, number}` to `prs:` only if not already present. Idempotent so rule 20
// § Commit and push cadence (step 4) can call it on every push without duplicating entries.
// Refuses (exit 3) when the resolved plan is not a PR plan: sidecar prs[] feeds reconcile,
// which auto-archives a plan when every entry is MERGED. Linking an unrelated merged PR onto
// a Master / Phase / roadmap-topic plan — typical when upsert runs from a worktree whose
// resolve target is a planning container with an unrelated branch — would silently archive
// a still-active planning container. Exit 3 lets the cadence log + continue without blocking
// the push (per efficient-pr-shipping.mdc § Commit and push cadence step 4).
async function cmdUpsertPr(flags) {
  const slug = requireString(flags, 'slug');
  const repo = requireString(flags, 'repo');
  const numberStr = requireString(flags, 'number');
  const number = Number.parseInt(numberStr, 10);
  if (!Number.isInteger(number) || number <= 0) die(`upsert-pr: --number must be positive integer (got ${numberStr})`);
  const plan = await findPlanBySlug(slug);
  if (!plan) die(`upsert-pr: no plan with slug "${slug}"`);

  const kind = await detectPlanKind(plan.planPath);
  if (kind !== 'pr') {
    die(
      `upsert-pr: plan "${slug}" has kind "${kind}", not a PR plan (mode #3 — body section "## 1. Single concern"). ` +
        `Sidecar prs[] is reconcile-tracked; linking ${repo}#${number} here risks auto-archiving a still-active container ` +
        `if that PR ever merges. Refusing the upsert. ` +
        `Likely cause: commit-and-push upsert ran from a worktree whose resolve target is a Master / Phase plan with an unrelated branch checked out. ` +
        `Fix: link the PR to the matching child PR plan instead, or run upsert from that PR plan's worktree.`,
      3,
    );
  }

  const { doc, statePath } = await loadSidecarDoc(plan.planPath);
  let prsSeq = doc.get('prs', true);
  if (!isSeq(prsSeq)) {
    prsSeq = new YAMLSeq();
    prsSeq.flow = false;
    doc.set('prs', prsSeq);
  }
  prsSeq.flow = false;

  // Skip if already present. Compare via toJSON() to unwrap scalars.
  for (const item of prsSeq.items) {
    const obj = isMap(item) ? item.toJSON() : null;
    if (obj && obj.repo === repo && obj.number === number) {
      log(`upsert-pr: ${repo}#${number} already in ${statePath}`);
      return;
    }
  }
  const m = new YAMLMap();
  m.flow = false;
  m.set('repo', repo);
  m.set('number', number);
  prsSeq.add(m);
  await saveSidecar(statePath, doc);
  log(`upsert-pr: added ${repo}#${number} to ${statePath}`);
}

// ---------- subcommand: prune-sessions ----------

// `prune-sessions --path <abs>`   — remove worktrees[] entries whose path is
//                                   equal to or under <abs>, and clear
//                                   session.focusPath if it sits under <abs>.
// `prune-sessions --all`           — for every sidecar, remove worktrees whose
//                                   path no longer exists on disk; clear
//                                   session.focusPath when missing on disk.
//
// Data-only: never runs git worktree remove, never closes Cursor windows.
// Idempotent — rerunning changes nothing when everything is already pruned.
async function cmdPruneSessions(flags) {
  const all = flags.all === true;
  const targetPath = typeof flags.path === 'string' ? path.resolve(flags.path) : null;
  if (!all && !targetPath) die('prune-sessions: either --path <abs> or --all is required');
  if (all && targetPath) die('prune-sessions: --path and --all are mutually exclusive');

  const plans = await listAllPlans();
  let touched = 0;
  for (const plan of plans) {
    const { doc, statePath, existed } = await loadSidecarDoc(plan.planPath);
    if (!existed) continue;
    let changed = false;

    // Filter worktrees[]
    const wtSeq = doc.get('worktrees', true);
    if (isSeq(wtSeq)) {
      const keep = [];
      for (const item of wtSeq.items) {
        if (!isMap(item)) continue;
        const obj = item.toJSON();
        const wtPath = typeof obj.path === 'string' ? path.resolve(obj.path) : null;
        if (!wtPath) {
          keep.push(item);
          continue;
        }
        const gone = all ? !pathExistsSync(wtPath) : pathTargeted(wtPath, targetPath);
        if (gone) {
          changed = true;
          log(`  prune worktree ${obj.repo || '?'}:${wtPath} in ${plan.slug}`);
          continue;
        }
        keep.push(item);
      }
      if (changed) {
        const fresh = new YAMLSeq();
        fresh.flow = false;
        for (const k of keep) fresh.add(k);
        doc.set('worktrees', fresh);
      }
    }

    // Clear session.focusPath when it points into the pruned territory
    const session = doc.get('session', true);
    if (isMap(session)) {
      const raw = session.toJSON();
      const focus = typeof raw.focusPath === 'string' ? raw.focusPath : null;
      if (focus) {
        const focusResolved = path.resolve(focus);
        const gone = all ? !pathExistsSync(focusResolved) : pathTargeted(focusResolved, targetPath);
        if (gone) {
          changed = true;
          log(`  clear session.focusPath=${focus} in ${plan.slug}`);
          doc.delete('session');
        }
      }
    }

    if (changed) {
      await saveSidecar(statePath, doc);
      touched += 1;
    }
  }
  log(`prune-sessions: updated ${touched} sidecar${touched === 1 ? '' : 's'}`);
}

// ---------- subcommand: detect-stale-workspaces ----------

async function resolveMainRepoRootFromWorktree(worktreePath) {
  const common = await spawnGitOutput(worktreePath, [
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir',
  ]);
  if (!common.ok) return null;
  const absCommon = path.resolve(worktreePath, common.stdout);
  const marker = `${path.sep}.git${path.sep}worktrees${path.sep}`;
  const idx = absCommon.indexOf(marker);
  if (idx >= 0) return absCommon.slice(0, idx);
  if (absCommon.endsWith(`${path.sep}.git`) || absCommon.endsWith('.git')) {
    return path.dirname(absCommon);
  }
  return worktreePath;
}

// `detect-stale-workspaces [--slug <slug>] [--json]`
// Read-only: list sidecar worktrees[] whose path still exists on disk.
// When prs[] is present, sets mergedPr true only if every linked PR is MERGED.
// Sets remoteHeadGone when origin has no head for the worktree name (read-only ls-remote).
async function cmdDetectStaleWorkspaces(flags) {
  await ensureSedeaContext();
  const asJson = flags.json === true;
  const slugFilter = typeof flags.slug === 'string' ? flags.slug : null;

  let plans = await listAllPlans();
  if (slugFilter) {
    const one = await findPlanBySlug(slugFilter);
    if (!one) die(`detect-stale-workspaces: no plan with slug "${slugFilter}"`);
    plans = [one];
  }

  const candidates = [];
  for (const plan of plans) {
    const { data } = await readSidecarPlain(plan.planPath);
    if (data.worktrees.length === 0) continue;

    let mergedPr = null;
    if (data.prs.length > 0) {
      let hasError = false;
      const states = [];
      for (const pr of data.prs) {
        const { fullRepo, error } = await resolveFullRepoForReconcile(
          pr,
          data.worktrees,
          SEDEA_REPO_ROOT,
        );
        if (!fullRepo) {
          hasError = true;
          break;
        }
        const res = await ghPrView(fullRepo, pr.number);
        if (res.state === 'ERROR') {
          hasError = true;
          break;
        }
        states.push(res.state);
      }
      if (!hasError) mergedPr = states.every((s) => s === 'MERGED');
      else mergedPr = false;
    }

    for (const wt of data.worktrees) {
      const wtPath = path.resolve(wt.path);
      if (!pathExistsSync(wtPath)) continue;

      let worktreeName = null;
      const br = await spawnGitOutput(wtPath, ['branch', '--show-current']);
      if (br.ok && br.stdout) worktreeName = br.stdout;

      let remoteHeadGone = null;
      if (worktreeName) {
        const mainRoot = await resolveMainRepoRootFromWorktree(wtPath);
        if (mainRoot) {
          const remote = await spawnGitOutput(mainRoot, ['ls-remote', '--heads', 'origin', worktreeName]);
          if (remote.ok) remoteHeadGone = remote.stdout.trim().length === 0;
        }
      }

      const reasons = ['worktree_path_still_present'];
      if (mergedPr === true) reasons.push('linked_prs_merged');
      if (remoteHeadGone === true) reasons.push('remote_head_gone');
      if (plan.isArchived) reasons.push('plan_archived');

      candidates.push({
        slug: plan.slug,
        planPath: plan.planPath,
        planArchived: plan.isArchived === true,
        worktreePath: wtPath,
        repo: wt.repo,
        worktreeName,
        mergedPr,
        linkedPrNumbers: data.prs.length > 0 ? data.prs.map((p) => p.number) : [],
        remoteHeadGone,
        reason: reasons.join('; '),
      });
    }
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ candidates }, null, 2)}\n`);
    return;
  }
  log(`== detect-stale-workspaces (${candidates.length} candidate(s)) ==`);
  for (const c of candidates) {
    log(
      `  ${c.slug}: ${c.repo}:${c.worktreePath} worktreeName=${c.worktreeName || '?'} mergedPr=${c.mergedPr} remoteHeadGone=${c.remoteHeadGone} (${c.reason})`,
    );
  }
}

function pathTargeted(candidate, target) {
  if (candidate === target) return true;
  return candidate.startsWith(target + path.sep);
}

// ---------- subcommand: reconcile ----------

// `reconcile [--dry-run] [--prune-worktrees]` — iterate every active plan
// (Sedea `.sedea/operations/<scope>/plans/` and roadmap subdirs),
// query `gh pr view` for every PR listed in the sidecar, and:
//   all MERGED   → set sidecar `archived: true` and `status: completed` on
//                  <slug>.state.yaml (rule 8), and append a bullet under
//                  `## Child plans` in the parent plan body.
//   any CLOSED   → flag "closed without merge" in the report, leave alone.
//   still OPEN / mixed → quiet; pl can re-run later.
//
// Org/repo for each `prs[]` row comes from `git remote get-url origin` on a
// worktree whose `repo` label matches, else from the hosting repo (parent of
// `.sedea`) when `prs[].repo` matches that folder basename — no static alias
// map. This script does not remove git worktrees or close editor windows.
// With `--prune-worktrees`, additionally delegates to `prune-sessions --all`
// at the end so stale sidecar entries for already-gone worktrees disappear in
// the same pass. Safe to run from chat.
async function cmdReconcile(flags) {
  const dryRun = flags['dry-run'] === true;
  const pruneWorktrees = flags['prune-worktrees'] === true;

  const plans = await listAllPlans();
  // Parent lookup must include archived plans too — the parent might already
  // be archived (rare but possible).
  const planBySlug = new Map();
  for (const p of plans) planBySlug.set(p.slug, p);

  const report = { archived: [], flagged: [], skipped: [] };

  for (const plan of plans) {
    if (plan.isArchived) continue;
    const { data } = await readSidecarPlain(plan.planPath);
    if (data.prs.length === 0) {
      report.skipped.push({ slug: plan.slug, reason: 'no prs[]' });
      continue;
    }

    const prStates = [];
    let hasError = false;
    for (const pr of data.prs) {
      const { fullRepo, error } = await resolveFullRepoForReconcile(pr, data.worktrees, SEDEA_REPO_ROOT);
      if (!fullRepo) {
        report.flagged.push({ slug: plan.slug, reason: error || 'unknown repo' });
        hasError = true;
        break;
      }
      const res = await ghPrView(fullRepo, pr.number);
      if (res.state === 'ERROR') {
        report.flagged.push({
          slug: plan.slug,
          reason: `gh pr view ${fullRepo}#${pr.number} failed: ${res.error}`,
        });
        hasError = true;
        break;
      }
      prStates.push({ ...pr, fullRepo, ...res });
    }
    if (hasError) continue;

    const allMerged = prStates.every((s) => s.state === 'MERGED');
    const anyClosed = prStates.some((s) => s.state === 'CLOSED');
    const mixed = !allMerged && prStates.some((s) => s.state === 'MERGED');

    if (allMerged) {
      await archivePlan(plan, prStates, planBySlug, dryRun);
      report.archived.push({ slug: plan.slug, prs: prStates });
    } else if (anyClosed) {
      const closed = prStates.filter((s) => s.state === 'CLOSED');
      report.flagged.push({
        slug: plan.slug,
        reason: `PR closed without merge: ${closed.map((c) => `${c.fullRepo}#${c.number}`).join(', ')}`,
        prs: prStates,
      });
    } else if (mixed) {
      const merged = prStates.filter((s) => s.state === 'MERGED');
      const open = prStates.filter((s) => s.state !== 'MERGED');
      report.flagged.push({
        slug: plan.slug,
        reason: `mixed: merged=[${merged.map((m) => `${m.fullRepo}#${m.number}`).join(', ')}] still open=[${open.map((m) => `${m.fullRepo}#${m.number}`).join(', ')}]`,
        prs: prStates,
      });
    } else {
      report.skipped.push({ slug: plan.slug, reason: `prs still open (${prStates.map((s) => `${s.fullRepo}#${s.number}`).join(', ')})` });
    }
  }

  if (pruneWorktrees) {
    log('');
    log('== prune-sessions --all ==');
    await cmdPruneSessions({ all: true });
  }

  printReconcileReport(report, dryRun);
}

function printReconcileReport(report, dryRun) {
  const prefix = dryRun ? '[dry-run] ' : '';
  log('');
  log(`== reconcile report ${dryRun ? '(dry-run)' : ''} ==`);
  log(`  archived: ${report.archived.length}`);
  for (const a of report.archived) {
    const urls = a.prs.map((p) => p.url).filter(Boolean).join(', ');
    log(`    ${prefix}- ${a.slug}${urls ? ` (${urls})` : ''}`);
  }
  log(`  flagged:  ${report.flagged.length}`);
  for (const f of report.flagged) {
    log(`    - ${f.slug}: ${f.reason}`);
  }
  log(`  skipped:  ${report.skipped.length}`);
  for (const s of report.skipped) {
    log(`    - ${s.slug}: ${s.reason}`);
  }
}

// Shell out to `gh pr view <n> --repo <org/repo> --json state,url`. Returns
// `{ state, url, title }` on success, `{ state: 'ERROR', error }` otherwise.
// The `gh` CLI is assumed to be installed + authenticated — reconcile is a
// personal shorthand, not a CI path.
async function ghPrView(fullRepo, number) {
  return new Promise((resolve) => {
    const child = spawn(
      'gh',
      ['pr', 'view', String(number), '--repo', fullRepo, '--json', 'state,url,title'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      resolve({ state: 'ERROR', url: '', title: '', error: err.message });
    });
    child.on('close', (code) => {
      if (code !== 0) {
        resolve({ state: 'ERROR', url: '', title: '', error: stderr.trim() || `exit ${code}` });
        return;
      }
      try {
        const j = JSON.parse(stdout);
        resolve({ state: j.state || 'UNKNOWN', url: j.url || '', title: j.title || '' });
      } catch (err) {
        resolve({ state: 'ERROR', url: '', title: '', error: `parse: ${err.message}` });
      }
    });
  });
}

async function archivePlan(plan, prStates, planBySlug, dryRun) {
  const urls = prStates.map((p) => p.url).filter(Boolean);
  const signalText = urls.length ? urls.join(', ') : '';
  const shippedPrs = prStates.map((s) => ({
    repo: s.fullRepo,
    number: s.number,
    url: s.url || null,
  }));
  await doArchive(plan, signalText, planBySlug, dryRun, { shippedPrs });
}

// Mechanical archive: set sidecar `archived: true` and `status: completed`
// (rule 8), then append a bullet for this child under the parent's
// `## Child plans`. The sidecar stays beside the plan file (same directory
// as active plans). Legacy frontmatter `archived:` is cleared when present.
// signalText is free-form ("PR urls", body-inferred ship notes, etc.) and appears
// after the em dash in the bullet. Used by reconcile (auto) and cmdArchive
// (manual). Dry-run skips sidecar and parent writes.
// `opts.shippedPrs` (reconcile only) promotes the merged PR snapshot into
// the plan's frontmatter as a permanent record; written before sidecar archive.
async function doArchive(plan, signalText, planBySlug, dryRun, opts = {}) {
  const shippedPrs = Array.isArray(opts.shippedPrs) ? opts.shippedPrs : null;
  if (shippedPrs && shippedPrs.length > 0) {
    const wrote = await writeShippedPrs(plan.planPath, shippedPrs, { dryRun });
    if (wrote) {
      log(`  ${dryRun ? '[dry-run] would write' : 'wrote'} shippedPrs (${shippedPrs.length}) to ${plan.slug}`);
    }
  }

  const parentSlug = await resolvePlanParent(plan.planPath);
  if (parentSlug) {
    const parent = planBySlug.get(parentSlug);
    if (parent && !parent.isArchived) {
      await noteChildArchived(parent, plan.slug, signalText, dryRun);
    }
  }

  const wroteArchived = await setSidecarArchived(plan.planPath, true, { dryRun });
  if (wroteArchived) {
    log(`  ${dryRun ? '[dry-run] would set' : 'set'} sidecar archived: true on ${plan.slug}`);
  }
  const wroteStatus = await setSidecarStatus(plan.planPath, 'completed', { dryRun });
  if (wroteStatus) {
    log(`  ${dryRun ? '[dry-run] would set' : 'set'} sidecar status: completed on ${plan.slug}`);
  }
  const clearedLegacyFm = await setPlanArchivedFlag(plan.planPath, false, { dryRun });
  if (clearedLegacyFm) {
    log(`  ${dryRun ? '[dry-run] would clear' : 'cleared'} legacy frontmatter archived: on ${plan.slug}`);
  }
  return { parentSlug: parentSlug || null };
}

// Append "- <child-slug> archived — <signalText>" under the parent's
// `## Child plans` section. Section is created at the end of the body if it
// doesn't exist yet. Idempotent: if a bullet for this slug is already present,
// skipped. signalText is free-form ("url1, url2", prose ship notes); empty
// string omits the em dash suffix.
async function noteChildArchived(parent, childSlug, signalText, dryRun) {
  const src = await fs.readFile(parent.planPath, 'utf8');
  const trimmedSignal = typeof signalText === 'string' ? signalText.trim() : '';
  const bullet = `- \`${childSlug}\` archived${trimmedSignal ? ` — ${trimmedSignal}` : ''}`;

  // Idempotency: skip if a bullet already mentions this slug.
  const slugRe = new RegExp(`^-\\s+\`${childSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``, 'm');
  if (slugRe.test(src)) {
    log(`  noteChildArchived: ${childSlug} already noted in ${parent.slug}`);
    return;
  }

  const heading = '## Child plans';
  let updated;
  const headingIdx = src.indexOf(heading);
  if (headingIdx >= 0) {
    // Find end of this section: next "\n## " heading or EOF.
    const afterHeading = headingIdx + heading.length;
    let nextIdx = src.indexOf('\n## ', afterHeading);
    if (nextIdx < 0) nextIdx = src.length;
    const before = src.slice(0, nextIdx).replace(/\s+$/, '');
    const after = src.slice(nextIdx);
    updated = `${before}\n${bullet}\n${after.length > 0 ? '\n' + after.replace(/^\n+/, '') : ''}`;
  } else {
    const trimmed = src.replace(/\s+$/, '');
    updated = `${trimmed}\n\n${heading}\n\n${bullet}\n`;
  }
  if (!dryRun) await fs.writeFile(parent.planPath, updated, 'utf8');
  log(`  ${dryRun ? '[dry-run] would append' : 'appended'} "${bullet}" to ${parent.slug}`);
}

// ---------- subcommand: list-candidates ----------

// `list-candidates [--json]` — scan every active (non-archived, non-roadmap)
// plan and emit the ones that look archive-ready without a sidecar `prs[]`
// gh check (reconcile handles that side). Heuristics:
//   - allTodosDone && sidecar prs[] empty && body mentions merged PR →
//     ship-signal = "pr-body".
//   - allTodosDone && sidecar prs[] empty && no PR evidence →
//     ship-signal kind "no-pr-body" (shipped / closed without merged-PR prose in body).
//   - otherwise → not a candidate.
// Plans with sidecar prs[] are deliberately skipped — `reconcile` is the
// source of truth for PR-tracked archival and body-scan would double-count.
async function cmdListCandidates(flags) {
  const asJson = flags.json === true;
  const candidates = await collectCandidates();
  if (asJson) {
    process.stdout.write(`${JSON.stringify(candidates, null, 2)}\n`);
    return;
  }
  log('');
  log(`== archive candidates (${candidates.length}) ==`);
  for (const c of candidates) {
    const todos = `${c.todos.done}/${c.todos.total}`;
    const parent = c.parent || '(no parent)';
    log(`  - ${c.slug}`);
    log(`      todos: ${todos} done`);
    log(`      parent: ${parent}`);
    log(`      signal: ${c.shipSignal.label} [${c.shipSignal.kind}]`);
  }
  if (candidates.length === 0) {
    log('  (nothing to surface — run `reconcile` for PR-tracked archival)');
  }
}

async function collectCandidates() {
  const plans = await listAllPlans();
  const defaultOrgRepo = await getHostingOrgRepoCached();

  // Parse every plan's frontmatter + sidecar once so classification is cheap.
  // We also build a parent->children index so we can check that an entire
  // subtree is archivable-in-this-run before surfacing a parent candidate.
  const entries = [];
  for (const plan of plans) {
    const fm = await readPlanFrontmatter(plan.planPath);
    const todos = fm ? summariseTodos(fm.todos) : null;
    let sidecarPrsCount = 0;
    let sidecarParent = null;
    if (!plan.isArchived) {
      const { data } = await readSidecarPlain(plan.planPath);
      sidecarPrsCount = data.prs.length;
      sidecarParent = data.parent;
    } else {
      // Archived plans still parse their sidecar so the hierarchy index sees
      // `parent:` values written before archival.
      const { data } = await readSidecarPlain(plan.planPath);
      sidecarParent = data.parent;
    }
    // Effective parent: sidecar wins, plan frontmatter is a migration-era
    // fallback. Matches `resolvePlanParent` but avoids the extra file read
    // since we already have both sources in hand.
    const effectiveParent =
      sidecarParent ?? (fm && fm.parent ? fm.parent : null);
    entries.push({ plan, fm, todos, sidecarPrsCount, effectiveParent });
  }
  const bySlug = new Map(entries.map((e) => [e.plan.slug, e]));
  const childrenBySlug = new Map();
  for (const e of entries) {
    if (!e.effectiveParent) continue;
    const list = childrenBySlug.get(e.effectiveParent) || [];
    list.push(e);
    childrenBySlug.set(e.effectiveParent, list);
  }

  // Classify every plan once so we can resolve parent readiness recursively.
  // 'archived'  — sidecar `archived: true` (rule 8; legacy frontmatter fallback
  //               via resolvePlanArchived during migration).
  // 'permanent' — roadmap topic (never archived by design; never a candidate;
  //               never blocks an allDone parent).
  // 'ready'     — in plans/, allDone, no sidecar prs[], not a roadmap topic,
  //               and every child is archived, permanent, or ready.
  // 'blocked'   — anything else (pending work, open PRs, blocked descendant,
  //               or cycle).
  // A parent can surface in the same run as its children: ordering is handled
  // by the skill at archive time (archive the children first so the bullet
  // lands on the parent's still-active body — but doArchive / findPlanBySlug
  // tolerate either order).
  const classCache = new Map();
  function classify(slug) {
    const memo = classCache.get(slug);
    if (memo !== undefined) return memo;
    // Seed with 'blocked' to break cycles defensively.
    classCache.set(slug, 'blocked');
    const e = bySlug.get(slug);
    if (!e) return 'blocked';
    if (e.plan.isArchived) {
      classCache.set(slug, 'archived');
      return 'archived';
    }
    if (!e.fm) return 'blocked';
    if (e.fm.kind === 'roadmap_topic') {
      classCache.set(slug, 'permanent');
      return 'permanent';
    }
    if (!e.todos || !e.todos.allDone) return 'blocked';
    if (e.sidecarPrsCount > 0) return 'blocked';
    const kids = childrenBySlug.get(slug) || [];
    for (const k of kids) {
      const c = classify(k.plan.slug);
      if (c !== 'archived' && c !== 'ready' && c !== 'permanent') return 'blocked';
    }
    classCache.set(slug, 'ready');
    return 'ready';
  }

  const out = [];
  for (const e of entries) {
    if (classify(e.plan.slug) !== 'ready') continue;

    const body = await fs.readFile(e.plan.planPath, 'utf8');
    const bodyPrs = scanBodyForPrs(body);

    const enrichedPrs = bodyPrs.map((p) => ({ ...p, orgRepo: p.orgRepo || defaultOrgRepo }));

    const shipSignal = bodyPrs.length > 0
      ? {
          kind: 'pr-body',
          label: enrichedPrs.map((p) => `${p.orgRepo}#${p.number}`).join(', '),
          prs: enrichedPrs,
        }
      : {
          kind: 'no-pr-body',
          label: 'shipped without merged-PR evidence in plan body',
          prs: [],
        };

    out.push({
      slug: e.plan.slug,
      planPath: e.plan.planPath,
      parent: e.effectiveParent,
      name: e.fm.name || e.plan.slug,
      todos: e.todos,
      shipSignal,
      suggestedSignal: shipSignalToSignalText(shipSignal),
    });
  }
  out.sort((a, b) => a.slug.localeCompare(b.slug));
  return out;
}

// Ship-signal → free-form string the user can pass to `archive --signal`.
// Kept simple and human so the bullet in ## Child plans reads naturally.
function shipSignalToSignalText(sig) {
  if (sig.kind === 'pr-body') {
    return sig.prs.map((p) => (p.url ? p.url : `${p.orgRepo}#${p.number}`)).join(', ');
  }
  if (sig.kind === 'no-pr-body') return 'shipped without merged-PR evidence in plan body';
  return '';
}

// Body scan heuristics for "merged PR #N". Two shapes supported today:
//   1. Markdown link near "merged" or "implemented":
//      "**Merged** ([org/repo#540](https://github.com/.../540))"
//      → captures orgRepo + number + url.
//   2. Bare "merged #N" (no link, no repo):
//      "**Implemented:** merged #533."
//      → captures number; orgRepo left null (agent can infer).
// Both scans dedupe on number+url. Add new patterns here when the prose
// conventions drift.
function scanBodyForPrs(text) {
  const hits = [];
  const linkRe = /(?:merged|implemented|shipped)[\s\S]{0,80}?\[([^\]#]*?)#(\d+)\]\(([^)]+)\)/gi;
  let m;
  while ((m = linkRe.exec(text)) !== null) {
    hits.push({ evidence: 'link', orgRepo: m[1].trim() || null, number: Number.parseInt(m[2], 10), url: m[3] });
  }
  const bareRe = /\bmerged\s+#(\d+)\b/gi;
  while ((m = bareRe.exec(text)) !== null) {
    hits.push({ evidence: 'bare', orgRepo: null, number: Number.parseInt(m[1], 10), url: null });
  }
  const seen = new Set();
  return hits.filter((h) => {
    const k = `${h.number}|${h.url || ''}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function summariseTodos(todos) {
  const out = { total: 0, done: 0, pending: 0, in_progress: 0, cancelled: 0, allDone: false };
  if (!Array.isArray(todos)) return out;
  for (const t of todos) {
    if (!t || typeof t !== 'object') continue;
    out.total += 1;
    const s = typeof t.status === 'string' ? t.status.toLowerCase() : '';
    if (s === 'done' || s === 'completed' || s === 'complete') out.done += 1;
    else if (s === 'pending' || s === 'not_started') out.pending += 1;
    else if (s === 'in_progress' || s === 'partial' || s === 'partially_implemented') out.in_progress += 1;
    else if (s === 'cancelled' || s === 'canceled') out.cancelled += 1;
    else out.pending += 1;
  }
  out.allDone = out.total > 0 && out.pending === 0 && out.in_progress === 0;
  return out;
}

async function readPlanFrontmatter(planPath) {
  const src = await fs.readFile(planPath, 'utf8');
  const m = src.match(/^(?:<!--[\s\S]*?-->\s*)?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  let doc;
  try {
    doc = parseDocument(m[1]);
  } catch {
    return null;
  }
  const raw = doc.toJSON() || {};
  return {
    parent: typeof raw.parent === 'string' && raw.parent.trim().length > 0 ? raw.parent.trim() : null,
    name: typeof raw.name === 'string' ? raw.name : null,
    kind: typeof raw.kind === 'string' ? raw.kind : null,
    status: typeof raw.status === 'string' ? raw.status : null,
    todos: Array.isArray(raw.todos) ? raw.todos : [],
    isProject: raw.isProject === true,
    shippedPrs: Array.isArray(raw.shippedPrs) ? raw.shippedPrs : null,
    archived: raw.archived === true,
  };
}

// Shared low-level frontmatter writer. Parses the YAML block with
// `keepSourceTokens` so comments + field order survive, hands the Document
// to `mutate`, then splices the serialised result back into the plan source
// between its `---` fences. The `mutate` callback returns `true` to request
// a write (idempotent by convention: return `false` when the mutation is a
// no-op so we skip the disk write entirely). Honours an optional leading
// HTML comment before the opening `---` (some plans carry license headers).
async function mutateFrontmatter(planPath, mutate, { dryRun } = {}) {
  const src = await fs.readFile(planPath, 'utf8');
  const re = /^((?:<!--[\s\S]*?-->\s*)?)---\r?\n([\s\S]*?)\r?\n---/;
  const match = src.match(re);
  if (!match) throw new Error(`mutateFrontmatter: no frontmatter in ${planPath}`);
  const prelude = match[1];
  const inner = match[2];
  const blockEnd = match.index + match[0].length;

  const doc = parseDocument(inner, { keepSourceTokens: true });
  const changed = mutate(doc);
  if (!changed) return false;

  let serialized = doc.toString();
  if (serialized.endsWith('\n')) serialized = serialized.slice(0, -1);
  const newBlock = `${prelude}---\n${serialized}\n---`;
  const newSrc = src.slice(0, match.index) + newBlock + src.slice(blockEnd);
  if (!dryRun) await fs.writeFile(planPath, newSrc, 'utf8');
  return true;
}

// Upsert `shippedPrs: [{repo, number, url}]` in a plan's frontmatter.
// Permanent record of merged PRs that shipped this plan's work. Written by:
//   (a) reconcile at archive time (from sidecar prs[] + gh state), and
//   (b) `backfill-prs-from-body` for legacy plans whose PR refs live in
//       prose only.
// Sidecar `prs:` remains the runtime register for in-flight PRs; this
// promotes the snapshot into the plan file so the record survives archival
// (`archived: true`). Idempotent: when the existing
// frontmatter value already matches, returns `false` without writing.
async function writeShippedPrs(planPath, entries, { dryRun } = {}) {
  return mutateFrontmatter(planPath, (doc) => {
    const existing = doc.get('shippedPrs');
    if (isSeq(existing) && shippedPrsEqual(existing.toJSON(), entries)) {
      return false;
    }
    const seq = new YAMLSeq();
    seq.flow = false;
    for (const e of entries) {
      const row = new YAMLMap();
      row.flow = false;
      row.set('repo', e.repo);
      row.set('number', e.number);
      if (e.url) row.set('url', e.url);
      seq.add(row);
    }
    doc.set('shippedPrs', seq);
    return true;
  }, { dryRun });
}

function shippedPrsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] || {};
    const y = b[i] || {};
    if (x.repo !== y.repo) return false;
    if (x.number !== y.number) return false;
    if ((x.url || null) !== (y.url || null)) return false;
  }
  return true;
}

// Set or clear legacy `archived:` in plan frontmatter (migration cleanup only).
// Sidecar archive bucket is sidecar `archived` per rule 8 — prefer
// setSidecarArchived for new writes.
async function setPlanArchivedFlag(planPath, value, { dryRun } = {}) {
  return mutateFrontmatter(planPath, (doc) => {
    if (value === true) {
      const cur = doc.get('archived');
      if (cur === true) return false;
      doc.set('archived', true);
      return true;
    }
    if (!doc.has('archived')) return false;
    doc.delete('archived');
    return true;
  }, { dryRun });
}

// ---------- subcommand: archive ----------

// `archive --slug <slug> --signal "<text>" [--parent <target>|--clear] [--dry-run]`
// — mechanical archive for one plan. Used by the plan-reconcile skill after the user
// picks candidates via AskQuestion, and by plan-state reconcile drag-drop
// controller when archiving on drop. One slug per call (agent loops) so
// each failure is isolated and logs are readable. Idempotent: archiving an
// already-archived plan is a no-op; re-running with the same slug after a
// partial failure will finish frontmatter + parent bullet updates.
//
// Optional pre-archive reparent (drag-drop: "archive + place under a new
// parent" or "archive + clear parent"): when `--parent` / `--clear` is
// supplied, rewrite the plan's sidecar `parent:` before archival
// so `doArchive`'s parent lookup sees the intended target and appends the
// `## Child plans` bullet to the right plan atomically.
async function cmdArchive(flags) {
  const slug = requireString(flags, 'slug');
  const signal = typeof flags.signal === 'string' ? flags.signal : '';
  const dryRun = flags['dry-run'] === true;
  const clear = flags.clear === true;
  const parentFlag = typeof flags.parent === 'string' ? flags.parent : null;
  if (clear && parentFlag) die('archive: --parent and --clear are mutually exclusive');

  const plan = await findPlanBySlug(slug);
  if (!plan) die(`archive: no plan with slug "${slug}"`);
  if (plan.isArchived) {
    log(JSON.stringify({ archived: slug, parent: null, note: 'already archived' }));
    return;
  }

  if (clear || parentFlag) {
    const newParent = clear ? null : parentFlag;
    await validateReparent('archive', slug, newParent);
    await setSidecarParent(plan.planPath, newParent, { dryRun });
  }

  const plans = await listAllPlans();
  const planBySlug = new Map();
  for (const p of plans) planBySlug.set(p.slug, p);

  const { parentSlug } = await doArchive(plan, signal, planBySlug, dryRun);
  log(JSON.stringify({
    archived: slug,
    parent: parentSlug || null,
    signal,
    dryRun,
  }));
}

// ---------- subcommand: reparent ----------

// `reparent --slug <slug> (--parent <target-slug> | --clear) [--dry-run]` —
// rewrite a plan's frontmatter `parent:` value. Used by plan-state parent commands
// drag-drop controller for same-status drops (both source + target active,
// or both archived). Preserves YAML comments + other frontmatter via
// `mutateFrontmatter`. Refuses cycles (target ancestor chain can't contain
// source) and self-parenting. No-op when the value already matches.
async function cmdReparent(flags) {
  const slug = requireString(flags, 'slug');
  const clear = flags.clear === true;
  const parentFlag = typeof flags.parent === 'string' ? flags.parent : null;
  const dryRun = flags['dry-run'] === true;

  if (!clear && !parentFlag) die('reparent: --parent <target-slug> or --clear is required');
  if (clear && parentFlag) die('reparent: --parent and --clear are mutually exclusive');

  const newParent = clear ? null : parentFlag;

  const plan = await findPlanBySlug(slug);
  if (!plan) die(`reparent: no plan with slug "${slug}"`);

  await validateReparent('reparent', slug, newParent);

  const from = await resolvePlanParent(plan.planPath);
  const changed = await setSidecarParent(plan.planPath, newParent, { dryRun });
  log(JSON.stringify({ reparented: slug, from, to: newParent, changed, dryRun }));
}

// Shared pre-check for `reparent` / `archive --parent`. Validates that
// - a target slug resolves (under `plans/` or `plans/roadmap-topics/`),
// - source isn't its own parent,
// - reparenting wouldn't create a cycle (walks target's ancestor chain).
// Terminates the process via die() on any violation; returns normally
// otherwise. `null` newParent is always accepted (clear).
async function validateReparent(cmd, sourceSlug, newParent) {
  if (newParent === null) return;
  if (newParent === sourceSlug) die(`${cmd}: cannot set "${sourceSlug}" as its own parent`);
  const targetPlan = await findPlanBySlug(newParent);
  if (!targetPlan) die(`${cmd}: no plan with target parent slug "${newParent}"`);
  const chain = await collectAncestorSlugs(newParent);
  if (chain.includes(sourceSlug)) {
    die(`${cmd}: would create cycle — "${sourceSlug}" is already an ancestor of "${newParent}" (chain: ${chain.join(' -> ')})`);
  }
}

// Walk a plan's `parent:` chain up to a roadmap root or a missing/broken
// link. Returns the chain of visited slugs (exclusive of `startSlug` —
// i.e. just the ancestors). Terminates defensively if a slug repeats so
// a broken graph can't hang the walk.
async function collectAncestorSlugs(startSlug) {
  const chain = [];
  const seen = new Set([startSlug]);
  let cur = startSlug;
  while (true) {
    const plan = await findPlanBySlug(cur);
    if (!plan) break;
    const next = await resolvePlanParent(plan.planPath);
    if (!next) break;
    if (seen.has(next)) break;
    seen.add(next);
    chain.push(next);
    cur = next;
  }
  return chain;
}

// Upsert `parent:` in a plan's sidecar (<slug>.state.yaml). Canonical home
// for the parent link — Cursor's native Plan-mode writer strips frontmatter
// fields it doesn't recognise, so we keep the hierarchy link in the sidecar
// (which Cursor never touches) and leave plan-frontmatter alone. The
// plan-state resolves the effective parent via `resolveParentSlug`
// (sidecar wins, frontmatter is a legacy fallback until the
// `migrate-parent-to-sidecar` subcommand runs).
//
// Null writes as the literal `null` scalar. Returns `false` when the sidecar
// `parent:` already equals `newParent` (idempotent). Position: inserted at
// the top of the sidecar map so the human-readable shape is
// `parent: …` → `worktrees: …` → `prs: …` → `session: …`, matching the
// frontmatter convention from plan-file-conventions.mdc.
async function setSidecarParent(planPath, newParent, { dryRun } = {}) {
  const { doc, statePath } = await loadSidecarDoc(planPath);
  const existingNode = doc.get('parent', true);
  const existingJs = doc.get('parent');
  const existingNormalized =
    typeof existingJs === 'string' && existingJs.trim().length > 0
      ? existingJs.trim()
      : null;
  if (existingNode !== undefined && existingNormalized === newParent) {
    return false;
  }
  if (isMap(doc.contents) && !doc.has('parent')) {
    doc.contents.items.unshift(doc.createPair('parent', newParent));
  } else {
    doc.set('parent', newParent);
  }
  if (!dryRun) await saveSidecar(statePath, doc);
  return true;
}

// Set or clear sidecar `archived:` (sidecar archive bucket — rule 8).
async function setSidecarArchived(planPath, value, { dryRun } = {}) {
  const want = value === true;
  const { doc, statePath } = await loadSidecarDoc(planPath);
  const cur = doc.get('archived');
  if (want) {
    if (cur === true) return false;
    doc.set('archived', true);
  } else {
    if (cur === undefined || cur === false) return false;
    doc.set('archived', false);
  }
  if (!dryRun) await saveSidecar(statePath, doc);
  return true;
}

// Set sidecar plan lifecycle `status` (plan lifecycle status — rule 8 § Lifecycle).
async function setSidecarStatus(planPath, status, { dryRun } = {}) {
  if (!PLAN_BOARD_STATUSES.has(status)) {
    die(`setSidecarStatus: status must be one of not_started|started|completed|canceled (got "${status}")`);
  }
  const { doc, statePath } = await loadSidecarDoc(planPath);
  const cur = doc.get('status');
  if (cur === status) return false;
  doc.set('status', status);
  if (!dryRun) await saveSidecar(statePath, doc);
  return true;
}

// ---------- subcommand: unarchive ----------

// `unarchive --slug <slug> [--dry-run]` — inverse of the drag-drop
// archive gesture. Clears sidecar `archived:` on `<slug>.state.yaml` and
// legacy frontmatter `archived:` when present. Does **not** change sidecar
// `status` — archive/reconcile set `status: completed` and unarchive keeps it
// intentionally (restore = back in the active tree, not re-open delivery).
// Use `set-plan-status` when the developer wants a different lifecycle dot.
// Strips the matching `- \`<slug>\` archived...` bullet from the current
// parent's `## Child plans` section when that parent is still active (not
// archived). Leaves sidecar `parent:` untouched (gesture = "put it back where
// it was", not "reparent"). Idempotent: running on a plan without
// `archived: true` prints a no-op note and exits 0.
//
// Archived parents: body left alone — matches `doArchive`'s rule that
// archived parents are closed hierarchy. (If the user archived a subtree
// and then drags an unarchive onto an archived parent, the dispatcher
// doesn't emit that Decision in the first place; see drop-dispatch.ts.)
async function cmdUnarchive(flags) {
  const slug = requireString(flags, 'slug');
  const dryRun = flags['dry-run'] === true;

  const plan = await findPlanBySlug(slug);
  if (!plan) die(`unarchive: no plan with slug "${slug}"`);
  if (!plan.isArchived) {
    log(JSON.stringify({ unarchived: slug, parent: null, bulletRemoved: false, note: 'already active', dryRun }));
    return;
  }

  const parentSlug = await resolvePlanParent(plan.planPath);

  let bulletRemoved = false;
  if (parentSlug) {
    const planBySlug = new Map();
    for (const p of await listAllPlans()) planBySlug.set(p.slug, p);
    const parent = planBySlug.get(parentSlug);
    if (parent && !parent.isArchived) {
      bulletRemoved = await removeChildBullet(parent, slug, dryRun);
    }
  }

  await setSidecarArchived(plan.planPath, false, { dryRun });
  await setPlanArchivedFlag(plan.planPath, false, { dryRun });

  const { data } = await readSidecarPlain(plan.planPath);
  const statusPreserved = data.status ?? null;

  log(JSON.stringify({
    unarchived: slug,
    parent: parentSlug,
    bulletRemoved,
    statusPreserved,
    statusChanged: false,
    lifecycleNote:
      'unarchive clears archived only; completed from archive is intentional — use set-plan-status to change the plan lifecycle status',
    dryRun,
  }));
}

// Strip the first `- \`<childSlug>\` archived...` bullet from the parent
// plan body. The bullet shape is set by `noteChildArchived` — we match
// that shape exactly and remove the whole line (trailing newline
// included). Returns `false` when no matching bullet is present (the user
// hand-edited it, or it was never written — the drop dispatcher logs
// `bulletRemoved: false` so this is visible in the output channel).
async function removeChildBullet(parent, childSlug, dryRun) {
  const src = await fs.readFile(parent.planPath, 'utf8');
  const escaped = childSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lineRe = new RegExp(`^-\\s+\`${escaped}\`\\s+archived[^\\n]*\\n?`, 'm');
  if (!lineRe.test(src)) return false;
  const updated = src.replace(lineRe, '');
  if (!dryRun) await fs.writeFile(parent.planPath, updated, 'utf8');
  return true;
}

// ---------- subcommand: migrate-parent-to-sidecar ----------

// `migrate-parent-to-sidecar [--dry-run]` — one-shot corpus migration for
// step 3 of the parent-slug-in-sidecar plan. For every plan under `plans/`
// and `plans/roadmap-topics/`:
//   1. If plan frontmatter has a `parent:` key, copy its value into the
//      sidecar (creating the sidecar with the conventional header if
//      missing) and then delete the frontmatter `parent:` key.
//   2. When both locations already carry a `parent:` key and they
//      disagree, the sidecar wins (sidecar union already resolves
//      it that way); the frontmatter is still stripped so the two
//      locations can never drift again. The disagreement is reported in
//      the run summary so the user can audit.
//   3. Plans whose frontmatter already has no `parent:` key are left
//      alone — the sidecar legacy-fallback reader handles both
//      pre- and post-migration shapes.
//
// Idempotent: re-runs after a successful run report `alreadyMigrated`
// for every plan and write nothing. Intended for one-off migration on
// `.sedea/operations/.../plans/` trees. Output: JSON summary on stdout so the
// plan-reconcile-style caller can inspect `.conflicts.length` for red-flag audit.
async function cmdMigrateParentToSidecar(flags) {
  const dryRun = flags['dry-run'] === true;
  const plans = await listAllPlans();

  const moves = []; // { slug, from, to, conflict }
  let alreadyMigrated = 0;
  let noSource = 0;
  const conflicts = [];
  const skipped = []; // { slug, reason }

  for (const plan of plans) {
    const fm = await readFrontmatterParentKeyPresence(plan.planPath);
    const sc = await readSidecarParentKeyPresence(plan.planPath);

    if (!fm.hasKey) {
      if (sc.hasKey) alreadyMigrated += 1;
      else noSource += 1;
      continue;
    }

    let sidecarWillChange = false;
    let conflict = false;
    if (!sc.hasKey) {
      sidecarWillChange = true;
    } else if (sc.value !== fm.value) {
      conflict = true;
    }

    try {
      if (sidecarWillChange) {
        await setSidecarParent(plan.planPath, fm.value, { dryRun });
      }
      await stripFrontmatterParent(plan.planPath, { dryRun });
    } catch (err) {
      // A frontmatter-rewrite failure on a single plan (usually a YAML
      // syntax error predating this migration) should not abort the whole
      // run — the other plans are independent. Collect the skip, continue.
      skipped.push({
        slug: plan.slug,
        reason: err && err.message ? err.message : String(err),
      });
      continue;
    }

    const finalSidecarValue = sidecarWillChange ? fm.value : sc.value;
    moves.push({
      slug: plan.slug,
      from: fm.value,
      to: finalSidecarValue,
      conflict,
    });
    if (conflict) {
      conflicts.push({
        slug: plan.slug,
        frontmatter: fm.value,
        sidecar: sc.value,
      });
    }
  }

  for (const m of moves) {
    const tag = m.conflict ? ' (CONFLICT — sidecar wins)' : '';
    log(
      `  ${dryRun ? '[dry-run] would migrate' : 'migrated'} ${m.slug}: ` +
        `fm="${m.from ?? 'null'}" -> sidecar="${m.to ?? 'null'}"${tag}`,
    );
  }
  for (const s of skipped) {
    log(`  skipped ${s.slug}: ${s.reason}`);
  }
  log('');
  log(`== migrate-parent-to-sidecar ${dryRun ? '(dry-run) ' : ''}==`);
  log(`  migrated:         ${moves.length}`);
  log(`  alreadyMigrated:  ${alreadyMigrated}`);
  log(`  noSource:         ${noSource}`);
  log(`  conflicts:        ${conflicts.length}`);
  log(`  skipped:          ${skipped.length}`);
  log('');
  process.stdout.write(
    `${JSON.stringify(
      {
        migrated: moves.length,
        alreadyMigrated,
        noSource,
        conflicts,
        skipped,
        dryRun,
      },
      null,
      2,
    )}\n`,
  );
}

// Read plan frontmatter `parent:` key presence + value, distinguishing
// "key absent" from "key present with null value". `readPlanFrontmatter`
// collapses both to null, which is fine for the extension reader but
// loses the distinction migration needs (migration only writes when
// the source has the key).
async function readFrontmatterParentKeyPresence(planPath) {
  const src = await fs.readFile(planPath, 'utf8');
  const m = src.match(/^(?:<!--[\s\S]*?-->\s*)?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { hasKey: false, value: null };
  let doc;
  try {
    doc = parseDocument(m[1]);
  } catch {
    return { hasKey: false, value: null };
  }
  if (!isMap(doc.contents)) return { hasKey: false, value: null };
  if (!doc.has('parent')) return { hasKey: false, value: null };
  const v = doc.get('parent');
  const value =
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
  return { hasKey: true, value };
}

// Sidecar counterpart to `readFrontmatterParentKeyPresence`.
// `readSidecarPlain` collapses "key absent" and "key present-null" to
// the same `parent: null`, but migration needs to distinguish them so an
// explicitly-cleared sidecar (`parent: null`) isn't overwritten by a
// stale frontmatter value.
async function readSidecarParentKeyPresence(planPath) {
  const statePath = sidecarPathFor(planPath);
  if (!(await fileExists(statePath))) return { hasKey: false, value: null };
  const src = await fs.readFile(statePath, 'utf8');
  let doc;
  try {
    doc = parseDocument(src);
  } catch {
    return { hasKey: false, value: null };
  }
  if (!isMap(doc.contents)) return { hasKey: false, value: null };
  if (!doc.has('parent')) return { hasKey: false, value: null };
  const v = doc.get('parent');
  const value =
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
  return { hasKey: true, value };
}

// Remove the `parent:` key from a plan's frontmatter via the shared
// `mutateFrontmatter` helper. No-op (returns false) when the key is
// already absent — makes re-runs of the migration cheap and safe.
async function stripFrontmatterParent(planPath, { dryRun } = {}) {
  return mutateFrontmatter(
    planPath,
    (doc) => {
      if (!doc.has('parent')) return false;
      doc.delete('parent');
      return true;
    },
    { dryRun },
  );
}

// ---------- subcommand: set-plan-status ----------

// `set-plan-status --slug <slug> --status <not_started|started|completed|canceled> [--dry-run]`
// — write plan lifecycle status to sidecar only (rule 8).
async function cmdSetPlanStatus(flags) {
  const slug = requireString(flags, 'slug');
  const rawStatus = requireString(flags, 'status');
  if (!PLAN_BOARD_STATUSES.has(rawStatus)) {
    die(
      `set-plan-status: status must be one of not_started|started|completed|canceled (got "${rawStatus}")`,
    );
  }
  const dryRun = flags['dry-run'] === true;
  const plan = await findPlanBySlug(slug);
  if (!plan) die(`set-plan-status: no plan with slug "${slug}"`);
  if (
    (await resolvePlanArchived(plan.planPath))
    && rawStatus !== 'completed'
    && rawStatus !== 'canceled'
  ) {
    die(`set-plan-status: plan "${slug}" is archived — unarchive first or set completed/canceled`);
  }
  const changed = await setSidecarStatus(plan.planPath, rawStatus, { dryRun });
  log(JSON.stringify({ slug, status: rawStatus, changed, dryRun }));
}

// ---------- subcommand: set-todo-status ----------

// Canonical todo status values, matching the extension's reader + the
// `Todos` section in plan-file-conventions.mdc. `done` is accepted as
// input for ergonomic CLI use but is always normalised to `completed`
// on write (the corpus convention).
const TODO_STATUSES = new Set(['pending', 'in_progress', 'completed', 'cancelled']);

function canonicalTodoStatus(raw) {
  if (raw === 'done') return 'completed';
  if (TODO_STATUSES.has(raw)) return raw;
  return null;
}

// `set-todo-status --slug <s> --todo <id> --status <pending|in_progress|completed|cancelled> [--dry-run]`
// — flip a single `todos[].status` entry in a plan's frontmatter via
// the shared `mutateFrontmatter` helper so comments, field order, and
// wrapped `content:` lines all survive. Idempotent: when the target
// value already matches, returns `changed: false` and skips the disk
// write (no watcher reload thrash). Unknown todo id lists the available
// ids in the error message so the agent can self-correct without a
// re-read. Source file can live under `plans/` or `plans/roadmap-topics/` —
// resolution is via the existing `findPlanBySlug`.
async function cmdSetTodoStatus(flags) {
  const slug = requireString(flags, 'slug');
  const todoId = requireString(flags, 'todo');
  const rawStatus = requireString(flags, 'status');
  const dryRun = flags['dry-run'] === true;

  const status = canonicalTodoStatus(rawStatus);
  if (!status) {
    die(`set-todo-status: status must be one of pending|in_progress|completed|cancelled (got "${rawStatus}")`);
  }

  const plan = await findPlanBySlug(slug);
  if (!plan) die(`set-todo-status: no plan with slug "${slug}"`);

  let from = null;
  const changed = await mutateFrontmatter(plan.planPath, (doc) => {
    const todos = doc.get('todos');
    if (!isSeq(todos) || todos.items.length === 0) {
      die(`set-todo-status: plan "${slug}" has no todos`);
    }
    const entry = todos.items.find((t) => isMap(t) && String(t.get('id')) === todoId);
    if (!entry) {
      const available = todos.items
        .filter(isMap)
        .map((t) => String(t.get('id')))
        .join(', ');
      die(`set-todo-status: no todo with id "${todoId}" in plan "${slug}" (available: ${available})`);
    }
    const existing = entry.get('status');
    from = typeof existing === 'string' ? existing : null;
    // Normalise existing value for comparison so re-runs against a
    // `done` alias in the file still see themselves as idempotent.
    const fromCanonical = from ? canonicalTodoStatus(from) : null;
    if (fromCanonical === status) return false;
    entry.set('status', status);
    return true;
  }, { dryRun });

  log(JSON.stringify({ slug, todo: todoId, from, to: status, changed, dryRun }));
}

// Thin aliases for the two common transitions. Forward unchanged flags
// (including `--dry-run`) so `todo-start` / `todo-done` behave
// identically to `set-todo-status --status …` otherwise.
const cmdTodoStart = (flags) => cmdSetTodoStatus({ ...flags, status: 'in_progress' });
const cmdTodoDone = (flags) => cmdSetTodoStatus({ ...flags, status: 'completed' });

// ---------- subcommand: backfill-prs-from-body ----------

// `backfill-prs-from-body (--slug <s> | --all) [--dry-run] [--force]` —
// One-shot writer that populates plan frontmatter `shippedPrs` for legacy
// plans whose merged-PR references only live in prose. Uses the same
// `scanBodyForPrs` regex as list-candidates (markdown link + bare
// `merged #N`). Default behaviour:
//   - Skip plans that already carry a non-empty `shippedPrs` in frontmatter
//     (reconcile owns future writes from Phase 2 forward).
//   - Skip plans whose body yields no PR hits (nothing to backfill).
//   - When a body hit lacks an `orgRepo` capture (bare `merged #N`),
//     default to the Sedea hosting repo's `git remote origin` (org/repo).
// `--force` overwrites existing shippedPrs values (for re-runs when the
// prose gets clearer). Prints a per-plan line + summary.
async function cmdBackfillPrsFromBody(flags) {
  const slugFlag = typeof flags.slug === 'string' ? flags.slug : null;
  const allFlag = flags.all === true;
  const dryRun = flags['dry-run'] === true;
  const force = flags.force === true;
  if (!slugFlag && !allFlag) die('backfill-prs-from-body: --slug <s> or --all is required');
  if (slugFlag && allFlag) die('backfill-prs-from-body: --slug and --all are mutually exclusive');

  let targets;
  if (slugFlag) {
    const plan = await findPlanBySlug(slugFlag);
    if (!plan) die(`backfill-prs-from-body: no plan with slug "${slugFlag}"`);
    targets = [plan];
  } else {
    targets = await listAllPlans();
    targets.sort((a, b) => a.slug.localeCompare(b.slug));
  }

  const defaultBareRepo = await getHostingOrgRepoCached();

  let updated = 0;
  let skippedExisting = 0;
  let skippedNoPr = 0;
  for (const plan of targets) {
    const fm = await readPlanFrontmatter(plan.planPath);
    if (!fm) continue;
    if (!force && Array.isArray(fm.shippedPrs) && fm.shippedPrs.length > 0) {
      skippedExisting += 1;
      continue;
    }

    const body = await fs.readFile(plan.planPath, 'utf8');
    const bodyPrs = scanBodyForPrs(body);
    if (bodyPrs.length === 0) {
      skippedNoPr += 1;
      continue;
    }

    // Dedupe by (repo, number) across both scan patterns — the same PR may
    // surface as both a markdown link (with url) and a bare `merged #N` hit.
    // Keep the first occurrence, but upgrade to a URL-bearing row if a later
    // match has one.
    const byKey = new Map();
    for (const p of bodyPrs) {
      const repo = p.orgRepo || defaultBareRepo;
      const key = `${repo}#${p.number}`;
      const prev = byKey.get(key);
      if (!prev) {
        byKey.set(key, { repo, number: p.number, url: p.url || null });
      } else if (!prev.url && p.url) {
        prev.url = p.url;
      }
    }
    const entries = [...byKey.values()];

    const wrote = await writeShippedPrs(plan.planPath, entries, { dryRun });
    if (wrote) {
      const summary = entries
        .map((e) => `${e.repo}#${e.number}${e.url ? '' : ' (no url)'}`)
        .join(', ');
      log(`  ${dryRun ? '[dry-run] would write' : 'wrote'} ${plan.slug}: ${summary}`);
      updated += 1;
    } else {
      skippedExisting += 1;
    }
  }

  log('');
  log(`== backfill-prs-from-body ${dryRun ? '(dry-run) ' : ''}==`);
  log(`  updated:          ${updated}`);
  log(`  skipped-existing: ${skippedExisting}`);
  log(`  skipped-no-pr:    ${skippedNoPr}`);
}

// ---------- helpers ----------

function requireString(flags, name) {
  const v = flags[name];
  if (typeof v !== 'string' || v.length === 0) die(`missing --${name}`);
  return v;
}

// ---------- entry ----------

const USAGE = `Usage: plan-state <subcommand> [flags]

Subcommands:
  resolve --cwd <path>
      Print "<slug>\\t<planPath>" for the plan whose sidecar covers <cwd>.
      Exit 2 when no plan matches (rule-friendly).

  set-worktrees --slug <slug> --json '[{"repo":"user-auth","path":"/abs"}]'
      Replace sidecar worktrees[] wholesale.

  init-sidecar --plan-path <abs> --parent <slug|null> [--plans-base-path <abs>]
      Create a new sidecar stub with parent, optional plansMonthBucket (first-write
      derivation), and empty worktrees/prs. Refuses when the sidecar already exists.

  resolve-plans-write-dir [--plans-base-path <abs>] [--target-plan-path <abs>]
      [--parent-plan-path <abs>] [--flat-plans-root <abs>] [--json]
      Resolve absolute plans write directory for core planner skills. Priority:
      explicit plansBasePath handover, target plan dirname, parent plan dirname,
      then flat plans root (first registered scope dir or --flat-plans-root).

  set-session --slug <slug> --focus <abs>
      Set sidecar session.focusPath; promotes sidecar status to started when
      the plan is active and status is missing or not_started.

  set-plan-status --slug <slug> --status <not_started|started|completed|canceled> [--dry-run]
      Write plan lifecycle status to sidecar status only (rule 8).

  upsert-pr --slug <slug> --repo <basename> --number <n>
      Append {repo, number} to sidecar prs[] (idempotent).

  prune-sessions --path <abs> | --all
      Remove stale worktrees/session entries. Data-only, never touches git.

  detect-stale-workspaces [--slug <slug>] [--json]
      Read-only: emit worktrees[] paths that still exist on disk (optional
      mergedPr when sidecar prs[] is present). Used by coding-session
      (detect-only) and plan-reconcile pre-cleanup.

  reconcile [--dry-run] [--prune-worktrees]
      For every active plan with prs[]: gh pr view each entry; if all merged,
      set sidecar archived: true and status: completed (rule 8) and note the
      plan under the parent plan's ## Child plans section. Resolves org/repo
      from worktree git remote or hosting repo basename (no static alias map).
      Flags closed-without-merge and mixed states. --prune-worktrees also runs
      prune-sessions --all.

  list-candidates [--json]
      Emit archive candidates that reconcile does NOT own (sidecar prs[]
      empty). Surfaces active (non-sidecar-archived) plans with all todos done
      whose merged PRs only live in body prose, or with no PR evidence in the
      body. Intended for the plan-reconcile skill's interactive AskQuestion loop.

  archive --slug <slug> --signal <text> [--parent <target>|--clear] [--dry-run]
      Mechanical archive for one plan: set sidecar archived: true and
      status: completed, append "- <slug> archived -- <signal>" under the parent
      plan's ## Child plans, and clear legacy frontmatter archived: when present.
      Sidecar stays beside the plan file. One slug per call; idempotent.
      Optional --parent/--clear rewrites the sidecar parent before archival
      (drag-drop archive-to-new-parent gesture).

  reparent --slug <slug> (--parent <target-slug> | --clear) [--dry-run]
      Rewrite a plan's sidecar parent: value. Refuses cycles and
      self-parenting. No-op when the value already matches. Used by the
      plan-state drag-drop controller for same-archive-status drops.

  unarchive --slug <slug> [--dry-run]
      Clear sidecar archived: on the plan, remove legacy frontmatter archived:
      when present, and strip the matching "- <slug> archived..." bullet from
      the current parent's ## Child plans section. Sidecar status is preserved
      (completed after archive is intentional; use set-plan-status to change
      the lifecycle dot). Leaves sidecar parent: alone. Idempotent on
      already-active plans.

  migrate-parent-to-sidecar [--dry-run]
      One-shot: for every plan under plans/ and plans/roadmap-topics/, copy
      frontmatter parent: into the sidecar (creating the sidecar if needed)
      and strip the frontmatter key. Idempotent:
      re-runs are no-ops. Reports conflicts where both locations already
      carried non-matching values (sidecar wins; frontmatter stripped).

  set-todo-status --slug <slug> --todo <id> --status <pending|in_progress|completed|cancelled> [--dry-run]
      Flip a single todos[].status entry in a plan's frontmatter.
      Accepts 'done' as an alias for 'completed'. Idempotent (no-op +
      changed:false when target already matches). Unknown todo id lists
      available ids. JSON stdout: {slug, todo, from, to, changed, dryRun}.

  todo-start --slug <slug> --todo <id> [--dry-run]
      Shorthand for set-todo-status --status in_progress.

  todo-done --slug <slug> --todo <id> [--dry-run]
      Shorthand for set-todo-status --status completed.

  backfill-prs-from-body (--slug <s> | --all) [--dry-run] [--force]
      Populate frontmatter shippedPrs on legacy plans whose merged PR
      references only live in prose. Skips plans that already have
      shippedPrs unless --force is passed. Bare "merged #N" references
      default to the hosting repo's git remote origin (org/repo).
`;

async function main() {
  const raw = process.argv.slice(2);
  const sub = raw[0];
  const subRest = raw.slice(1);
  if (!sub || sub === '--help' || sub === '-h') {
    process.stdout.write(USAGE);
    return;
  }
  const flags = parseFlags(subRest);
  switch (sub) {
    case 'resolve':
      await cmdResolve(flags);
      break;
    case 'set-worktrees':
      await cmdSetWorktrees(flags);
      break;
    case 'init-sidecar':
      await cmdInitSidecar(flags);
      break;
    case 'resolve-plans-write-dir':
      await cmdResolvePlansWriteDir(flags);
      break;
    case 'set-session':
      await cmdSetSession(flags);
      break;
    case 'set-plan-status':
      await cmdSetPlanStatus(flags);
      break;
    case 'upsert-pr':
      await cmdUpsertPr(flags);
      break;
    case 'prune-sessions':
      await cmdPruneSessions(flags);
      break;
    case 'detect-stale-workspaces':
      await cmdDetectStaleWorkspaces(flags);
      break;
    case 'reconcile':
      await cmdReconcile(flags);
      break;
    case 'list-candidates':
      await cmdListCandidates(flags);
      break;
    case 'archive':
      await cmdArchive(flags);
      break;
    case 'reparent':
      await cmdReparent(flags);
      break;
    case 'unarchive':
      await cmdUnarchive(flags);
      break;
    case 'migrate-parent-to-sidecar':
      await cmdMigrateParentToSidecar(flags);
      break;
    case 'set-todo-status':
      await cmdSetTodoStatus(flags);
      break;
    case 'todo-start':
      await cmdTodoStart(flags);
      break;
    case 'todo-done':
      await cmdTodoDone(flags);
      break;
    case 'backfill-prs-from-body':
      await cmdBackfillPrsFromBody(flags);
      break;
    default:
      die(`unknown subcommand: ${sub}\n${USAGE}`);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((err) => {
    die(err && err.stack ? err.stack : String(err));
  });
}
