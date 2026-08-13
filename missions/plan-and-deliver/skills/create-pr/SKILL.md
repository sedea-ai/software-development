---
name: create-pr
description: >-
 Inline coding-session procedure to create or prepare a GitHub PR from a reviewed
 implementation branch using PR plan lineage and pre-pr-review result. Executed by
 the active coding-session agent only — not spawned, no warmUpRules.
designation:
  allowed: Create GitHub PR from reviewed branch; PR description per ship rules
  forbidden: Implementation edits; merge without authorization; dispatch resolution
inputs:
  targetPlanPath:
    type: string
    description: Absolute PR plan path, when plan-anchored.
    required: false
  targetPlanSlug:
    type: string
    description: PR plan slug, when plan-anchored.
    required: false
  worktreePath:
    type: string
    description: Absolute hosting repo worktree path.
    required: true
  worktreeName:
    type: string
    description: Branch to create the PR from.
    required: true
  baseRef:
    type: string
    description: Base ref for the PR, usually origin/main.
    required: true
  repoUrl:
    type: string
    description: Git remote URL for the repository.
    required: false
  diffSummary:
    type: object
    description: Summary of commits, files, and changes from coding-session.
    required: false
  prePrReviewRecommendation:
    type: string
    description: Recommendation from pre-pr-review. Must be go.
    required: true
  prePrReviewFlags:
    type: array
    description: Non-blocking flags from pre-pr-review.
    required: false
    default: []
  followUpsAppended:
    type: array
    description: Follow-up bullets appended to the PR plan by pre-pr-review.
    required: false
    default: []
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from coding-session.
    required: false
  upstreamSkill:
    type: string
    description: Invoker skill — must be coding-session when inline.
    required: false
---

# Create PR

**Inline context schema (not spawn).** The frontmatter **`inputs`** map describes values **`coding-session`** passes in prose or handoff on the **same lane**. Mission Control does **not** spawn **`create-pr`** via **`mission_control_spawn_agent`**. Do **not** treat **`inputs`** as a spawn contract.

**Lane requirement (no separate warm-up).** This skill has **no** frontmatter **`warmUpRules`** by design. Run it **only** on the active **`coding-session`** lane after that session has loaded ship rules (**`20_efficient-pr-shipping`**, **`.sedea/centers/software-development/missions/plan-and-deliver/plan.mdc`**, **`skills/README.md`**, dev-process) and **`pre-pr-review`** has returned `recommendation: "go"`. Do **not** start a standalone Mission Control session on **`create-pr`** alone — context will be incomplete.

### Standalone dispatch (stop immediately)

If Mission Control opened a session whose only intent is **`create-pr`** / *open a PR* with **no** active **`coding-session`** context (`worktreePath`, `worktreeName`, `baseRef`, pre-PR **go**, PR plan when anchored):

1. **Stop** — do not run gates or **`gh pr create`**.
2. Tell the developer **`create-pr`** is **inline-only** on the **`coding-session`** lane.
3. Direct them to open or return to **`coding-session`** (detached phrase, snapshot, or **`plan and deliver`** ship path) and complete the ship chain through **`pre-pr-review`** → inline **`create-pr`** on clean **go** in [`coding-session/SKILL.md`](../coding-session/SKILL.md).

**Execution owner:** the active **coding-session agent** runs this skill inline. Do **not** spawn a separate PR-creating child lane. The coding-session lane has worktree, worktree name ref, diff, PR plan, pre-PR review outputs, and developer approvals needed to open a PR safely.

**Required upstream context:** `prePrReviewRecommendation: "go"`; `worktreePath`, `worktreeName`, `baseRef`; optional `targetPlanPath` / `targetPlanSlug`; `diffSummary` and pre-PR flags when available. If context is missing, recover on **`coding-session`** before running this procedure.

