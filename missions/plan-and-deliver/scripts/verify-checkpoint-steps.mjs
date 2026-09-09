#!/usr/bin/env node
/**
 * Checkpoint-trust governance lint — forbidden idle-handoff and gate-terminal patterns.
 *
 * Phase 1 scaffold: warn-only by default (exit 0). Phase 2+ audit PRs use --enforce.
 *
 * Step-table contract (designation enum, inventory status): see
 * `.sedea/centers/sedea/docs/pr-step-table-template.md` (PR 1 / #865).
 *
 * Run from hosting repo root or software-development center repo root:
 *
 *   node .sedea/centers/software-development/missions/plan-and-deliver/scripts/verify-checkpoint-steps.mjs
 *   node .../verify-checkpoint-steps.mjs --enforce
 *
 * Exit 0 when warn-only (default) or no violations under --enforce.
 * Exit 1 under --enforce when any violation is reported.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveGovernanceContext } from './resolve-governance-root.mjs';

/** @typedef {{ id: string; regex: RegExp; category: 'idle-handoff' | 'gate-terminal'; hint: string }} PatternDef */

/** @typedef {{ rel: string; line: number; category: string; patternId: string; excerpt: string }} Finding */

const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'out', 'dist', '.build']);
const SKIP_PREFIXES = ['.sedea/operations'];

const GOVERNANCE_SUFFIXES = new Set(['plan.mdc', 'SKILL.md']);
const GOVERNANCE_EXTENSIONS = new Set(['.mdc']);

/**
 * Forbidden idle-handoff prose at checkpoint / waiting steps (conduct 1 § No idle handoff).
 * @type {PatternDef[]}
 */
