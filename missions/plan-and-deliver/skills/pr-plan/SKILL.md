---
name: pr-plan
description: >-
 Populate a PR plan body: draft §§ 1–4 (Single concern, Background, Change scope,
 Reasoning) per Sedea's New Feature Development Process per-PR template. Mirrors
 **phase-planner** for mode #3: scope from parent's `### PR list` item N, grounds § 4
 in parent's `### Single-concern strategy` + `### Sequencing`, scopes § 3 from the
 parent's changes. §§ 5–8 and deploy scaffolding stay `_TBD_` for **coding-session**
 (and follow-up turns). Appends canonical `deploy-test-plan-verified` todo per
 development-process.md. Target resolved per planning-target-resolution. Use under
 mission dispatch, **pr-plan** protocol branch, natural language, or after **new-plan**
 ignition on a `PR breakdown` child stub.
designation:
  allowed: Populate PR plan §§1–4; spawn coding-session handoff after §5c approval
  forbidden: Application implementation; worktree ship on planning lane; fill §§5–8 here
inputs:
  targetPlanPath:
    type: string
    description: Path to the PR plan stub to populate.
    required: true
  targetPlanSlug:
    type: string
    description: Slug for the PR plan stub.
    required: true
  parentPlanPath:
    type: string
    description: Path to the parent plan containing the PR list row.
    required: true
  parentPlanSlug:
    type: string
    description: Slug for the parent plan.
    required: true
  parentIndex:
    type: number
    description: One-based PR list index that produced this child.
    required: true
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from the upstream agent.
    required: false
  upstreamSkill:
    type: string
    description: Skill that requested this PR plan population, usually new-plan.
    required: false
  parentAgentRole:
    type: string
    description: When new-plan-agent, report Completion (inline) to the invoker instead of mission_control_send_agent_result.
    required: false
  autoContinue:
    type: boolean
    description: Legacy spawn hint only — does not skip §5c handoff or §5d spawn. When true, still run Step 5 through §5c (and §5d when the developer picks Start coding session).
    required: false
    default: true
  parentRowSingleConcern:
    type: string
    description: PR description seed from parent ### PR list item N Single concern sub-bullet; copy verbatim to ## 1. Single concern.
    required: false
  skipPrPlanHandoffModal:
    type: boolean
    description: When true (pr-breakdown approve-list auto-chain, or debug-and-fix code-promotion cascade), skip §5c modal after §§1–4; auto-run §5d when debugExitConfirmed; report inline completion with prPlanHandoffSkipped when §5d is not auto-run.
    required: false
    default: false
  debugExitConfirmed:
    type: boolean
    description: When true with upstreamSkill debug-and-fix, debug child step 7 code-promotion confirmation satisfies §5c layer-1 consent — auto-run §5d after §5a.
    required: false
    default: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/pr-plan/SKILL.md"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
---

# PR plan: §§ 1–4 from the parent plan

**Normative execution (plan and deliver):** **Inline only** on the invoker lane — **`new-plan`** step 4 with **`parentAgentRole: "new-plan-agent"`**. Report **`## Completion (inline)`**; do **not** emit **`mission_control_send_agent_result`** for **`pr-plan`**. **Exception:** §5d may emit **`mission_control_spawn_agent`** for **`coding-session`** on a **new** child lane. A standalone spawned **`pr-plan`** child is non-default. See **`../README.md`** § *Normative execution mode*.

This skill drives the **per-PR planning move** under Sedea's New Feature Development Process: take a freshly-spawned PR plan stub (indexed child from the parent's **`### PR list`** under **`PR breakdown`**, typically right after the **`new-plan`** protocol branch) and populate §§ **1–4** of the **per-PR template** — Single concern, Background, Change scope, Reasoning. §§ **5–8** and the § 7 deploy scaffold stay **`_TBD_`** for **`coding-session`** and later turns unless the **developer** explicitly asks for a **fill** sketch here.

The agent has enough context after step 3 to draft §§ 1–4 from the parent's **`### PR list`** row, **`### Single-concern strategy`**, **`### Sequencing`**, and earlier parent sections (diagrams / changes as *context* — PR plans do **not** embed parent diagrams in the body). § 4 is consumed by **a coding agent** (PR description) and **pre-pr-review** / **a reviewer agent**; keep sentences unambiguous. This skill reports planning readiness; **worktrees and ship execution** belong to **`coding-session`** on a **separate** lane.

The procedure below is a hard contract — do **not** skip steps or start drafting before the target is verified as a PR plan stub.