**Post-PR lifecycle:** merge checks, After-deploy **`deploy-walk`**, and inline **`plan-reconcile`** are owned by **`coding-session`** ([Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate), [After deploy deploy-walk handoff](../coding-session/SKILL.md#after-deploy-deploy-walk-handoff), [Plan-reconcile handoff (inline)](../coding-session/SKILL.md#plan-reconcile-handoff-inline)) — not this skill. **`gh pr create`** is the only `gh` operation this skill owns; after the PR exists, generic **`gh`** PR inspection is **not** a substitute for inline **`pr-review`** and **`pr-review.mjs`** Step 1 on **`coding-session`**.

## Pin promotion forbidden (binding)

**`create-pr`** opens PRs for **implementation diffs** on the active **`coding-session`** worktree branch only (source files, tests, config — not gitlink-only pointer bumps).

**Forbidden:**

- Using this skill (or `gh pr create` while executing this skill) for **gitlink-only** / **hosting pin promotion** PRs.
- Opening a hosting PR whose committed diff is **only** submodule pointer change(s) with no implementation files in scope.

**Required instead:** [`.sedea/centers/sedea/skills/promote-submodule-pin/SKILL.md`](.sedea/centers/sedea/skills/promote-submodule-pin/SKILL.md) § *Script invocation* — call `center-pull-promote-pin.sh`, `hosting-gitlink-pull-promote-pin.sh`, or `batch-promote-submodule-pins.sh` **before** or **after** the implementation PR per the ship chain — never via **`create-pr`**. Promote scripts create the hosting worktree with **`worktree-setup.sh --pin-only`**. **Forbidden:** default **`worktree-setup.sh`** or **`create-pr`** for pin PRs.

**Worktree removal ownership (binding).** **Do not remove worktrees you do not own.** Opening a PR does **not** grant cleanup on other worktrees. **`git worktree remove`**, **`git worktree prune`**, and **`sedea_remove_worktree_folder`** apply **only** to **this pass’s** **`WORKTREE_ROOT`** when rule **0** § *Worktree ownership* and rule **20** § *Worktree removal ownership (binding)* preconditions hold. **`git worktree list` is read-only** when ownership is unclear — **stop; do not remove**.

## Structured choice (Mission Control)

Gates use **AskQuestion**, **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act* on the **`coding-session`** lane — **preferred:** recap + modal in one message. **Act** (`gh pr create`, plan follow-up append) only after the developer selects.

## Checkpoint turn UX (skill-local)

Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`create-pr`**; other ship-chain skills document their own markers.

**Parent yield gate:** Mid-ship StreamFinal without same-turn Act on the invoker **`coding-session`** lane is governed by **`coding-session/SKILL.md`** § [Yield gate (Checkpoint — binding)](../coding-session/SKILL.md#yield-gate-checkpoint--binding). This skill must **not** authorize recap-only “Act next turn” exits that leave the parent without a resume modal.

**Real-dispatch test loop (binding):** After merge, run one full inline **`create-pr`** on a **`coding-session`** Checkpoint dispatch through [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) (clean path) or [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) (exception), then verify **`coding-session`** [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) opens same turn without idle-handoff prose — collect a developer verdict before the parent phase advances **`pr-review`** PR 5 — per **Ship-chain skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path** inline steps ([Gate](#gate) validation **1–4**, push when pre-authorized, [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) → **`gh pr create`** on the **same** turn) **auto-advance without a turn-end modal**. **Developer-input** surfaces below are **USER_CHECKPOINT** — **not** rule **2** external-wait.

| Situation | Normative gate / owner |
|-----------|------------------------|
| Branch not on remote; push not pre-authorized | [Push authorization gate](#push-authorization-gate-binding) — **this skill** |
| Pre-PR clean; push satisfied; Checkpoint auto-advance criteria pass | [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) — **no** Pre-gh modal |
| Pre-gh needed (non-Checkpoint, push unauthorized, defer/revise/emit-prompt, or follow-up append unresolved) | [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) — **this skill** (exception / non-Checkpoint only) |
| **`gh pr create`** succeeded — next ship action | [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) — **`coding-session`** same turn — **not** this skill |
| Developer returns after GitHub review / idle open PR | **`coding-session`** post-create-pr or **`pr-review`** disposition — developer-input |

**Forbidden:** prose-only PR URL, *review on GitHub*, *tell me when*, *come back when*, *waiting for PR review*, or *I'll open the PR* without **`mission_control_present_structured_choice`** at [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) (when that gate applies) or without handing off to **`coding-session`** [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) on the **same turn** **`gh pr create`** completes. **Forbidden:** treating GitHub CI/check completion or third-party reviewer activity as **external-wait** that skips the post-create-pr modal — **lane continuation** requires a developer pick on **`coding-session`**. **Forbidden on Checkpoint clean path:** opening Pre-gh / *Create the pull request now?* when [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) criteria pass.

**Implicit external-wait (not this skill):** host-delivered **`pre-pr-review`** child result on the parent lane — **`coding-session`** still owns the next-step modal before StreamFinal when the skill requires it. **`create-pr`** does **not** classify parent wait-for-reviewer as permission to end at PR URL prose alone.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **Pre-PR clean path** — validate `prePrReviewRecommendation`, worktree context, branch ref, committed diff ([Gate](#gate) steps **1–4**) | Auto-advance when inputs valid | exception: validation failure → stop with recap; do not call **`gh pr create`** |
| **Push authorization** — branch on remote or push pre-authorized | Auto-advance when remote has commits or **`coding-session`** already pushed on clean-**go** auto path | **Gate** when push is required but not authorized — [Push authorization gate](#push-authorization-gate-binding) |
| **Pre-gh authorization** — developer pick before **`gh pr create`** | **Auto-advance** — **`authorize-create-pr`** or **`approve-followups-create-pr`** when [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) criteria pass | **Gate** when push unauthorized, developer named defer/revise/emit-prompt, or follow-up append unresolved — [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) |
| **`gh pr create`** + PR description | Auto-advance on the **same** turn after implicit authorize pick (Checkpoint) or on the **next** response turn after modal pick (non-Checkpoint) | exception: `gh` failure → recap + re-open pre-gh gate |
| **`## Completion (inline)`** handback | Parent opens [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) with **`mission_control_present_structured_choice`** same turn — Checkpoint and non-Checkpoint | — |
| **PR prompt fallback** | Auto-advance when developer picks emit prompt or push/creation remains unauthorized | — |

**Skip pre-gh modal (binding):** When [Standalone dispatch (stop immediately)](#standalone-dispatch-stop-immediately) applies, **skip** both authorization gates — stop before **`gh`** or push. When **`coding-session`** invoked this skill via [Inline create-pr (auto on clean go)](../coding-session/SKILL.md#inline-create-pr-auto-on-clean-go) on a Checkpoint dispatch, **skip** the pre-gh modal on the clean path — [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding).

## Session orientation table (binding)

Give developers a **consistent state snapshot** during inline PR creation so they can re-orient after reload or parallel work.

**When required:** At every **Mandatory gate** below — render as the **first block** in `displayMarkdown` (before recap or diff summary). **Forbidden:** omitting the table and substituting scattered one-liners on modal gates.

**Table shape (markdown):**

| Field | Value |
|-------|-------|
| Plan | `<slug>` @ `<path>` or — |
| Worktree | `<worktreePath>` from inline context |
| Branch | `<worktreeName>` from inline context |
| PR | — (pre-PR — no open PR yet) |
| Ship phase | parent `shipPhase` when inline on **`coding-session`**, or `implementing` |
| Deploy scope | — (create-pr does not own deploy walk) |
| Review | `go` from **`pre-pr-review`** when present |

**Population rules:** Same as [`.sedea/centers/software-development/missions/plan-and-deliver/skills/coding-session/SKILL.md`](../coding-session/SKILL.md) § *Session orientation table (binding)* — use inline context; never invent paths or PR numbers.

**Mandatory gates (this skill):** [Push authorization gate](#push-authorization-gate-binding); [Pre-gh authorization gate](#pre-gh-authorization-gate-binding).

### Push authorization gate (binding)

When [Gate](#gate) step **5** requires push but the branch is not on the remote and push was **not** authorized by **`coding-session`** (for example developer deferred push at ship cut-point):

Put the session orientation table and push status (`git status`, tracking ahead/behind) in **`displayMarkdown`**.

USER_CHECKPOINT — authorize push before PR creation.

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `authorize-push` | Push branch and continue | Run **`git push`**; on success, proceed to [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) on the **next** turn |
| `emit-pr-prompt` | Emit PR prompt — do not push | [PR prompt fallback](#pr-prompt-fallback); `continuationStatus: "active"` |
| `defer-pr` | Defer PR creation | Stop with `partial`; `remainingTasks` names push deferral |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

- **Next-step resolution:** Auto-advance through [Gate](#gate) steps **1–4** on the happy path — no `USER_CHECKPOINT` until push is required and unauthorized.

### Checkpoint — auto-advance `authorize-create-pr` (binding)

Under Checkpoint trust, when **`coding-session`** loads this skill after **`pre-pr-review`** clean **`go`** ([Inline create-pr (auto on clean go)](../coding-session/SKILL.md#inline-create-pr-auto-on-clean-go) or Checkpoint **`approve-followups-create-pr`** auto path), **auto-advance** as if the developer picked **`authorize-create-pr`** or **`approve-followups-create-pr`** — **no** **`mission_control_present_structured_choice`** — when **all** hold:

1. [Gate](#gate) steps **1–4** pass (`prePrReviewRecommendation: "go"`, worktree context, committed diff).
2. Branch is on the remote **or** push was authorized on this turn (including **`coding-session`** clean-**go** push on the inline create-pr path).
3. Developer did **not** name **`defer-pr`**, **`revise-first`**, **`emit-pr-prompt`**, or **`create-pr-no-followups`** in the **same** message when follow-ups were pending append.
4. **`followUpsAppended`** intent is resolved — **`false`** on clean go without proposed follow-ups; **`true`** only when **`coding-session`** Checkpoint auto-advanced **`approve-followups-create-pr`** or inline context carries non-empty **`followUpsAppended`**.

**Resolved pick id:**

| Inline context | Auto-advance pick |
|----------------|-------------------|
| No proposed follow-ups / `followUpsAppended: false` | **`authorize-create-pr`** |
| Follow-ups approved for append | **`approve-followups-create-pr`** |

When clean: one-line recap (reviewer **`go`**, branch pushed, PR opening), run **`gh pr create`** on the **same** turn, merge [## Completion (inline)](#completion-inline) — **forbidden:** *Coding session — create PR* modal or *Create the pull request now?* structured choice on this path.

**Exception — gate required:** When Checkpoint does not apply, push is unauthorized, validation fails, or the developer named defer/revise/emit-prompt, emit the modal below.

### Pre-gh authorization gate (binding)

**Non-Checkpoint and exception path only.** Under Checkpoint trust, use [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) first — **forbidden:** opening this modal when that section’s clean criteria pass.

**When required:** After [Gate](#gate) steps **1–5** pass (including push when authorized) and Checkpoint auto-advance does **not** apply. **Forbidden:** calling **`gh pr create`** in the same assistant turn as this modal (non-Checkpoint). **Forbidden:** prose-only PR creation handoff (*tell me when*, *I'll open the PR*) without **`mission_control_present_structured_choice`**.

Put the session orientation table, reviewer **`go`** summary, optional flags, and proposed follow-ups (when present) in **`displayMarkdown`**.

USER_CHECKPOINT — authorize `gh pr create` on this lane.

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `authorize-create-pr` | Create PR now | On the **developer's response turn**, run **`gh pr create`** per rule **20** § *Comprehensive PR descriptions*; merge [## Completion (inline)](#completion-inline) |
| `approve-followups-create-pr` | Approve follow-ups and create PR | Append proposed follow-ups to the plan **`## Follow-ups`** when present; then **`gh pr create`** on response turn |
| `create-pr-no-followups` | Create PR without appending follow-ups | **`gh pr create`** with `followUpsAppended: false` on response turn |
| `emit-pr-prompt` | Emit PR prompt — do not run `gh` | [PR prompt fallback](#pr-prompt-fallback); do not call **`gh pr create`** |
| `defer-pr` | Defer PR creation | `continuationStatus: "active"`; `remainingTasks` names deferral |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

- **`defaultOptionId: authorize-create-pr`** when pre-PR clean path passed, branch is pushed, and no follow-up append decision is pending.
- **`defaultOptionId: create-pr-no-followups`** when **`hasProposedFollowUps`** is **false** and the developer already declined follow-up append at **`coding-session`** [Create-PR handoff after go](../coding-session/SKILL.md#create-pr-handoff-after-go).
- **Next-step resolution:** Under Checkpoint trust, auto-advance through pre-PR clean path, push (when authorized), and **`gh pr create`** on the clean path — no `USER_CHECKPOINT` until an exception applies. Under non-Checkpoint trust, auto-advance through pre-PR clean path and push authorization — no `USER_CHECKPOINT` until this gate.

**Standalone dispatch:** When [Standalone dispatch (stop immediately)](#standalone-dispatch-stop-immediately) applies, **skip** this gate — stop before **`gh`**.

## Relationship to rule 20 (`gh pr create`)

**`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`** forbids **`gh pr create`** on planning, Squad Leader, **`pre-pr-review`**, and other non-ship lanes. **Exception:** the active **`coding-session`** agent **while executing this skill inline** after pre-PR clean **`go`** (auto path) or exceptional Create-PR gate may call `gh pr create` when gates pass and push/creation is authorized.

## Gate

Before creating or preparing a PR (Checkpoint: see [Checkpoint turn UX (skill-local)](#checkpoint-turn-ux-skill-local) for auto-advance vs gate routing):

1. Verify `prePrReviewRecommendation` is exactly `go`. If not, stop; PR creation is blocked until review passes.
2. Verify `worktreePath`, `worktreeName`, and `baseRef` are present.
3. Verify the worktree name ref matches `worktreeName` (`git branch --show-current`).
4. Verify the committed diff exists: `git diff <baseRef>...HEAD` is non-empty.
5. Verify the worktree is pushed or push it only if the developer / **`coding-session`** explicitly authorized push. If push is not authorized, open [Push authorization gate](#push-authorization-gate-binding) — do not push silently. If push is not authorized and the developer picks emit prompt, use [PR prompt fallback](#pr-prompt-fallback) and report `partial` with `remainingTasks`.

When pre-PR validation and push preconditions pass:

- **Checkpoint trust** — when [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding) criteria pass, run **`gh pr create`** on the **same** turn (implicit **`authorize-create-pr`** / **`approve-followups-create-pr`**). **Forbidden:** opening [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) on the clean path.
- **Non-Checkpoint or exception** — open [Pre-gh authorization gate](#pre-gh-authorization-gate-binding) before **`gh pr create`**. When the developer authorizes creation, run `gh pr create` on the **response turn** — not the same turn as the modal.

If creation is not authorized, produce the PR prompt below and set `continuationStatus: "active"` — do not call `gh pr create`.

## `gh pr create` procedure (binding)

When authorized to open the PR ([Gate](#gate), [Checkpoint — auto-advance `authorize-create-pr`](#checkpoint--auto-advance-authorize-create-pr-binding), or [Pre-gh authorization gate](#pre-gh-authorization-gate-binding)):

1. **Derive PR base branch** — From inline **`baseRef`** (e.g. `origin/main`): strip a leading `origin/` prefix → **`<prBaseBranch>`** (e.g. `main`). When **`baseRef`** uses another remote prefix, strip that remote name and `/` only.
2. **Pre-create self-check** — `gh api repos/{owner}/{repo} --jq .default_branch`. When the result ≠ **`<prBaseBranch>`**, **`--base` is mandatory** (always safe to pass even when equal).
3. **Create PR** — From **`worktreePath`**:

```bash
gh pr create \
  --base "<prBaseBranch>" \
  --head "<worktreeName>" \
  --title "<title>" \
  --body "<body>"
```

Body per rule **20** § *Comprehensive PR descriptions*.

4. **Forbidden:** bare **`gh pr create`** without **`--base`** — GitHub repository **`default_branch`** may differ on fork layouts.

Cross-ref: rule **20** § *Hosting-repo PR base branch (binding)*. **Center-repo PRs:** [`.sedea/centers/sedea/rules/3_center.mdc`](.sedea/centers/sedea/rules/3_center.mdc) § *Center-repo worktree procedure*; **`development-process.md`** § *Center-repo PR base (binding)*.

## PR prompt fallback

When direct PR creation is not authorized, generate a copy-paste prompt for a future **`coding-session`** ship pass. Gather:

1. **Current worktree name ref**: `git branch --show-current`
2. **Integration line**: from `git merge-base` / tracking parent (e.g. `main`).
3. **Repo URL**: `git remote get-url origin`
4. **Changes summary**: `git diff <base>...HEAD` plus session context — **reviewer-complete** per rule **20** § *Comprehensive PR descriptions*.

Print inside a fenced code block:

```
Create a PR for the worktree I pushed: `<current-worktree-name>`
In the <repo-url> repo
The integration line is `<integration-line>`

Use past tense for the PR title.

Here is a summary of the changes as a starting point for the PR description (verify against the diff and adjust as needed). Use bullets; keep it proportional to PR size but do not omit reasoning:

- Why this slice / motivation (enough that a reviewer can tell intent vs mistake)
- What changed (behaviour, APIs, schema, config)
- Not in this PR (deferrals, parent scope left out on purpose)
- Plan lineage (if applicable): path or slug to `.sedea/operations/**/plans/<slug>.plan.md` and optional pointer to Mermaid in the plan
- Intentional non-changes (if any)
- How to verify (which tests or observable behaviour — no separate test-plan essay)
```

## Result contract

Merge these fields into **`coding-session`** `outputs` via **`## Completion (inline)`**:

- `targetPlanPath`
- `targetPlanSlug`
- `worktreePath`
- `worktreeName`
- `baseRef`
- `repoUrl`
- `prUrl`
- `prNumber`
- `promptEmitted`
- `remainingTasks`
- `shipPhase` — `pr-open` when PR created; `implementing` or `blocked` when deferred
- `rowStatus` — `open` when PR exists and ship continues; `blocked` when handoff blocked
- `blockedReason` — when `rowStatus: blocked`
- `prState` — `open` | `merged` | `closed` | `unknown` when known
- `reviewState` — when queried on this pass
- `continuationStatus` — `active` when PR open or prompt emitted; `partial` when blocked

Set `continuationStatus`:

- `active` when a PR URL/number is created and post-create-pr gates remain on **`coding-session`**.
- `active` when a PR prompt was emitted but the developer still must create the PR.
- `active` when push or PR creation is blocked by missing authorization.

## Mission Control section 8 sync (via coding-session)

**`create-pr`** is **not** a separate child terminal. After inline completion, the invoker **must** merge these fields into the next **`coding-session`** **`mission_control_send_agent_result`** **`outputs`** (or re-emit updated terminal on that lane):

| Field | When |
|-------|------|
| `targetPlanPath` | Always when plan-anchored |
| `shipPhase` | `pr-open` when PR created; `implementing` or `blocked` when deferred |
| `rowStatus` | `open` when PR exists; `blocked` when handoff blocked |
| `prUrl` / `prNumber` | When PR created |
| `remainingTasks` / `blockedReason` | When applicable |

**Forbidden:** nudging manual **Ship recap** on the Squad Leader dispatch. Host sync delivers §8 updates from **`coding-session`** terminals only.

| Outcome | `shipPhase` | Key `outputs` |
|---------|-------------|---------------|
| PR created | `pr-open` | `targetPlanPath`, `prUrl`, `prNumber` |
| Blocked / deferred | `implementing` or `blocked` | `targetPlanPath`, `remainingTasks`, `blockedReason` |

## Completion (inline)

Report on the **same `coding-session` lane**. Do **not** emit `mission_control_spawn_agent`, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution` from this procedure alone.

Required fields (prose to invoker / merged into **`coding-session`** `outputs`):

- All keys from **## Result contract**
- One-line summary: PR opened (`prUrl`) or blocked reason

**Handback:** on the **same `coding-session` assistant turn** that finishes this procedure:

- **Checkpoint trust** — parent opens [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) with **`mission_control_present_structured_choice`** and post-create-pr **`options`** — **forbidden:** prose-only PR URL, *Next: inline pr-review*, or auto-starting inline **`pr-review`** on the **`create-pr`** completion turn.
- **Non-Checkpoint trust** — same post-create-pr gate with **`mission_control_present_structured_choice`** and post-create-pr **`options`**, not prose-only PR URL.

Do **not** auto-start inline **`pr-review`**, inline **`deploy-walk`**, or **`plan-reconcile`** from this skill. When the developer picks **`start-pr-review`** or **`start-pr-review-delegate-merge`** at post-create-pr, **`coding-session`** starts inline **`pr-review`** on the **next** turn and must run **`pr-review.mjs`** Step 1 before generic review/wait/merge options.
