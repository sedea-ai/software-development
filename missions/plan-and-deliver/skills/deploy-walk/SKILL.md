---
name: deploy-walk
description: >-
 Inline coding-session procedure to walk a PR plan's `## N. Deploy test plan` section
 one step at a time. Executed by the active coding-session agent only — not spawned,
 no warmUpRules. Agent-executable steps run without approval; manual steps print
 numbered step-by-step testing instructions for the developer. Three-state lifecycle
 in `**Status:**`; capstone todo when done.
 Does not auto-run plan-reconcile.
designation:
  allowed: Walk deploy test plan; run agent-executable verification; flip steps with evidence
  forbidden: Application implementation; unchecked manual steps without evidence; dispatch resolution
inputs:
  targetPlanPath:
    type: string
    description: Absolute PR plan path containing the deploy test plan.
    required: true
  targetPlanSlug:
    type: string
    description: PR plan slug.
    required: true
  prUrl:
    type: string
    description: GitHub PR URL that was merged.
    required: false
  prNumber:
    type: number
    description: GitHub PR number that was merged.
    required: false
  repoUrl:
    type: string
    description: Git repository URL.
    required: false
  worktreeName:
    type: string
    description: Worktree name that produced the PR (worktree or post-merge verification).
    required: false
  mergeSha:
    type: string
    description: Merge commit SHA for deployment verification.
    required: false
  mergedAt:
    type: string
    description: Timestamp when the PR merged.
    required: false
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from coding-session.
    required: false
  upstreamSkill:
    type: string
    description: Skill that invokes deploy verification inline — `coding-session` (Before deploy pre-merge or After deploy post-merge).
    required: false
  worktreePath:
    type: string
    description: Absolute worktree path (required when inline on coding-session).
    required: false
  deployWalkScope:
    type: string
    description: >-
      `before-deploy-only` when inline from coding-session pre-merge — walk only
      `### Before deploy` while Status stays `drafted`; do not run After deploy or
      `deploy-walk deployed`. Omit for full post-merge walk (typical After-deploy inline).
    required: false
  promoteSubmodulePinOutcomes:
    type: array
    description: >-
      Per-center submodule merge gate results from coding-session
      (`{ centerSlug, sourceOnMainVerified, promoteStatus }`) — passed through for
      honest After deploy attestation; not a substitute for verify script SHA checks.
    required: false
---

# Deploy walk-through

## Warm-up manifest (inline)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Inline-only*. **No** frontmatter **`warmUpRules`** or **`laneRules`** — runs on the active **`coding-session`** lane whose **`effectiveWarmUp`** already loaded ship rules. **No `alwaysApply` frontmatter flip.**

### Inherited from invoker (`coding-session`)

| Source | Paths (via parent lane) |
|--------|-------------------------|
| Parent **`skillWarmUp`** | `plan.mdc`, `skills/README.md`, `development-process.md`, rule **20** (parent omits rule **30** from frontmatter — see README cap table) |
| Parent **`laneRules`** | Rule **2**, rule **6**, rule **20**, `coding-session/SKILL.md` |
| This skill | Procedure body only — no separate spawn warm-up |

**Lane requirement (no separate warm-up).** Run **only** on the active **`coding-session`** lane after that session has loaded ship rules. Do **not** start a standalone Mission Control session on **`deploy-walk`** alone — context will be incomplete.

### Standalone dispatch (stop immediately)

If Mission Control opened a session whose only intent is **`deploy-walk`** / deploy verification with **no** active **`coding-session`** context (`worktreePath`, `targetPlanPath` when plan-anchored):

1. **Stop** — do not walk checklists or edit the plan.
2. Tell the developer **`deploy-walk`** is **inline-only** on the **`coding-session`** lane (Before deploy after commit, After deploy after merge, or deploy phrases on that lane).
3. Direct them to open or return to **`coding-session`** with the PR plan and worktree — see [`coding-session/SKILL.md`](../coding-session/SKILL.md) § *Before deploy deploy-walk handoff* and § *After deploy deploy-walk handoff*.

**Execution owner:** the active **coding-session agent** runs this skill inline. Do **not** spawn a separate deploy-walk child lane.

**Agent-executable** steps (tests, repo scripts, curl/log checks the agent can run in the worktree or with available env) run **without approval** — on pass, flip `[ ]` → `[x]` with a dated note and advance. **Manual** steps are presented with numbered **Testing steps** the developer follows in order (verbatim plan text, rationale, expected outcome, expanded commands); the agent assists until the developer confirms, then flips the box. Three-state lifecycle (`drafted` → `deployed` → `done`) is recorded in a `**Status:**` line at the top of § N. When Status reaches `done`, frontmatter todo `deploy-test-plan-verified` flips `pending` → `done` in the same turn (see *Frontmatter capstone*). **Cross-skill:** when **`coding-session`** receives ad-hoc “step *N* confirmed” for §7, it must apply the same plan-file update rules here — or the developer should invoke **`deploy-walk <N> done`**. Use when the user says `deploy-walk present <N>`, `deploy-walk <N> done [: <note>]`, `deploy-walk <N> skip: <reason>`, `deploy-walk <N> block: <reason>`, `deploy-walk deployed [: <note>]`, or `deploy-walk status` **on the coding-session lane**.

| Step kind | Who runs it | On success |
|-----------|-------------|------------|
| **Agent-executable** | **Coding-session agent** (inline deploy-walk) — no approval modal before run | Agent runs commands, flips `[ ]` → `[x]` with dated note (command + outcome), advances to the next step |
| **Manual** | **Developer** — agent prints numbered **Testing steps** and assists | Developer reports; agent flips on `deploy-walk <N> done` / skip / block |