**Worktree removal ownership (binding).** This skill populates plans only — **do not remove worktrees you do not own.** Worktree create/remove belongs to **`coding-session`** after §5d handoff. **`git worktree list` is read-only** unless rule **0** § *Worktree ownership* preconditions hold. See [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Worktree ownership*.

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Default warm-up*. Normative **inline** on invoker lane; manifest applies when standalone spawned or warm-up replay. Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. **384 KiB cap:** frontmatter omits **`plan.mdc`**, **`development-process.md`** — explicit **`Read`** at named protocol steps. **No `alwaysApply` frontmatter flip.**

### `bootstrapRules` — host-resolved (Software Development center layer)

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap (≤10 KB); host merges when `centerSlug === software-development` |

### `skillWarmUp` — frontmatter `warmUpRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Slim spawn contracts, terminal stop |
| `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` | Target resolution, depth-first gates |

**Omitted from frontmatter (384 KiB spawn cap — runtime `Read`):** `plan.mdc`, `development-process.md`, `planning-mode-templates.md` — load at named protocol steps.

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice, AskQuestion |
| `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` | Planning target resolution (role minimum) |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/pr-plan/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight M1–M9, definitive `laneRules` |

## Agent messaging (MCP)

**MCP spawn/result/notify skill.** Parent→child spawn, plan-change notify, and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*; operator checklists: **`../README.md`** § *MCP spawn preflight* and § *MCP notify preflight*.

| Action | MCP tool |
|--------|----------|
| Parent spawn (when this skill emits a child lane) | **`mission_control_spawn_agent`** |
| Parent plan-change notify (open **`coding-session`** child on this PR plan row) | **`mission_control_notify_child_lanes`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- `Read` **`docs/spawn-ship-contracts.md`** § *MCP notify preflight* (rows N1–N8) — then run notify preflight before every **`mission_control_notify_child_lanes`** call — cross-ref **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*.
- Inline skills on this mission stay **inline-only** — no spawn wire change unless the protocol step explicitly spawns a child lane.
- **Relevant Links (post-write):** After each Write/StrReplace that **creates or materially edits** this PR plan, call MCP **`mission_control_update_relevant_documents`** with the absolute plan path (`kind: plan`) — same turn preferred. **Skip** read-only loads and unchanged already-registered paths. Does **not** replace terminal `targetPlanPath` outputs. See **`../README.md`** § *Relevant Links — post-write registration*.

### Plan-change notify — emit-when (`mission_control_notify_child_lanes`)

After a **material** edit to this target PR plan §§ **1–4** (or § **5–8** sketch chosen on this lane) that affects the open **`coding-session`** child **or** reopens this **terminal** PR plan row, notify with a **separate** MCP call (one slug per call, v1). Normative protocol: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*.

| Emit when | Target child slugs (examples) | §5e alignment |
|-----------|------------------------------|---------------|
| Material §§1–4 / handoff sketch edit while **`coding-session`** is non-terminal for this **`targetPlanPath`** | Dispatch-unique **`coding-session-<targetPlanSlug>`** (or slug in **`activeLanes`**) | Notify **does not replace** §5e child terminal merge |
| Material edit while this **`pr-plan`** lane is **terminal** but parent adds PR scope on this plan path | Parent notifies **this lane's slug** (terminal wake) — **forbidden** duplicate **`pr-plan`** spawn | Receive § *Terminal wake* below |

**Material edit** includes: §1 single-concern scope change, §3 change-scope bullet adds/removes/rewrites, §4 reasoning that alters implementation constraints, §5–8 sketch edits after **`prefill-sections`**, and **add-PR-to-ship-complete-row** parent list edits.

**Forbidden:** empty or speculative **`targetSlugs`**; notify terminal **`coding-session`** children; notify instead of §5d spawn for **first-time** handoff; duplicate spawn when slug exists.

### MCP notify preflight (`mission_control_notify_child_lanes`)

| Step | Check |
|------|--------|
| N1 | Caller authority — **`pr-plan`** may notify the open **`coding-session`** child slug for **`inputs.targetPlanPath`** only |
| N2 | Required args present: **`summary`**, **`changeType`**, **`affectedPlanPaths`** (non-empty), **`targetSlugs`** (exactly one slug) |
| N3 | **Forbidden args absent** — no host-resolved identity keys, no **`notifyAllDescendants`** |
| N4 | **`targetSlugs`** contains exactly **one** dispatch-unique child slug per call |
| N5 | **`affectedPlanPaths`** includes this target PR plan (and parent plan when parent row context changed) |
| N6 | Multiple children → **separate MCP calls** (one slug per call, v1) — rare on this skill; default one **`coding-session`** child per PR plan |
| N7 | Notify open **`coding-session`** only when non-terminal; terminal **`pr-plan`** wake is **receive-only** on this lane from parent — omit terminal leaf slugs per rule **4** § *Leaf-lane omission* |
| N8 | **First-time** implementation handoff → **`mission_control_spawn_agent`** §5d — when slug exists → parent notifies, never duplicate spawn |

### Plan-change notification receive (child lane)

When Mission Control delivers **`Mission Control: plan-change-notification delivered.`** on a **standalone spawned **`pr-plan`** lane**, treat it as mid-population handoff — not skill terminal completion and not §5e child-result merge. **Inline under **`new-plan`****: the **invoker** lane owns notify receive per **`new-plan/SKILL.md`** / **`phase-planner/SKILL.md`** — do **not** duplicate receive handling on the inline populator turn.

**Intake (binding):**

1. Parse host envelope fields: **`summary`**, **`changeType`**, **`affectedPlanPaths`**, optional **`excerptPointers`**, **`requestedChildActions`**, **`initiatingContext`**.
2. **`Read`** each **`affectedPlanPaths`** entry in full before acting.
3. Compare to **`inputs.targetPlanPath`**, **`inputs.parentPlanPath`**, parent **`### PR list`** row **N**, and open **`coding-session`** child state — do **not** close the PR plan row solely because notify arrived.
4. Keep **`outputs.continuationStatus: active`** while §5c is not yet offered, a **`coding-session`** child is open, or blocking **`remainingTasks`** remain — on **terminal wake**, clear ship-complete flags when resuming PR scope expansion.

**Terminal wake (binding):** When this lane was terminal and notify intersects **`inputs.targetPlanPath`**, reactivate — **forbidden** parent duplicate spawn.

**Checkpoint vs external-wait (binding):** Notify delivery is **developer-input USER_CHECKPOINT** — **not** external-wait. Emit structured choice on the same turn after re-read; do **not** auto-advance to §5d spawn, §5e terminal merge, or **`mission_control_send_agent_result`** solely because notify arrived.

USER_CHECKPOINT — parent plan-change notification received on pr-plan child lane.

**Required options** (`modalTitle`: *PR plan — plan change notification*; list in this order):

| Option id | Label |
|-----------|--------|
| `add-pr-scope` | Add PR scope — resume PR plan after terminal wake |
| `acknowledge-only` | Acknowledge — continue PR plan work with updated context |
| `re-read-revise` | Re-read / revise affected PR or parent plan sections |
| `plan-reconcile` | Run inline **`plan-reconcile`** when authorized |
| `escalate-parent` | Escalate to **`phase-planner`**, **`master-planner`**, or Squad Leader |
| `stop-work` | Stop PR plan work (cancellation or developer-directed) |
| `more-details` | More details for option _ |

**Option semantics (binding):**

| Option | Act |
|--------|-----|
| **`add-pr-scope`** | Reactivate terminal lane: set **`continuationStatus: active`**; revise §§ or §5–8 sketch for added scope; re-offer §5c when ready — **re-emit updated** terminal when standalone spawned |
| **`acknowledge-only`** | Merge notify context into lane ledger; resume prior step — **no** terminal MCP result |
| **`re-read-revise`** | Update target PR plan §§ or spawn **`inputs`** when paths intersect — keep row open |
| **`plan-reconcile`** | Inline **`plan-reconcile`** per contract — merge ledger; **no** terminal result solely from notify |
| **`escalate-parent`** | Bubble summary upstream — **forbidden** **`mission_control_refocus_parent_lane`** solely from notify |
| **`stop-work`** | Pause PR plan population; **`partial`** only when genuinely blocked |

**Forbidden on notify delivery (binding):** Terminal **`mission_control_send_agent_result`** solely due to notification; **`mission_control_refocus_parent_lane`** solely due to notification; skipping **`affectedPlanPaths`** re-read; treating notify as §5e child terminal merge.

Normative protocol: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*; **`../README.md`** § *Child delivery checkpoint (receive)*.

## Handoff to `coding-session` (spawned child lane)

**`pr-plan`** and **`coding-session`** are **sequential skills on different lanes**. After planning handoff approval, **`pr-plan`** emits **`mission_control_spawn_agent`** for **`coding-session`**; the child owns worktrees, workspace attach, and **implements** the PR plan on that lane (default **spawned implementation lane** — see **`coding-session`** § *Execution mode after worktree attach*). When **`pr-plan`** runs **inline under `new-plan`**, §5d still spawns **`coding-session`** from the **`new-plan`** lane — only the **`pr-plan`** populator lane is eliminated.

| Concern | **`pr-plan`** (this skill) | **`coding-session`** |
|---------|---------------------------|----------------------|
| Per-PR §§ **1–4** | Draft and maintain | Read; revise only when the developer returns to planning |
| Per-PR §§ **5–8** | Default **`_TBD_`**; optional *speculative* sketch if the developer picks a fill option | Substantive fill during implementation; final text once code paths are known |
| `readyForImplementation` | Set in `outputs` and passed in spawn `inputs` | Read as layer-1 hint only |
| Worktrees, implementation, ship chain | Out of scope — spawn only | Owns (spawned-lane default) |
| Start **`coding-session`** | Step **5d** after **AskQuestion** **Start coding session** (§5c) when §5a passes | Spawned child lane with `planningHandoffMode` + `planningHandoffApproved`; layer 2 **auto-authorizes** when §§1–4 drafted (or plan complete) — no second worktree-open modal |

**Signals (canonical):** **`.sedea/centers/software-development/rules/30_planning-target-resolution.mdc`** § *Planning readiness vs ship* and § *Agent checklist (planning vs ship — do not conflate)* — `readyForImplementation` on this lane does **not** authorize code edits, worktrees, commit/push, or §8 `phase` past `not-started`.

**Detached entry still valid:** The developer may still start **`coding-session`** via a new Mission Control session, natural language, or snapshot per **development-process.md** § *Start implementation (`coding-session` entry)* — without a **`pr-plan`** spawn.

## Trigger

- Mission dispatch or explicit request to run the **`pr-plan`** protocol branch.
- Natural language: draft PR plan, populate PR plan body, fill per-PR §§ 1–4.
- Immediately after **`new-plan`** ignition when the parent dual-title is **`PR breakdown`** — the usual next step on the new child stub.

The **developer** picks the next move per **30_planning-target-resolution** § *Sedea input channel*.

## Checkpoint turn UX (skill-local)

### Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.


Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`pr-plan`**; other planning skills document their own markers.

**Real-dispatch test loop (binding):** After merge, run one full **`pr-plan`** spawn on a Checkpoint dispatch through §5c and collect a developer verdict before the parent phase advances the next **`pr-plan`** step PR — per **Planning protocol skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path protocol steps auto-advance without a turn-end modal**. Call **`mission_control_present_structured_choice`** or **AskQuestion** only at **USER_CHECKPOINT** markers in this skill, **implicit external-wait** surfaces (host-delivered child results), or **exception** paths.

**Developer-input** (continuation requires the **developer** to pick a modal option on **this lane**) is **not** external-wait. These are USER_CHECKPOINT surfaces — **must** close the turn with **`mission_control_present_structured_choice`** / **AskQuestion**, not prose *reply when ready*, *tell me when*, or recap-only idle:

| Situation | Normative gate |
|-----------|----------------|
| §5c — start coding session / revise / defer | [§5c — Hand back](#5c--hand-back-recap--structured-choice) |
| Step **5-open-items** — multiple readiness blockers before §5c | [Step 5-open-items — Open-item modal contract](#step-5-open-items--open-item-modal-contract) |
| Missing target / ambiguous parent row (standalone spawned) | Step **1** exception — structured choice per **30_planning-target-resolution** |
| Parent plan-change notify UserSend (standalone spawned lane) | [Plan-change notification receive (child lane)](#plan-change-notification-receive-child-lane) |

**Implicit external-wait** (host may deliver **`mission_control_send_agent_result`** from spawned **`coding-session`** without a developer modal pick on **that** turn): §5d spawn in flight → §5e child summary. **Forbidden:** classifying §5c handoff approval as external-wait — layer 1 consent requires the §5c modal (unless **`skipPrPlanHandoffModal: true`** auto-chain, including **`debugExitConfirmed: true`** debug code-promotion cascade).

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Identify target / verify stub | Auto-advance on spawned handoff with locked `inputs` | exception: wrong template / missing target → structured choice |
| **1a–1b** — Template + parent topology | Auto-advance on happy path | exception: blocked parent link |
| **2** — Load development-process | Auto-advance | — |
| **3** — Read parent / match PR row | Auto-advance when row match succeeds | exception: ambiguous row / no match |
| **4** — Draft §§1–4 | Auto-advance through write and **4f** echo | **Gate** when Step **5-open-items** applies (multiple gaps) |
| **5a–5b** — Readiness + planning completeness | Auto-advance when checks pass | — |
| **§5c** — Implementation handoff | **Gate** when §§1–4 drafted and §5a passes — **first developer-pick gate in this calibration PR** | Start coding session (below) — **auto-advance to §5d** when **`skipPrPlanHandoffModal: true`** **and** **`upstreamSkill: debug-and-fix`** **and** **`debugExitConfirmed: true`** |
| **§5d** — Spawn **`coding-session`** | Auto-advance act-after-select; **waiting** on child lane until §5e | external-wait — child terminal delivery; no prose-only *waiting for child* |
| **§5e** — Child summary | Auto-advance merge; re-offer §5c on failure paths | exception: **`prShipComplete: true`** defer paths |
| **Plan-change notification receive** | **Gate** — developer-input USER_CHECKPOINT after mandatory re-read | [Plan-change notification receive (child lane)](#plan-change-notification-receive-child-lane) — **not** external-wait |

**Skip §5c (binding):** When **`skipPrPlanHandoffModal: true`** (inline **`pr-breakdown`** **`approve-list`** auto-chain), after §5a passes run **`## Completion (inline)`** with **`prPlanHandoffSkipped: true`** — **do not** open §5c on **this** inline turn. **Not** a regression for this calibration.

**Skip §5c on debug code-promotion cascade (binding):** When **`skipPrPlanHandoffModal: true`** **and** **`upstreamSkill: debug-and-fix`** **and** **`debugExitConfirmed: true`**, after §5a passes **auto-run §5d** without opening §5c; set **`implementationHandoffStatus: spawned-coding-session`**. State one informational line: *Debug code-promotion confirmed on debug lane — auto-starting coding session.* **Forbidden:** opening §5c; treating debug cascade as defer/revise without explicit exception; reporting **`prPlanHandoffSkipped: true`** without emitting §5d when §5a passes.

## Step 1 — Identify the target plan and verify it's a PR plan stub

The skill operates on a **target** `.plan.md` resolved before this skill runs, per [`30_planning-target-resolution.mdc`](../../../../rules/30_planning-target-resolution.mdc) § *Resolution order*. Acknowledge the target slug in one line when this skill starts. Resolve targets from session, snapshot, or explicit path — **planning-target-resolution** is normative. Do **not** infer the target from the IDE’s focused-file list alone.

When spawned by `new-plan` with `parentAgentRole: "new-plan-agent"`, run **inline** on the **`new-plan`** lane: report **`## Completion (inline)`** to the invoker — do **not** emit **`mission_control_send_agent_result`**. You may still emit **`mission_control_spawn_agent`** for **`coding-session`** per §5d.

When spawned by `new-plan` without `parentAgentRole: "new-plan-agent"` (legacy standalone populator spawn), `targetPlanPath`, `targetPlanSlug`, `parentPlanPath`, `parentPlanSlug`, and `parentIndex` are already locked. Treat missing or conflicting values as a spawn-contract failure: stop with `failure` or `partial` and report the missing field. Do not fall back to IDE focus or free-form target discovery in spawned mode.

If there is no resolved target, **stop** and emit a fresh *Where we are now in the plan tree* snapshot with **`AskQuestion`** or **`mission_control_present_structured_choice`** in **one turn** per **30_planning-target-resolution** § *Sedea input channel* and **`../README.md`** § *Recap, structured choice, act* (`displayMarkdown` + `askQuestion`). **Obsolete:** recap-only turn without structured choice. Then continue.

Acknowledge in one line: *"Target plan: `<slug>`."*

### 1a — Verify the body's template state

Read the target plan in full and apply:

| Body state | Meaning | Action |
| --- | --- | --- |
| Has `## Overview` + `## Phasing` + `## Out of scope` (**new-plan** stub) | Fresh stub, drafting needed | Step 1b → Step 2 → Step 3 → Step 4 (full body rewrite) |
| Has `## 1. Single concern` … `## 4. Reasoning` with `_TBD_` under one or more of §§ 1–4 | Partially drafted | Step 1b → Step 2 → Step 3 → Step 4 (fill only still-`_TBD_` sections) |
| Has §§ 1–4 all populated | Already drafted | Step 5 (handoff menu) |
| Master Plan body (`## 4. Architectural design` + `## 6. Delivery phases \| PR breakdown`) | Wrong skill | **Stop:** use **`master-planner`**. |
| Phase plan body (`## 1. Background` … `## 4. Changes` for mode #2) | Wrong skill | **Stop:** use **`phase-planner`**. |

Acknowledge the body state in one line.

If the **new-plan** stub sections carry **non-stub user content**, merge it into § 2 / § 3 in your own words and **flag** that merge in the echo or handoff.

### 1b — Verify parent topology

Read the target plan's sidecar `<slug>.state.yaml` for `parent:`.

- `parent: null` (or sidecar missing) → **stop:** PR plans require a parent under **`PR breakdown`**. Fix via **`plan-reconcile`** or by hand, or use **`master-planner`** if this file should be a Master Plan.
- `parent:` does not resolve to an existing `.plan.md` under the same `.sedea/operations/.../plans/` tree → **stop:** fix sidecar before drafting.
- Parent is a **roadmap topic** grouping plan → **stop:** children should be Master Plans, not PR plans; fix sidecar or use **`master-planner`**.
- Parent resolves; read parent's dual-title block (`## 6. …` Master, `## 5. …` Phase):
 - Heading **`PR breakdown`** → proceed.
 - Heading **`Delivery phases`** → **stop:** use **`phase-planner`** on this file (phase child), not **`pr-plan`**.
 - Dual-title `Delivery phases | PR breakdown` still `_TBD_` → **stop:** run **`pr-breakdown`** (or **`delivery-phases`**) on the parent first.

Acknowledge: *"Parent: `<parent-slug>` (mode #3 **`PR breakdown`**); proceeding."*

If `parentPlanPath` / `parentPlanSlug` inputs were supplied, they must match the resolved sidecar parent and the parent file read here. If they conflict, stop with `failure`; the child was spawned against the wrong parent context.

## Step 2 — Load the development-process doc

Read `.sedea/centers/software-development/docs/development-process.md` with the Read tool, **no offset, no limit** (slim core). Then read `.sedea/centers/software-development/docs/planning-mode-templates.md` in full. Acknowledge: *"Loaded development-process core + planning-mode-templates; will follow § 3 per-PR template + § 6/§ 5 contents rule."*

Re-read every invocation; do not rely on session memory.

## Step 3 — Read the parent plan and find the PR row

Read the parent plan in full. Locate **`## 6. PR breakdown`** (Master parent) or **`## 5. PR breakdown`** (Phase parent). Inside: **`### Single-concern strategy`**, **`### Sequencing`**, **`### PR list`**.

### 3a — Match the target plan to a numbered item in `### PR list`

Match the target plan's `name:` to the **bolded slug** on a **`### PR list`** row. If spawned input includes `parentIndex`, inspect that exact item first and require it to match the target plan link or title; do not silently pick a different row.

1. Exact match.
2. Slug-normalised match (spaces ↔ `_` / `-`, case-insensitive where helpful).
3. Substring match only when 1–2 fail **and** one row clearly wins.

If ambiguous or no match, **stop**. In standalone mode, use **AskQuestion** so the **developer** picks item **N**, or they fix parent list / child `name:`. In spawned mode, return `partial` with `remainingTasks` naming the row/link mismatch; do not ask the developer from this child lane unless the upstream agent explicitly delegated that choice.

Capture **N**, the **Single concern** sub-bullet (proto-§ 1), and the **Plan** line (link or **`_TBD`** placeholder until **`new-plan`** / **`plan-reconcile`** wires it).

Verify that the captured **Plan** line links to this target plan after **`new-plan`** wiring. If it is still `_TBD`, points to another file, or is missing, continue drafting only if the body is otherwise valid, but report `parentPlanLinkStatus: "blocked"` and add a `remainingTasks` item for **`plan-reconcile`**. Do not report terminal readiness while the parent link is untrusted.

Acknowledge: *"Parent `### PR list` item N=<n>: \"<slug>\" — single concern captured."*

### 3b — Load `### Single-concern strategy` and `### Sequencing`

These ground § 4 **Why this approach** and **Considered & rejected**: split rationale, ordering vs sibling PRs, and explicit sequencing constraints.

### 3c — Load architectural / changes context

- **Master Plan parent:** § 4 Architectural design + § 5 Changes (including **`### Decomposition assessment`** when present).
- **Phase plan parent:** § 2 Scope + § 3 Code design + § 4 Changes.

Use diagrams and lists as **input** to prose; do **not** paste parent Mermaid into the PR plan body. § 3 Change scope stays short bullets only.

Acknowledge one line with what you loaded (diagram count, change bullet count).

## Step 4 — Draft §§ 1–4 into the target plan

### 4a — Write the body (fresh stub case)

When the body is the **new-plan** stub, replace the **entire body** in one `StrReplace` with the per-PR template through §§ 1–4 and **`_TBD_`** for §§ 5–8 (match **development-process.md** § 3 per-PR headings). Use this shape (fill `<…>` from steps 3–4b–4e; keep `**Status:** drafted` date from the agent clock):

````
old_string:
# <display name>

## Overview

<existing overview content>

## Phasing

<existing phasing stub>

## Out of scope

<existing out-of-scope stub>

new_string:
# <display name>

## 1. Single concern

<one sentence per § 4b>

## 2. Background

<2–3 sentences per § 4c>

## 3. Change scope

<short bullets per § 4d>

## 4. Reasoning

### Why this approach

<full sentences per § 4e>

### Considered & rejected

<_TBD_ or entries per § 4e>

## 5. Repo rules impact

_TBD_

## 6. Tests to write

_TBD_

## 7. Deploy test plan

**Status:** drafted *(<YYYY-MM-DD>: PR plan drafted.)*

### Before deploy

_TBD — numbered GFM task list (`1. [ ]` / `2. [ ]` / `3. [ ]`), not dashes, not bare numbers without checkboxes._

### After deploy

_TBD — numbered GFM task list (`1. [ ]` / `2. [ ]` / `3. [ ]`), not dashes, not bare numbers without checkboxes._

## 8. Caveats (optional)

_TBD_
````

Frontmatter **`name`**, **`overview`**, **`isProject`** stay as **`new-plan`** set them. If you ever edit a frontmatter scalar containing `: `, follow [`new-plan/SKILL.md`](../new-plan/SKILL.md) YAML quoting rules.

**Partial bodies:** one `StrReplace` per still-`_TBD_` §, anchored on section headers; do not wipe drafted text.

After the body first matches the per-PR template shape, run **§ 4a-bis** if `deploy-test-plan-verified` is not yet in frontmatter.

### 4b — § 1 Single concern

One sentence. When inline context or spawn **`inputs`** include **`parentRowSingleConcern`**, write **`## 1. Single concern`** to that string **verbatim** (trim outer whitespace only — **no** paraphrase, tighten, or rewrite). That field is the parent **`### PR list`** **Single concern** sub-bullet (PR description seed).

Otherwise: copy the parent's **Single concern** sub-bullet for item **N** without paraphrase when possible; only tighten when the source is ambiguous. Keep concrete, active voice, single purpose (Strategy #6).

### 4c — § 2 Background

Two or three sentences: prior state → gap or trigger → optional narrow context for **a reviewer agent**. Do **not** restate the whole feature; the parent file holds breadth.

### 4d — § 3 Change scope

Short bullets (**2–5 words** per bullet per dev-process). PR-scoped subset of parent's change list; split shared bullets across PRs; **flag** parent bullets that fit no PR boundary.

### 4e — § 4 Reasoning

Full sentences (not the short-bullet rule).

**### Why this approach** — two to four entries typical: cross-PR split rationale from **`### Single-concern strategy`**, sequencing from **`### Sequencing`**, structural choices from parent's design + this PR's slice.

**### Considered & rejected** — alternatives with why rejected; use parent text when present. If parent context has nothing honest, leave **`_TBD_`** and **flag** for **`coding-session`**.

### 4f — Echo to chat

Echo §§ 1–4 with the same headers as the file. Surface flags (unmapped parent bullets, **`_TBD_`** in **Considered & rejected**, thin reasoning) as numbered open items in **`displayMarkdown`** when multiple gaps exist before §5c; apply **Step 5-open-items — Open-item modal contract**. When only one minor flag exists, echo it in recap and proceed to §5a.

### 4a-bis — Append canonical `deploy-test-plan-verified` todo

After **4a** (full stub → per-PR template **or** first time the body is recognised as per-PR template with `## 7. Deploy test plan`), read frontmatter. If `id: deploy-test-plan-verified` already exists, **skip**.

Otherwise append this list item **immediately before** `isProject:` (indentation: two spaces before `-`, four before `id` / `content` / `status`, six before each `>-` continuation line — match sibling todos):

```yaml
 - id: deploy-test-plan-verified
 content: >-
 Mark done only when every Before-deploy and After-deploy step is checked
 (`[x]`) and the deploy section `**Status:**` reads `done` (walk via `deploy-walk`,
 or edit manually). Independent of PR merge; run inline `plan-reconcile` on the active
 `coding-session` lane while the dispatch is open when you want reconcile/archive after merges
 — not after dispatch resolution.
 status: pending
```

**Byte-identical** `content: >-` text must match **development-process.md** § *Frontmatter capstone todo (`deploy-test-plan-verified`)* — if that doc block changes, update this skill in the same change set.

**`StrReplace` anchor:** last existing todo's ` status: …` line + newline + `isProject:` → reinsert that status line + newline + the YAML block above + newline + `isProject:`. Append only; do not remove executor todos.

Echo: *"Inserted frontmatter todo `deploy-test-plan-verified` (per development-process.md)."*

### What not to draft here

Do **not** fully author §§ 5–8 as final text in the same turn as **4a** unless the **developer** explicitly chose a **fill** option in step 5 — those sections are usually best filled in **`coding-session`** once code paths exist. **`pre-pr-review`** treats missing or **`_TBD_`** § 5 / § 7 as hard problems and § 6 as under-documentation risk when the skill is run with strict gates — leaving **`_TBD_`** after **4a** is expected.

### §7 deploy fill contract (binding — `prefill-sections` and §5–8 sketch)

When the developer chooses **`prefill-sections`** or asks for a § 7 sketch on this lane, follow **planning-mode-templates.md** § mode #3 § 7 **What NOT to include** — especially **Ship-chain and mission-protocol steps**.

| Allowed in **`### Before deploy`** / **`### After deploy`** | **Forbidden** (ship chain — owned by **`coding-session`**) |
|---------------------------------------------------------------|--------------------------------------------------------------|
| PR-specific verification beyond standing CI and § 6 tests | `plan-reconcile`, archive PR plan, **`pr-ship-complete`** |
| Production smoke / monitor / rollback checks for **this change** | Pre-PR review, create PR, PR review, approve/merge PR |
| Submodule attestation when **this PR** changes a gitlink | Worktree setup, attach, cleanup; **`git pull origin main`** |
| After deploy author note: hosting gitlink promoted, **`HOSTING_ROOT`** refreshed, Reload Window before manual smoke (product gitlink ships) | **`promote-submodule-pin`** as a §7 checkbox — ship chain owns pin promotion |
| | **`promote-submodule-pin`**, dispatch resolution, generic protocol-step rows |

**`plan-reconcile` wording (binding):** **Forbidden** After deploy lines such as *Archive via plan-reconcile when dispatch closes* or *defer plan-reconcile to dispatch close*. Correct timing: inline on the **active `coding-session` lane while the dispatch is open**, before Squad Leader dispatch resolution — see **development-process.md** § *§7 Deploy test plan — ship-chain boundary*.

Mark § 7 sketches explicitly as *sketch* in echo; **`coding-session`** owns substantive fill and may revise steps once code paths are known.

## Step 5 — Resolve implementation readiness

After §§ 1–4 are drafted and the deploy capstone todo is present, compute readiness for implementation.

### 5a — Readiness checks

Set `readyForImplementation: true` only when all are true:

- Target body has populated §§ 1–4.
- `## 1. Single concern` is one clear concern.
- `## 3. Change scope` has at least one concrete PR-scoped bullet.
- `## 4. Reasoning` has **Why this approach** populated.
- Parent `### PR list` row is matched and the parent `Plan:` link points to this target plan.
- Frontmatter includes `deploy-test-plan-verified`.
- **Gitlink promotion scope (5a-gitlink-scope):** When §3 change-scope, parent row, or upstream Master Plan **`### Gitlink promotion scope`** implies gitlink checkout work, read upstream PRD / Master Plan for **Gitlink promotion scope**. When missing or `_TBD_`, set `readyForImplementation: false`, add blocking `remainingTasks`, and set `outputs.gitlinkPromotionScopeStatus: required`. When resolved, set `outputs.gitlinkPromotionScopeStatus: resolved` and record decision on PR plan §8 *Ship notes* when material. When no gitlink checkout in scope, set `outputs.gitlinkPromotionScopeStatus: not-applicable`.

Set `readyForImplementation: false` when any of those checks fail. Add each missing item to `remainingTasks`.

### 5b — Planning completeness

§§ 5–8 may remain `_TBD_` after this skill. That does **not** block **`readyForImplementation`** by itself — see **Handoff to `coding-session`** for the split between speculative sketches here and substantive §§ 5–8 work in **`coding-session`**.

**Two-layer readiness (do not conflate):**

| Layer | Where | What passes |
|-------|--------|-------------|
| **Planning handoff** | This skill → `outputs.readyForImplementation` | §§ 1–4 drafted, capstone todo, parent link (§5a). §§ 5–8 may stay `_TBD_`. |
| **Worktree gate** | **`coding-session`** § *Auto-authorize implementation (pr-plan spawn)* when §5d passes `planningHandoffApproved` | Per-PR body may keep §§ 5–8 `_TBD_`; child lane opens worktree and implements without a second approval modal. Detached entry without spawn still uses the worktree-open gate. |

`readyForImplementation: true` does **not** bypass **`plan-ws-completeness.mjs`** or authorize worktrees on **this** lane. The Squad Leader §8 ship ledger must keep `phase: not-started` until **`coding-session`** reports `developerApprovedImplementation: true` (**`.sedea/centers/software-development/missions/plan-and-deliver/plan.mdc`** §7–§8). After §5d spawn, **`INCOMPLETE`** + **`EXPECTED_SECTIONS_5_8_TBD`** is **expected** — the child **auto-authorizes** worktrees when §§1–4 are drafted (no second modal). Detached **`coding-session`** still uses the worktree-open gate.

However:

- If § 4 **Considered & rejected** is `_TBD_`, add a non-blocking `remainingTasks` note for `coding-session`.
- If parent link is blocked, keep `continuationStatus: "active"` until **`plan-reconcile`** repairs it or the upstream agent explicitly accepts the partial state.
- Do not run worktrees or implementation on this lane; spawn **`coding-session`** only per §5d.

**`autoContinue` (frontmatter / spawn `inputs`):** Does **not** authorize skipping Step **5**, §5c, or auto-spawning **`coding-session`**. After §§1–4 are written, **always** run §5a → §5c on this lane (inline under **`new-plan`** or standalone). **`autoContinue: true`** only means readiness may be reported in **`outputs`** — implementation handoff still requires §5c **Start coding session** (or explicit **`defer`**) before §5d.

**Skip §5c on PR-breakdown auto-chain (binding):** When **`skipPrPlanHandoffModal: true`** (inline context from **`new-plan`** after **`pr-breakdown`** **`approve-list`** auto-expand of PR index **1**) **without** **`debugExitConfirmed: true`**, after §5a passes run **`## Completion (inline)`** to the invoker with **`implementationHandoffStatus: not-offered`**, **`prPlanHandoffSkipped: true`**, and populated §§1–4 fields — **do not** open §5c on **this** inline **`pr-plan`** turn.

**Skip §5c on debug code-promotion cascade (binding):** When **`skipPrPlanHandoffModal: true`** **and** **`upstreamSkill: debug-and-fix`** **and** **`debugExitConfirmed: true`**, after §5a passes **auto-run §5d** — **do not** open §5c. Set **`planningHandoffApproved: true`** and **`implementationHandoffStatus: spawned-coding-session`** after §5d emit.

**`skipPrPlanHandoffModal` skips §5c on the inline pr-plan turn only** — it does **not** forbid **`mission_control_spawn_agent`** for **`coding-session`** from the invoker lane afterward.

| Invoker (`parentAgentRole`) | Who owns §5d-equivalent spawn or §5c re-entry |
|-----------------------------|-----------------------------------------------|
| **`new-plan-agent`** on **`master-planner`** lane | **This Master Plan child lane** owns §5c and §5d — inline **`pr-plan`** §5d **`mission_control_spawn_agent`** for **`coding-session`** emits from **the master-master-planner lane**, not the Squad Leader. **`master-planner`** Step **7b** may re-enter inline **`pr-plan`** §5c on the same **`targetPlanPath`**, or defer |
| **`new-plan-agent`** on **`phase-planner`** lane (`phase-planner-agent` subtree) | **`phase-planner/SKILL.md`** Step **5f** — offer spawn or **`reenter-pr-plan-5c`** on **that** child lane; **forbidden** to default to detached **`coding-session`** or **`master-planner`** prose redirect. **Decomposition** (inline **`pr-breakdown`** on **this phase plan**): Step **5b-decompose** on **`phase-planner`**, not **`master-planner`** Step **7**. |

When inline under **`phase-planner`**, include **`invokerRole: phase-planner-agent`** (or equivalent) in inline completion so the parent runs Step **5f** (implementation) or Step **5b-decompose** / **5e** (decomposition merge) without inferring from README shorthand alone.

**Forbidden after §§1–4 (binding — inline under `new-plan` or upstream on planner):**

- Report **`## Completion (inline)`** to the invoker while **`implementationHandoffStatus`** is still **`not-offered`** (§5c not yet shown) **unless** **`skipPrPlanHandoffModal: true`**.
- Bubble **`readyForImplementation: true`** upstream and return to **`master-planner`** Step **7b** master-plan menus without offering §5c on **this** lane first **unless** **`skipPrPlanHandoffModal: true`** (then include **`prPlanHandoffSkipped: true`** in inline completion).
- Skip §5c based on PRD **`operation: manage`** or a linked `@path` alone — PRD source does **not** change the **`pr-plan`** → **`coding-session`** handoff chain.

Set **`implementationHandoffStatus: "offered"`** when §5c modal is emitted; **`deferred`** when the developer picks **`defer`**; **`spawned-coding-session`** after §5d.

- **Next-step resolution:** Auto-advance to §5c-pre when `outputs.gitlinkPromotionScopeStatus: required`; otherwise auto-advance to §5c structured choice after §5a readiness passes and §5b completeness note — **or auto-advance to §5d** when **`skipPrPlanHandoffModal: true`** **and** **`upstreamSkill: debug-and-fix`** **and** **`debugExitConfirmed: true`** — no `USER_CHECKPOINT` on substeps **5a–5b** or step **4** draft writes.

### §5c-pre — Gitlink promotion scope (binding)

When **`outputs.gitlinkPromotionScopeStatus: required`**, open structured choice **before** standard §5c handoff:

USER_CHECKPOINT — record gitlink promotion scope before implementation handoff.

| Option id | Label |
|-----------|--------|
| `gitlink-in-scope` | In scope — include hosting gitlink promotion in this PR ship chain |
| `gitlink-follow-up` | Follow-up — document deferred promotion on PR plan §8 |
| `gitlink-excluded` | Excluded — explicit out-of-scope with rationale |
| `more-details` | More details for option _ |

On pick: write decision to PR plan §8 *Ship notes* (and §3 bullet when material); re-run §5a; set `outputs.gitlinkPromotionScopeStatus: resolved`; then proceed to §5c. When decision is **`follow-up`** or **`excluded`**, §8 must include explicit gitlink-promotion note — **forbidden** empty §8 on gitlink checkout PRs.

### Step 5-open-items — Open-item modal contract

Apply the shared planning open-item contract from `../README.md` § *Planning open-item modal contract* to every **pr-plan** gate that can surface multiple unresolved items before implementation handoff: §5a readiness blockers, missing gitlink promotion scope (§5c-pre), blocked or untrusted parent `Plan:` links, unmapped parent change bullets, thin **Considered & rejected**, ambiguous row match, optional §5–8 pre-fill sketch choices, and non-blocking follow-up flags from step **4f**.

**When open items exist** — use **one modal with multiple `questions[]` entries**:

- **`displayMarkdown`:** numbered list of open items. For each item, include the PR plan section or parent row affected, the gap or blocker, why it matters for readiness or handoff, and the agent's proposed resolution options.
- **`askQuestion.questions`:** one scoped question per open item (for example `accept-scope-bullet`, `map-parent-bullet`, `defer-considered-rejected`, `repair-parent-link`, `prefill-section-N`, `mark-non-blocking`, `more-details`). **Forbidden:** one combined question whose options mix per-item resolutions with terminal handoff choices.
- **Final question:** always append the terminal **pr-plan** §5c handoff question last in the array (start coding session · revise section · pre-fill §§5–8 · defer · commit reminder · **More details for option _**). **Forbidden:** a resolve-only modal that omits §5c routing until every item is cleared — **except** when **`skipPrPlanHandoffModal: true`** (auto-chain only; inline completion without §5c).
- **Many open items:** batch across turns when needed; each batch still ends with the §5c terminal question unless **`skipPrPlanHandoffModal`** applies.

**When no open items remain** — use the existing single §5c terminal handoff question.

**Act after selection.** Apply each chosen item resolution, rewrite affected plan sections, re-run §5a readiness checks, then re-open the same modal shape until §5c can offer implementation handoff or defer.

### 5c — Hand back (recap + structured choice)

Per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**, **`../README.md`** § *Planning open-item modal contract*, and **`../README.md`** § *Recap, structured choice, act (plan-and-deliver)*. Do **not** use “Turn A/B” labels in developer-facing chat.

Invoke **AskQuestion** or **`mission_control_present_structured_choice`** per **Step 5-open-items** — when readiness blockers or §4f flags remain, one scoped `questions[]` entry per open item, then the §5c terminal options table as the **final** `questions[]` entry.

**Preferred (one assistant message):** **AskQuestion tool** with brief recap, or **`mission_control_present_structured_choice`** with:

- `displayMarkdown` — link + one-line readiness summary (below)
- `askQuestion` — modal (`modalTitle`: *PR plan — next move*; options from the table)

**Legacy split (obsolete on Mission Control lanes):** Prefer **`mission_control_present_structured_choice`** (recap in `displayMarkdown` + `askQuestion` same turn). If the tool is unavailable, still **must** close with structured choice — do not end with recap-only prose.

#### Recap (same turn as structured choice)

When using the legacy split, do **not** include **`mission_control_spawn_agent`** or **`mission_control_send_agent_result`** in the recap message. Put recap content in **`displayMarkdown`** and **`askQuestion`** on the **same** turn per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant**. **Obsolete:** recap-only message with **AskQuestion** deferred to a separate turn.

1. A backtick path to the target `.plan.md` (prefer the hosting-absolute path; a `.sedea/operations/…/plans/…` path is also valid). Do **not** use a `file://` Markdown link or put backticks inside a Markdown link label.
2. One-line summary: *Drafted per-PR §§ 1–4; implementation readiness: `<ready|not ready>`.*
3. Planning handoff note: *§§ **5–8** stay **`_TBD_`** until **`coding-session`** fills them on the implementation lane (or you choose **Pre-fill §§ 5–8 here (sketch, then coding)** below). Worktree validation may report **incomplete** — that is expected; the child lane **auto-starts** implementation when you pick **Start coding session** (no second approval modal) unless you pre-filled here or use detached entry.*

Do **not** echo the full §§ 1–4 body in chat unless the developer asked for a fill sketch in the same flow.

#### Structured choice — approval modal

Invoke **AskQuestion**, **`mission_control_present_structured_choice`** (`modalTitle`: *PR plan — next move*) per **Step 5-open-items**. Call MCP with `displayMarkdown` + `askQuestion` only — no prose-only gate ending. When open items exist, item-scoped questions precede the terminal handoff options below as the **last** `questions[]` entry:

USER_CHECKPOINT — approve implementation handoff and start coding session (fill §§5–8 on child lane).

Required options (brief `label`; put detail in `prompt` when needed):

| Option id | Label |
|-----------|--------|
| `start-coding-session` | Start coding session — fill §§5–8 there |
| `revise-section` | Revise a section |
| `prefill-sections` | Pre-fill §§5–8 here (sketch, then coding) |
| `commit-reminder` | Commit when ready |
| `defer` | Defer |
| `more-details` | More details for option _ |

- When §5a readiness passes and **`skipPrPlanHandoffModal`** is not set → open this gate via **`mission_control_present_structured_choice`** (spawned lanes) or **AskQuestion** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**. Apply **Step 5-open-items** when open items exist — this handoff question stays last in `questions[]`.
- When §5a fails → explain blockers in `remainingTasks`; do **not** open this gate until readiness passes or the developer picks revise/defer paths.
- **`defaultOptionId: start-coding-session`** when §5a passes and no blocking open items remain.
- **`start-coding-session`** — Run §5d when §5a passes; if not ready, explain blockers in `remainingTasks` and do **not** spawn.
- **`revise-section`** — Developer names § *N* and feedback; one focused `StrReplace`; echo; re-offer §5c.
- **`prefill-sections`** — Same as former option 2 (speculative § 5–8 sketch); re-offer §5c.
- **`commit-reminder`** — Remind the developer to commit; this skill does **not** run `git`; re-offer §5c.
- **`defer`** — No spawn; set `implementationHandoffStatus: "deferred"` when reporting completion.

**Stop** after §5c AskQuestion or after §5d spawn announcement — do not run **`coding-session`** procedures on this lane.

**Inline under `new-plan`:** After §5c or §5d, report **`## Completion (inline)`** to the invoker — do **not** emit **`mission_control_send_agent_result`**. The **`new-plan`** lane merges ledger fields and aggregates **`coding-session`** child results per **`new-plan/SKILL.md`** step **5b**.

### 5d — Spawn `coding-session` (after `start-coding-session` or debug cascade)

Run when the developer chose **`start-coding-session`** and §5a readiness passes, **or** when **`skipPrPlanHandoffModal: true`** **and** **`upstreamSkill: debug-and-fix`** **and** **`debugExitConfirmed: true`** and §5a readiness passes. When §5a fails, stay on §5c — explain blockers in `remainingTasks` and do **not** spawn (§5c bullet above).

1. **Resolve paths** (all absolute; never documentation placeholders):
 - `targetPlanPath` — absolute path to the target `.plan.md` on this lane.
 - `targetPlanSlug` — slug from filename.
 - `parentPlanPath` / `parentPlanSlug` / `parentIndex` — from steps 1–3 when known.
 - `ledgerParent` — parent slug from sidecar `parent:` (not a placeholder string).
 - `repoPath` — walk up from `targetPlanPath` until **`.sedea/centers/sedea/`** exists; use the parent of **`.sedea/`** as hosting repo root.
2. **Build `initiatingPrompt`** — one short block with required bullets:
 - §1 single concern; §3 change-scope bullets; parent `### PR list` item **N**; `readyForImplementation` and §5a gaps; non-blocking `remainingTasks`.
 - `planningHandoffMode: sections-1-4-complete`
 - `sections5to8Status: TBD-by-design — child owns substantive fill; do not treat as pr-plan failure`
 - `expectedPlanCompleteness: incomplete-until-coding-session-fills-5-8 — auto-authorize worktree when EXPECTED_SECTIONS_5_8_TBD; no second approval modal`
 - `planningHandoffApproved: true` when `readyForImplementation: true` (layer 1 consent from §5c **Start coding session**, or from debug child **`debugExitConfirmed: true`** cascade)
 - Checkpoint trust: child lane follows **`coding-session/SKILL.md`** § *Checkpoint turn UX* — auto-advance happy path including **Debug code-promotion ship profile** when **`upstreamSkill: debug-and-fix`**; **`USER_CHECKPOINT`** at worktree-open (when not auto-authorized), ship cut-point (exception), post-create-pr, pre-PR feedback, and pre-merge gates (exception paths only on debug cascade clean path)
3. **Emit exactly one** child-spawn line (valid JSON on the same line; new UUID per spawn):

 - Cross-check **`../README.md`** § *Universal spawn preflight* (including display-metadata rows **8–10**).
 - `skillPath`: `.sedea/centers/software-development/missions/plan-and-deliver/skills/coding-session/SKILL.md`
 - `name`: `PR{parentIndex}-{semantic title}` when **`parentIndex`** is known — semantic title from §1 single concern or **`targetPlanSlug`**; otherwise `PR-{semantic title}` — **not** generic "Coding session" alone (≤64 chars; truncate semantic title if needed). Prefix per [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Lane title prefix conventions*
 - `slug`: `coding-session-<targetPlanSlug>` (unique per dispatch)
 - `description`: one-line implementation scope (for example *Worktree and implementation for PR N …*)
 - `inputs`: `targetPlanPath`, `targetPlanSlug`, `readyForImplementation`, `planningHandoffApproved: true` (only when `readyForImplementation: true`), `planningHandoffMode: "sections-1-4-complete"` (required when `readyForImplementation: true`), `repoPath`, `ledgerParent`, `upstreamSkill: "pr-plan"` (or **`"debug-and-fix"`** when this lane’s invoker / seed is **`upstreamSkill: debug-and-fix`** — see **Reuse worktree ownership** below); include `parentPlanPath`, `parentPlanSlug`, `parentIndex` when known
 - Optional `warmUpRules`: merge **`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`** if not already loaded from skill frontmatter
 - **Reuse worktree ownership (binding — debug / inherited handoff):** When this lane received an absolute existing hosting-repo **`worktreePath`** (and usually **`worktreeName`**) from an upstream debug or similar seed — especially **`inputs.upstreamSkill === "debug-and-fix"`** or debug handover in **`initiatingPrompt`** — **and** that path already exists on disk, §5d **must** forward ownership onto the **`coding-session`** spawn, not only path/name:
   - `worktreePath` / `worktreeName` — exact absolute path and branch name from the seed
   - `worktreeOwnership: "inherited"`
   - `worktreeCreatedByUpstream` — creating skill slug (e.g. **`debug-and-fix`**)
   - `mountedViaMcp: true` when upstream already ran **`sedea_add_worktree_folder`** for that path; otherwise `false` (child may attach once — still **no** new **`worktree-setup.sh`** for ownership)
   - `developerApprovedImplementation: true` when the invoker already authorized reuse (debug code-promotion path)
   - Set **`upstreamSkill: "debug-and-fix"`** when the seed’s upstream was debug-and-fix (overrides default **`pr-plan`** label for that spawn)
   - **`initiatingPrompt`** must state: inherit cleanup ownership for this path; post-merge auto-cleanup is authorized; remount-only reuse is **not** unclear ownership
   - **Forbidden:** spawn **`coding-session`** with only `worktreePath` / `worktreeName` after inheriting ownership yourself; telling the child ownership is unclear because **this** §5d lane did not run **`worktree-setup.sh`**

4. Emit **`mission_control_spawn_agent`**, announce waiting for the **`coding-session`** child result, and close the turn with structured choice per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** — no second spawn in the same turn; do not prose-only stop.
5. Set `implementationHandoffStatus: "spawned-coding-session"` and record `spawnCorrelationId` matching the spawn request until the child terminal arrives.

### 5e — Aggregate `coding-session` child result

When Mission Control delivers **`mission_control_send_agent_result`** for the spawn `correlationId`:

1. Match by `correlationId` first, then `outputs.targetPlanPath` / `outputs.targetPlanSlug`.
2. Summarize for the developer: child status, whether worktrees were created, `developerApprovedImplementation`, `planCompleteness`, and `remainingTasks`.
3. Copy `outputs.activeLanes`, `outputs.openLedgerEntries`, and child `remainingTasks` into this lane's result when reporting upstream.
4. When child **`outputs.prShipComplete`** is **`true`**: merge **`shipPhase`**, **`rowStatus`**, **`mainPullStatus`**, **`archivedSlugs`**, and echo **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`** into this lane's **`outputs`**; set **`outputs.implementationHandoffStatus: "coding-session-terminal"`**; set **`outputs.codingSessionStatus`** from child **`status`**.
4a. When child **`outputs.parentPlanningFollowUpNotification`** is **`"sent"`** with non-empty **`parentPlanningFollowUps`**: copy into this lane's **`outputs`**; bubble upward on **re-emit updated** terminal (standalone) or **`## Completion (inline)`** (under **`new-plan`**) — **`coding-session`** does not schedule parent work; this lane does not expand PR lists.
5. **Re-emit updated terminal:** On a **standalone** spawned lane, emit a fresh **`mission_control_send_agent_result`** (same **`correlationId`**) with merged **`outputs`** including **`prShipComplete`**, **`parentPlanningFollowUps`** when present, and parent index fields — so **`new-plan`** / **`pr-breakdown`** / **`master-planner`** receive updates without manual **Ship recap**. **Inline under `new-plan`:** report merged fields in **`## Completion (inline)`** prose instead; the **`new-plan`** lane propagates per **`new-plan/SKILL.md`** step **5b**.
6. Do **not** treat child `developerApprovedImplementation: true` as permission to edit code on the **`pr-plan`** lane.
7. Re-offer §5c **AskQuestion** when the developer may revise the plan or spawn again after a failed/partial child run — unless **`prShipComplete: true`** and the developer defers follow-up on this lane (upstream owns **`expand-eligible`**).

## Step 5a — Follow-up turns

On revise requests, re-read the section, `StrReplace`, echo, re-offer the step 5c **AskQuestion** menu. When **`implementationHandoffStatus: spawned-coding-session`** and the edit is **material** per [Plan-change notify — emit-when](#plan-change-notify--emit-when-mission_control_notify_child_lanes), call **`mission_control_notify_child_lanes`** for the open **`coding-session`** child **before** re-offering §5c — one slug per call; notify does **not** replace §5e terminal merge.

On **fill** requests for § 5–8, draft the requested section with explicit *sketch* caveats; offer revise or accept; executor still owns final polish. After any fill, recompute implementation readiness and update the result contract. When a **`coding-session`** child is open and the sketch is material, emit notify per emit-when table above.

## One primary choice per turn — surface observations

Perform exactly what was chosen. List short **numbered observations** for gaps (parent list mismatch, thin **Considered & rejected**, heavy § 3, blocked parent link) in **`displayMarkdown`** and apply **Step 5-open-items — Open-item modal contract**: one scoped `questions[]` entry per observation, then the §5c terminal handoff question last. Prefer recap + modal in one message.

## Scope guard

**Owns:** target PR plan **body** §§ 1–4; **4a-bis** append-only capstone todo; implementation readiness assessment; optional **fill** sketches for § 5–8 when explicitly chosen.

**Out of scope:** parent **`### PR list`** edits; parent **`Plan:`** wiring (**`plan-reconcile`**); frontmatter `name` / `overview` / `isProject` (except **4a-bis** append); running **`coding-session`** procedures on this lane (worktrees, `git worktree`, MCP attach, implementation edits); Master / Phase templates (**`master-planner`**, **`phase-planner`**).

**In scope for spawn:** one **`mission_control_spawn_agent`** for **`coding-session`** per §5d after **AskQuestion** **`start-coding-session`** with real absolute paths (standalone spawned lane **or** inline under **`new-plan`**).

Stop after the step 5c **AskQuestion** turn, after §5d spawn announcement, or after §5e child summary — per terminal stop rules below. When **`parentAgentRole`** is **`new-plan-agent`**, skip **`mission_control_send_agent_result`** and report **`## Completion (inline)`** instead.

## Completion (spawned)

### MCP result preflight (`mission_control_send_agent_result`)

| Step | Check |
|------|--------|
| R1 | Call **`mission_control_send_agent_result`** with **`status`**, **`summary`**, optional **`outputs`** / **`errors`** |
| R2 | **Forbidden args absent** — no **`correlationId`**, **`dispatchId`**, **`slotId`**, or other host-resolved keys |
| R3 | Populate **`outputs`** from the required field list below |
| R4 | Re-emit updated MCP result after user-requested follow-up on this lane (same spawn session; host resolves **`correlationId`**) |
| R5 | **`mission_control_refocus_parent_lane`** — when **Required** per § *MCP parent refocus* below (spawned standalone only); **forbidden** while **`continuationStatus: active`** |

### MCP parent refocus (`mission_control_refocus_parent_lane`)

| Signal on this terminal | Refocus? |
|-------------------------|----------|
| Inline under **`new-plan`** | **N/A** — use **`## Completion (inline)`**; no refocus |
| **`continuationStatus: active`**; open **`coding-session`**; §5c menu not yet offered | **Forbidden** |
| Notify-only turns | **Forbidden** |
| **`continuationStatus: terminal`** on a **spawned** standalone run | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "pr-plan-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above. See **`../README.md`** § *Parent refocus on terminal*.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Required `outputs` fields:

- `outputs.targetPlanPath`, `outputs.targetPlanSlug`
- `outputs.parentPlanPath`, `outputs.parentPlanSlug`, `outputs.parentIndex`
- `outputs.parentPlanLinkStatus` — `linked` | `blocked` | `unknown`
- `outputs.readyForImplementation`, `outputs.implementationReadinessReasons`
- `outputs.implementationHandoffStatus` — `not-offered` | `offered` | `deferred` | `spawned-coding-session` | `coding-session-terminal` (child finished); not `developerApprovedImplementation`
- `outputs.prPlanHandoffSkipped` — `true` when §5c was skipped via **`skipPrPlanHandoffModal`** (auto-chain from **`pr-breakdown`** **`approve-list`**)
- `outputs.spawnCorrelationId` — UUID from §5d when `implementationHandoffStatus` is `spawned-coding-session` or until child terminal is merged
- `outputs.codingSessionStatus` — echo child `status` when §5e applies
- `outputs.prShipComplete` — `true` when §5e merged child reconcile complete (archive + main pull)
- `outputs.parentPlanningFollowUpNotification`, `outputs.parentPlanningFollowUps` — when §5e merged child parent follow-up notification
- `outputs.mainPullStatus`, `outputs.archivedSlugs` — when §5e merged from child
- `outputs.shipPhase`, `outputs.rowStatus` — echo child when **`prShipComplete: true`**
- `outputs.activeLanes`, `outputs.openLedgerEntries`, `outputs.remainingTasks`
- `outputs.continuationOwner`: `"pr-plan-agent"`
- `outputs.continuationStatus`:
 - `terminal` when handoff menu is complete, no **`coding-session`** child is open, parent link is trusted, and no blocking `remainingTasks` (or developer deferred/abandoned)
 - `active` when parent link repair, fill sketches, **`coding-session`** child lane is open, or §5c menu not yet offered
 - `terminal` with `readyForImplementation: false` only when upstream or developer marks the PR plan deferred, abandoned, or out of scope

Complete §5d spawn (when chosen) + wait announcement **before** the MCP result call when spawning on a **standalone** spawned lane. Stop after the MCP result call. Do not emit a second **`mission_control_spawn_agent`** in the same turn after the MCP result call (see **`../README.md`** § *Terminal stop (normative)*). **Inline under `new-plan`:** do **not** emit the MCP result call — use **`## Completion (inline)`** below.

## Completion (inline)

Report the fields below in prose to the invoker on the **same lane**. Do **not** emit `mission_control_spawn_agent` for **`pr-plan`**, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*). **Exception:** §5d may still emit **`mission_control_spawn_agent`** for **`coding-session`**.

**Primary path:** **`new-plan`** step 4 runs this skill **inline** (`parentAgentRole: "new-plan-agent"`). Use the same `outputs` semantics as **`## Completion (spawned)`** in prose only — the **`new-plan`** lane merges ledger fields and aggregates **`coding-session`** per **`new-plan/SKILL.md`** step **5b**. **Standalone** mission dispatch may still spawn this skill on a child lane; then use **`## Completion (spawned)`** instead.
