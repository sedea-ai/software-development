# Coding session — checkpoint UX (on-demand)

**On-demand reference.** Load via step-bound `Read` from [`coding-session/SKILL.md`](../skills/coding-session/SKILL.md) before opening a `USER_CHECKPOINT` gate or when [Yield gate](../skills/coding-session/SKILL.md#checkpoint-turn-ux-on-demand-read) applies — not in `laneRules` warm-up.

Cross-ref ship chain: [`coding-session-ship-chain.md`](coding-session-ship-chain.md).

---

### Plan-change notification receive (child lane)

When Mission Control delivers a silent UserSend whose first line is **`Mission Control: plan-change-notification delivered.`**, treat it as a **parent plan-change handoff** — not terminal completion, not implicit external-wait resume, and **not** permission to close the ship chain.

**Intake (binding):**

1. **Detect** the preamble line and parse the host envelope: **`summary`**, **`changeType`**, **`affectedPlanPaths`**, optional **`excerptPointers`**, optional **`requestedChildActions`**, optional **`initiatingContext`**, parent slug/agent id.
2. **`Read`** each path in **`affectedPlanPaths`** in full (`Read` tool, no offset/limit skip) **before** acting or offering options.
3. **Compare** grounded plan content to lane **`inputs`** (`targetPlanPath`, `targetPlanSlug`, `parentPlanPath`, ledger sidecar) and current implementation state.
4. **Keep** **`outputs.continuationStatus: active`** on any in-flight ship work — notify does not mark PR ship complete.

**Checkpoint vs external-wait (binding):** Plan-change notification delivery is a **developer-input USER_CHECKPOINT** on this lane — **not** implicit external-wait. Call **`mission_control_present_structured_choice`** or **AskQuestion** on the **same turn** after re-read and recap; do **not** end with prose-only acknowledgment or auto-advance into ship steps without the developer pick.

USER_CHECKPOINT — parent plan-change notification received; pick how to respond before continuing implementation or ship work.

**Required recap** (include in **`displayMarkdown`** when calling **`mission_control_present_structured_choice`**):

- One line: parent slug, **`changeType`**, and **`summary`**.
- Bullet list of **`affectedPlanPaths`** re-read (confirm each file was loaded).
- One line comparing whether **`inputs.targetPlanPath`** or anchored PR plan intersects the change (yes/no + which sections).

**Required options** (`modalTitle`: *Coding session — plan change notification*; list in this order):

| Option id | Label |
|-----------|--------|
| `acknowledge-only` | Acknowledge — continue current implementation with updated context |
| `re-read-revise` | Re-read / revise affected plan sections on this lane |
| `plan-reconcile` | Run inline **`plan-reconcile`** when authorized (plan-anchored ship) |
| `escalate-parent` | Escalate to parent planner — change needs upstream decision |
| `stop-work` | Stop work on this lane (when **`changeType: cancellation`** or developer-directed) |
| `more-details` | More details for option _ |

**Option semantics (binding):**

| Option | Act |
|--------|-----|
| **`acknowledge-only`** | Record acknowledgment in chat; resume prior ship-chain step — **no** terminal MCP result |
| **`re-read-revise`** | Edit anchored plan §§ or implementation scope per re-read; stay **`continuationStatus: active`** |
| **`plan-reconcile`** | Inline **`plan-reconcile`** per its contract when plan-anchored and ship rules loaded — merge ledger; **no** terminal result solely from notify |
| **`escalate-parent`** | Summarize gap for upstream **`phase-planner`** / **`pr-plan`** / Squad Leader — **no** **`mission_control_refocus_parent_lane`** solely from notify |
| **`stop-work`** | Pause implementation; may emit **`partial`** only when skill work is genuinely blocked — **not** because notify arrived |

When **`requestedChildActions`** is present, surface matching options in recap (for example **`re-read-plan`** → prefer **`re-read-revise`**; **`run-plan-reconcile`** → prefer **`plan-reconcile`**; **`acknowledge-only`** → default **`acknowledge-only`**; **`stop-work`** → include **`stop-work`**).

**Forbidden on notify delivery (binding):**

- Terminal **`mission_control_send_agent_result`** solely because notification arrived.
- **`mission_control_refocus_parent_lane`** solely because notification arrived.
- Treating notify as **`pre-pr-review`** / child-result external-wait — no host **`correlationId`** merge on parent from notify alone.
- Skipping **`Read`** of **`affectedPlanPaths`** before the USER_CHECKPOINT gate.
- Classifying notify as external-wait to avoid a turn-end modal under Checkpoint trust.

Normative protocol summary: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol* § *Child agent duty*; **`../README.md`** § *Spawn vs notify* and § *Child delivery checkpoint (receive)*.

## Structured choice (Mission Control)

Approval gates and worktree naming picks use **AskQuestion** or **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act* — recap + modal in **one turn** when practical; rule **2** priority **3** split only when a long draft was already sent (next message = MCP structured choice). **Act** (worktrees, spawn, `git`, code edits) is always after the developer selects in the modal.

On **[Spawned implementation lane](../skills/coding-session/SKILL.md#spawned-implementation-lane)**, **this lane** edits the hosting repo under the worktree through the implementation cut point — do not tell the developer to paste a session prompt into another chat. On **prompt-only** runs, emit the external prompt and **stop** without implementing here.

## Session orientation table (binding)

Give developers a **consistent state snapshot** at ship gates so they can re-orient after reload, tab switch, or parallel work.

**When required:** At every **Mandatory gate** below — render as the **first block** in `displayMarkdown` (before step recap or checklist prose). **Forbidden:** omitting the table and substituting scattered one-liners.

**Table shape (markdown):**

| Field | Value |
|-------|-------|
| Plan | `<slug>` @ `<path>` or — |
| Plan IO host | `<absolute HOSTING_ROOT>` or — |
| Code IO | `<absolute WORKTREE_ROOT>` or — |
| Worktree | `<absolute WORKTREE_ROOT>` or — |
| Branch | `<worktreeName>` or — |
| PR | `<url>` (#N) or — |
| Ship phase | `<shipPhase>` |
| Deploy scope | Before deploy · After deploy · — |
| CI | `passing` · `failing (N)` · `pending` · `deferred` — from **`pr-review`** Step 1b when in PR review |
| Review | `<prePrReviewRecommendation>` / `prReviewStatus` / `reviewState` or — |

**Population rules:**

| Rule | Requirement |
|------|-------------|
| No invention | Use `—` when unknown; never guess paths or PR numbers |
| Plan IO host / Code IO | Set after worktree attach — **Plan IO host** = **`HOSTING_ROOT`**; **Code IO** = **`WORKTREE_ROOT`** (see § *Plan and sidecar IO (binding)*) |
| Worktree row | Populated while session worktree exists; `—` after authorized cleanup |
| PR row | Populated when `prUrl` or `prNumber` exists |
| Deploy scope | `Before deploy` during before-deploy-only walk; `After deploy` post-merge walk; `—` otherwise |
| Review row | Pre-PR: `outputs.prePrReviewRecommendation`; during PR: `prReviewStatus` + GitHub `reviewState` when known |

**Mandatory gates (this skill):**

| Gate | Section |
|------|---------|
| Repo rules reconciliation | [Repo rules reconciliation gate](#repo-rules-reconciliation-gate) |
| Ship cut-point | [Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy) |
| Before deploy walk | [Before deploy deploy-walk handoff](#before-deploy-deploy-walk-handoff) |
| Pre-PR handback | [Pre-PR review handoff](#pre-pr-review-handoff) |
| PR opened | [Post-create-pr handoff gate](#post-create-pr-handoff-gate) |
| Post-merge cleanup modal | [Post-merge workspace cleanup](#post-merge-workspace-cleanup) |
| After deploy walk | [After deploy deploy-walk handoff](#after-deploy-deploy-walk-handoff) |
| Implementation continuation | [Implementation continuation gate](#implementation-continuation-gate) |

Inline **`deploy-walk`** and **`pr-review`** on this lane must include the same table per their skill contracts.

### Spawned lane — MCP structured choice (binding)

On spawned **`coding-session`** lanes, **in order to use the AskQuestion modal**, call **`mission_control_present_structured_choice`** for gates (MCP structured choice). Before the [Worktree-open gate](../skills/coding-session/SKILL.md#worktree-open-gate), [Worktree-open gate (pr-plan spawn handoff)](#worktree-open-gate-pr-plan-spawn-handoff), [Repo rules reconciliation gate](#repo-rules-reconciliation-gate), [Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy), [Review feedback approval gate](#review-feedback-approval-gate) (**non-Checkpoint / exception only**), [Create-PR handoff after go](#create-pr-handoff-after-go) (exceptional — when **`hasProposedFollowUps`**, **`actionablePrePrFindings`** with developer **`proceed-create-pr`**, or explicit defer/revise before PR), [Post-create-pr handoff gate](#post-create-pr-handoff-gate), and any turn that **awaits a developer pick** before the next **Act** — **unless** [Auto-authorize implementation (pr-plan spawn)](../skills/coding-session/SKILL.md#auto-authorize-implementation-pr-plan-spawn) or [Auto-spawn pre-pr-review](#auto-spawn-pre-pr-review) / [Inline create-pr (auto on clean go)](#inline-create-pr-auto-on-clean-go) / Checkpoint [auto-advance `fix-now-session`](#checkpoint--auto-advance-fix-now-session-binding) / Checkpoint [auto-advance `approve-followups-create-pr`](#checkpoint--auto-advance-approve-followups-create-pr-binding) / [Post-merge workspace cleanup](#post-merge-workspace-cleanup) auto-advance applies (no modal; proceed):

1. **Self-check:** call **`mission_control_present_structured_choice`** with recap in **`displayMarkdown`** — **no** recap-only prose without the MCP call.
2. Put required recap lines in **`displayMarkdown`** only (see pr-plan spawn handoff recap below).
3. Copy-paste template for pr-plan spawn **worktree-open** gate (replace `<recap>` when validation adds a line):

```json
{
  "displayMarkdown": "<recap>",
  "askQuestion": {
    "modalTitle": "Coding session — start implementation",
    "questions": [
      {
        "id": "worktree-open",
        "prompt": "Authorize worktree and implementation on this lane?",
        "allowMultiple": false,
        "options": [
          {
            "id": "continue-fill-5-8",
            "label": "Continue — fill §§5–8 while implementing"
          },
          {
            "id": "revise-plan",
            "label": "Revise PR plan first"
          },
          {
            "id": "change-repo",
            "label": "Change repo or worktree settings"
          },
          {
            "id": "defer",
            "label": "Defer implementation"
          },
          {
            "id": "more-details",
            "label": "More details for option _"
          }
        ]
      }
    ]
  }
}
```

Default **`<recap>`** for pr-plan spawn: *Planning handoff complete (§§1–4). §§5–8 fill on this lane during implementation.*

### Prose-only ship handoff forbidden (binding)

On spawned **`coding-session`** lanes, Mission Control opens the AskQuestion UI only when **StreamFinal** parses the **AskQuestion tool** or a valid **`mission_control_present_structured_choice`** call per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc). Resolve host parser module names from the **active hosting repo** overlay (for example **`.cursor/rules/dot-sedea.mdc`**) — do not embed product source paths in center assets. Prose menus do **not** open a modal.

**Forbidden** when any ship gate awaits a developer pick (cut-point, review feedback, exceptional create-PR, post-create-PR, or § *Every developer-await turn*):

| Anti-pattern | Why it fails |
|--------------|--------------|
| *Stay advisory until you pick …* / *I'll wait until you …* | Prose handoff — conduct **1** § *No idle handoff*; rule **2** § *Turn completion invariant* |
| *Pick Ship cut-point* / *tell me to push* without **`mission_control_present_structured_choice`** | User cannot click options — same |
| *PR created* / PR URL only — *review on GitHub* without post-create-pr **`mission_control_present_structured_choice`** | Same — § [Post-create-pr handoff gate](#post-create-pr-handoff-gate) step **7** |
| *Run these spot-checks, then reply with results* / *tell me when review is done* / *auto-advancing (no modal)* at a **developer-input** gate | § [Developer input vs external-wait (Checkpoint)](#developer-input-vs-external-wait-checkpoint) — manual deploy steps need **`deploy-walk`** [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding); PR-review resume needs post-create-pr or **`pr-review`** disposition gate |
| Recap + diff summary **without** MCP structured choice on the **same** turn | **No modal** — agent failure |
| Redirect cut-point to Squad Leader or another tab | § *Post-reload / cold session* — cut-point runs **on this lane** |

**Required instead:** call **`mission_control_present_structured_choice`** (recap in **`displayMarkdown`**; ship options in **`askQuestion`**) per the gate template for that step. During implementation with **no** open ship gate, use [Implementation continuation gate](#implementation-continuation-gate) — **not** rule **2** default options that include push or PR paths.

### Every developer-await turn (binding)

On spawned **`coding-session`** lanes, **any** assistant turn where the developer must **pick** before you **Act** (commit, push, spawn, `gh pr create`, edits, next ship step) **must** end with **`mission_control_present_structured_choice`** (or **AskQuestion** tool when available on the lane). This includes — not only ship cut-point:

| Await point | Modal section |
|-------------|----------------|
| Worktree / implementation | [Worktree-open gate](../skills/coding-session/SKILL.md#worktree-open-gate) |
| Implementation batch (no ship gate open) | [Implementation continuation gate](#implementation-continuation-gate) — **Checkpoint:** auto-advance **`ready-for-review`** when clean; modal only on exception |
| Plan §5 → `.mdc` reconcile (plan-anchored) | [Repo rules reconciliation gate](#repo-rules-reconciliation-gate) |
| Review-ready / commit / Before deploy | [Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy) — **Checkpoint:** auto-advance **`commit-only`** + **Act same turn** when clean; [Yield gate](#yield-gate-checkpoint--binding) if Act cannot continue; modal on exception |
| Before deploy manual step | § [Before deploy deploy-walk handoff](#before-deploy-deploy-walk-handoff) step 4 |
| Pre-PR findings | [Review feedback approval gate](#review-feedback-approval-gate) — **Checkpoint:** auto-advance **`fix-now-session`** **same turn** (no consent modal when Act continues) |
| Open PR (exceptional) | [Create-PR handoff after go](#create-pr-handoff-after-go) — **Checkpoint:** auto-advance **`approve-followups-create-pr`** when **`hasProposedFollowUps`** |
| **After `gh pr create` succeeds** | [Post-create-pr handoff gate](#post-create-pr-handoff-gate) — **Checkpoint:** **Gate** — emit post-create-pr **`mission_control_present_structured_choice`** same turn |
| **Waiting for PR review / merge resume** (developer returns after GitHub review or idle PR) | **`pr-review`** disposition gate — **Checkpoint:** PR review stop only |
| **After fix push — Step 5 pending** | Run **`pr-review`** Step 5 **same turn** as push — **Checkpoint:** auto-run; no post-create-pr or pre-merge modal until **`githubReconciliationStatus: complete`** |
| Waiting on child **`pre-pr-review`** | **Checkpoint:** spawn turn emits **`mission_control_spawn_agent` alone** per rule **4** § *Spawn-ack semantics* — **forbidden** parallel spawn + wait modal; **Gate** on the **next** turn — next-step resume **`mission_control_present_structured_choice`** before StreamFinal ([Yield gate](#yield-gate-checkpoint--binding) / #external-wait); auto-advance **Act** on child result same turn when possible per [Review result aggregation](#review-result-aggregation) |
| **After deploy manual §7 step** (inline **`deploy-walk`**) | **`deploy-walk`** [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding) — **same turn** as Step 4 presentation |

**Forbidden:** ending a turn with only a PR link, *PR created — review on GitHub*, *tell me when*, *reply with results*, or *pick … in chat* when a gate table exists for that await point. **Forbidden:** treating **developer-input** gates as **external-wait** — see § [Developer input vs external-wait (Checkpoint)](#developer-input-vs-external-wait-checkpoint).

### Post-reload / cold session (binding)

After Mission Control reload or window restart on **this** spawned **`coding-session`** lane:

1. **You are already on the coding-session child lane** — warm-up and post-restore preamble identify **spawned child**, not Squad Leader.
2. **Never** ask the developer to "switch to" or "continue in" the Coding session tab — they are messaging you here.
3. **[Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy)**, worktree-open, and every other gate in this skill run **on this lane** — call **`mission_control_present_structured_choice`** here; do **not** redirect ship cut-point to another tab or to the Squad Leader.
4. Re-read this SKILL.md and the prior transcript; resume from the last incomplete ship-chain step.
5. **Dispatch binding (binding):** When the preamble includes `[Mission Control — post-restore cold session]`, treat **`Active dispatch UUID`**, **`Bundle directory`**, and **`Your slot id`** in that preamble as authoritative scope. Read **`parent-child-registry.v1.json`**, **`dispatch-tab.v1.json`**, and **`dispatch-events.v1.ndjson` only under that bundle directory** — never under sibling dispatch folders.
6. **Forbidden cold-restore recovery:** `ls -lt` (or any mtime sort) across `.sedea/operations/**/dispatch/` to pick a dispatch; opening another tab's bundle because it is "newer"; mapping **PR N** without **`targetPlanSlug`** + the dispatch id stated in the preamble.
7. When spawn context JSON is missing from the preamble but dispatch binding is present, recover handover from **this dispatch's** registry (and `dispatch-events` for the matching `correlationId`) before running tools — do not improvise cross-dispatch scope.

## Checkpoint turn UX (skill-local)

Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps when this lane **continues Act on the same turn**; emit structured choice at **USER_CHECKPOINT** markers, implicit external-wait surfaces, exception paths, and every **Yield** (see [Yield gate](#yield-gate-checkpoint--binding)). **No cross-skill inheritance** — gate defaults here apply only to **`coding-session`**; other ship-chain skills document their own markers.

### Yield gate (Checkpoint — binding)

Under Checkpoint trust, **auto-advance may resolve a pick and Act on the same turn**. It must **not** end StreamFinal mid-ship with recap / `partial` only and rely on host continue-recovery.

**Yield** = this assistant turn will StreamFinal **without** further Act (tool use, edits, spawn, or git writes) on the **same** turn while ship work remains open:

- `continuationStatus: active`, **or**
- non-empty `remainingTasks`, **or**
- dirty worktree / uncommitted ship edits, **or**
- awaiting a child result (`pre-pr-review` correlation in flight), **or**
- any hop documented as “Act on the **next** turn” after an implied Checkpoint pick

When **Yield** applies: **must** call **`mission_control_present_structured_choice`** (or AskQuestion) before StreamFinal — resume / continue Act / pause / **More details for option _** — treat as a gate surface even without a legacy `USER_CHECKPOINT` marker.

**Forbidden:** “Checkpoint auto-advance — Act next turn” prose-only StreamFinal; relying on `[Mission Control — continue recovery]` as the control plane for mid-ship hops.

**Still allowed without a Yield modal:** same-turn Act after auto-resolve (for example **`fix-now-session`** implement on the same turn as the child result; agent-executable **`deploy-walk`** steps that continue Act in-turn; clean continuous Act chains that do not StreamFinal mid-flight).

### Checkpoint three-stop model (binding)

On a **clean** Checkpoint ship chain (no eligibility failures, named defer/revise, executive override, or plan-change notify), the lane opens a **developer consent** turn-end modal at these surfaces (in addition to any [Yield gate](#yield-gate-checkpoint--binding) when StreamFinal would otherwise yield mid-ship):

| # | Surface | Normative gate |
|---|---------|----------------|
| **1** | **PR opened** — next ship action after inline **`create-pr`** | [Post-create-pr handoff gate](#post-create-pr-handoff-gate) on this lane |
| **2** | **PR review** — inline **`pr-review`** disposition (Step **3b** / Step **4**) after PR exists | **`pr-review/SKILL.md`** disposition gate on this lane |
| **3** | **Manual deploy verification** — §7 Production Deploy Steps the agent cannot execute | **`deploy-walk`** [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding) for **`### Before deploy`** and **`### After deploy`** manual steps |

**Auto-advance under Checkpoint (not consent-modal stops — standard ship operations when Act continues same turn):** worktree-open when [Auto-authorize](../skills/coding-session/SKILL.md#auto-authorize-implementation-pr-plan-spawn) applies; implementation continuation; repo rules reconciliation; ship cut-point (**Act same turn** — see [Yield gate](#yield-gate-checkpoint--binding) if Act cannot continue); agent-executable Before deploy **`deploy-walk`** steps; **`pre-pr-review`** child **result** handback when Act continues same turn (**spawn turn** emits spawn alone per rule **4** — Yield / #external-wait resume modal on the **next** turn, not batched with spawn); pre-PR findings with **`flags`** / Must / Should (**`fix-now-session`** **same turn** — **no** review-feedback consent modal; append **`proposedFollowUps`** to plan when present); inline **`create-pr`** on clean **`go`** (including **`create-pr`** [Checkpoint — auto-advance `authorize-create-pr`](../create-pr/SKILL.md#checkpoint--auto-advance-authorize-create-pr-binding) — **forbidden:** *Create the pull request now?* consent modal); create-PR when **`hasProposedFollowUps`** only (**`approve-followups-create-pr`** **same turn** — append + open PR); **`rebase-onto-main-and-resolve-conflicts`** (fetch, rebase onto **`origin/main`**, resolve conflicts, **`--force-with-lease`** push) including Checkpoint auto-rebase when behind main; failing CI remediation; post-fix push + **`pr-review`** Step 5; pre-merge when **`mergeDelegationReady`** (**`approve-merge-pr`**); post-merge cleanup and After deploy agent-executable steps; **`deploy-walk`** [Checkpoint — auto-advance `approve-deploy-closure`](../deploy-walk/SKILL.md#checkpoint--auto-advance-approve-deploy-closure-binding) when After deploy is fully satisfied (**forbidden:** *approve deploy checklist closure?* modal on clean path); inline **`plan-reconcile`** [Checkpoint — auto-advance `approve-reconcile-mutations`](../plan-reconcile/SKILL.md#checkpoint--auto-advance-approve-reconcile-mutations-binding), [Checkpoint — auto-advance own-plan archive](../plan-reconcile/SKILL.md#checkpoint--auto-advance-own-plan-archive-binding), and [Checkpoint — auto-advance `confirm-inline-closure`](../plan-reconcile/SKILL.md#checkpoint--auto-advance-confirm-inline-closure-binding) when clean (**forbidden:** *approve PR-tracked reconcile mutations?*, multi-plan *pick plans to archive?*, and *confirm plan-reconcile inline closure?* on the clean own-plan path).

**Not exceptions (binding):** pre-PR review **`flags`**, PR comment fix loops, **`rebase-onto-main-and-resolve-conflicts`** conflict resolution (included in the pick — **forbidden** *you resolve conflicts* / recap-only stops), failing CI fix paths, and post-create-pr rebase push — run as **standard operations** without an extra coding-session modal between steps **except** [Post-create-pr handoff gate](#post-create-pr-handoff-gate) stop **1** and **`pr-review`** disposition stop **2**. **Rebase-onto-main obligation (binding):** **`rebase-onto-main-and-resolve-conflicts`** and Checkpoint auto-rebase when behind **`origin/main`** include **full conflict resolution on this lane** — **forbidden** prose-only conflict recaps that halt the ship chain without editing conflicted files and running **`git rebase --continue`**. **PR review stop 2 waiver:** When Checkpoint auto-advances **`fix-ci-only`** (CI-only, zero Must/Should/review comments) per **`pr-review/SKILL.md`** § *Checkpoint — auto-advance disposition* and § *`fix-ci-only` same-turn loop*, disposition stop **2** does **not** re-open mid-loop — **forbidden** opening Step **4** disposition between pushes until green, defer, or scope dispute. **Forbidden:** prose-only *Next: inline pr-review* / PR URL recap without post-create-pr **`mission_control_present_structured_choice`** on the **`create-pr`** completion turn — that gate is the resume surface for PR handling, not external-wait.

**Real-dispatch test loop (binding):** After merge, run one full **`coding-session`** spawn on a Checkpoint dispatch through the worktree-open gate (or auto-authorize path when eligible) and collect a developer verdict before the parent phase advances **`pre-pr-review`** PR 2 — per **Ship-chain skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path protocol steps may auto-advance when this lane continues Act on the same turn**. Call **`mission_control_present_structured_choice`** or **AskQuestion** at **USER_CHECKPOINT** markers in this skill, **implicit external-wait** surfaces that end the turn before the child/host delivery, **exception** paths, and every [Yield gate](#yield-gate-checkpoint--binding) StreamFinal.

**Developer-input** (continuation requires the **developer** to pick a modal option or structured choice on **this lane**) is **not** external-wait. Under **non-Checkpoint** trust, these USER_CHECKPOINT surfaces **must** close the turn with **`mission_control_present_structured_choice`** / **AskQuestion**. Under **Checkpoint** trust, rows marked **Checkpoint gate** require a modal; same-turn Act auto-advance remains per [Checkpoint three-stop model](#checkpoint-three-stop-model-binding) — **forbidden:** StreamFinal mid-ship without a modal when [Yield gate](#yield-gate-checkpoint--binding) applies.

| Situation | Normative gate | Checkpoint |
|-----------|----------------|------------|
| PR opened — next ship action (review, merge check, defer) | [Post-create-pr handoff gate](#post-create-pr-handoff-gate) | **Checkpoint gate** — post-create-pr stop **1** |
| Developer submits own GitHub review — resume triage | [Manual review submission (developer-input)](#manual-review-submission-developer-input) | Auto-advance **`start-pr-review-delegate-merge`** when triage was requested |
| Inline **`pr-review`** — triage disposition / fix scope | **`pr-review`** Step **3b** / Step **4** disposition gates | **Checkpoint gate** — PR review stop **2**; **waived** during CI-only **`fix-ci-only` auto-advance loop** until defer or scope dispute |
| Before / After deploy — manual §7 verification | **`deploy-walk`** [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding) | **Checkpoint gate** — deploy manual stop |
| After deploy checklist fully satisfied — Status `deployed → done` | **`deploy-walk`** [Deploy closure approval gate](../deploy-walk/SKILL.md#deploy-closure-approval-gate-binding) | Auto-advance **`approve-deploy-closure`** **same turn** — **no** modal on clean path |
| Pre-PR findings after child returns | [Review feedback approval gate](#review-feedback-approval-gate) | Auto-advance **`fix-now-session`** **same turn** — **no** `USER_CHECKPOINT` / modal on clean path |
| Agent-delegated merge when clean | [Pre-merge authorization gate](#pre-merge-authorization-gate) | Auto-advance **`approve-merge-pr`** when **`mergeDelegationReady`** |
| Parent plan-change notify UserSend | [Plan-change notification receive (child lane)](../skills/coding-session/SKILL.md#plan-change-notification-receive-child-lane) | **Checkpoint gate** (exception to three-stop when notify arrives mid-ship) |

**Implicit external-wait** (host or async event may resume the lane **without** a developer modal pick on that turn): host-delivered **`mission_control_send_agent_result`** from spawned **`pre-pr-review`** may arrive later — on the **next** turn after the spawn-only turn (per rule **4** § *Spawn-ack semantics*), open the **next-step resume** structured choice (**Yield** / #external-wait) before StreamFinal — **forbidden** to batch that modal with **`mission_control_spawn_agent`** on the spawn turn. Squad Leader **`#external-wait`** resume per mission `plan.mdc` — same split-turn rule. **Forbidden:** classifying *waiting for the developer to review the PR on GitHub and return* as external-wait — GitHub reviewers are external; **lane continuation** is developer-input via the gates above. **Forbidden:** ending a **`pre-pr-review`** spawn turn with prose-only *waiting for child*, false *spawned child* narration from **`transcriptOnly`** ack, or a resume modal on the **same** turn as spawn.

**Checkpoint auto-advance does not apply** when a row in § *Every developer-await turn* names a gate and no clean auto-advance criterion in the Checkpoint table passes — including **manual After deploy** presentation: auto-advance stops **at** presentation; the **same turn** must emit **`deploy-walk`** Manual step await gate.

**Checkpoint three-stop model exception (binding):** [Batch ship (Checkpoint — binding)](../skills/coding-session/SKILL.md#batch-ship-checkpoint--binding) **does not** open stops **1–2** when **`openPrBatch.length > 1`** — **`approve-ship-batch`** per [`.sedea/centers/sedea/docs/batch-ship-checkpoint-profile.md`](.sedea/centers/sedea/docs/batch-ship-checkpoint-profile.md); stop **3** (manual deploy) unchanged. Release-note fragment ship is owned by **`ship-release-note-fragment`** (inline from **`capture-release-note`**) — not **`coding-session`**.

### Batch ship (Checkpoint — binding)

When **`openPrBatch.length > 1`**, use **`approve-ship-batch`** instead of per-PR post-create-pr (stop **1**) and per-PR **`pr-review`** disposition (stop **2**). Normative contract: [`.sedea/centers/sedea/docs/batch-ship-checkpoint-profile.md`](.sedea/centers/sedea/docs/batch-ship-checkpoint-profile.md). Skill detail: [`coding-session/SKILL.md`](../skills/coding-session/SKILL.md) § *Batch ship*.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **Pre-worktree validation** — `plan-ws-completeness.mjs` | Auto-advance — record `planCompleteness`; route in worktree-open or auto-authorize | — |
| **Auto-authorize** — pr-plan / phase-planner spawn handoff | Auto-advance when [eligibility](../skills/coding-session/SKILL.md#auto-authorize-implementation-pr-plan-spawn) passes — skip worktree-open modal | exception: eligibility fails → worktree-open gate |
| **Worktree-open gate** | **Gate** when layer 2 modal required — **first developer-pick gate on spawned lane** | Authorize worktree (below) |
| **Generic flow** steps **1–4** — setup, sidecar, attach, bootstrap | Auto-advance on happy path | exception: bootstrap / attach failure |
| **Spawned implementation** steps **5–6** | Auto-advance through implementation batches | exception: blocking stop → `partial` result |
| **Implementation continuation gate** | **Auto-advance** — resolve **`ready-for-review`** when [clean implementation](#implementation-continuation-gate) criteria pass | **Gate** when any clean criterion fails — [Implementation continuation gate](#implementation-continuation-gate) |
| **Repo rules reconciliation** + **pre-review verification** (steps **7–8**) | Auto-advance on happy path before ship cut-point | exception: action bullets without `.mdc` diff; verification failures — [Repo rules reconciliation gate](#repo-rules-reconciliation-gate) |
| **Ship cut-point gate** | **Auto-advance** — resolve **`commit-only`** and **Act same turn** (full path: commit + inline Before deploy **`deploy-walk`** when plan-anchored) when [clean cut-point](#ship-cut-point-gate-approve-commit-before-deploy) criteria pass; if Act cannot continue this turn → [Yield gate](#yield-gate-checkpoint--binding) | **Gate** when any clean criterion fails — [Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy) |
| **Pre-PR review feedback** | **Auto-advance** — **`fix-now-session`** **same turn** when **`actionablePrePrFindings`** (implement Must + Should; append follow-ups to plan); after clean **`go`**, [Submodule merge gate (before create-pr)](#submodule-merge-gate-before-create-pr) then inline **`create-pr`** without findings; **`approve-followups-create-pr`** **same turn** when **`hasProposedFollowUps`** only | Exception: developer **`defer`** / **`revise-scope`** in **same** message — [Review feedback approval gate](#review-feedback-approval-gate) Non-Checkpoint modal only |
| **Submodule merge gate (before create-pr)** | **Auto-advance** when source on center **`defaultBranch`** and inline **`promote-submodule-pin`** succeeds for every affected gitlink (including built-in **`sedea`**) | **Gate** when source not on **`defaultBranch`**, promote hard stop, or ambiguous scope |
| **Pre-merge ship** (after post-create-pr pick → **`pr-review`** or direct **`approve-merge-pr`** → merge delegation) | **Auto-advance** — rebase push **`--force-with-lease`**; pre-merge → **`approve-merge-pr`** when **`mergeDelegationReady`** | **Checkpoint gate** at **`pr-review`** disposition only; exception: merge blockers after inspect — [Pre-merge authorization gate](#pre-merge-authorization-gate) |
| **Post-create-pr handoff** | **Gate** — emit post-create-pr **`mission_control_present_structured_choice`** same turn as inline **`create-pr`** completion | [Post-create-pr handoff gate](#post-create-pr-handoff-gate) — **Checkpoint** stop **1** |
| **Post-merge tail** (cleanup → promote-pin hint → After deploy walk entry) | **Auto-advance** — no turn-end modal between PR merge and first After deploy manual step | exception: cleanup partial / merge unconfirmed / promote-pin hard failure |
| **After deploy deploy-walk** — manual §7 steps (Production Deploy Steps) | **Gate** — **sole** USER_CHECKPOINT surface **after PR merge** on this lane | [`deploy-walk` Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding) |
| **Post-after-deploy tail** (plan-reconcile → **`prShipComplete`**) | **Auto-advance** — run remainder inventory without batch modal when clean | exception: reconcile flags requiring developer picks |
| **Plan-change notification receive** | **Gate** — developer-input USER_CHECKPOINT after mandatory re-read | [Plan-change notification receive (child lane)](../skills/coding-session/SKILL.md#plan-change-notification-receive-child-lane) — **not** external-wait |

**Skip worktree-open modal (binding):** When [Auto-authorize implementation (pr-plan spawn)](../skills/coding-session/SKILL.md#auto-authorize-implementation-pr-plan-spawn) applies, layer 2 is satisfied without opening [Worktree-open gate](../skills/coding-session/SKILL.md#worktree-open-gate) — not a regression for this calibration.

### Post-merge Checkpoint chain (binding)

Under Checkpoint trust, after **`outputs.prState: merged`** (or merge confirmed on **`check-pr-status`** / delegate-merge path), **one continuous same-turn auto-advance chain** runs before any turn-end modal — **except** when [After deploy deploy-walk handoff](#after-deploy-deploy-walk-handoff) reaches a **manual** §7 step and **`deploy-walk`** opens its [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding).

**Auto-advance order (happy path — no turn-end modal between steps):**

0. When **`outputs.prNumber`** is known, run [Post-merge ship mechanics script](../docs/coding-session-ship-chain.md#post-merge-ship-mechanics-script-binding) with **`--apply`** after merge consent on this chain; merge JSON into `outputs` before cleanup.
1. [Post-merge workspace cleanup](#post-merge-workspace-cleanup) **`--apply`** when ownership preconditions pass.
2. Inline **`promote-submodule-pin`** when cleanup JSON **`nextAction: promote-pin-required`** (agent-owned handoff — no spawn, no modal per that skill). **Default on for every hosting-repo submodule** — including built-in **`sedea`** — per [`.sedea/centers/sedea/skills/promote-submodule-pin/SKILL.md`](.sedea/centers/sedea/skills/promote-submodule-pin/SKILL.md). **Forbidden:** treating built-in **`sedea`** as **`skipped` / `not-applicable`** without running the skill when drift or cleanup hint applies.
3. [After deploy deploy-walk handoff](#after-deploy-deploy-walk-handoff) — inline **`deploy-walk`** for **`### After deploy`** only.
4. When **`deployStatus: done`** and **`deployTodoStatus: done`**, auto-run [Post–After deploy remainder inventory](#post-after-deploy-remainder-inventory) steps (**`plan-reconcile`** then **`pr-ship-complete`**) without [Post–After deploy remainder authorization](#post-after-deploy-remainder-authorization) batch modal when reconcile requires no developer picks.

**Manual step presentation (binding):** When step **3** inline **`deploy-walk`** presents a **manual** After deploy step (Step 4 presentation), **same assistant turn** must close with **`deploy-walk`** [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding). **Forbidden:** listing unchecked After deploy steps in recap and ending with *reply with results*, *run these spot-checks then tell me*, or *auto-advancing (no modal)* — that gate is the **allowed** USER_CHECKPOINT after merge, not an optional extra modal.

**Forbidden turn-end modals after PR merge (Checkpoint — binding):**

| Forbidden | Includes |
|-----------|----------|
| Re-open [Post-create-pr handoff gate](#post-create-pr-handoff-gate) | *PR merged — what's next?*, **`spawn-after-deploy-walk`** pick substitutes, standalone After deploy recap before **`deploy-walk`** presents step 1 |
| Standalone After deploy step modal | Recap + **`mission_control_present_structured_choice`** that mirrors §7 step text **before** inline **`deploy-walk`** runs — manual gates come **only** from **`deploy-walk`** Step 4 / Manual step await |
| [Post-merge workspace cleanup](#post-merge-workspace-cleanup) authorization | Default auto-apply path — exceptional modal only per that section |
| [Post–After deploy remainder authorization](#post-after-deploy-remainder-authorization) | Batch or per-step remainder modals on clean happy path |
| **`approve-deploy-closure`** as a separate coding-session modal | Defer to **`deploy-walk`** [Checkpoint — auto-advance `approve-deploy-closure`](../deploy-walk/SKILL.md#checkpoint--auto-advance-approve-deploy-closure-binding) — **forbidden:** *approve deploy checklist closure?* on this lane |
| **`approve-reconcile-mutations`** / multi-plan archive pick as coding-session modals | Defer to **`plan-reconcile`** [Checkpoint — auto-advance `approve-reconcile-mutations`](../plan-reconcile/SKILL.md#checkpoint--auto-advance-approve-reconcile-mutations-binding) and [own-plan archive](../plan-reconcile/SKILL.md#checkpoint--auto-advance-own-plan-archive-binding) — **forbidden:** *approve PR-tracked reconcile mutations?* and *pick plans to archive…* multi-select on the clean Checkpoint path |
| **`confirm-inline-closure`** as a separate coding-session or reconcile modal on clean handback | Defer to **`plan-reconcile`** [Checkpoint — auto-advance `confirm-inline-closure`](../plan-reconcile/SKILL.md#checkpoint--auto-advance-confirm-inline-closure-binding) — **forbidden:** *confirm plan-reconcile inline closure?* on clean path |

**Allowed USER_CHECKPOINT after merge:** **`deploy-walk`** [Manual step await gate](../deploy-walk/SKILL.md#manual-step-await-gate-binding) for **`### After deploy`** manual steps only (Production Deploy Steps).

**Exception paths (modal OK):** post-merge cleanup partial failure; **`promote-submodule-pin`** hard stop for any eligible center (including built-in **`sedea`**); **`deploy-walk`** block/skip paths; plan-reconcile inventory requiring explicit picks (flagged archive, follow-ups triage when unchecked bullets remain, Non-Checkpoint / exception reconcile gates); **`return-to-implementation-new-worktree`** from deploy manual gate.

### Repo rules reconciliation gate

**When required:** Plan-anchored run with at least one **action** or **verify-only** §5 bullet (not `_None_` only). Open **immediately before** [Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy) — **standalone** modal, not combined with cut-point options.

**Precondition:** Implementation ready for developer review; step **7** procedure complete or honestly skipped.

USER_CHECKPOINT — approve §5 repo rules reconciliation before ship cut-point on this lane. defaultOptionId: reconcile-approved

Call **`mission_control_present_structured_choice`** (`modalTitle`: *Coding session — repo rules reconciliation*). Recap must include [Session orientation table (binding)](coding-session-checkpoint-ux.md#session-orientation-table-binding) as first block, then:

- Each §5 bullet with classification (action / verify-only)
- Matching **`.mdc` diff** path or verify-only attestation
- `outputs.reconciledRepoRulesPaths` when populated

| Option id | Label (brief) | Agent action |
|-----------|---------------|--------------|
| `reconcile-approved` | Reconcile approved — open ship cut-point | Set `outputs.repoRulesReconciliationStatus: complete`; open [Ship cut-point gate](#ship-cut-point-gate-approve-commit-before-deploy) on **next** turn |
| `revise-rules` | Revise `.mdc` or §5 first | Return to step **7** procedure |
| `more-changes` | More implementation changes first | Return to [Spawned implementation lane](../skills/coding-session/SKILL.md#spawned-implementation-lane) step **5** |
| `defer` | Defer ship chain | Keep `continuationStatus: active` |
| `more-details` | More details for option _ | Elaborate; re-ask |

**Block opening ship cut-point** when any **action** bullet lacks a worktree **`.mdc` diff** and §5 was not revised — offer **`revise-rules`** / **`more-changes`** only.

**Spawned lane — MCP structured choice (binding):** Same turn ends with **`mission_control_present_structured_choice`**; recap in **`displayMarkdown`** only.
