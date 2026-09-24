---
name: pre-pr-review
description: >-
 Pre-PR reviewer agent (fresh spawned lane): review a committed implementation
 diff against a PR plan or free-form scope, score plan/rules/quality categories,
 propose Code Review Follow-ups when plan-anchored, and report go/no-go before PR
 creation. Scores §7 Before deploy only; After deploy is post-merge (deploy-walk) and
 is omitted entirely from this report (not Defer, flags, or summary). Spawned by
 coding-session after the implementation cut point;
 coding-session obtains developer approval before any follow-up mutation.
designation:
  allowed: Pre-PR diff review; score plan, rules, quality; go or no-go before create-pr
  forbidden: Open PR without clean go; scope outside committed diff; dispatch resolution
inputs:
  anchorType:
    type: string
    description: Review anchor type, either plan or free-form.
    required: true
  targetPlanPath:
    type: string
    description: Absolute PR plan path when anchorType is plan.
    required: false
  targetPlanSlug:
    type: string
    description: PR plan slug when anchorType is plan.
    required: false
  worktreePath:
    type: string
    description: Absolute hosting repo worktree path to review.
    required: true
  worktreeName:
    type: string
    description: Branch being reviewed.
    required: true
  baseRef:
    type: string
    description: Remote base ref for the review diff, usually origin/main.
    required: true
  projectRules:
    type: array
    description: Absolute .cursor/rules/*.mdc paths to read before scoring.
    required: false
    default: []
  diffSummary:
    type: object
    description: >-
      Optional summary from coding-session. Must be a JSON object (not a string).
      Expected keys when present: commitCount, fileCount, insertions, deletions,
      head and/or subject; optional files (string array of paths).
    required: false
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from the upstream implementation agent.
    required: false
  upstreamSkill:
    type: string
    description: Skill that spawned this reviewer, usually coding-session.
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/pre-pr-review/SKILL.md"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
---

# Pre-PR Review

**Spawn-only (binding).** Run on a **fresh spawned child lane** opened by **`mission_control_spawn_agent`** from **`coding-session`**. Mission Control validates frontmatter **`inputs`** at spawn time. **Forbidden:** execute this skill **inline** on the **`coding-session`** lane — mirror [`create-pr/SKILL.md`](../create-pr/SKILL.md) (inline-only on **`coding-session`**; **`pre-pr-review`** is the inverse: spawn-only from that lane).

### Standalone dispatch (stop immediately)

If Mission Control opened a session whose only intent is **`pre-pr-review`** / pre-PR review with **no** spawn handover from active **`coding-session`** (`worktreePath`, `worktreeName`, `baseRef`, committed diff):

1. **Stop** — do not run review steps.
2. Tell the developer **`pre-pr-review`** is **spawn-only** — a fresh child lane from **`coding-session`** after ship cut-point + Before deploy.
3. Direct them to open or return to **`coding-session`** and complete the ship chain through [Auto-spawn pre-pr-review](../coding-session/SKILL.md#auto-spawn-pre-pr-review).

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Default warm-up* / *Warm-up cap exceptions*. Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. Frontmatter matches this table. **384 KiB cap:** frontmatter omits **`plan.mdc`** and **`development-process.md`** — Step 3 reads **`development-process.md`**; Step 4 loads **`inputs.targetPlanPath`** (PR plan, not Squad Leader **`plan.mdc`**). **No `alwaysApply` frontmatter flip.**

### `bootstrapRules` — host-resolved (Software Development center layer)

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap (≤10 KB); host merges when `centerSlug === software-development` |

### `skillWarmUp` — frontmatter `warmUpRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn contracts, terminal stop |
| `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc` | Review-before-PR, worktree ownership |
| `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` | Plan anchor validation (spawn-only) |

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice when this lane must surface a pick |
| `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc` | Ship lane context |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/pre-pr-review/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight |

**Who runs this:** a fresh **pre-PR reviewer agent** lane spawned by **`coding-session`** after developer implementation approval, **commit**, and inline **Before deploy** **`deploy-walk`** (or documented skip). The reviewer must have no carry-over from the coding agent that changed the worktree.

This pass complements, and does not replace, the later GitHub-surface **reviewer agent**.

**Worktree removal ownership (binding).** **Do not remove worktrees you do not own.** Review **`worktreePath`** only — this skill does **not** authorize **`git worktree remove`**, **`git worktree prune`**, or **`sedea_remove_worktree_folder`** except on **this pass’s** **`WORKTREE_ROOT`** when **all four** preconditions in [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Worktree ownership* and rule **20** § *Worktree removal ownership (binding)* hold. **`git worktree list` is read-only** when ownership is unclear — **stop; do not remove**.

## Agent messaging (MCP)

**MCP spawn/result skill.** Parent→child spawn and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*.

| Action | MCP tool |
|--------|----------|
| Parent spawn (when this skill emits a child lane) | **`mission_control_spawn_agent`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- Inline skills on this mission stay **inline-only** — no spawn wire change unless the protocol step explicitly spawns a child lane.

**Spawn-only lane (binding):** **`pre-pr-review`** runs on a **fresh spawned child lane** from parent **`coding-session`** only — **forbidden** inline on the coding lane. Parent **`coding-session`** owns spawn turn sequencing, Yield / #external-wait resume, and external-wait gates per [`.sedea/centers/sedea/rules/4_mission.mdc`](.sedea/centers/sedea/rules/4_mission.mdc) § *Spawn-ack semantics (binding)* and **`coding-session/SKILL.md`** § *Pre-PR spawn turn sequencing* — cross-reference only; do **not** duplicate the full block here.

## Structured choice (Mission Control)

This skill does not own approval modals — **`coding-session`** collects developer consent before spawns. When this lane must surface a pick, use **AskQuestion**, **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act*.

## Checkpoint turn UX (skill-local)

Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`pre-pr-review`**; invoker missions **`plan-and-deliver`**, **`single-phase`**, **`quick-fix`**, and **`debug-and-fix`** document their own **`coding-session`** ship gates — see **`coding-session/SKILL.md`** § *Checkpoint turn UX* for Review feedback approval and Create-PR handoff.

**Parent yield gate:** After parent **`coding-session`** emits **`mission_control_spawn_agent`** for this lane (spawn-only turn per rule **4** § *Spawn-ack semantics (binding)* — cross-reference only), the parent must close the **next** turn with a next-step resume modal per **`coding-session/SKILL.md`** § [Yield gate (Checkpoint — binding)](../coding-session/SKILL.md#yield-gate-checkpoint--binding). **Forbidden:** batching spawn with that modal on the same turn. This skill’s Step **8** auto-emit does **not** waive the parent Yield obligation.

**Real-dispatch test loop (binding):** After merge, run one full **`pre-pr-review`** spawn on a Checkpoint dispatch through Step **8** — verify Steps **1–7** auto-advance and Step **8** **always** auto-emits terminal + parent refocus (including **`no-go`**) without a modal; the **`coding-session`** parent receives the bubble-up and owns next-step gates before the parent phase advances the next ship-chain skill PR — per **Phase 2 — Software Development center audit** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Validate spawned inputs | Auto-advance on valid spawn `inputs` | exception: missing required inputs → `failure` terminal |
| **Refresh lane display** | Auto-advance when labels match; act when stale | — |
| **2** — Fresh reviewer lane | Auto-advance on clean detached lane | exception: reused coding-agent context → `aborted` |
| **3** — Load standards and rules | Auto-advance | exception: missing required rule → `partial` |
| **4** — Load anchor | Auto-advance | exception: wrong plan template → `failure` |
| **5** — Read committed diff | Auto-advance against committed cut point | exception: zero commits / empty diff → `failure` |
| **6** — Score categories | Auto-advance through category table | — |
| **7** — Proposed follow-ups | Auto-advance (handoff only; no plan mutation) | — |
| **8** — Report and result | Auto-advance — report, parent refocus, terminal same turn (all outcomes including **`no-go`**) | — |

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path** reviewer steps (**1–8**) **auto-advance without a turn-end modal** on this lane. This skill owns **no** developer-input **`USER_CHECKPOINT`** markers — **`coding-session`** owns Review feedback approval, Create-PR handoff (exceptional), and post-create-pr gates after terminal bubble-up.

**Forbidden on this lane:** prose-only report handback without **`mission_control_send_agent_result`**; **`mission_control_present_structured_choice`** / AskQuestion at Step **8** (including **`no-go`**); *tell me when*, *waiting for developer*, or *stay advisory until you pick* — parent lane gates apply after **`mission_control_refocus_parent_lane`**.

**Exception paths** (missing inputs, wrong anchor, empty diff, reused coding-agent context) emit **`failure`** / **`aborted`** / **`partial`** terminal results — not developer-choice modals on this reviewer lane.

## Session orientation table (binding)

Give developers a **consistent state snapshot** during pre-PR review so they can re-orient after reload or parallel work.

**When required:** At spawn bootstrap gates only — **not** at Step **8** under Checkpoint (Step **8** auto-advances). Render as the **first block** in `displayMarkdown` when a gate applies. **Forbidden:** omitting the table and substituting scattered one-liners on modal gates. The terminal **`mission_control_send_agent_result`** line uses the 1–3 sentence `summary` only — do **not** embed the markdown table in the terminal JSON.

**Table shape (markdown):**

| Field | Value |
|-------|-------|
| Plan | `<slug>` @ `<path>` or — (free-form: —) |
| Worktree | `<worktreePath>` from spawn inputs |
| Branch | `<worktreeName>` from spawn inputs |
| PR | — (pre-PR — no open PR yet) |
| Ship phase | `pre-pr-review` |
| Deploy scope | Before deploy complete · skipped · — |
| Review | in progress · `go` · `no-go` when reporting |

**Population rules:** Same contract as [`.sedea/centers/software-development/missions/plan-and-deliver/skills/coding-session/SKILL.md`](../coding-session/SKILL.md) § *Session orientation table (binding)* — use spawn `inputs` and review outputs; never invent paths.

**Mandatory gates (this skill):** None at Step **8** under Checkpoint — the reviewer lane always auto-handbacks; **`coding-session`** owns developer gates for **`no-go`**, flags, and actionable handback (see [Step 8 — Report and result](#step-8--report-and-result)).

## Step 1 — Validate spawned inputs

Required inputs:

1. `anchorType`: `plan` or `free-form`.
2. `worktreePath`: absolute worktree path.
3. `worktreeName`: worktree name being reviewed.
4. `baseRef`: remote base ref, usually `origin/main`.

For `anchorType: "plan"`, `targetPlanPath` is required and must point to a per-PR plan. If the file is a Master Plan or Phase plan, stop with `failure`; this review requires the PR plan that owns the implementation scope.

If any required input is missing, stop with `failure`. Do not ask the developer to reconstruct a seed; the spawning `coding-session` agent owns input assembly.

- **Next-step resolution:** Auto-advance to [Refresh lane display](#refresh-lane-display-when-stale) when validation passes — no `USER_CHECKPOINT` on happy-path spawn handoff. On missing required inputs, emit `failure` terminal — not a missing-inputs modal on this lane.

## Refresh lane display (when stale)

After **`targetPlanSlug`** or free-form scope is validated (end of Step 1):

1. Compare the visible tab **title** / **hover** to this review pass (plan slug, worktree name, or scope summary).
2. When spawn labels are **generic or wrong**, call MCP **`mission_control_update_lane_display`** on **this lane only** with **`title`** = `Pre-PR Review-{semantic title}` (**`targetPlanSlug`**, worktree name, or scope summary) and optional **`description`** / **`hoverDescription`** (max lengths in [`.sedea/centers/sedea/rules/9_display-metadata-authority.mdc`](.sedea/centers/sedea/rules/9_display-metadata-authority.mdc)). See [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Lane title prefix conventions*.
3. **Skip** when spawn labels already match scope.
4. **Forbidden:** **`mission_control_update_dispatch_display`** from a child lane.

See [`.sedea/centers/software-development/rules/50_mission-control-display-metadata-discipline.mdc`](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Child lane — refresh own slot when labels are stale*.

- **Next-step resolution:** Auto-advance to Step **2** after display refresh or skip — no `USER_CHECKPOINT` on this step.

## Step 2 — Fresh reviewer lane

Confirm this is a fresh reviewer lane. Do not reuse context from the coding agent that implemented the worktree. If the lane already contains implementation edits or coding-agent tool history, stop with `aborted` and request a fresh `pre-pr-review` spawn.

- **Next-step resolution:** Auto-advance to Step **3** on a clean detached lane — no `USER_CHECKPOINT` on this step.

## Step 3 — Load standards and rules

Read `.sedea/centers/software-development/docs/development-process.md` in full, or at minimum the per-PR template, strategy, cadence, and Pre-PR reviewer sections.

Read every path from `projectRules`. If a rule path is missing, report it as `partial` unless the rule is clearly irrelevant to the diff.

- **Next-step resolution:** Auto-advance to Step **4** — no `USER_CHECKPOINT` on this step.

## Step 4 — Load anchor

- `plan`: read `targetPlanPath`. Verify per-PR template sections §§ 1–7 are present; § 8 and `## Follow-ups` are optional. Do not mutate §§ 1–8.
- `free-form`: no plan file; review the committed diff only.

- **Next-step resolution:** Auto-advance to Step **5** when anchor loads — no `USER_CHECKPOINT` on this step. Wrong plan template → `failure` terminal.

## Step 5 — Read committed diff

From `worktreePath`, inspect:

```bash
git fetch origin
git diff --stat <baseRef>...HEAD
git log --oneline <baseRef>..HEAD
git diff <baseRef>...HEAD
git status --short
git status --short --ignore-submodules=dirty
```

If `git status --short` is non-empty, continue against the committed diff but evaluate dirty-tree degradation using `git status --short --ignore-submodules=dirty` (aligns with `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc` submodule-only drift guidance). Only non-submodule local edits should be flagged as not part of the reviewed cut point.

If there are zero commits ahead and no diff, stop with `failure`: there is nothing to review.

- **Next-step resolution:** Auto-advance to Step **6** when a committed diff exists — no `USER_CHECKPOINT` on this step.

### Gitlink-only diff recap (binding)

When `git diff <baseRef>...HEAD` under the review worktree is **only** submodule gitlink pointer changes — or substantive edits live in a linked center / product / center-content repo — the review artifact is the **source repo**, not hosting gitlink stat lines.

| Rule | Requirement |
|------|-------------|
| **Handback** | Terminal `codingAgentHandback` and parent-facing recap must name the **source repo**, branch/SHA when known, and changed paths — not treat gitlink-only diff as the content to review |
| **Before `go`** | When the downstream hosting PR would be gitlink-only, include source-repo file summary in `codingAgentHandback` so **`coding-session`** [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) can lead with it |
| **Forbidden** | Hosting PR link as primary recap; achievement-style orientation tables; asking the developer to review gitlink pointer deltas as substantive content |

Resolve affected submodule role(s) per [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Three-repo submodule taxonomy*.

## Pre-PR phase boundary (plan anchor)

This skill runs **before** the PR is opened or merged. Scope is **pre-merge readiness** — not production deploy verification.

| Plan section | Pre-PR scope | Owner after merge |
|--------------|--------------|-------------------|
| §§ **1–6**, § **8** | In scope for scoring and follow-ups | — |
| § **7** `### Before deploy` | In scope — verify against diff / § 6 tests | **`coding-session`** runs **`deploy-walk`** inline (`before-deploy-only`) before this review |
| § **7** `### After deploy` | **Out of scope** — omit from the entire pre-PR report (see below) | **`deploy-walk`** after merge (**development-process.md** § *Ship chain*) |

### §7 After deploy — silent omission (binding)

**`### After deploy`** is **post-merge** work. This pre-PR pass does **not** score it and does **not** mention it anywhere in output — including under **`Defer`**, flags, blockers, proposed follow-ups, category **G** narrative, chat recap, `outputs.codingAgentHandback`, or the terminal `summary`.

Do **not** report (and do **not** echo for awareness):

- Unchecked **`[ ]`** lines under **`### After deploy`**.
- Missing execution of **After deploy** steps before the PR exists.
- Requests to complete **After deploy** before PR.
- Summary bullets such as *Post-merge production smoke via deploy-walk; not a pre-PR gate* or tags like **`[G §7 After deploy — post-merge]`**.

If the only “deferred” work you would list is post-merge deploy verification, **omit the `Defer` group entirely** from the report and leave `codingAgentHandback.Defer` empty (or omit the key).

### §7 Before deploy — scoring

- **`PASS`** when every Before-deploy item is satisfied by the diff, § 6 tests, or an explicit *None — …* line in the plan.
- **`FLAG`** only for Before-deploy gaps that are **merge-blocking** (missing PR-specific verification not covered by § 6 or standing CI).
- **`FAIL`** only when a Before-deploy gap would make merging unsafe **now** — never because After-deploy is still `[ ]`.

## Step 6 — Score categories

Verdict per row: `PASS`, `FLAG`, or `FAIL`. `FAIL` blocks PR creation or merge readiness.

### Exhaustive review and clean verification pass (binding)

Review **every changed file and applicable category** against the same committed cut point, anchor, and project rules. Keep a deduplicated findings ledger with file/location, evidence, category, severity (`FLAG` or `FAIL`), and an actionable remedy. Finding an issue, including a merge-blocking `FAIL`, **does not terminate the review**: inspect the rest of the diff and categories for independent issues. Do not emit an intermediate `mission_control_send_agent_result`, refocus the parent, or ask for a fresh spawn after the first finding.

After completing the initial full review, **run the entire review again** from the diff and anchor, not just the files or categories with known findings. Add any distinct newly discovered issues to the ledger and repeat complete passes until one full verification pass finds **zero new issues**. A clean verification pass means no *additional* findings, **not** that existing findings have been fixed or that a `no-go` can become `go`. Keep all previously found blockers and flags in the final report. If required review inputs are unavailable or coverage cannot be completed, use the existing `failure` / degraded `partial` paths; never claim exhaustive verification for an incomplete pass. This is read-only review: do not change source or plan files to make a pass clean.

### Plan anchor categories

| Cat | Focus |
| --- | --- |
| **A** | § 1 Single concern vs diff scope |
| **B** | § 2 Background clarity |
| **C** | § 3 Change scope vs diff |
| **D** | § 4 Reasoning quality |
| **E** | § 5 Repo rules impact |
| **F** | § 6 Tests to write |
| **G** | § 7 Deploy test plan — **`### Before deploy` only** (see [Pre-PR phase boundary](#pre-pr-phase-boundary-plan-anchor)); After deploy is post-merge |
| **H** | § 8 Caveats vs surprises |
| **I** | Repo-rule compliance |
| **J** | General code quality |

### Free-form categories

| Cat | Focus |
| --- | --- |
| **F1** | Single concern |
| **F2** | Repo-rule compliance |
| **F3** | General code quality |

- **Next-step resolution:** Auto-advance to Step **7** only after all applicable categories and changed files have been inspected and a subsequent full pass adds zero new issues — no `USER_CHECKPOINT` on this step.

## Step 7 — Proposed follow-ups

For `plan` anchor only: collect actionable `FLAG` items that are not blockers as **proposed** `## Follow-ups` for the PR plan. Do **not** mutate the plan file from this reviewer lane; the active **`coding-session`** agent must present these proposed follow-ups to the developer and receive explicit approval before appending them.

Rules:

1. One sentence per bullet.
2. Prefix with bracketed category tag, e.g. `[C § 3]`.
3. Add optional `(target: ...)` routing hints.
4. Do not append `FAIL` items; blockers stay in the report.
5. Return proposed follow-ups in `outputs.proposedFollowUps`; leave `outputs.followUpsAppended` empty unless the invocation context explicitly includes prior developer approval for this exact mutation.
6. **Exclude** every item that only restates **`### After deploy`** or post-merge production verification — omit entirely (see **§7 After deploy — silent omission** above), not in `proposedFollowUps` or handback.

For `free-form`, skip file writes.

- **Next-step resolution:** Auto-advance to Step **8** — handoff only; no plan mutation and no `USER_CHECKPOINT` on this step.

## Step 8 — Report and result

Report **once**, after Step **6** has completed its clean verification pass. Consolidate and deduplicate the full findings ledger across all passes; do not hand back one issue at a time. Preserve every unresolved `FAIL` as a blocker (`no-go`) even if the final pass found no new issues. Only the review-precluding exception paths in Steps **1–5** or degraded coverage in Step **6** may end without this verification.

Report:

1. Category table.
2. Blockers (`FAIL`).
3. Flags.
4. Recommendation: `go` only when there are no `FAIL` rows.
5. Coding-agent handback: what to fix next, with **`Must`** and **`Should`** groups when non-empty. Apply [Pre-PR phase boundary](#pre-pr-phase-boundary-plan-anchor):
 - **`Must`** — merge-blocking `FAIL` rows and true pre-merge gaps only.
 - **`Should`** — pre-merge improvements only.
 - **`Defer`** — **do not use** for **`### After deploy`**, **`deploy-walk`**, or post-merge production smoke (see **§7 After deploy — silent omission** above). Include **`Defer`** only for other genuinely deferred pre-PR-adjacent items; if none, omit the **`Defer`** section and do not populate post-merge deploy bullets in `outputs.codingAgentHandback`.
6. **Deploy test plan (§7):** when the developer reported manual §7 smoke during review, list which numbered **`### Before deploy`** steps they said passed — the coding agent should flip those lines in `targetPlanPath` only after the developer **confirms each step** in session (see **`coding-session`** § *Deploy test plan confirmations*). Do **not** mention **`### After deploy`** in this pass. This reviewer skill does **not** append `[x]` without that per-step confirmation.

The handback is advisory until the developer approves the fix pass. Do not frame reviewer feedback as automatic authorization for **`coding-session`** to edit code. The coding agent must present the review result to the developer, **recommend** addressing relevant findings when **`actionablePrePrFindings`** applies, and open its **Review feedback approval gate** (including **Implement pre-PR review findings now (this session)** as the first option — **even when** `recommendation` is `go` but `flags` or **Must** / **Should** handback remain) before applying fixes or proceeding to Create-PR.

End with a child result containing:

- `outputs.anchorType`
- `outputs.targetPlanPath`
- `outputs.targetPlanSlug`
- `outputs.worktreePath`
- `outputs.worktreeName`
- `outputs.baseRef`
- `outputs.recommendation` (`go` | `no-go`)
- `outputs.blockers`
- `outputs.flags`
- `outputs.proposedFollowUps`
- `outputs.followUpsAppended`
- `outputs.codingAgentHandback`
- `outputs.requiresDeveloperApproval`
- `outputs.activeLanes`
- `outputs.openLedgerEntries`
- `outputs.remainingTasks`
- `outputs.continuationOwner: "pre-pr-review-agent"`
- `outputs.continuationStatus`

Set `continuationStatus`:

- `terminal` when the review report is complete — including **`no-go`** (parent owns fix-loop gates; this lane does not wait on the developer).
- `partial` status with `continuationStatus: "active"` when the review ran but missing rules, non-submodule dirty uncommitted edits, or incomplete anchors make the result degraded.

After the report, hand back per **Squad Leader bubble-up** below. Do not run `git`, `gh`, source edits, commits, pushes, or PR creation.

- **Next-step resolution:** Auto-advance through Steps **1–8** on the happy path — **no** `USER_CHECKPOINT` on Step **8**. **`no-go`** is a recommendation for the parent lane, not a reviewer-lane pause.

## Squad Leader bubble-up (detached lanes)

Runs on a **detached** reviewer lane; the **plan and deliver** Squad Leader may not see this result until terminal **`mission_control_send_agent_result`** host sync.

### Auto terminal + parent refocus (binding — all outcomes)

After Step **8** report completes ( **`go`** or **`no-go`** ):

**Same turn** (report prose may precede MCP structured-choice call):

1. Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "pre-pr-review-complete" }` — no host-resolved identity keys).
2. Emit terminal **`mission_control_send_agent_result`** as the **last line** per [Completion (spawned)](#completion-spawned).

Populate terminal **`outputs`** with full review result — including **`recommendation: no-go`**, **`blockers`**, **`flags`**, and **`codingAgentHandback`** when present. The **parent** (**`coding-session`**) opens **Review feedback approval gate** or blocks Create-PR per its skill; this reviewer lane does **not** pause for developer confirmation.

**Forbidden at Step 8:** **`mission_control_present_structured_choice`** / AskQuestion report/result modal; **`USER_CHECKPOINT`** at Step **8**; waiting for **`review-lane-done`**; prose-only handback without MCP result.

§8 progress reaches the Squad Leader via **`mission_control_send_agent_result`** terminal **`outputs`** (`targetPlanPath`, `shipPhase`, `rowStatus`) and Mission Control host sync — **not** developer paste on the leader dispatch (**`../../plan.mdc`** §8 *Policy — no manual recap*).

| Outcome | `shipPhase` | `rowStatus` | Key `outputs` |
|---------|-------------|-------------|---------------|
| `recommendation: go` | `pre-pr-review` | `open` | `targetPlanPath`, `remainingTasks` |
| `no-go` / blockers | `pre-pr-review` | `blocked` | `targetPlanPath`, `blockers`, `blockedReason` in recap |

## Mission Control section 8 sync (required terminal `outputs`)

On **every** terminal `mission_control_send_agent_result` (including follow-up re-emits), `outputs` **must** include:

| Field | Rule |
|-------|------|
| `targetPlanPath` | Absolute PR plan `.plan.md` path — **required**; host skips ledger sync without it |
| `shipPhase` | From the bubble-up table row for this terminal (`pre-pr-review` typical) |
| `rowStatus` | `open` when `recommendation: go`; `blocked` when `no-go` or blockers remain |
| `remainingTasks` | When `rowStatus` is not `closed` |
| `blockedReason` | When `rowStatus` is `blocked` (summarize blockers) |

Mission Control writes `ship-ledger.v1.json` from child terminal **`outputs`** and may inject **Ship recap — plan and deliver** on the Squad Leader lane. Manual **Ship recap** paste on the leader dispatch is **forbidden** per **`../../plan.mdc`** §8 *Policy — no manual recap*; when host sync did not run, fix terminal **`outputs`** or route to **mission completeness triage** — do not nudge paste workaround.

## Completion (spawned)

Required `outputs` per **Step 8 — Report and result**, **Mission Control section 8 sync**, and the bubble-up table. Re-emit an **updated** terminal result after user-requested follow-up on this lane (same `correlationId`).

### Parent refocus (binding)

On every successful Step **8** auto-handback, call **`mission_control_refocus_parent_lane`** **immediately before** the MCP result call so Mission Control focuses the **immediate parent** lane (typically **`coding-session`**) in the same dispatch. See **`.sedea/centers/sedea/skills/README.md`** § *Optional parent refocus (`mission_control_refocus_parent_lane`)*.

| Path | Refocus |
|------|---------|
| Step **8** complete (**`go`** or **`no-go`**) | **`mission_control_refocus_parent_lane`** same turn, before terminal |
| **`failure`** / **`aborted`** terminal without bubble-up | Omit refocus unless skill text requires parent attention |

**Forbidden:** structured-choice options whose primary purpose is parent-switch — use **`mission_control_refocus_parent_lane`** instead.

### MCP result preflight (`mission_control_send_agent_result`)

| Step | Check |
|------|--------|
| R1 | Call **`mission_control_send_agent_result`** with **`status`**, **`summary`**, optional **`outputs`** / **`errors`** |
| R2 | **Forbidden args absent** — no **`correlationId`**, **`dispatchId`**, **`slotId`**, or other host-resolved keys |
| R3 | Populate **`outputs`** from the required field list below |
| R4 | Re-emit updated MCP result after user-requested follow-up on this lane (same spawn session; host resolves **`correlationId`**) |

**Message order on terminal turns:** report recap (optional prose) → **`mission_control_refocus_parent_lane`** (when required above) → **`mission_control_send_agent_result`** (**last line**).

Stop after the MCP result call. Do not emit another `mission_control_spawn_agent` or run the next protocol step in the same turn (see **`../README.md`** § *Terminal stop (normative)*).

## Completion (inline)

Report the fields below in prose to the invoker on the **same lane**. Do **not** emit `mission_control_spawn_agent`, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*).

**Forbidden when `upstreamSkill` is `coding-session`:** do **not** run inline on the **`coding-session`** lane — spawn only per **Spawn-only (binding)** above.

When a mission protocol **explicitly** assigns this skill inline on a **non–`coding-session`** lane (rare), use the same `outputs` semantics as **Step 8 — Report and result** and **`## Completion (spawned)`** in prose only — **no** spawn or MCP results.