const IDLE_HANDOFF_PATTERNS = [
  {
    id: 'wait-for-instructions',
    category: 'idle-handoff',
    regex: /\bI(?:'ll| will) wait(?:\s+for|\s+until)\b/i,
    hint: 'Use mission_control_present_structured_choice / AskQuestion — not prose wait',
  },
  {
    id: 'tell-me-when',
    category: 'idle-handoff',
    regex: /\btell me when\b/i,
    hint: 'External-wait needs resume modal before turn end',
  },
  {
    id: 'reply-when-ready',
    category: 'idle-handoff',
    regex: /\breply when(?: you'?re)? ready\b/i,
    hint: 'List resume paths in structured choice options',
  },
  {
    id: 'come-back-when',
    category: 'idle-handoff',
    regex: /\bcome back when\b/i,
    hint: 'External-wait needs resume modal before turn end',
  },
  {
    id: 'ball-in-court',
    category: 'idle-handoff',
    regex: /\bball is in your court\b/i,
    hint: 'Modal options required — conduct 1 § No idle handoff',
  },
  {
    id: 'over-to-you',
    category: 'idle-handoff',
    regex: /\bover to you\b/i,
    hint: 'Modal options required — conduct 1 § No idle handoff',
  },
  {
    id: 'work-done-for-now',
    category: 'idle-handoff',
    regex: /\bmy work here is done\b/i,
    hint: 'Terminal or gate modal — not prose handoff',
  },
  {
    id: 'stay-advisory-until',
    category: 'idle-handoff',
    regex: /\bstay advisory until you pick\b/i,
    hint: 'coding-session § Prose-only ship handoff forbidden',
  },
  {
    id: 'reply-with-results',
    category: 'idle-handoff',
    regex: /\breply with results\b/i,
    hint: 'deploy-walk Manual step await gate — not free-form reply',
  },
  {
    id: 'waiting-for-review-prose',
    category: 'idle-handoff',
    regex: /\bwaiting for (?:the )?(?:developer to )?review\b/i,
    hint: 'Post-create-pr or pr-review disposition gate — not prose',
  },
];

/**
 * Gate-terminal / refocus-at-open-gate patterns (premature terminal or parent redirect).
 * @type {PatternDef[]}
 */
const GATE_TERMINAL_PATTERNS = [
  {
    id: 'refocus-mcp-at-gate',
    category: 'gate-terminal',
    regex: /\bmission_control_refocus_parent_lane\b.*\b(?:open gate|USER_CHECKPOINT|worktree-open|cut-point)\b/i,
    hint: 'mission_control_refocus_parent_lane is for terminal child completion — not open gates',
  },
  {
    id: 'switch-to-parent-lane',
    category: 'gate-terminal',
    regex: /\b(?:switch to|go to|focus) (?:the )?parent lane\b/i,
    hint: 'Use mission_control_refocus_parent_lane at terminal completion only',
  },
  {
    id: 'done-go-to-parent',
    category: 'gate-terminal',
    regex: /\bdone\s*[—-]\s*go to parent\b/i,
    hint: 'Forbidden AskQuestion option purpose — use mission_control_refocus_parent_lane',
  },
  {
    id: 'terminal-at-open-gate',
    category: 'gate-terminal',
    regex: /\bmission_control_send_agent_result\b.*\b(?:open gate|before (?:the )?modal|without (?:structured choice|AskQuestion))\b/i,
    hint: 'USER_CHECKPOINT gates need structured choice before terminal result',
  },
  {
    id: 'prose-only-pr-handoff',
    category: 'gate-terminal',
    regex: /\bPR created\b.*\breview on GitHub\b/i,
    hint: 'Post-create-pr handoff gate — same turn mission_control_present_structured_choice',
  },
];

const ALL_PATTERNS = [...IDLE_HANDOFF_PATTERNS, ...GATE_TERMINAL_PATTERNS];

/**
 * Required binding anchors — under --enforce, missing substrings fail the scan.
 * Paths are repo-relative from the active governance scan root (center or hosting).
 * @type {{ rel: string; anchor: string; hint: string }[]}
 */
const REQUIRED_BINDING_ANCHORS = [
  {
    rel: 'missions/plan-and-deliver/plan.mdc',
    anchor: 'Child registry is not completion evidence',
    hint: 'plan-and-deliver §8 pre-resolution must forbid registry cardinality as ship-complete',
  },
  {
    rel: 'missions/single-phase/plan.mdc',
    anchor: 'Child registry is not completion evidence',
    hint: 'single-phase §8 pre-resolution must forbid registry cardinality as ship-complete',
  },
  {
    rel: 'missions/quick-fix/plan.mdc',
    anchor: 'Child registry is not completion evidence',
    hint: 'quick-fix §7 pre-resolution must forbid registry cardinality as ship-complete',
  },
];

function die(msg) {
  process.stderr.write(`verify-checkpoint-steps: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  let enforce = false;
  let pathsFile = null;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--enforce') {
      enforce = true;
    } else if (arg === '--paths-file') {
      i += 1;
      pathsFile = argv[i];
      if (!pathsFile) die('--paths-file requires a path');
    } else if (arg === '-h' || arg === '--help') {
      process.stdout.write(`Usage: verify-checkpoint-steps.mjs [--enforce] [--paths-file FILE]

  --enforce       Exit 1 when violations are found (phase 2+ CI hard gate)
  --paths-file    Newline-separated repo-relative paths to scan (default: governance glob)

Phase 1 default: warn-only — prints WARN lines and exits 0.
`);
      process.exit(0);
    } else {
      die(`unknown argument: ${arg}`);
    }
  }
  return { enforce, pathsFile };
}

async function walkCenterGovernanceFiles(centerRoot, relDir = '', out = []) {
  const abs = path.join(centerRoot, relDir);
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIR_NAMES.has(ent.name)) continue;
    const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
    const relPosix = rel.split(path.sep).join('/');
    const childAbs = path.join(centerRoot, rel);
    if (ent.isDirectory()) {
      await walkCenterGovernanceFiles(centerRoot, rel, out);
    } else if (isGovernanceFile(relPosix, ent.name)) {
      out.push({ abs: childAbs, rel: relPosix });
    }
  }
  return out;
}

function shouldSkipRel(relPosix) {
  for (const prefix of SKIP_PREFIXES) {
    if (relPosix === prefix || relPosix.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

function isGovernanceFile(relPosix, baseName) {
  if (GOVERNANCE_SUFFIXES.has(baseName)) return true;
  if (baseName.endsWith('.mdc') && relPosix.includes('/rules/')) return true;
  if (baseName.endsWith('.mdc') && relPosix.includes('/missions/')) return true;
  return false;
}

async function walkGovernanceFiles(rootDir, relDir = '', out = []) {
  const abs = path.join(rootDir, relDir);
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    if (SKIP_DIR_NAMES.has(ent.name)) continue;
    const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
    const relPosix = rel.split(path.sep).join('/');
    if (shouldSkipRel(relPosix)) continue;
    const underCenters = relPosix.startsWith('.sedea/centers/');
    const leadsToCenters =
      ent.isDirectory() &&
      (relPosix === '.sedea' || relPosix === '.sedea/centers' || underCenters);
    if (!underCenters) {
      if (leadsToCenters) {
        await walkGovernanceFiles(rootDir, rel, out);
      }
      continue;
    }
    const childAbs = path.join(rootDir, rel);
    if (ent.isDirectory()) {
      await walkGovernanceFiles(rootDir, rel, out);
    } else if (isGovernanceFile(relPosix, ent.name)) {
      out.push({ abs: childAbs, rel: relPosix });
    }
  }
  return out;
}

/**
 * Skip lines that document forbidden patterns (normative tables, anti-pattern catalogs).
 * @param {string} line
 * @param {string} rel
 */
function isDocumentationExempt(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^\|/.test(trimmed)) return true;
  if (/^#{1,6}\s/.test(trimmed) && /\bForbidden\b/i.test(trimmed)) return true;
  // Normative **Forbidden:** / **Forbidden** catalogs (colon variant was a false-positive gap).
  if (/\*\*Forbidden\b/.test(trimmed)) return true;
  if (/\*\*Forbidden on this lane:\*\*/.test(trimmed)) return true;
  // Binding sections that quote forbidden idle-handoff phrases as anti-pattern examples.
  if (
    /\*\*(?:Turn completion|Merged-forward|Implicit external-wait|Manual step presentation|When required)\b/.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (/\bdo not call\b/i.test(trimmed)) return true;
  if (
    /\bmission_control_propose_dispatch_resolution\b/.test(trimmed) &&
    /\b(?:Squad Leader|leader only|leader lane|only the Squad Leader)\b/i.test(trimmed)
  ) {
    return true;
  }
  if (/\bnot\b/i.test(trimmed) && /\b(?:external-wait|prose-only|idle handoff)\b/i.test(trimmed)) {
    return true;
  }
  // Detection-procedure bullets quoting softened prose as examples to match, not prescribe.
  if (/^\s*-\s+Use semantic matching\b/.test(trimmed)) return true;
  if (/\bsuch as\s+["'][^"']*\b(?:tell me when|reply with|come back when)\b/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * @param {string} body
 * @param {string} rel
 * @returns {Finding[]}
 */
function scanFile(body, rel) {
  const findings = [];
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isDocumentationExempt(line)) continue;
    for (const pattern of ALL_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          rel,
          line: i + 1,
          category: pattern.category,
          patternId: pattern.id,
          excerpt: line.trim().slice(0, 160),
        });
      }
    }
  }
  return findings;
}

/**
 * @param {string} body
 * @param {string} rel
 * @param {string} anchor
 * @returns {Finding[]}
 */
function scanRequiredAnchor(body, rel, anchor) {
  if (body.includes(anchor)) return [];
  return [
    {
      rel,
      line: 1,
      category: 'gate-terminal',
      patternId: 'missing-binding-anchor',
      excerpt: `missing required anchor: ${anchor}`,
    },
  ];
}

async function loadPathsFromFile(scanRoot, pathsFile) {
  const raw = await fs.readFile(pathsFile, 'utf8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((rel) => ({
      rel: rel.split(path.sep).join('/'),
      abs: path.join(scanRoot, rel),
    }));
}

async function main() {
  const { enforce, pathsFile } = parseArgs(process.argv);
  const ctx = await resolveGovernanceContext();

  const files = pathsFile
    ? await loadPathsFromFile(ctx.scanRoot, pathsFile)
    : ctx.mode === 'center'
      ? await walkCenterGovernanceFiles(ctx.centerRoot)
      : await walkGovernanceFiles(ctx.scanRoot);

  /** @type {Finding[]} */
  const allFindings = [];

  for (const { abs, rel } of files) {
    let body;
    try {
      body = await fs.readFile(abs, 'utf8');
    } catch (err) {
      process.stderr.write(`WARN: could not read ${rel}: ${err.message}\n`);
      continue;
    }
    allFindings.push(...scanFile(body, rel));
  }

  if (enforce) {
    for (const { rel, anchor, hint } of REQUIRED_BINDING_ANCHORS) {
      const relFromScanRoot =
        ctx.mode === 'hosting' ? `.sedea/centers/software-development/${rel}` : rel;
      const abs = path.join(ctx.scanRoot, relFromScanRoot);
      let body;
      try {
        body = await fs.readFile(abs, 'utf8');
      } catch (err) {
        allFindings.push({
          rel,
          line: 1,
          category: 'gate-terminal',
          patternId: 'missing-binding-anchor',
          excerpt: `could not read for anchor check: ${err.message} (${hint})`,
        });
        continue;
      }
      allFindings.push(...scanRequiredAnchor(body, relFromScanRoot, anchor));
    }
  }

  if (allFindings.length === 0) {
    process.stdout.write(
      `verify-checkpoint-steps: OK (${files.length} governance file(s) scanned, 0 pattern hit(s))\n`,
    );
    return;
  }

  const modeLabel = enforce ? 'ERROR' : 'WARN';
  for (const f of allFindings) {
    const stream = enforce ? process.stderr : process.stdout;
    stream.write(
      `${modeLabel}: ${f.rel}:${f.line} [${f.category}/${f.patternId}] ${f.excerpt}\n`,
    );
  }

  const summary = `verify-checkpoint-steps: ${allFindings.length} pattern hit(s) — ${files.length} governance file(s) scanned (${enforce ? 'enforce' : 'warn-only'})`;
  if (enforce) {
    process.stderr.write(`${summary}\n`);
    process.exit(1);
  }
  process.stdout.write(`${summary}\n`);
}

main().catch((err) => die(err.message));