See [Agent-executable vs manual steps](#agent-executable-vs-manual-steps).

**Worktree removal ownership (binding).** **Do not remove worktrees you do not own.** Deploy verification may read **`worktreePath`**; post-merge cleanup removes **only** **this pass’s** **`WORKTREE_ROOT`** after merge consent — see [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Worktree ownership* and rule **20** § *Worktree removal ownership (binding)*. **`git worktree list` is read-only** when ownership is unclear — **stop; do not remove**.

## Structured choice (Mission Control)

Target picks, deploy-with-gaps, and closure gates use **AskQuestion** or **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act* — recap + modal in **one turn** when practical; rule **2** priority **3** split only when a long recap was already sent. **Act** (checkbox flips, status lines) follows developer selection or explicit deploy-walk commands.

When run **inline** on **`coding-session`** (pre-merge **Before deploy** or post-merge **After deploy**), this procedure owns deploy verification status and reports it via **`## Completion (inline)`** to the coding-session agent; it does not run implementation, PR review, or plan reconciliation.

## Checkpoint turn UX (skill-local)

Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`deploy-walk`**; other ship-chain skills document their own markers.

**Parent yield gate:** Mid-ship StreamFinal without same-turn Act on the invoker **`coding-session`** lane is governed by **`coding-session/SKILL.md`** § [Yield gate (Checkpoint — binding)](../coding-session/SKILL.md#yield-gate-checkpoint--binding). This skill must **not** authorize recap-only “Act next turn” exits that leave the parent without a resume modal.

**Real-dispatch test loop (binding):** After merge, run one full inline **`deploy-walk`** on a **`coding-session`** Checkpoint dispatch through [Manual step await gate](#manual-step-await-gate-binding) / [Step 4 — Step presentation contract](#step-4--step-presentation-contract) and collect a developer verdict before the parent phase advances **`create-pr`** PR 4 — per **Ship-chain skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path** inline walk steps (bootstrap, agent-executable pass, sub-section auto-advance) **auto-advance without a turn-end modal**. **Manual** step presentation is **developer-input** — a **USER_CHECKPOINT** — and **must** close with [Manual step await gate](#manual-step-await-gate-binding) on the **same turn** as Step 4 presentation.

**Forbidden:** recap of manual **Testing steps** + *reply with results*, *tell me when done*, *run these spot-checks then reply*, or *auto-advancing (no modal)* — those phrases describe developer-input gates, not happy-path auto-advance. **Forbidden:** treating manual deploy verification as rule **2** external-wait.

When inline on **`coding-session`** After deploy under [Post-merge Checkpoint chain](../coding-session/SKILL.md#post-merge-checkpoint-chain-binding), the parent auto-advance chain stops **at** manual presentation; this skill owns the turn-end modal.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Resolve target plan | Auto-advance when slug/path is unambiguous | exception: multiple candidates → [Target plan pick gate](#target-plan-pick-gate-binding) |
| **2** — Read § N deploy test plan | Auto-advance | exception: missing section / wrong checklist shape → stop with recap (no modal) |
| **Inline walk bootstrap** | Auto-advance through [Autonomous agent-executable pass](#autonomous-agent-executable-pass) | exception: blocked step → block note; no auto-flip |
| **Autonomous agent-executable pass** | Auto-advance while next steps are agent-executable | exception: run failure → block or manual handback |
| **Manual step await** / **Step 4** presentation | **Gate** — primary developer-pick surface on inline walk | [Manual step await gate](#manual-step-await-gate-binding) |
| **Before deploy complete** → **`deploy-walk deployed`** | **Gate** when sub-section completes or developer invokes status transition | [Deploy status transition gate](#deploy-status-transition-gate-binding) |
| **`approve-deploy-closure`** | **Auto-advance** — resolve **`approve-deploy-closure`** **same turn** when After deploy is fully satisfied (Status `deployed → done` + capstone) | **Gate** on Non-Checkpoint / exception only — [Deploy closure approval gate](#deploy-closure-approval-gate-binding) |

### Host classifier coupling (binding)

Mission Control gate-surface detection for inline **`deploy-walk`** on Checkpoint dispatches consults **`deploy-walk/SKILL.md`** prose in addition to literal **`USER_CHECKPOINT`** lines. When [Step 4 — Step presentation contract](#step-4--step-presentation-contract) or [Manual step await gate](#manual-step-await-gate-binding) presentation ships on a turn, the host **`DEPLOY_WALK_MANUAL_STEP_BODY_PATTERNS`** classifier (see active hosting repo `extensions/mission-control/src/shared/checkpointTurnClassifier.ts`) must treat that body as a **developer-input gate** — including **continue-recovery** turns where policy preamble would otherwise suppress marker detection.

| Presentation contract element | Host pattern family | Agent obligation |
|--------------------------------|---------------------|------------------|
| `**Manual step**` blockquote shell | Manual step body patterns | Same turn closes with [Manual step await gate](#manual-step-await-gate-binding) — not prose-only recap |
| `manual step await gate` heading reference | Manual step body patterns | Recovery turns route to **gate recovery**, not continue recovery |
| Numbered **Testing steps** under manual presentation | Manual step + testing-steps patterns | Do not end with command hints alone — modal options required |

**Forbidden:** changing Step 4 presentation shape (for example removing `**Manual step**`, shortening **Testing steps** to one line, or dropping the manual-step await cross-ref) without updating the hosting-repo classifier patterns in the same PR chain. **Cross-ref:** PR 4 recovery routing — `.sedea/operations/.../plans/4_checkpoint_recovery_manual_gate_routing_*.plan.md` §8 Follow-ups **[J]**.

## Not chained to `plan-reconcile`

**This skill never invokes `plan-reconcile`.** Capstone todo **`deploy-test-plan-verified`** → `done` closes the **deploy checklist only** — not archive, not parent-plan reconcile.

| Agent mistake | Correct action |
|---------------|----------------|
| Treat deploy walk `done` as permission to archive the plan | Tell the developer to run **`plan-reconcile`** inline on **`coding-session`** when ready (phrase or stale-worktree / post-deploy choice) |
| Paraphrase § 7 After deploy as *defer plan-reconcile to dispatch close* or recommend skipping a step until dispatch resolution | **Forbidden** — reconcile runs inline on active **`coding-session`** while dispatch is open; revise plan text or modal copy |
| Emit **`mission_control_spawn_agent`** for **`plan-reconcile`** from this lane | **Forbidden** — hand off in prose only |

Canonical: **`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`** § *deploy-walk vs plan-reconcile (not chained)*.

## Entry points

Canonical table: **`.sedea/centers/software-development/docs/development-process.md`** § *Ship chain* → **`deploy-walk` entry points**.

| How it starts | Lane |
|---------------|------|
| Developer phrase (`deploy-walk present <N>`, status, done/skip/block) on active **`coding-session`** | Inline on **`coding-session`** |
| **`coding-session`** after implementation approval + commit — Before deploy only | Inline (`upstreamSkill: coding-session`, `deployWalkScope: before-deploy-only`) |
| **`coding-session`** After deploy — developer chooses **PR merged — start After deploy deploy-walk** at post-create-pr gate | Inline (`upstreamSkill: coding-session`) — full §7 walk |
| Detached phrase / direct skill dispatch without **`coding-session`** | **Stop** — redirect to **`coding-session`** (see *Standalone dispatch*) |

**Pre-merge vs post-merge:** **`coding-session`** runs walk **Before deploy** while the PR is still open (`**Status:**` stays `drafted`). **`coding-session`** (post-create-pr gate) owns **After deploy** and the `drafted → deployed → done` lifecycle. Completing either walk does **not** start **`plan-reconcile`** — reconcile is a separate developer or **`coding-session`** follow-on when merge/archive triage is needed.

## Inline on coding-session (`before-deploy-only`)

When `upstreamSkill` is **`coding-session`** and `deployWalkScope` is **`before-deploy-only`**:

| Rule | Behavior |
|------|----------|
| **Scope** | Only **`### Before deploy`** numbered steps while `**Status:**` is `drafted` |
| **Forbidden** | `deploy-walk deployed` / `deploy-walk deployed: …` (no `drafted → deployed` flip pre-merge) |
| **Forbidden** | `deploy-walk present after <N>` or walking **`### After deploy`** |
| **Forbidden** | **Frontmatter capstone** `deploy-test-plan-verified` → `done` (full checklist not complete pre-merge) |
| **Terminal** | `beforeDeployStatus: complete`; `deployStatus: drafted` (unchanged); `afterDeployStatus: incomplete` or `unknown` — hand back to **`coding-session`** for [Auto-spawn pre-pr-review](../coding-session/SKILL.md#auto-spawn-pre-pr-review) |
| **Blocked** | Any Before-deploy step remains `[ ]` without skip/block resolution → report `blockedStep` in inline outputs |
| **Handback** | Parent **`coding-session`** continues to [Auto-spawn pre-pr-review](../coding-session/SKILL.md#auto-spawn-pre-pr-review) — not **`create-pr`** |

Use `worktreePath` / `worktreeName` from inline context for command context in step presentations. PR merge fields (`prUrl`, `mergeSha`, …) are optional and usually absent.

## Session orientation table (binding)

Give developers a **consistent state snapshot** during deploy verification so they can re-orient after reload, tab switch, or parallel work.

**When required:** At every **Mandatory gate** below — render as the **first block** in `displayMarkdown` (before plan header or step recap). **Forbidden:** omitting the table and substituting scattered one-liners.

**Table shape (markdown):**

| Field | Value |
|-------|-------|
| Plan | `<slug>` @ `<path>` or — |
| Worktree | `<absolute WORKTREE_ROOT>` or — |
| Branch | `<worktreeName>` or — |
| PR | `<url>` (#N) or — |
| Ship phase | parent `shipPhase` when inline on **`coding-session`**, or — |
| Deploy scope | Before deploy · After deploy · — |
| Review | — (deploy walk does not own PR triage) |

**Population rules:** Same as [`.sedea/centers/software-development/missions/plan-and-deliver/skills/coding-session/SKILL.md`](../coding-session/SKILL.md) § *Session orientation table (binding)* — use `—` when unknown; never invent paths or PR numbers.

**Mandatory gates (this skill):** [Inline walk bootstrap](#inline-walk-bootstrap) start; [Target plan pick gate](#target-plan-pick-gate-binding); each [Step 4 — Step presentation contract](#step-4--step-presentation-contract) manual presentation; [Deploy status transition gate](#deploy-status-transition-gate-binding); [Deploy with gaps gate](#deploy-with-gaps-gate-binding); [Deploy closure approval gate](#deploy-closure-approval-gate-binding) (**Non-Checkpoint / exception only** under Checkpoint — clean path auto-advances **`approve-deploy-closure`**); every developer-await **AskQuestion** / **`mission_control_present_structured_choice`** ([Deploy developer-await modal options](#deploy-developer-await-modal-options-binding)).

## Worktree path visibility (binding)

When **`worktreePath`** is set on inline context (typical on **`coding-session`** Before deploy while the session worktree still exists):

| Surface | Requirement |
|---------|-------------|
| **Session orientation table** | **Worktree** and **Branch** rows populated from inline context |
| **Manual step presentation** ([Step 4](#step-4--step-presentation-contract)) | Full orientation table first; plan header follows |
| **Agent-executable run** | Recap **`cwd: <absolute-worktreePath>`** before shell commands |
| **Developer-await gates** ([Deploy developer-await modal options](#deploy-developer-await-modal-options-binding)) | **`displayMarkdown`** starts with the orientation table |
| **`deploy-walk status`** | Append **`worktree=<absolute-path>`** when known |

When **`worktreePath`** is missing but agent-executable steps need a cwd, surface one line: *No worktree in inline context — resolve **`worktreePath`** before running in-tree commands* — do not guess cwd from chat.

After merge cleanup the session worktree may be gone — After deploy walks often have no **`worktreePath`**; do not invent a path. [Return to implementation from deploy walk](#return-to-implementation-from-deploy-walk-inline-handback) hands back to parent **`coding-session`** (same worktree when path exists; new worktree when gone) when the developer picks **`return-to-implementation-new-worktree`**.

## Deploy developer-await modal options (binding)

Every **AskQuestion** / **`mission_control_present_structured_choice`** gate while a deploy step awaits developer input (manual step presentation, block follow-up, After-deploy closure, sub-section completion hints) **must** include these options unless the gate table below explicitly omits one:

| Option id | Label (brief) |
|-----------|---------------|
| *(gate-specific)* | Step done / skip / block / closure / present-next — per [Manual step await gate](#manual-step-await-gate-binding) |
| `all-manual-steps-done` | All remaining manual steps passed — one take |
| `return-to-implementation-new-worktree` | Label per [Return-to-implementation option label](../coding-session/SKILL.md#return-to-implementation-option-label-binding) — when **`worktreePath`** is set, use **Continue implementation on the same worktree** |
| `more-details` | More details for option _ |

**Dual verification modes (binding):** Deploy verification must support **both** paths on every manual-step gate in the active sub-section (`### Before deploy`, `### After deploy`, or any §7 deploy checklist the walk covers):

1. **Step-by-step** — present one manual step with full **Testing steps**; developer picks **`deploy-step-n-done`**, **`present-next-manual-step`**, skip, or block before advancing.
2. **One take** — when the developer verified **all remaining manual** steps outside chat (local, staging, production, or other §7 environments), offer **`all-manual-steps-done`** to flip every remaining manual `[ ]` in the active sub-section in one action.

**When to include `all-manual-steps-done`:** Include on every [Manual step await gate](#manual-step-await-gate-binding) when **at least two** manual `[ ]` steps remain in the active sub-section, **or** when the developer states they verified multiple/all manual steps in one take. Omit only when exactly one manual step remains (step-by-step **`deploy-step-n-done`** is sufficient).

**`all-manual-steps-done` — Act (binding):**

1. **Same turn first:** finish any pending **agent-executable** `[ ]` steps in the active sub-section via [Autonomous agent-executable pass](#autonomous-agent-executable-pass) — **forbidden** to batch-flip manual steps while agent-executable steps remain unchecked without running them.
2. **Recap** remaining manual step numbers and verbatim plan lines in **`displayMarkdown`** before the modal closes.
3. On pick: apply [§ `deploy-walk all-manual-done`](#deploy-walk-all-manual-done--batch-flip-remaining-manual-steps) semantics — flip each remaining manual `[ ]` with `*(YYYY-MM-DD: all manual steps passed in one take.)*` (or the developer's note when using `deploy-walk all-manual-done: <note>`).
4. Run the same sub-section completion branches as [§ `deploy-walk <N> done`](#deploy-walk-n-done--deploy-walk-n-done-note--flip-box-advance-hint) when the batch completes the active sub-section.

**Forbidden:** **`all-manual-steps-done`** when the developer has not attested verification — do not infer from silence. **Forbidden:** removing step-by-step presentation when the developer picks **`present-next-manual-step`** or has not attested batch completion.

**`return-to-implementation-new-worktree`** — developer found a product defect during deploy verification (including after the PR merged). Set **`outputs.returnToImplementation: true`** in **`## Completion (inline)`** and stop the walk. Parent **`coding-session`** runs [Return to implementation from deploy walk](../coding-session/SKILL.md#return-to-implementation-from-deploy-walk-new-worktree) on the **next** turn (**Branch A — same worktree** when session path exists; **Branch B — new worktree** when gone) — **do not** edit product code from this skill.

### Manual step await gate (binding)

Every gate after presenting a **manual** step (or when inline bootstrap stops on the first manual step) **must** call **`mission_control_present_structured_choice`** or **AskQuestion** with **all** rows below unless a gate table elsewhere explicitly omits one. Put the current step presentation and a numbered list of **remaining manual** steps (when ≥2) in **`displayMarkdown`**.

USER_CHECKPOINT — confirm manual deploy step verification or pick next walk action.

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `deploy-step-n-done` | Step N done — I verified this step | Equivalent to **`deploy-walk <N> done`**; optional note via follow-up chat → **`deploy-walk <N> done: <note>`** |
| `deploy-step-n-skip` | Skip step N — with reason | **`deploy-walk <N> skip: <reason>`** |
| `deploy-step-n-block` | Block step N — with reason | **`deploy-walk <N> block: <reason>`** |
| `present-next-manual-step` | Present next manual step — one by one | **`deploy-walk present <N+1>`** when N+1 is manual; if N+1 is agent-executable, run [Autonomous agent-executable pass](#autonomous-agent-executable-pass) first |
| `all-manual-steps-done` | All remaining manual steps passed — one take | [§ `deploy-walk all-manual-done`](#deploy-walk-all-manual-done--batch-flip-remaining-manual-steps) |
| `return-to-implementation-new-worktree` | Label per [Return-to-implementation option label](../coding-session/SKILL.md#return-to-implementation-option-label-binding) | Set **`outputs.returnToImplementation: true`**; hand back to **`coding-session`** |
| `more-details` | More details for option _ | Elaborate; re-open gate |

- **`defaultOptionId: deploy-step-n-done`** when the developer is reviewing the currently presented manual step with no blockers surfaced.
- **Next-step resolution:** Auto-advance through [Inline walk bootstrap](#inline-walk-bootstrap) and [Autonomous agent-executable pass](#autonomous-agent-executable-pass) on the happy path — no `USER_CHECKPOINT` until a **manual** step is presented per [Step 4 — Step presentation contract](#step-4--step-presentation-contract).

### Target plan pick gate (binding)

When [Step 1 — Resolve the target plan](#step-1--resolve-the-target-plan) resolution order item **5** applies (multiple PR plans with unchecked deploy steps):

Put candidate slugs and one-line unchecked counts in **`displayMarkdown`**. Include [Session orientation table (binding)](#session-orientation-table-binding) when inline context supplies **`worktreePath`**.

USER_CHECKPOINT — pick which PR plan this deploy walk targets.

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| *(one per candidate slug)* | Walk `{slug}` deploy checklist | Bind target plan; continue Step **2** on **next** turn |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

- **Forbidden:** prose-only plan pick menus — every choosable slug is an **`options`** row.
- **Next-step resolution:** Auto-advance Step **1** items **1–4** on the happy path — no `USER_CHECKPOINT` until multiple candidates remain.

### Deploy status transition gate (binding)

When **`### Before deploy`** is fully `[x]` (or skipped) while `**Status:**` is still `drafted`, or the developer invokes **`deploy-walk deployed`**, close with structured choice **before** flipping `drafted → deployed`.

USER_CHECKPOINT — approve deploy status transition to deployed.

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `mark-deployed` | Mark deployed — proceed to After deploy | Run **`deploy-walk deployed`** semantics; open After-deploy walk on **next** turn when steps remain |
| `review-before-deploy` | Review Before-deploy checklist first | Re-present unchecked or skipped Before-deploy rows; no status flip |
| `block-deploy-transition` | Block deploy transition | Keep `**Status:** drafted`; report blocked reason in recap |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

When any `[ ]` boxes remain in `### Before deploy` and the developer still requests **`deploy-walk deployed`**, use [Deploy with gaps gate](#deploy-with-gaps-gate-binding) instead of this gate.

- **`defaultOptionId: mark-deployed`** when Before deploy is fully `[x]` or skipped with audit notes.
- **Checkpoint — Before deploy only scope:** When `deployWalkScope: before-deploy-only`, **forbidden** — do not open this gate; hand back to **`coding-session`** for [Auto-spawn pre-pr-review](../coding-session/SKILL.md#auto-spawn-pre-pr-review) instead.

### Deploy with gaps gate (binding)

When **`deploy-walk deployed`** is requested while unchecked `[ ]` items remain in `### Before deploy`:

USER_CHECKPOINT — proceed to deployed with unchecked Before-deploy steps?

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `proceed-deployed-with-gaps` | Proceed to deployed with unchecked Before-deploy steps | Flip `**Status:** drafted → deployed`; list unchecked indexes in status history note |
| `review-before-deploy` | Review Before-deploy steps first | No status flip |
| `block-deploy-transition` | Block deploy transition | No status flip |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

Only **`proceed-deployed-with-gaps`** authorizes the status mutation when gaps remain.

### Deploy closure approval gate (binding)

When **`### After deploy`** is fully `[x]` (or skipped) while `**Status:**` is `deployed`, or the last After-deploy **`done`** completes the sub-section, resolve checklist closure — either auto-advance (Checkpoint clean path) or structured choice (Non-Checkpoint / exception) — **before** flipping `deployed → done` or mutating capstone todo **`deploy-test-plan-verified`**.

#### Checkpoint — auto-advance `approve-deploy-closure` (binding)

Under Checkpoint trust, **auto-advance** as if the developer picked **`approve-deploy-closure`** — **no** **`mission_control_present_structured_choice`** and **no** `USER_CHECKPOINT` on this happy path — when **all** hold:

1. **`### After deploy`** is fully `[x]` or empty/skipped by design, and `**Status:**` is `deployed`.
2. No unresolved blockers, skips requiring review, or open **`returnToImplementation`** handback on this walk.
3. Developer did **not** name **`review-deploy-checklist`**, **`leave-status-deployed`**, or **`return-to-implementation-new-worktree`** in the **same** message.

When clean: one-line recap (*Checkpoint — closing deploy checklist*) + **Act on this same turn** — flip `**Status:** deployed → done` and run [Frontmatter capstone](#frontmatter-capstone--deploy-test-plan-verified-pending--done) mutation. **Forbidden:** opening the Non-Checkpoint modal below; ending StreamFinal with *approve deploy checklist closure?* while waiting for a developer pick; treating the leftover `USER_CHECKPOINT` under Non-Checkpoint as applying to this clean path.

**Exception — gate required:** When any clean criterion fails, After-deploy satisfaction is ambiguous, or the developer named review / leave-deployed / return-to-implementation in the **same** message, call **`mission_control_present_structured_choice`** per below.

#### Non-Checkpoint and exception modal (binding)

USER_CHECKPOINT — approve deploy checklist closure. defaultOptionId: approve-deploy-closure

When Checkpoint auto-advance does **not** apply (non-Checkpoint dispatch, or any failed clean criterion above):

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `approve-deploy-closure` | Approve deploy checklist closure | Flip `**Status:** deployed → done`; run [Frontmatter capstone](#frontmatter-capstone--deploy-test-plan-verified-pending--done) mutation |
| `review-deploy-checklist` | Review deploy checklist first | Re-read §7; no status flip |
| `leave-status-deployed` | Leave status deployed | Keep `**Status:** deployed`; capstone stays `pending` |
| `return-to-implementation-new-worktree` | Label per [Return-to-implementation option label](../coding-session/SKILL.md#return-to-implementation-option-label-binding) | Set **`outputs.returnToImplementation: true`**; hand back to **`coding-session`** — no `done` flip |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

Only **`approve-deploy-closure`** authorizes the Status `deployed → done` flip and **`deploy-test-plan-verified`** `pending → done` mutation. **`return-to-implementation-new-worktree`** sets **`outputs.returnToImplementation: true`** — hand back to **`coding-session`**; do **not** flip to `done`.

- **`defaultOptionId: approve-deploy-closure`** when After deploy is fully satisfied and no blockers remain.
- **Checkpoint on parent lane:** Parent **`coding-session`** defers closure to **`deploy-walk`** inline auto-advance — **forbidden:** duplicate **`approve-deploy-closure`** modal on **`coding-session`** (see **`coding-session/SKILL.md`** § *Post-merge Checkpoint chain*).

On inline start, run [Inline walk bootstrap](#inline-walk-bootstrap) — do not wait for `deploy-walk present 1`.

The skill is **loose mode by design** on **manual** steps. Between `deploy-walk present <N>` (manual presentation) and `deploy-walk <N> done` / `skip` / `block`, the chat is **normal collaboration** — the **developer** can ask questions, paste logs, debug. **Agent-executable** steps do **not** wait for `deploy-walk present <N>` — the agent runs them, updates the plan, and continues.

**State lives in the plan file, not in chat memory.** The skill re-reads the plan on every command. A walk that started yesterday, was interrupted by 30 other turns, and resumed today still works — the agent finds the same `[ ]` boxes and the same `**Status:**` line.

The procedure below is a hard contract — do **not** skip steps, infer state from chat memory, or mark a step `[x]` without a passing run (agent-executable) or developer resolution (manual). Do **not** skip **manual** steps without developer `done` / `skip` / `block` / **`all-manual-done`** attestation.

## Agent-executable vs manual steps

Classify each unchecked step **before** acting. When classification is ambiguous, use **AskQuestion** once (recap + modal) — do **not** guess credentials, environments, or subjective UI checks.

### Per-step and per-assertion classification (binding)

- Classify each numbered checklist line independently. If it contains multiple checks, split them into sub-assertions first.
- **Mixed steps** (UI + filesystem / YAML / JSON / grep / diff): run agent-executable sub-assertions in the same turn, then present only the UI or subjective remainder as manual.
- Neighboring manual UI steps do not make file, YAML, JSON, grep, or diff checks manual.

### Agent-executable (auto-run — no approval)

Run **without** an **AskQuestion** approval gate **before each agent-executable step** (mid-turn tool work). Use **`worktreePath`** from inline context when present — recap **`cwd: <absolute-path>`** per [Worktree path visibility (binding)](#worktree-path-visibility-binding); otherwise resolve cwd from plan anchor or chat. When an auto-run pass **ends the assistant turn** without chaining further steps, still close with structured choice per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** (include [Deploy developer-await modal options](#deploy-developer-await-modal-options-binding) when awaiting developer input).

| Examples | Notes |
|----------|--------|
| Unit / integration tests (`npm test`, `node --test`, `go test`, `cargo test`, …) | Run in the worktree; exit 0 = pass |
| Center governance scripts (`node .sedea/centers/sedea/scripts/*.mjs`, `node …/plan-and-deliver/scripts/*.mjs`) | From **`HOSTING_ROOT`** per rule **20** § *Hosting repo cwd* |
| **`verify-submodule-ship-attestation.mjs`** | Submodule After deploy step 1 — strict SHA gitlink vs center **`defaultBranch`** tip; optional **`promoteSubmodulePinOutcomes`** cross-check |
| Repo scripts (`./scripts/verify-*.sh`, `make test`, documented package scripts) | Read script first when non-obvious |
| `curl` / `wget` / HTTP checks to **localhost**, staging URLs, or endpoints documented in the step when credentials/env are already available in the session | Do **not** invent secrets; if env vars are missing, treat as manual or **block** |
| File / config assertions (`test -f`, grep, read expected artifact) | |
| `git` read-only checks relevant to the step (branch, diff stat) | No `git commit` / `git push` from this skill |
| Lint / typecheck / build smoke named in the step | |

**On pass:** apply `deploy-walk <N> done: <note>` semantics in the same turn — note must cite the command (or script) and outcome (e.g. *exit 0*, *HTTP 200*, *all tests passed*).

**On fail:** do **not** flip the box. Either **`deploy-walk <N> block: <reason>`** with stderr/exit code, or present the failure and assist debug (manual collaboration) until the developer chooses done / skip / block.

**Auto-advance:** after marking step N done, immediately process step N+1 in the **same assistant turn** when it is also agent-executable. Stop the chain when the next step is **manual**, **blocked**, sub-section complete, or a lifecycle gate applies (see [Inline walk bootstrap](#inline-walk-bootstrap)).

### Manual (developer-led)

| Examples | Agent behavior |
|----------|----------------|
| Browser / UI verification, visual review, product sign-off | Present numbered **Testing steps** per [Step presentation contract](#step-4--step-presentation-contract); wait for developer |
| Production dashboard, on-call judgment, “confirm with teammate” | Same |
| Steps requiring credentials, VPN, or hardware the agent cannot access | Same — **Testing steps** include commands the developer runs locally |
| Subjective “feels right in staging” without automatable assertion | Same — **Testing steps** name concrete observations to record |

**No auto-run** and **no auto-flip** until the developer invokes `deploy-walk <N> done`, `skip`, or `block`, or free-form equivalent confirmed in one line.

### Agent capability inventory (binding)

**Default:** If a deploy step can be satisfied with this inventory and credentials already available in the session, classify it **agent-executable**, **run it in the same turn**, flip the checkbox on pass, and auto-advance. **Do not** delegate that work to the developer.

| Category | Agent runs (use tools — do not ask the developer) |
|----------|---------------------------------------------------|
| **Shell** | `npm test`, `npm run <script>`, `node --test`, `go test`, `cargo test`, `make`, repo `./scripts/*.sh`, `node .sedea/centers/sedea/scripts/*.mjs`, `curl` / `wget`, `jq`, `node -e`, read-only `git` (`status`, `diff`, `log`, `rev-parse`, `branch`) |
| **Logs and text** | `grep`, `rg`, `tail`, `head`, `cat`, `awk`, `sed` on log files and stdout; search for phrases, error codes, stack traces, HTTP status lines |
| **Filesystem read** | `Read`, `Grep`, `Glob` on repo paths; `test -f`, `test -d`, diff expected vs actual config or artifacts in **`worktreePath`** |
| **Plan file edits** | `StrReplace` on deploy checklist boxes, `**Status:**`, capstone todo; read-only `plan-state.mjs resolve` / `show` from **`HOSTING_ROOT`** |
| **HTTP / API** | `curl` to localhost, staging, or URLs named in the step when env vars or tokens are already in the session — **do not** invent secrets |
| **GitHub CLI** | `gh pr view`, `gh api`, `gh run list` / `view` when `gh` auth works in the shell |
| **Mission Control MCP** | `sedea_get_current_user`; `sedea_add_worktree_folder` / `sedea_remove_worktree_folder` when worktree lifecycle applies; `mission_control_update_lane_display` on **own** slot only |
| **Parse / verify** | Read JSON, YAML, Markdown plan sections; compare output to expected shape; count matches; exit codes — **agent parses**, not developer |

**Anti-pattern — tests do not satisfy product UI steps (binding):**

| Step text signals | Classification |
|-------------------|----------------|
| EDH, F5, webview, dashboard UI, visual metrics bar, button disabled/enabled, mission spawn count **visible in product UI** | **Manual only** — unit/integration test pass (`npm test`, vitest, `node --test`, …) **does not** satisfy even when related `*.test.ts` exists and passes |

**Forbidden:** treating vitest / **`npm test`** stdout as proof for steps whose plan text names browser, webview, dashboard, or on-screen UI verification.

### Submodule ship attestation (After deploy — binding)

When the anchored PR plan's **`### After deploy`** step text references **submodule source merged**, **`promote-submodule-pin`**, **honest attestation**, **`verify-submodule-ship-attestation`**, or **dual-repo ship gate** attestation, classify the step **agent-executable** and run this procedure **before** flipping the checkbox.

**Preconditions:**

1. **`HOSTING_ROOT`** resolves (inline context may omit **`worktreePath`** post-merge — attestation runs from hosting root, not session worktree).
2. Inline context may include **`promoteSubmodulePinOutcomes`** from parent **`coding-session`** — use for cross-check only; **forbidden:** treating N/A, skipped, or failed promote outcomes as pass.

**Procedure:**

1. From **`HOSTING_ROOT`**, run:
   ```bash
   node .sedea/centers/software-development/missions/plan-and-deliver/scripts/verify-submodule-ship-attestation.mjs \
     --hosting-root "$HOSTING_ROOT"
   ```
   When **`promoteSubmodulePinOutcomes`** is non-empty, write a temp JSON array and pass **`--outcomes-json <path>`** (or embed in a wrapper object with key **`promoteSubmodulePinOutcomes`**).
2. **On exit 0:** flip the step **`[x]`** with dated note citing script exit **0**, each in-scope **`centerSlug`**, matching **`gitlinkSha`** / **`remoteTip`**, and promote outcome status when provided.
3. **On exit 1:** do **not** flip. Report failing **`centerSlug`** rows from stdout JSON; offer **`deploy-walk <N> block: …`** or assist debug. **Forbidden:** hand-waving promote N/A, *hosting gitlink already at feature SHA*, or *promote skipped for built-in sedea* as attestation pass.
4. **Distinction (binding):** **Center source merged to `defaultBranch`** and **`promote-submodule-pin` success** are separate obligations — both must appear in evidence. Strict SHA: hosting gitlink must equal center **`defaultBranch`** tip, not merely a fetchable feature-branch commit.

**Deferred §7 steps from prior PRs:** When step text explicitly defers attestation to this PR (for example PR 1–2 After deploy carryover), run this procedure as the fulfillment path — do not re-mark deferred steps on prior plans from this lane unless those plans are the active anchor.

**Agent-executable verification examples (binding)** — when a step names `dispatch.yaml`, dispatch bundle JSON, plan sidecars, YAML/JSON fields, before/after mutations, or plan-body checkboxes/status, the agent uses tools (`Read`, `Grep`, `Glob`, `Shell`) before flipping `[ ]` → `[x]`. Done notes cite the tool result: path, command, exit code, or quoted field values. Developer chat confirmation alone is **not** evidence for agent-executable work.

**Challenged checkbox correction (binding):** When the developer challenges a checked step (marked without tool evidence, misclassified as manual, or contradicted by artifacts):

1. Re-read the plan line and reclassify per assertion.
2. Run agent-executable checks immediately.
3. If evidence contradicts the checkbox, revert `[x]` → `[ ]`; re-flip only after new pass evidence.
4. Recap what changed before closing the turn.

**Manual only** (present per [Step 4 — Step presentation contract](#step-4--step-presentation-contract)):

| Situation | Why manual |
|-----------|------------|
| Browser / native UI, visual review, product sign-off | Agent cannot drive the UI |
| Production dashboard or on-call judgment without automatable threshold | Human gate |
| Credentials, VPN, SSO, hardware, or env vars **missing** from session | **block** or manual with expanded **Testing steps** |
| Subjective “looks right” with no named automatable check | Developer records observation |

**Forbidden mis-delegation (agent-executable steps):**

| Anti-pattern | Required instead |
|--------------|------------------|
| “Run this command…” / “execute in your terminal…” | Agent runs Shell in **`worktreePath`** |
| “Grep the log for…” / “find this phrase in…” | Agent greps/parses; cite matching lines in recap |
| “Open this file and check…” | Agent `Read` / `Grep` |
| “Parse the output and confirm…” | Agent parses; report pass/fail with evidence |
| “Paste the log snippet here” when the log path is known | Agent reads the log file |
| **Testing steps** that only repeat commands the agent should run | Remove duplicate — agent runs first; manual steps cover UI-only actions |
| **AskQuestion** “may I run this test?” before agent-executable work | Run without approval modal (see *Agent-executable (auto-run)*) |

When **manual** is required, **Testing steps** must be **numbered**, **3–7** sub-steps minimum when the plan implies multiple actions, with **Commands / context** fully expanded — not a one-line “please verify.”

### Inline walk bootstrap

When run **inline** on **`coding-session`** (first turn after inline context validates):

1. Resolve plan (Step 1) and read § N (Step 2).
2. Run [Autonomous agent-executable pass](#autonomous-agent-executable-pass) from the first unchecked step in the active sub-section.
3. Stop on the first **manual** step with full presentation, on **block**, or when the inline scope is satisfied (`before-deploy-only` Before complete, or full walk terminal rules).

Do **not** wait for the developer to send `deploy-walk present 1` first when agent-executable steps are queued at the front of the checklist.

## Autonomous agent-executable pass

Repeat until stop condition:

1. Re-read the plan; find the lowest-numbered `[ ]` in the active sub-section (respect `deployWalkScope` and `**Status:**` routing).
2. If none remain, run sub-section / lifecycle completion branches (Before complete → `deploy-walk deployed` hint or terminal; After complete → closure gate).
3. Classify the step ([Agent-executable vs manual steps](#agent-executable-vs-manual-steps)).
4. **Agent-executable:** run it → on pass, `StrReplace` flip + note → continue loop in the **same turn**.
5. **Manual:** present step N with numbered **Testing steps** per [Step presentation contract](#step-4--step-presentation-contract), list remaining manual step numbers when ≥2, and **stop** — close with [Manual step await gate](#manual-step-await-gate-binding) (step-by-step **or** **`all-manual-steps-done`**).

**Forbidden:** **AskQuestion** “may I run this test?” before an agent-executable step. **Forbidden:** mark manual steps done without developer resolution.

## Trigger

| Command | Action |
|---|---|
| `deploy-walk present <N>` | Process step N: if **agent-executable**, run → flip on pass → auto-advance while the next steps are also agent-executable; if **manual**, present in detail. Sub-section auto-resolved from **`**Status:**`**: `drafted` → `### Before deploy`; `deployed` → `### After deploy`; `done` → all-checked summary. |
| `deploy-walk present before <N>` / `deploy-walk present after <N>` | Same, with the sub-section forced explicitly. Always works regardless of status — the explicit out-of-order escape hatch. |
| `deploy-walk present <slug> <N>` (or with `before` / `after`) | Same, with the target plan named explicitly. Use when chat context spans multiple PR plans. |
| `deploy-walk <N> done` | Flip step N's `[ ]` → `[x]`, append `*(YYYY-MM-DD: done.)*`, advance hint to step N+1. |
| `deploy-walk <N> done: <note>` | Flip + append `*(YYYY-MM-DD: <note>)*` (period at end of note is the agent's responsibility). |
| `deploy-walk <N> skip: <reason>` | Flip + strike-through step text + append `*(YYYY-MM-DD: Skipped — <reason>)*`. The strike is GFM `~~text~~`. |
| `deploy-walk <N> block: <reason>` | **No flip** — box stays `[ ]`. Append `*(YYYY-MM-DD: Blocked — <reason>)*` after the step text. |
| `deploy-walk all-manual-done` | Batch-flip every remaining **manual** `[ ]` in the active sub-section — see [§ `deploy-walk all-manual-done`](#deploy-walk-all-manual-done--batch-flip-remaining-manual-steps). |
| `deploy-walk all-manual-done: <note>` | Same batch flip; append `*(YYYY-MM-DD: <note>)*` on each flipped line instead of the default one-take phrase. |
| `deploy-walk deployed` | Flip `**Status:**` from `drafted` → `deployed`, append `*(YYYY-MM-DD HH:MM: deployed.)*` to the history. |
| `deploy-walk deployed: <note>` | Same + append the note. |
| `deploy-walk status` | Read-only one-line summary: status, Before X/Y, After X/Y, last transition date. No edits. |

Free-form English equivalents (e.g. *"step 3 done — staging green"*, *"actually skip step 4, the regression suite covers it"*) are interpreted by the agent into one of the canonical commands above; the agent confirms the interpretation in one line *before* applying the edit. If the interpretation is ambiguous, use **AskQuestion** with concrete options instead of guessing.

**Auto-advance (agent-executable only):** after `deploy-walk <N> done` from an agent run, continue to step N+1 in the same turn when N+1 is agent-executable.

**Manual steps:** after `deploy-walk <N> done` from the developer, the confirmation names the next step. If N+1 is agent-executable, run [Autonomous agent-executable pass](#autonomous-agent-executable-pass) immediately (do not wait for `deploy-walk present <next>`). If N+1 is manual, wait for `deploy-walk present <next>` or developer continuation.

## Step 1 — Resolve the target plan

The target is a `.plan.md` file under the **`.sedea/operations/`** plan union on **`HOSTING_ROOT`** with a `## N. Deploy test plan` section. Resolve it from chat context per [`30_planning-target-resolution.mdc`](../../../../rules/30_planning-target-resolution.mdc) § *Resolution order*, with **one additional filter**: only consider plans whose body has `## N. Deploy test plan` *and* a `**Status:**` line.

When spawn **`inputs.targetPlanPath`** is supplied (typical inline run from **`coding-session`**), use that **absolute path verbatim** for all plan reads and `StrReplace` edits — it points at **`HOSTING_ROOT`** `.sedea/operations/…`, not the worktree copy. **Forbidden:** resolving or editing deploy checklist paths under `WORKTREE_ROOT/.sedea/operations/`.

Resolution order (highest confidence first):

1. **Explicit slug in the command.** `deploy-walk present 1_server_side_preview_endpoint_f4fe9ae9 3` — use the named slug verbatim (with or without the `_<hex>` suffix; match against `name:` frontmatter or filename stem).
2. **Mid-walk continuation.** Same chat already invoked `deploy-walk present <M>` against a specific plan; continue with that plan unless the **developer** names a different one.
3. **Most recent agent recommendation.** The agent's last turn listed a **deploy-walk** step command in **`displayMarkdown`** or structured-choice **`options`** against a specific plan.
4. **Single candidate in chat context.** Exactly one PR plan was read / referenced in the recent chat window — use it.
5. **Multiple candidates.** Stop and open [Target plan pick gate](#target-plan-pick-gate-binding) listing PR plans with at least one unchecked `[ ]` in their `## N. Deploy test plan`. The **developer** picks; subsequent commands stick with that plan.
6. **No candidate.** Stop with: *"**deploy-walk** needs a target PR plan. Per **planning-target-resolution** and **`../README.md`** § *Recap, structured choice, act*, emit a fresh "Where we are now in the plan tree" snapshot, then collect the lane pick via **AskQuestion**, **`mission_control_present_structured_choice`** (§ *Sedea input channel* — prefer recap + modal in one message), then re-invoke."*

The IDE focused-file list (host-injected **open and recently viewed files** metadata) is **not** consulted.

Acknowledge the resolved target in one line: *"Target plan: `{slug}` (resolved from {source})."*

## Step 2 — Read § N Deploy test plan and parse the lifecycle

Read the target plan in full (`Read` tool, no offset, no limit) and locate its Deploy test plan section. Match by **name**, not number — both `## 7. Deploy test plan` (current per-PR template) and `## 6. Deploy test plan` (legacy 7-section per-PR plans) are valid section numbers; the skill is agnostic.

Inside the section, parse:

1. **`**Status:** {state} *(YYYY-MM-DD: ...)* …`** — the lifecycle line. State must be `drafted`, `deployed`, or `done`. History entries are appended over time as italic-parenthetical notes; do not strip them.
2. **`### Before deploy`** — numbered `1. [ ] …` / `1. [x] …` task list.
3. **`### After deploy`** — same shape.

Sub-section heading inference, when not pinned by the command:

| Status | Active sub-section |
|---|---|
| `drafted` | `### Before deploy` (advance to `### After deploy` only via `deploy-walk present after <N>` explicit override). |
| `deployed` | `### After deploy`. |
| `done` | All-checked. `deploy-walk present <N>` returns the summary, no edit. |

If the **Status:** line is missing (legacy plan or not yet swept to the new convention), fall back to the heuristic: any `[ ]` in `### Before deploy` → Before; else After. Surface this as a flag in the agent's reply: *"Plan lacks the `**Status:**` lifecycle marker. Falling back to checkbox heuristic. Add `**Status:** drafted *(YYYY-MM-DD: PR plan drafted.)*` above `### Before deploy` to enable status-aware routing — this is what the **`pr-plan`** protocol branch template emits for new plans."*

If the Deploy test plan section uses **dash bullets** (`- ...`) instead of numbered task list (`1. [ ] ...`), stop with: *"`{slug}`'s § N Deploy test plan uses dash bullets, not the GFM task list contract this skill expects (`1. [ ] ...`). Convert the section to numbered checkboxes (one-time sweep) before invoking **deploy-walk**. The **`pr-plan`** template emits the right shape for new plans."*

## Step 3 — Branch by command and execute

Each command has its own contract. After agent-executable auto-runs, you may chain multiple steps in one turn. When a **manual** step is presented, the walk is **blocked**, or a lifecycle gate applies, close with **AskQuestion** or **`mission_control_present_structured_choice`** (step status + next action) — do **not** prose-only “stop and wait for the next user message.”

**Turn completion (binding):** When the assistant turn ends, **always** emit structured choice per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** — **except** when Checkpoint happy-path auto-advance continues mid-turn without ending the turn. Put recap and suggested next walk actions in **`displayMarkdown`**; mirror each choosable path in **`options`** (for example *Present step N+1*, *Mark deployed*, *Step N done*, *Deploy walk status*). The developer may still type **`deploy-walk …`** commands in chat, but **forbidden** as the sole turn ending: “reply when ready”, “reply with results”, “tell me when done”, “auto-advancing (no modal)”, or command hints without [Manual step await gate](#manual-step-await-gate-binding) when a **manual** step was presented.

### `deploy-walk present <N>` — process step N

Find the Nth numbered item in the active sub-section (regex `^N\. \[[ x]\] `). Then:

- If the box is already `[x]`, recap the checked step in **`displayMarkdown`**, then close with **AskQuestion** or **`mission_control_present_structured_choice`**: re-walk step N (before/after), present step N+1, or **More details for option _**. If N+1 is `[ ]` and agent-executable, you may run [Autonomous agent-executable pass](#autonomous-agent-executable-pass) from N+1 without waiting.
- If the box is `[ ]` and has a prior `*(YYYY-MM-DD: Blocked — {reason})*` annotation, surface it: *"Previously blocked: {reason} (YYYY-MM-DD). Has the blocker cleared?"* Then classify — re-run if agent-executable and developer cleared the blocker; else present as manual.
- If the box is `[ ]` and clean, **classify**:
 - **Agent-executable** — run per [Agent-executable vs manual steps](#agent-executable-vs-manual-steps); on pass flip and auto-advance; on fail block or assist.
 - **Manual** — present with numbered **Testing steps** per § *Step 4 — Step presentation contract*, then close with **AskQuestion** or **`mission_control_present_structured_choice`** per [Manual step await gate](#manual-step-await-gate-binding) — do not prose-only stop.

### `deploy-walk <N> done` / `deploy-walk <N> done: <note>` — flip box, advance hint

`StrReplace` to flip:

- `old_string`: `{line N verbatim}` (the entire line, e.g. `1. [ ] Confirm staging is healthy.`).
- `new_string`: `{line N with [ ] → [x] and the note appended}` (e.g. `1. [x] Confirm staging is healthy. *(2026-05-14: staging green, no alerts pending.)*`).

If `{note}` is omitted in `deploy-walk <N> done`, append `*(YYYY-MM-DD: done.)*` (literal phrase). Use today's date from the agent's clock context.

After the edit, **check whether step N was the last `[ ]` in the active sub-section**:

- If `### Before deploy` is now fully `[x]` and Status is `drafted`, open [Deploy status transition gate](#deploy-status-transition-gate-binding) — include the verbatim first After-deploy step in **`displayMarkdown`** when helpful.
- If `### After deploy` is now fully `[x]` and Status is `deployed`, resolve [Deploy closure approval gate](#deploy-closure-approval-gate-binding) — under Checkpoint trust **auto-advance** **`approve-deploy-closure`** **same turn**; otherwise open the Non-Checkpoint / exception modal.
- Otherwise, if step N+1 is **agent-executable**, continue [Autonomous agent-executable pass](#autonomous-agent-executable-pass) in the same turn (no `deploy-walk present` wait).
- If step N+1 is **manual**, close with **AskQuestion** or **`mission_control_present_structured_choice`** per [Manual step await gate](#manual-step-await-gate-binding) — **`present-next-manual-step`**, **`all-manual-steps-done`**, or **More details for option _** — put the verbatim next unchecked step line in **`displayMarkdown`**.

### `deploy-walk <N> skip: <reason>` — strike + flip

`StrReplace` to flip with strike-through:

- `old_string`: `{line N verbatim}` (e.g. `1. [ ] Confirm staging is healthy.`).
- `new_string`: `{line N with [ ] → [x] and the step text wrapped in ~~ ~~, plus skip note}` (e.g. `1. [x] ~~Confirm staging is healthy.~~ *(2026-05-14: Skipped — covered by phase 4's regression suite.)*`).

The strike-through is GFM `~~text~~`. Skipped steps count toward sub-section completion (status-flip logic and "all checked?" detection treat them the same as `done`).

Confirmation: *"Marked {Before or After}-deploy step N skipped: \"{reason}\". Next: step N+1 — ..."* (or the all-checked branch).

### `deploy-walk <N> block: <reason>` — note only, no flip

`StrReplace` to append a block note **without flipping**:

- `old_string`: `{line N verbatim}`.
- `new_string`: `{line N}` + ` *(YYYY-MM-DD: Blocked — {reason})*` (append the block note after the full step line; e.g. `1. [ ] Hit staging health endpoint for each configured tenant id. *(2026-05-14: Blocked — staging auth-service@2.4 not yet deployed; awaiting release from #platform.)*`).

The box stays `[ ]`. The skill stops the loop — no next-step hint, no auto-advance. The **developer** re-invokes `deploy-walk present <N>` later when the blocker clears, at which point the prior block note is surfaced (per § *Step 3 — `deploy-walk present <N>`* above).

Confirmation: *"Marked {Before or After}-deploy step N blocked: \"{reason}\". Box left `[ ]`. Re-invoke `deploy-walk present <N>` once the blocker clears."*

### `deploy-walk all-manual-done` — batch-flip remaining manual steps

Use when the developer verified **all remaining manual** checklist items in one take (Before deploy, After deploy, or any active §7 sub-section). Free-form equivalents: *"all manual deploy steps passed"*, *"I verified the whole Before deploy checklist"*, *"steps 2–5 done in staging"* (interpret → batch flip for listed manual indexes only).

**Preconditions:**

1. Re-read the plan; identify the **active sub-section** (same routing as [Step 2](#step-2--read--n-deploy-test-plan-and-parse-the-lifecycle)).
2. Run [Autonomous agent-executable pass](#autonomous-agent-executable-pass) through any pending **agent-executable** `[ ]` steps in that sub-section **in the same turn** before batch-flipping manual steps.
3. Collect every **manual** `[ ]` numbered line remaining in that sub-section. If none remain, report one line and run sub-section completion branches — **no** batch edit.

**Edit mechanics:**

For each remaining manual step line, apply the same `StrReplace` flip as [§ `deploy-walk <N> done`](#deploy-walk-n-done--deploy-walk-n-done-note--flip-box-advance-hint):

- Default note: `*(YYYY-MM-DD: all manual steps passed in one take.)*`
- With command note: `*(YYYY-MM-DD: <note>)*` from `deploy-walk all-manual-done: <note>`

**Forbidden:** batch-flip **agent-executable** steps the agent has not run. **Forbidden:** batch-flip across sub-sections (Before vs After) in one command — run **`deploy-walk deployed`** / lifecycle gates between sub-sections as usual.

**After batch flip:** run the same branches as the last step's **`done`** in that sub-section (Before complete → **`deploy-walk deployed`** hint; After complete → [Deploy closure approval gate](#deploy-closure-approval-gate-binding) — Checkpoint auto-advance **`approve-deploy-closure`** when clean).

Confirmation: *"Marked {count} {Before or After}-deploy manual steps done in one take: {comma-separated step numbers}."*

### `deploy-walk deployed` / `deploy-walk deployed: <note>` — status transition `drafted → deployed`

Pre-conditions:

- Status must currently be `drafted`. If `deployed` or `done`, reply: *"Status is already `{current}`. To override, reply `deploy-walk deployed force` (**developer** escape hatch — only use if the plan's lifecycle drifted from reality)."* (Skill's `force` branch is identical to the normal branch; the gate is the **developer**'s confirmation.)
- If any `[ ]` boxes remain in `### Before deploy`, open [Deploy with gaps gate](#deploy-with-gaps-gate-binding) — **forbidden** flipping status without developer pick.
- When Before deploy is fully `[x]` or skipped, open [Deploy status transition gate](#deploy-status-transition-gate-binding) before `StrReplace` on the Status line.

`StrReplace` on the Status line:

- `old_string`: `**Status:** drafted {existing-history}` (the full current line, including all prior `*(...)*` entries).
- `new_string`: `**Status:** deployed {existing-history} *(YYYY-MM-DD HH:MM: deployed.)*` (or with the user's note in place of `deployed.`). Time uses 24-hour `HH:MM` from the agent's clock context.

After status flip, close with **AskQuestion** or **`mission_control_present_structured_choice`**: *Present After-deploy step 1* (equivalent to **`deploy-walk present 1`**), *Deploy walk status*, or **More details for option _** — put the verbatim first After-deploy step line in **`displayMarkdown`**.

If `### After deploy` has no `[ ]` items at all (it's empty by design or already all `[x]` — unusual), reply: *"Status flipped: `drafted → deployed`. No `### After deploy` steps remain."* Then resolve [Deploy closure approval gate](#deploy-closure-approval-gate-binding) — under Checkpoint trust **auto-advance** **`approve-deploy-closure`** **same turn**; otherwise open the Non-Checkpoint / exception modal before flipping `deployed → done` or changing `deploy-test-plan-verified` to `done`.

### `deploy-walk status` — read-only summary

No edits. Reply with one line summarising the plan's current state (plain text or a single fenced `text` line — do **not** use raw `<…>` placeholders, which Markdown parsers treat as HTML tags):

```text
{slug} — Status: {state} (last transition: {YYYY-MM-DD}). Before: {X}/{Y} ✓. After: {A}/{B} ✓. worktree={absolute-path when worktreePath set}
```

Where `{X}` is the count of `[x]` boxes (including skipped) in `### Before deploy`, `{Y}` is the total numbered items, `{A}` / `{B}` the same for `### After deploy`, `{state}` from the `**Status:**` line, and `{YYYY-MM-DD}` from the latest `*(…)*` history entry when present. If no `**Status:**` line is found, surface: *"No `**Status:**` lifecycle marker — pre-skill plan format. Counts: Before {X}/{Y}, After {A}/{B}."*

## Step 4 — Step presentation contract

**Checkpoint gate (binding):** Under Checkpoint trust, manual step presentation closes with [Manual step await gate](#manual-step-await-gate-binding) — the first developer-pick gate on inline **`deploy-walk`**. Do **not** auto-advance past presentation without developer selection.

Use this structure for **manual** steps only (or when an agent-executable run **failed** and you are handing back to the developer). Do **not** present first and wait when the step is agent-executable and runnable — run it per [Agent-executable vs manual steps](#agent-executable-vs-manual-steps).

When presenting a manual step, **print numbered step-by-step testing instructions** the developer can follow without inferring missing actions. **Plan path:** show the absolute path you resolved in Step 1 (from **`plan-state resolve`** output, an explicit path the **developer** supplied, or the read tool path). Do **not** use `~/.cursor/plans/` or other non-**`.sedea/operations/`** locations for hosting repo plan IO.

Use a **blockquote** or plain lines for the presentation shell — **do not** put `{slug}`, paths, or `{state}` inside raw `<…>` angle brackets (Markdown/HTML will eat them). Template:

> **Plan:** {slug} — {absolute-path-to.plan.md} — Section: § N {Before or After} deploy, step {N} of {total}.
> **Status:** {state} (last transition: {YYYY-MM-DD}).
> **Worktree:** {absolute-worktreePath} *(omit this line only when `worktreePath` is absent from inline context)*
>
> ### Step
>
> *(verbatim text from the plan, including any inline `code spans` or **bold**)*
>
> ### Why
>
> *(any italic *because* phrasing in the plan body adjacent to or inside this step — search the surrounding paragraph for `*...*` runs that explain rationale; if there isn't one, omit this sub-section)*
>
> ### Testing steps
>
> 1. *(first concrete action — open URL, run command, navigate UI)*
> 2. *(next action with inputs filled or `TODO:` markers)*
> 3. *(verification checkpoint — what to observe, expected signal)*
> *(continue until the full manual test is executable without inference)*
>
> ### Expected outcome
>
> *(pass/fail criteria after all testing steps — HTTP status, response shape, log line, SQL output, dashboard signal. Pull from the step text + repo conventions; be concrete, not aspirational)*
>
> ### Commands / context
>
> *(full commands referenced in **Testing steps** — expand shorthand; "each of the 9 `pushType` values" → enumerated list; "psql ..." → full command with env vars filled or `TODO: fill in`; "curl staging" → full curl with headers and body)*
>
> ### Cross-references
>
> *(if the step depends on another phase or PR being live, name it: "This step assumes phase 4's PUT contract is deployed." If the step has a related caveat in § 8, name it: "See § 8 caveat 2 for the rebase implication.")*
>
> ---
>
> **Manual step** — follow **Testing steps** in order **or** verify all remaining manual steps in your environment and pick **All remaining manual steps passed — one take** on the modal. Close this turn with **AskQuestion** or **`mission_control_present_structured_choice`** per [Manual step await gate](#manual-step-await-gate-binding) — step-by-step (**`deploy-step-n-done`**, **`present-next-manual-step`**, skip, block), batch (**`all-manual-steps-done`**), **return-to-implementation-new-worktree**, or **More details for option _** — put equivalent **`deploy-walk <N> done` / `skip` / `block` / `all-manual-done`** command text in **`displayMarkdown`** when helpful.

### Testing steps authoring rules

1. **Testing steps** is **mandatory** for every manual presentation — a numbered list (`1.` … `N.`). Minimum one step; prefer **3–7** when the plan step implies multiple actions.
2. Each sub-step is **one action + one checkpoint** (run command → check output; open page → confirm element; trigger flow → verify side effect).
3. Expand plan shorthand into executable detail (URLs, curl bodies, CLI flags, UI paths, env vars as `TODO:` when unknown).
4. **Forbidden:** manual presentation with only context blocks and **no** **Testing steps** list.
5. **Forbidden:** inventing UI navigation paths that do not exist today — for example directing developers to a removed Hub **Plans** pane. Cite only verbatim plan §7 text, verified CLI commands (for example `plan-state.mjs list-candidates` from **`HOSTING_ROOT`**), or Hub surfaces that exist today (**Dispatch** and **Centers** only).
6. When an agent-executable run **failed** and you hand back to the developer, include **Testing steps** for the retry path (same rules).

**Example** (plan step: `Confirm staging health dashboard shows no alerts`):

```markdown
### Testing steps
1. Open `{STAGING_DASHBOARD_URL}` (or run `open https://staging.example.com/health`).
2. Filter to service `{service}` and window **Last 15 minutes**.
3. Confirm **Active alerts** = 0 and **Error rate** below the threshold named in the plan step.
4. Screenshot or paste the dashboard summary in chat if the signal is ambiguous.
```

If a sub-section ("Why" or "Cross-references") has nothing to say, omit it rather than emit a placeholder. If "Expected outcome" is genuinely ambiguous for a **manual** step, use **AskQuestion** to clarify what counts as success before the **developer** runs anything. For **agent-executable** ambiguity (missing env, unclear pass criteria), use **AskQuestion** to classify *agent-run* vs *manual* — not to approve a run you already know is agent-executable.

The presentation should be **detail-oriented**, not minimalist. Long presentations are fine; lazy ones aren't.

## Step 5 — Edit mechanics

`StrReplace` is the only tool used for edits. The step text is usually unique within the file (numbered + bracketed = effectively keyed). When it isn't (rare; e.g. the same one-liner appears in both Before and After), include the sub-section heading + the line in `old_string`:

```
old_string:
### Before deploy

1. [ ] Confirm staging is healthy.

new_string:
### Before deploy

1. [x] Confirm staging is healthy. *(2026-05-14: staging green, no alerts pending.)*
```

Status-line edits are similar — the `**Status:** {state}` prefix + first history entry is unique:

```
old_string: **Status:** drafted *(2026-05-14: PR plan drafted.)*
new_string: **Status:** deployed *(2026-05-14: PR plan drafted.)* *(2026-05-14 14:32: deployed — push-svc canary @ commit a1b2c3d.)*
```

For block-then-resume, the `done` edit `old_string` includes the prior block note so it's preserved as audit trail:

```
old_string: 1. [ ] Hit staging health endpoint for each configured tenant id. *(2026-05-14: Blocked — staging auth-service@2.4 not yet deployed.)*
new_string: 1. [x] Hit staging health endpoint for each configured tenant id. *(2026-05-14: Blocked — staging auth-service@2.4 not yet deployed.)* *(2026-05-15: done — staging deploy completed overnight; all tenants returned 200.)*
```

History is **append-only**. Never overwrite or compact prior `*(YYYY-MM-DD: ...)*` entries.

## Frontmatter capstone — `deploy-test-plan-verified` (`pending` → `done`)

PR plans carry a YAML todo whose `id` is **`deploy-test-plan-verified`** (see [`development-process.md`](../../../../docs/development-process.md) § *Per-PR plan template* § 7 — Frontmatter capstone). It stays `pending` until every Before-deploy and After-deploy checkbox is `[x]` **and** the deploy section's `**Status:**` reads `done`.

When this skill sets `**Status:**` from `deployed` → `done` — after Checkpoint auto-advance **`approve-deploy-closure`**, or after the developer picks **Approve deploy checklist closure** on Non-Checkpoint / exception (last After-deploy checkbox, or the empty-After-deploy chain from `deploy-walk deployed`) — **immediately** apply a second `StrReplace` on frontmatter using this **exact** `old_string` / `new_string` pair (byte-identical to [`pr-plan`](../pr-plan/SKILL.md) § 4a-bis and on-disk plans — do not paraphrase the `content: >-` body):

```
old_string:
 - id: deploy-test-plan-verified
 content: >-
 Mark done only when every Before-deploy and After-deploy step is checked
 (`[x]`) and the deploy section `**Status:**` reads `done` (walk via `deploy-walk`,
 or edit manually). Independent of PR merge; run inline `plan-reconcile` on the active
 `coding-session` lane while the dispatch is open when you want reconcile/archive after merges
 — not after dispatch resolution.
 status: pending

new_string:
 - id: deploy-test-plan-verified
 content: >-
 Mark done only when every Before-deploy and After-deploy step is checked
 (`[x]`) and the deploy section `**Status:**` reads `done` (walk via `deploy-walk`,
 or edit manually). Independent of PR merge; run inline `plan-reconcile` on the active
 `coding-session` lane while the dispatch is open when you want reconcile/archive after merges
 — not after dispatch resolution.
 status: done
```

- If the `old_string` block is **not found** (plan lacks the todo, or `content:` was edited and no longer matches), **do not** fail the Status flip — the deploy section is already correct. Reply with a **flag**: *"Could not find canonical `deploy-test-plan-verified` block — add it per **`pr-plan`** § 4a-bis (or hand-insert), then set `status: done` to match § 7."* Optionally append the canonical block with `status: done` immediately before `isProject:` if the plan has zero deploy-capstone todo.
- If `status` is already `done`, skip the second `StrReplace` (idempotent re-run).

**`plan-reconcile` is not invoked.** Finishing the walk does not run **plan-reconcile** — merge-driven reconcile is a separate **developer** gesture (mission dispatch or natural language to the **plan-reconcile** protocol branch).

## Auto-resolution rules — `deploy-walk present <N>` without sub-section

When the user runs `deploy-walk present <N>` (no `before` / `after`), pick the sub-section per the **Status** column above. The full table:

| Status | `deploy-walk present <N>` routes to |
|---|---|
| `drafted` | `### Before deploy` step N. If N exceeds Before's count, surface: *"Step N doesn't exist in `### Before deploy` (only Y items). After deploy, continue in `### After deploy` with `deploy-walk present after` using step index (N − Y)."* |
| `deployed` | `### After deploy` step N. If N exceeds After's count, same pattern. |
| `done` | One-line summary in **`displayMarkdown`**, then structured choice: re-walk a step (before/after), **Deploy walk status**, or **More details for option _** — do not prose-only stop.
| missing | Heuristic fallback (any `[ ]` in Before → Before; else After) plus a flag noting the missing Status marker. |

`deploy-walk present before <N>` and `deploy-walk present after <N>` always work regardless of status — they're the explicit out-of-order escape hatch. If they hit a sub-section the status disagrees with (e.g. `deploy-walk present after 1` while Status is `drafted`), surface a one-line warning at the top of the step presentation:

> **Status mismatch:** PR is `drafted` (not deployed yet). Proceeding with After-deploy step 1 anyway because you asked explicitly.

No blocking — the **developer** is in control.

## Edge cases

1. **Multi-line step text.** A `1. [ ] …` step (arbitrary `{text}` on the first line) may wrap across multiple lines if the text is long (Markdown allows continuation lines indented under the list item). Capture the full step in `old_string` — read enough lines after the `1.` line to include all wrapped content. The flip and note still go on the *first* line (after the `[x]`) — wrapped continuation lines stay as-is.
2. **Step text with backticks / inline code.** `StrReplace` is literal — escape nothing, copy verbatim from the file. Don't reformat.
3. **User typo on step number.** If `deploy-walk present 12` is invoked but the section has only 5 items, reply: *"Section has only 5 numbered items; `deploy-walk present 12` is out of range. Did you mean a different step number? Or run `deploy-walk status` for the current shape."*
4. **`deploy-walk <N> done` invoked without a prior `deploy-walk present <N>`.** The skill doesn't enforce ordering — `done` just flips the box. If the box was already `[x]`, surface: *"Step N was already `[x]` when this `done` arrived. No edit applied. Did you mean a different step number?"*
5. **Status line drifted (e.g. `deployed` but Before still has `[ ]` boxes).** This isn't an error condition — the **developer** may have deployed despite skipping some Before-deploy checks deliberately, or the previous `deploy-walk deployed` invocation surfaced the unchecked-box flag and the **developer** accepted it. The skill respects the Status line as the source of truth.
6. **Plan archived mid-walk.** If **`plan-state`** **`reconcile`** archives the plan between commands (rare; usually requires the PR to merge), the next command's Step-1 resolution must **re-resolve** the slug under **`.sedea/operations/`**. Archived plans keep the same **`plans/`** tree path with sidecar **`archived: true`** on **`<slug>.state.yaml`** (rule 8 — sidecar `archived:` is authoritative; frontmatter `archived:` is not read). Edits still apply via `StrReplace` on that path. Archival timing is **plan-reconcile** / **`plan-state`**'s concern, not this skill's.
7. **User wants to revert a `[x]` to `[ ]`.** Not a built-in command. If they ask, do the inverse `StrReplace` manually (flip `[x]` → `[ ]` and trim the trailing `*(...)*` note). Surface this as an unusual case — usually the right move is a fresh `deploy-walk <N> done` with a new note explaining what changed.
8. **Deploy walk on a non-PR plan (Master Plan, Phase plan, etc.).** Master Plans and Phase plans don't have `## N. Deploy test plan` sections — they have dual-title decomposition sections. If the user runs **deploy-walk** against one, stop with: *"Plan `{slug}` is a Master Plan, Phase plan, or Roadmap topic (pick which), which doesn't have a `## N. Deploy test plan` section. **deploy-walk** only walks PR plans (per-PR template § 7 / § 6). Did you mean a child PR plan?"*
9. **Roll-back.** Out of scope for v1. If a deploy fails and the user wants to flip status back to `drafted`, they edit the Status line manually.
10. **Long agent-executable chains.** If more than ~5 agent-executable steps remain, you may stop after a batch with a one-line recap in **`displayMarkdown`** (*"Steps 1–5 auto-passed; step 6 is manual — presenting now."*) and either continue presenting step 6 in the same turn or close with structured choice per **Turn completion (binding)** above — do not silently skip steps or end the turn without a modal.
11. **Developer verified all manual steps outside chat.** Interpret as **`deploy-walk all-manual-done`** (or modal **`all-manual-steps-done`**) after agent-executable steps in the active sub-section are satisfied — do not force step-by-step modals when the developer attests one-take verification.

## Scope guard

This skill walks **one PR plan's `## N. Deploy test plan` section at a time**. It does **not**:

- Run **manual** steps without developer resolution — present numbered **Testing steps**, assist, wait for `done` / `skip` / `block`.
- Run destructive or irreversible production changes (deploy to prod, delete data, rotate secrets) unless the step text explicitly requires it **and** the developer chose that path in the same message — prefer **block** + AskQuestion when unsure.
- **`git commit`**, **`git push`**, or any other write to the **hosting** git tree on behalf of the **developer** unless they explicitly ask in the same message. Plan body edits are normal **`StrReplace`** on the **`.plan.md`** file; syncing **`.sedea/operations/`** (or the hosting repo) to version control follows the **developer**'s workflow and hosting repo docs — this skill does **not** prescribe a monorepo-specific plan-commit command.
- Reconcile / archive the plan when it reaches `done`, or auto-run **`plan-reconcile`**. **`plan-reconcile`** is never auto-invoked from this skill. The `done` flip + frontmatter `deploy-test-plan-verified` → `done` close the **deploy checklist only**; archival still depends on merge + explicit **plan-reconcile** (see **development-process** cadence).
- Spawn child plans, edit other plans, or modify the parent plan's PR list / scope. Those are **`master-planner`**, **`pr-breakdown`**, **`phase-planner`**, etc.
- Run **`coding-session`**, **`pre-pr-review`**, **`pr-review`**, or any other protocol branch from inside this one. If the **developer** wants those, they invoke them via mission dispatch or natural language.
- Apply to plans without the GFM task list contract (`1. [ ] ...`). Pre-skill plans must be swept first; the skill stops with a clear message instead of guessing.
- Walk "all PR plans in flight" in batch. Cross-plan dashboards can come later as a one-line script over **`.sedea/operations/.../plans/`**; the skill is per-plan.

## Inline result contract

When run inline on **`coding-session`**, report these fields in prose via **`## Completion (inline)`** so the parent can merge into coding-session `outputs`:

- `outputs.targetPlanPath`
- `outputs.targetPlanSlug`
- `outputs.prUrl`
- `outputs.prNumber`
- `outputs.mergeSha`
- `outputs.deployStatus` (`drafted` | `deployed` | `done` | `blocked` | `unknown`)
- `outputs.beforeDeployStatus` (`complete` | `incomplete` | `blocked` | `unknown`)
- `outputs.afterDeployStatus` (`complete` | `incomplete` | `blocked` | `unknown`)
- `outputs.deployTodoStatus` (`pending` | `done` | `missing` | `unknown`)
- `outputs.blockedStep`
- `outputs.remainingTasks`
- `outputs.shipPhase` — `deploy-walk` while checklist in progress; update when blocked or done
- `outputs.rowStatus` — `open` while steps remain; `closed` when `deployStatus` and `deployTodoStatus` are both `done`; `blocked` when a deploy step is blocked
- `outputs.blockedReason` — when `rowStatus` is `blocked` (name the blocked step)
- `outputs.returnToImplementation` — **`true`** when the developer chose **`return-to-implementation-new-worktree`** at a deploy gate; parent **`coding-session`** runs return-to-implementation procedure (see [Return to implementation from deploy walk](#return-to-implementation-from-deploy-walk-inline-handback))
- `outputs.requiresShipTail` — **`true`** when `upstreamSkill` is **`coding-session`**, scope is post-merge **After deploy** (not `before-deploy-only`), and **`deployStatus: done`** with **`deployTodoStatus: done`** — parent owns [Post–After deploy remainder inventory](../coding-session/SKILL.md#post-after-deploy-remainder-inventory); this skill does **not** emit **`prShipComplete`**

## Return to implementation from deploy walk (inline handback)

When the developer selects **`return-to-implementation-new-worktree`** at any [Deploy developer-await modal options](#deploy-developer-await-modal-options-binding) gate:

1. **Do not** flip deploy checklist boxes or Status to `done` as part of this pick.
2. Set **`outputs.returnToImplementation: true`**, keep **`deployStatus`** / sub-section state as-is (document the active step index in **`outputs.remainingTasks`** when useful).
3. Report via **`## Completion (inline)`** — parent **`coding-session`** runs [Return to implementation from deploy walk](../coding-session/SKILL.md#return-to-implementation-from-deploy-walk-new-worktree) on the **next** turn (**Branch A** when session worktree exists; **Branch B** when gone).
4. **Forbidden:** product edits, **`git commit`**, or new worktree creation from **`deploy-walk`** — parent owns worktree lifecycle.

Stop when a **manual** step is presented and awaiting developer input, when the walk is **blocked**, when Before-deploy scope is satisfied (`before-deploy-only`), or when full post-merge walk reaches `done`. You **may** process multiple **agent-executable** steps in one turn before stopping. Do not auto-invoke other skills; do not commit hosting-repo git from this procedure.

## Mission Control section 8 sync (via coding-session)

**`deploy-walk`** is **not** a separate child terminal. §8 ship ledger fields reach the Squad Leader via **`coding-session`** terminal **`outputs`** on re-emit — include `targetPlanPath`, `shipPhase`, `rowStatus`, `deployStatus`, `deployTodoStatus`, `remainingTasks`, and `blockedReason` when applicable per **`../coding-session/SKILL.md`** § *Mission Control section 8 sync*. **Forbidden:** manual **Ship recap** on the leader dispatch.

## Completion (inline)

Report the fields from **## Inline result contract** in prose to the invoker on the **same lane**. Do **not** emit `mission_control_spawn_agent`, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*).

When `upstreamSkill` is **`coding-session`** and the walk completes post-merge After deploy with **`deployStatus: done`** and **`deployTodoStatus: done`**, set **`requiresShipTail: true`** in inline outputs and include one handback line: *Deploy checklist closed — coding-session owns plan-reconcile tail.*

Normally invoked inline from **`coding-session`** (Before deploy, pre-merge, or After deploy post-merge). Deploy phrases on the active coding-session lane use the same procedure body.
