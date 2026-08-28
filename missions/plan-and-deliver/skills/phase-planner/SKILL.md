---
name: phase-planner
description: >-
 Populate a phase plan body: draft §§ 1–4 (Background, Scope, Code design,
 Changes) plus **`### Decomposition assessment`** before the dual-title § 5,
 per Sedea's New Feature Development Process (mode #2). Pulls scope from the
 parent's `Delivery phases` item N, reuses the parent's diagrams with this phase
 highlighted, and infers phase-scoped Changes. § 5 list body and § 6 Caveats
 stay `_TBD_` for inline **`delivery-phases`** / **`pr-breakdown`** on this lane. Target resolved per
 planning-target-resolution. Use under mission dispatch, **`phase-planner`** protocol
 branch, natural language, or after **`new-plan`** ignition on a `Delivery phases`
 child stub.
designation:
  allowed: Phase plan §§1–4; inline delivery-phases or pr-breakdown; spawn pr-plan for PR rows
  forbidden: Application implementation; worktree ship on planning lane; coding-session inline
inputs:
  targetPlanPath:
    type: string
    description: Path to the phase plan stub to populate.
    required: true
  targetPlanSlug:
    type: string
    description: Slug for the phase plan stub.
    required: true
  parentPlanPath:
    type: string
    description: Path to the parent plan containing the Delivery phases row.
    required: true
  parentPlanSlug:
    type: string
    description: Slug for the parent plan.
    required: true
  parentIndex:
    type: number
    description: One-based Delivery phases index that produced this child.
    required: true
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from the upstream agent.
    required: false
  upstreamSkill:
    type: string
    description: Skill that requested this phase population, usually new-plan.
    required: false
  autoContinue:
    type: boolean
    description: When true, run the next decomposition branch inline after population if parent hint and assessment agree.
    required: false
    default: true
  plansBasePath:
    type: string
    description: >-
      Optional absolute handover path to a dispatch-scoped plans write folder.
      When omitted, resolve from target/parent plan paths or flat plans root fallback.
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/phase-planner/SKILL.md"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
---

# Phase plan: §§ 1–4 from the parent plan

This skill drives the **second-tier** planning move under Sedea's New Feature Development Process: take a freshly-spawned phase plan stub (indexed child from the parent's `Delivery phases` list, typically right after the **`new-plan`** protocol branch) and populate its body with sections 1 through 4 of the **Phase plan template** — Background, Scope, Code design, Changes — plus **`### Decomposition assessment`** (sizing and routing recommendation) **immediately before** the dual-title `## 5. Delivery phases | PR breakdown` section. The dual-title **list** body and § 6 (Caveats) stay `_TBD_` until follow-up turns.

The agent has enough context after step 3 to draft §§ 1–4 and the assessment — inferable from the parent plan's architectural design + change list + this phase's row in the parent's `Delivery phases` numbered list. The assessment supplies **kinds of change**, **PR count band**, **sequencing / coupling**, a **routing recommendation**, and **confidence** so the next **`delivery-phases`** / **`pr-breakdown`** path can be selected without guessing. Filling the dual-title **numbered list** is owned by those protocol branches; § 6 (Caveats) often only emerges once § 5 reveals constraints.

The procedure below is a hard contract — do **not** skip steps, re-order them, or start drafting before the target plan is verified as a phase plan stub. Skipping a step is the difference between a clean phase plan and one that drifts from the documented process.

## Resolve plans write directory (binding)

Honor optional **`inputs.plansBasePath`** on every plan write and on spawn handover to downstream plan skills:

1. Collect **`inputs.plansBasePath`**, **`inputs.targetPlanPath`**, and **`inputs.parentPlanPath`** when present.
2. From **`HOSTING_ROOT`**:

```bash
cd "$HOSTING_ROOT"
.sedea/centers/sedea/scripts/run-sedea-node.sh \
  .sedea/centers/software-development/missions/plan-and-deliver/scripts/plan-state.mjs \
  resolve-plans-write-dir --json \
  ${PLANS_BASE_PATH:+--plans-base-path "$PLANS_BASE_PATH"} \
  ${TARGET_PLAN_PATH:+--target-plan-path "$TARGET_PLAN_PATH"} \
  ${PARENT_PLAN_PATH:+--parent-plan-path "$PARENT_PLAN_PATH"}
```

3. Treat JSON **`writeDir`** as authoritative for new plan paths on this lane. When spawning **`new-plan`**, **`coding-session`**, or nested **`phase-planner`**, include **`plansBasePath`** in spawn **`inputs`** when JSON **`plansBasePath`** is non-null — **forbidden** re-deriving flat-root paths when nested handover is active.
4. Material edits to an existing **`targetPlanPath`** stay in that file's directory — do not relocate plans when handover resolves nested vs flat.

- **Next-step resolution:** Auto-advance to step **1** target verification once resolve completes — no `USER_CHECKPOINT` on happy path.

## Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Default warm-up*. Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. Frontmatter matches this table; spawners may omit run-request **`laneRules`** when identical (README spawn preflight row 11). **384 KiB cap:** frontmatter omits **`plan.mdc`**, **`development-process.md`** — explicit **`Read`** at named protocol steps. **No `alwaysApply` frontmatter flip.**

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
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/phase-planner/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight M1–M9, definitive `laneRules` |

## Agent messaging (MCP)

**MCP spawn/result/notify skill.** Parent→child spawn, plan-change notify, and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*; operator checklists: **`../README.md`** § *MCP spawn preflight* and § *MCP notify preflight*.

| Action | MCP tool |
|--------|----------|
| Spawn **`coding-session`**, nested **`phase-planner`**, or fire-and-forget **`hosting-repo-rules`** | **`mission_control_spawn_agent`** |
| Parent plan-change notify (named non-terminal children on this phase subtree) | **`mission_control_notify_child_lanes`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- `Read` **`docs/spawn-ship-contracts.md`** § *MCP notify preflight* (rows N1–N8) — then run notify preflight before every **`mission_control_notify_child_lanes`** call — cross-ref **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*.
- **`laneRules`:** rely on this skill's frontmatter **`laneRules`**; MCP spawn schema omits **`laneRules`** on the wire (Phase 1 stub).
- Inline skills (**`delivery-phases`**, **`pr-breakdown`**, inline **`pr-plan`**, inline **`new-plan`**) stay **inline-only** — no spawn wire change.
- **Relevant Links (post-write):** After each Write/StrReplace that **creates or materially edits** this phase plan (or child ops plans written on this lane), call MCP **`mission_control_update_relevant_documents`** with absolute path(s) (`kind: plan`) — same turn preferred. **Skip** read-only loads, warm-up paths, and unchanged already-registered paths. Does **not** replace terminal plan path outputs. See **`../README.md`** § *Relevant Links — post-write registration*.

### Plan-change notify — emit-when (`mission_control_notify_child_lanes`)

After a **material** phase plan edit on **this phase subtree** that affects named child lanes (active **or** terminal **`pr-plan`** row owners per rule **4** § *Planner-lane wake*), notify each affected child with a **separate** MCP call (one slug per call, v1). Normative protocol: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*.

| Emit when | Target child slugs (examples) | Step **5e** alignment |
|-----------|------------------------------|------------------------|
| Material edit to phase plan §§1–4, **`### PR list`**, or decomposition scope on this file changes work for affected children | Open **`coding-session`** spawns from this phase; **terminal `pr-plan`** slugs when a new PR row is added to a ship-complete plan path; nested **`phase-planner`** children on this subtree when material | Notify **does not replace** Step **5e** child terminal merge — still aggregate **`mission_control_send_agent_result`** deliveries; notify is handoff only |

**Material edit** includes: PR list row scope/sequencing changes, **adding PR rows after phase ship-complete**, §3 Changes bullets that alter a child PR plan path, and assessment/route updates that change what a named child should implement.

**Forbidden:** empty or speculative **`targetSlugs`**; implicit fan-out; duplicate spawn when a planner slug already exists for the plan path; using notify instead of spawn for **first-time** PR row expansion with no prior slug.

### MCP notify preflight (`mission_control_notify_child_lanes`)

| Step | Check |
|------|--------|
| N1 | Caller authority — **`phase-planner`** may notify descendant slugs on this phase subtree only |
| N2 | Required args present: **`summary`**, **`changeType`**, **`affectedPlanPaths`** (non-empty), **`targetSlugs`** (exactly one slug) |
| N3 | **Forbidden args absent** — no host-resolved identity keys, no **`notifyAllDescendants`** |
| N4 | **`targetSlugs`** contains exactly **one** dispatch-unique child slug per call (terminal **`pr-plan`** slugs allowed per rule **4** § *Planner-lane wake*) |
| N5 | **`affectedPlanPaths`** includes this phase plan and affected child PR plans when applicable |
| N6 | Multiple children → **separate MCP calls** (one slug per call, v1) |
| N7 | Include **terminal planner** slugs when **`affectedPlanPaths`** intersects; omit terminal **leaf** lanes (`coding-session`) per rule **4** § *Leaf-lane omission* |
| N8 | **First-time** PR row / lane with no prior slug → **`mission_control_spawn_agent`** — when slug exists → notify, never duplicate spawn |

### Plan-change notification receive (child lane)

When Mission Control delivers **`Mission Control: plan-change-notification delivered.`** on **this** spawned **`phase-planner`** lane, treat it as mid-phase delivery handoff — not skill terminal completion and not Step **5e** child-result merge.

**Intake (binding):**

1. Parse host envelope fields: **`summary`**, **`changeType`**, **`affectedPlanPaths`**, optional **`excerptPointers`**, **`requestedChildActions`**, **`initiatingContext`**.
2. **`Read`** each **`affectedPlanPaths`** entry in full before acting.
3. Compare to **`inputs.targetPlanPath`**, phase subtree plans, **`activeLanes`**, and open **`### PR list`** rows — do **not** close the phase delivery row solely because notify arrived.
4. Keep **`outputs.continuationStatus: active`** while open child lanes or inline decomposition work remains — on **terminal wake**, clear **`phaseShipComplete`** on the next re-emit when resuming decomposition (add-PR-to-closed-phase).

**Terminal wake (binding):** When this lane previously reported **`continuationStatus: terminal`** or **`phaseShipComplete: true`** and notify delivery intersects **`inputs.targetPlanPath`**, treat the notification as **reactivation** — **forbidden** to tell the parent to spawn a duplicate **`phase-planner`**. Set ledger to active; offer **`resume-decomposition`** below.

**Checkpoint vs external-wait (binding):** Notify delivery is **developer-input USER_CHECKPOINT** — **not** external-wait. Emit structured choice on the same turn after re-read; do **not** auto-advance to Step **5e** terminal merge or refocus parent.

USER_CHECKPOINT — parent plan-change notification received on phase-planner child lane.

**Required options** (`modalTitle`: *Phase planner — plan change notification*; list in this order):

| Option id | Label |
|-----------|--------|
| `resume-decomposition` | Resume decomposition — add PR / revise phase plan (terminal wake) |
| `acknowledge-only` | Acknowledge — continue phase delivery with updated context |
| `re-read-revise` | Re-read / revise affected phase or PR plan sections |
| `plan-reconcile` | Run inline **`plan-reconcile`** when authorized on this subtree |
| `escalate-parent` | Escalate to **`master-planner`** or Squad Leader |
| `stop-work` | Stop phase delivery work (cancellation or developer-directed) |
| `more-details` | More details for option _ |

**Option semantics (binding):**

| Option | Act |
|--------|-----|
| **`resume-decomposition`** | Reactivate terminal lane: set **`continuationStatus: active`**, clear **`phaseShipComplete`** when adding PRs; route inline **`pr-breakdown`** / **`new-plan`** / **`pr-plan`** per Step **5** — **re-emit updated** terminal when standalone spawned |
| **`acknowledge-only`** | Merge notify context into lane ledger; resume prior step — **no** terminal MCP result |
| **`re-read-revise`** | Update phase plan §§ or child spawn **`inputs`** when paths intersect — keep phase row open |
| **`plan-reconcile`** | Inline **`plan-reconcile`** per contract — merge ledger; **no** terminal result solely from notify |
| **`escalate-parent`** | Bubble summary upstream — **forbidden** **`mission_control_refocus_parent_lane`** solely from notify |
| **`stop-work`** | Pause phase delivery; **`partial`** only when genuinely blocked |

**Forbidden on notify delivery (binding):** Terminal **`mission_control_send_agent_result`** solely due to notification; **`mission_control_refocus_parent_lane`** solely due to notification; skipping **`affectedPlanPaths`** re-read; treating notify as Step **5e** child terminal merge.

Normative protocol: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*; **`../README.md`** § *Child delivery checkpoint (receive)*.

## Trigger

Invocation context (mission dispatch and structured choices):

- Mission dispatch or explicit request to run the **`phase-planner`** protocol branch.
- Natural language: populate / draft / fill the phase plan body.
- Immediately after **`new-plan`** ignition when the parent dual-title is **`Delivery phases`** — the usual next step on the new child stub.

The **developer** picks the next move per **30_planning-target-resolution** § *Sedea input channel*.

## Step 1 — Identify the target plan and verify it's a phase plan stub

The skill operates on a **target** `.plan.md` resolved before this skill runs, per [`30_planning-target-resolution.mdc`](../../../../rules/30_planning-target-resolution.mdc) § *Resolution order*. Acknowledge the target slug in one line when this skill starts (e.g. *Target plan: `<slug>` (from prior structured choice).*). Resolve targets from session, snapshot, or explicit path — **planning-target-resolution** is normative.

When spawned by `new-plan`, `targetPlanPath`, `targetPlanSlug`, `parentPlanPath`, `parentPlanSlug`, and `parentIndex` are already locked. Treat missing or conflicting values as a spawn-contract failure: stop with `failure` or `partial` and report the missing field. Do not fall back to IDE focus or free-form target discovery in spawned mode.

If there is no resolved target, **stop** and emit a fresh *Where we are now in the plan tree* snapshot with **`AskQuestion`** or **`mission_control_present_structured_choice`** in **one turn** per **30_planning-target-resolution** § *Sedea input channel* and **`../README.md`** § *Recap, structured choice, act* (`displayMarkdown` + `askQuestion`). **Obsolete:** recap-only turn without structured choice. Then continue.

Acknowledge in one line: *"Target plan: `<slug>`."*

## Refresh lane display (when stale)

After the target phase slug is confirmed (end of Step 1):

1. Compare the visible tab **title** / **hover** to this lane's work (phase slug, parent index, delivery concern).
2. When spawn labels are **generic or wrong**, call MCP **`mission_control_update_lane_display`** on **this lane only** with **`title`** = `PH{parentIndex}-{semantic title}` (phase scope or **`targetPlanSlug`**; omit `{N}` only when **`parentIndex`** is unknown) and optional **`description`** / **`hoverDescription`** (max lengths in [`.sedea/centers/sedea/rules/9_display-metadata-authority.mdc`](.sedea/centers/sedea/rules/9_display-metadata-authority.mdc)). See [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Lane title prefix conventions*.
3. **Skip** when spawn labels already match scope.
4. **Forbidden:** **`mission_control_update_dispatch_display`** from a child lane.

See [`.sedea/centers/software-development/rules/50_mission-control-display-metadata-discipline.mdc`](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Child lane — refresh own slot when labels are stale*.

### 1a — Verify the body's template state

Read the target plan in full and apply:

| Body state | Meaning | Action |
|---|---|---|
| Has `## Overview` + `## Phasing` + `## Out of scope` (the new-plan stub) | Fresh stub, drafting needed | Step 1b → Step 2 → Step 3 → Step 4 (full body rewrite) |
| Has `## 1. Background` + `## 2. Scope` + `## 3. Code design` + `## 4. Changes`, with one or more `_TBD_` placeholders under §§ 1–4 | Partially drafted phase plan | Step 1b → Step 2 → Step 3 → Step 4 (fill only the still-`_TBD_` sections; keep already-drafted content) |
| Has §§ 1–4 populated but **no** `### Decomposition assessment` before `## 5. Delivery phases \| PR breakdown` | Partial draft (assessment missing) | Step 1b → Step 2 → Step 3 → Step 4g only (insert assessment via `StrReplace`; leave §§ 1–4 untouched unless they still have `_TBD_`) |
| Has §§ 1–4 + `### Decomposition assessment` complete; `## 5. Delivery phases \| PR breakdown` still `_TBD_` | Ready for **`delivery-phases`** / **`pr-breakdown`** | Step 5 (handoff menu) |
| Has `## 4. Architectural design` + `## 6. Delivery phases \| PR breakdown` (Master Plan template) | Wrong skill — this is a Master Plan | **Stop**: *"This plan's body is the Master Plan template. Use the **`master-planner`** protocol branch to draft Master Plan §§ 1–5."* |
| Has `## Single concern` heading | Wrong skill — this is a PR plan | **Stop**: *"This is a PR plan. PR plans don't use the Phase plan template; they have their own per-PR template."* |

Acknowledge the body state in one line — e.g. *"Body state: fresh new-plan stub; will rewrite to the Phase plan template."*

If the body is the new-plan stub but `## Overview` / `## Phasing` / `## Out of scope` carry **non-stub content** (the user typed scope context into them before invoking this skill), capture that content in your working notes and feed it into § 1 / § 2 drafting (paraphrase it; don't copy verbatim into the new sections). Flag in the chat reply (under § 4f or in the handoff): *"Captured user content from the stub `## Overview` / `## Phasing` and merged into § 1 / § 2 — review the wording."*

### 1b — Verify parent topology

Read the target plan's sidecar `<slug>.state.yaml` for `parent:`. Apply:

- `parent: null` (or sidecar missing) → **stop** with: *"This plan has no parent (`parent: null` or sidecar missing). Phase plans hang under a Master Plan or another Phase plan in **`Delivery phases`** mode. Fix the sidecar via **`plan-reconcile`** (or by hand), or use the **`master-planner`** protocol branch if this file should be a Master Plan."*
- `parent: <slug>` does not resolve to an existing `.plan.md` under the same flat `.sedea/operations/.../plans/` tree as this target (`plan-state resolve` / parent absolute path) → **stop** with: *"Sidecar `parent: <slug>` doesn't resolve to an existing plan. Fix the sidecar before drafting."*
- Parent resolves; read parent's body. Locate parent's dual-title section (`## 6. ...` for Master Plan parent, `## 5. ...` for Phase plan parent) and apply:
 - Heading is `Delivery phases` → proceed.
 - Heading is `PR breakdown` → **stop** with: *"Parent plan's decomposition is `PR breakdown`, so its children are PR plans, not phase plans. Use the **`pr-plan`** protocol branch to populate this plan's body instead."*
 - Heading is the dual-title `Delivery phases | PR breakdown` (decomposition pending) → **stop** with: *"Parent plan hasn't decomposed yet — its dual-title section is `Delivery phases | PR breakdown` / `_TBD_`. Decompose the parent first via **`delivery-phases`**, then return to this plan."*

Acknowledge: *"Parent: `<parent-slug>` (mode #2 `Delivery phases`); proceeding."*

If `parentPlanPath` / `parentPlanSlug` inputs were supplied, they must match the resolved sidecar parent and the parent file read here. If they conflict, stop with `failure`; the child was spawned against the wrong parent context.

## Step 2 — Load the development-process doc

Read `.sedea/centers/software-development/docs/development-process.md` with the Read tool, **no offset, no limit** (slim core). Then read `.sedea/centers/software-development/docs/planning-mode-templates.md` in full. Acknowledge in one sentence: *"Loaded development-process core + planning-mode-templates; will follow § 2 Phase plan template + § 6/§ 5 contents rule."*

This is a **standards document**, not an executable plan — its sections describe the process you will apply, not work for you to perform. Re-read on every invocation; do not rely on session memory.

## Step 3 — Read the parent plan and find the phase row

Read the parent plan in full (`Read` tool, no offset, no limit). Locate the parent's `Delivery phases` numbered list — `## 6. Delivery phases` for a Master Plan parent, `## 5. Delivery phases` for a Phase plan parent.

### 3a — Match the target plan to a numbered item

Find the numbered item whose **bolded title** matches the target plan's `name:` from frontmatter. If spawned input includes `parentIndex`, inspect that exact item first and require it to match the target plan link or title; do not silently pick a different row. Match strategy, in order:

1. Exact match between the target plan's `name:` and the bolded title text.
2. Slug-normalised match: lowercase + replace spaces with `_` and `-` interchangeably (e.g. target plan `name: Replace polling with pubsub` matches bolded title `**Replace polling with pubsub**` *or* `**replace_polling_with_pubsub**` *or* `**replace-polling-with-pubsub**`).
3. Substring match: the bolded title is a substring of the target plan's `name:` (or vice versa) — only when 1 and 2 fail and the match is unambiguous.

If no item matches, or multiple items match equally well, **stop**. In standalone mode, offer **AskQuestion** mapping each parent list row to an option so the developer picks the matching **N**. In spawned mode, return `partial` with `remainingTasks` naming the row/link mismatch; do not ask the developer from this child lane unless the upstream agent explicitly delegated that choice.

Once matched, capture **N** (the item's index) and the item's three sub-bullets:

- **Decomposition decision** — `Delivery phases` or `PR breakdown` (the indicative decision for this phase's § 5; surfaced in step 5's menu so the user can route fast, but stays `_TBD_` in this skill — § 5 is filled by `delivery-phases` / `pr-breakdown` later).
- **Scope sentence** — one short line; this is the proto-§ 2 Scope. The skill expands it into the full § 2 Scope using the parent's diagram.
- **Plan link** — link back to this plan (or `_TBD` spawn placeholder until the parent row is wired after **`new-plan`** / **`plan-reconcile`**).

Acknowledge: *"Parent's `Delivery phases` item N=<n>: \"<bolded title>\" — \"<scope sentence>\". Indicative decomposition: `<value>`."*

### 3b — Load architectural context from the parent

What you load depends on the parent's stage:

- **Master Plan parent** → load § 4 Architectural design (the diagrams, in full — preserve the Mermaid source) + § 5 Changes (the feature-level change list). These ground both this phase plan's § 2 Scope (which highlights the parts touched) and § 4 Changes (which is a phase-scoped subset of the parent's Changes list).
- **Phase plan parent** → load § 2 Scope (parent's scope, of which this child is a subset) + § 3 Code design (parent's diagram) + § 4 Changes (parent's change list).

Acknowledge in one sentence: *"Loaded parent's <§ 4 Architectural design + § 5 Changes | § 2 Scope + § 3 Code design + § 4 Changes>; <D> diagram(s), <K> change bullets."*

If the parent's diagram(s) are too large to reuse verbatim (more than ~10 nodes / lines, or multiple disjoint diagrams), pick the one(s) that cover the parts this phase touches. Note the choice in one line — *"§ 2 Scope will reuse parent's <diagram name> (the others don't intersect this phase)"*.

## Step 4 — Draft §§ 1–4 into the target plan

This is where the skill earns its keep: take the parent context loaded in step 3 and produce §§ 1–4 of the Phase plan template.

### 4a — Write the body (fresh case)

When the body is the new-plan stub, replace the **entire body** in one `StrReplace` with the Phase plan template populated for §§ 1–4 and `_TBD_` for §§ 5–6 (the outer fence below is quadruple backticks so the inner ```` ```mermaid ```` fences render literally — what the file actually receives is the inner content with regular triple-backtick mermaid fences):

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

## 1. Background

<1–2 sentences per § 4b below>

## 2. Scope

<one short sentence per § 4c below>

```mermaid
<reused parent diagram with this phase's parts highlighted, per § 4c>
```

## 3. Code design

```mermaid
<new diagram per § 4d below>
```

## 4. Changes

<short bullet list per § 4e below>

### Decomposition assessment

<bullets per § 4g below>

## 5. Delivery phases | PR breakdown

_TBD_

## 6. Caveats (optional)

_TBD_
````

The `_TBD_` placeholders under §§ 5–6 mirror the convention from `master-planner` step 5c — italic and easy to grep (`rg '^_TBD_$'`). The `## 5.` heading uses the **deliberate dual-title** form per the doc's § 6 / § 5 contents rule; the actual decomposition decision (`Delivery phases` vs `PR breakdown`) and the numbered child list are made when § 5 is drafted via `delivery-phases` / `pr-breakdown`. The **`### Decomposition assessment`** block is **not** a substitute for that list — it records evidence *before* the choice.

The frontmatter (`name`, `overview`, `todos`, `isProject`) is **not** touched — those were set correctly by the new-plan skill at scaffold time. If a follow-up `iterate` ever does edit a frontmatter scalar (e.g. fixing a typo in `name:`), follow the YAML scalar-quoting bullet in [`../new-plan/SKILL.md`](../new-plan/SKILL.md) § *Write the plan template* → `<slug>.plan.md` rules — most importantly, wrap any value containing `: ` (colon + space) in double quotes so the operations plan tree does not fall back to the slug for the tree label.

If the body is **partially drafted** (per the step 1a table), do not rewrite the whole body. Instead, fill only the still-`_TBD_` section(s) — one `StrReplace` per section, using the section header as disambiguating context (same shape as `master-planner` step 6 for §§ 1–5). Keep already-drafted content untouched. To add a missing assessment only, insert `### Decomposition assessment` and its bullets **immediately before** `## 5. Delivery phases | PR breakdown` (step 4g).

### 4b — § 1 Background

One paragraph, **1–2 sentences**, framed as: *how does this phase build on the previous phase(s), and which part of the parent it covers?* Pull the "what part of parent" piece from the parent's `Delivery phases` item N's bolded title + scope sentence (captured in step 3a). The "builds on previous phase(s)" piece comes from the order of items in the parent's `Delivery phases` numbered list — phases later in the list typically build on phases earlier in the list, unless the parent's list is explicitly out-of-order.

If this is **item 1** of the parent's list (no previous phase), frame § 1 as how this phase establishes the foundation for subsequent phases — call out the foundational pieces (schema, contract, scaffolding) that later phases will consume.

If the parent has a `### Sequencing` sub-section (only true for `PR breakdown` parents, not `Delivery phases` parents — but document the case anyway), use it to refine the "previous phase" framing.

### 4c — § 2 Scope

Two parts:

1. **One short sentence** describing the phase's scope at a high level — paraphrase / lightly expand the parent's `Delivery phases` item N's scope sub-bullet. Keep it tight (one line is the target; two short sentences is the absolute max).
2. **Diagram(s) reused from the parent plan's architectural / code design section** with the parts this phase touches **highlighted** (annotation / color / callout). The highlight must convey both *which* parts the phase touches and *how* it touches them.

For Mermaid diagrams: re-emit the parent's diagram with this phase's nodes / edges styled distinctly. Pattern that works well:

```mermaid
%% reused from parent plan § <4|3>; phase highlight via classDef
flowchart LR
 classDef phaseTouch fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,stroke-width:2px
 classDef phaseNew fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-dasharray: 5 5

 subgraph Legend["Legend"]
 LegendTouch["Touched in this phase<br/>(other nodes unchanged)"]
 LegendNew["Introduced in this phase"]
 end

 <parent's diagram source, verbatim or trimmed>

 class <node1>,<node2>,LegendTouch phaseTouch
 class <newNode1>,LegendNew phaseNew
```

`phaseTouch` marks existing-in-parent nodes this phase modifies; `phaseNew` marks nodes this phase introduces (dashed border = "doesn't exist yet"). Adjust the class names / colors to match repo conventions if any are loaded in scope.

**Legend rules:**

- Always include the `Legend` subgraph for **flowchart**-shaped reused diagrams so the diagram is self-documenting in the file, in GitHub, and in chat echo. Drop any explanatory prose that would otherwise restate what the legend conveys.
- Emit `LegendTouch` only when the phase has at least one `phaseTouch` node; emit `LegendNew` only when it has at least one `phaseNew` node. If the phase has only one of the two, drop the unused legend node and its `class … phaseNew` / `class … phaseTouch` entry from the legend.
- **Skip** the `Legend` subgraph for non-flowchart reused diagrams (`sequenceDiagram`, `erDiagram`, `stateDiagram`, etc.) — `subgraph` is flowchart-only syntax. For those, fall back to a short prose legend below the diagram (e.g. "*Bold actors are touched in this phase.*").

**Flowchart vs sequence (binding):** Do **not** copy flowchart patterns into `sequenceDiagram` blocks. HTML `<br/>` in quoted labels and `subgraph` / `classDef` / `class` styling are **flowchart-only**. Sequence diagrams use opaque participant ids (`participant plannerAgent as Planner`) and single-line `Note` statements — **forbidden** in Note bodies: `<br/>`, multi-line Note text, bare semicolons (`;`); **forbidden** in arrow message labels after `:`: bare semicolons (`;`). Full contract: [`.sedea/centers/sedea/docs/mermaid-authoring.md`](.sedea/centers/sedea/docs/mermaid-authoring.md).

**High-risk abbreviations:** Never use uppercased reserved keywords as bare ids — e.g. `OPT`, `ALT`, `END`, `LOOP`, `PAR`, `AND`, `AS` (Mermaid matches case-insensitively → `opt`, `alt`, …). Prefer opaque ids + labels (`participant scopeOpts as OPT`, `participant ScopeOpts as Scope options`). Do **not** reuse a flowchart node id as a sequence `participant` id.

If the parent's diagram is much bigger than this phase's scope (e.g. 15+ nodes and the phase touches 3), draft a **simplified subset** showing only the parts this phase touches plus their immediate neighbors — flag that you simplified, so the user can choose to expand.

### 4d — § 3 Code design

A new Mermaid diagram giving a visual representation of the change introduced by this phase. Pick the type that best fits, using the same menu as Master Plan § 4:

- Component / architecture chart — when the change is structural (new module, new service, new component).
- Flow chart — when the change is in control flow or data flow through new logic.
- Sequence diagram — when the change involves cross-process / cross-actor interactions over time.
- State diagram — when the change introduces a new lifecycle / state machine.
- ER / schema diagram — when the change is a data-model / DB delta.

Use **Mermaid** in fenced ```` ```mermaid ```` blocks so the diagram renders in Cursor and in GitHub. Include only what is necessary to understand the *shape* of the change; this is design granularity, not pseudocode. Follow [`.sedea/centers/sedea/docs/mermaid-authoring.md`](.sedea/centers/sedea/docs/mermaid-authoring.md) — opaque ids; when the diagram is a **flowchart**, `<br/>` in quoted labels and Legend `subgraph` are allowed; when it is a **`sequenceDiagram`**, use single-line `Note` only (no `<br/>`, no bare `;` in Notes or message labels, no flowchart `subgraph`/`classDef`).

The § 3 diagram complements § 2's reused-with-highlight diagram: § 2 shows *where in the parent's design* this phase lives; § 3 shows *what new shape* this phase introduces. They are usually different diagram types — § 2 inherits the parent's type (often component or flow), § 3 picks whatever conveys the per-phase change best (often sequence or state).

### 4d-lint — Post-write Mermaid lint (binding)

After **any** Write/StrReplace that creates or edits a fenced ```` ```mermaid ```` block in this phase plan (§2 Scope reused diagram and/or §3 Code design), and **before** Step **4f** echo or Step **5b** route handoff:

1. From **`HOSTING_ROOT`**, run:

   ```bash
   node .sedea/centers/sedea/scripts/verify-mermaid-authoring.mjs "<absolute-path-to-phase-plan>"
   ```

2. **Exit 0** → continue to Step **4f** / **5b**.
3. **Non-zero** → fix reserved bare ids / Note bodies / message-label semicolons in the plan file, re-run until exit **0**. **Forbidden:** echoing or handing off with failing Mermaid.

Also run this lint after any later Mermaid-only revise (Step **5d**) before re-echo.

### 4e — § 4 Changes

Short bullet list of what changes, how, and where, scoped to this phase. **2–3 words per bullet, never more than 5** (short-bullet rule from the dev-process doc). Group bullets by area of the codebase if it helps scannability — `**DB:**`, `**API:**`, `**Worker:**`, `**UI:**`, `**Config:**` — but keep each bullet terse.

The change list is a **phase-scoped subset** of the parent's Changes list (loaded in step 3b):

- If a change in the parent's list cleanly maps to **one phase only**, copy it (terse) into the right phase's list.
- If a change spans multiple phases, **split it** into per-phase bullets and only carry this phase's slice.
- If a change in the parent's list doesn't fit any phase boundary, **flag it** (in step 4f or in the handoff) — that's a planning gap worth surfacing back to the parent.

### 4g — `### Decomposition assessment`

Mandatory **in the same turn** as §§ 1–4 (or step 4g-only for legacy bodies missing it). Place **`### Decomposition assessment`** immediately **after** the `## 4. Changes` bullets and **before** `## 5. Delivery phases | PR breakdown`. Follow the short-bullet rule where each line is one scannable fact; the **Routing recommendation** line may be slightly longer.

Include these bullets (labels may vary; content must cover each dimension):

- **Kinds of change (count):** distinct *kinds* (not files, not lines) — per **`.sedea/centers/software-development/docs/planning-mode-templates.md`** § *PR sizing — test cases and kinds of changes* (canonical); [**`20_efficient-pr-shipping.mdc`**](../../../../rules/20_efficient-pr-shipping.mdc) § *Keep PRs small and focused* summarizes for ship lanes.
- **PR count band:** one of `single` | `few (2–5)` | `many (6+)`.
- **Sequencing / coupling:** one line — migrations, feature flags, cross-repo, contract order, or `low` if none.
- **Routing recommendation:** one of `Delivery phases` (needs sub-phases first) | `PR breakdown` multi-PR | `PR breakdown` single-PR — state **why** in the same bullet or the next short bullet.
- **Confidence:** `high` | `med` | `low`.

Ground the recommendation in §§ 2–4 and the parent's `Delivery phases` item N (step 3a). The parent's indicative decomposition sub-bullet is a **hint**, not a commitment — the assessment may disagree and must say so when it does (flag for the **developer** in the handoff if the mismatch is non-obvious).

### 4f — Echo to chat

When §§2–3 contain Mermaid, run **4d-lint** first. After writing the body, **echo §§ 1–4 and `### Decomposition assessment`** in the chat reply so the user can review without opening the file. The plan file is the source of truth; the chat copy is a review surface. Use the same section headers (`## 1. Background`, etc.) so the chat output aligns line-for-line with the file. Render Mermaid diagrams inline as fenced code blocks so the user sees them without opening the file.

If you simplified the parent's diagram in § 2c (per § 4c) or noticed parent-Changes bullets that didn't fit any phase boundary (per § 4e), surface those notes in the echo or in the handoff line — flag, don't hide.

### § 5 list and § 6 (out of scope for this skill)

Leave the dual-title **numbered list** under § 5 as `_TBD_` until inline **`delivery-phases`** or **`pr-breakdown`** fills it on this lane. Keep **`### Decomposition assessment`** immediately above § 5 — that block **is** in scope here. § 6 Caveats usually waits until § 5 exists so constraints are concrete.

### Inline handoff — **phase-planner** → **`delivery-phases`** / **`pr-breakdown`** (Step 5b)

When the developer approves route in Step **5**, run the chosen skill **inline on this lane** — **do not** emit **`mission_control_spawn_agent`** for **`delivery-phases`** or **`pr-breakdown`**. Load the target **`SKILL.md`**, construct inline context from the tables below, follow that skill’s steps, and merge **`## Completion (inline)`** into this skill’s ledger (`spawnedPlans`, `activeLanes`, `openLedgerEntries`, `remainingTasks`). Those skills run **`new-plan`** inline and may still spawn **`phase-planner`** or **`coding-session`** per their contracts. Inline **`delivery-phases`** USER_CHECKPOINT gates (Step **4** route, Step **6** list approval) run **on this lane** per **`delivery-phases/SKILL.md`** § *Checkpoint turn UX (skill-local)* — not on a separate tab.

**`delivery-phases`** on **this phase plan**:

| Inline context field | Value |
|----------------------|--------|
| `targetPlanPath` | Absolute path to this phase plan `.plan.md` |
| `targetPlanSlug` | This phase plan slug |
| `parentAgentRole` | `"phase-planner-agent"` |
| `ledgerParent` | `ledgerParent` from spawn inputs when present |
| `decompositionAssessment` | Full **`### Decomposition assessment`** block text |
| `routeLock` | `"delivery-phases"` |

Path: `.sedea/centers/software-development/missions/plan-and-deliver/skills/delivery-phases/SKILL.md`

**`pr-breakdown`** on **this phase plan** (single-PR **or** multi-PR):

| Inline context field | Value |
|----------------------|--------|
| `targetPlanPath` / `targetPlanSlug` | **This phase plan** — **always**, including single-PR |
| `parentAgentRole` | `"phase-planner-agent"` |
| `ledgerParent` | When known |
| `decompositionAssessment` | When present |
| `routeLock` | `"pr-breakdown"` |
| `prBreakdownShape` | `"single"` or `"multi"` per route signal |
| `upstreamRouteApproved` | `true` after Step **5b** **Approve phase plan and route** when `autoContinue` is not `false` |
| `skipPrBreakdownApprovalModal` | `true` when `autoContinue` is not `false`, route is clear (**K = 1** or multi), and parent hint + assessment agree |

**Forbidden:** `targetPlanPath` = ancestor Master Plan for single-PR **`pr-breakdown`** — PR list drafting stays on **this phase file** per **development-process.md** § *Single-PR on a phase plan (draft location — binding)*.

## Step 5 — Resolve next decomposition route

You know the state: §§ 1–4 and **`### Decomposition assessment`** are drafted; dual-title § 5 list body and § 6 stay `_TBD_`.

### Step 5-open-items — Open-item modal contract

Apply the shared planning open-item contract from `../README.md` to every **phase-planner** gate that can surface more than one unresolved item: parent-row mismatches, route conflicts between parent hint and assessment, missing or low-confidence route signals, phase-boundary observations, diagram simplification notes, parent Changes bullets that do not map to the phase, and implementation-handoff caveats.

**When open items exist** — use **one modal with multiple `questions[]` entries**:

- **`displayMarkdown`:** numbered list of open items. For each item, include the parent row or phase section it affects, the gap/conflict/caveat, why it matters for downstream decomposition, and the agent's proposed resolution options.
- **`askQuestion.questions`:** one scoped question per open item, with its own stable `id`, `prompt`, and item-only `options` (for example `accept-phase-boundary`, `revise-phase-section`, `use-parent-route`, `use-assessment-route`, `defer-to-caveats`, `skip-no-change`, `more-details`). **Forbidden:** one combined question whose options mix several item decisions.
- **Final question:** always append the terminal phase-planner gate question last in the array. Use the normal gate for the current step: **Approve phase plan and route**, route selection, implementation handoff after inline `pr-plan` skip, defer/abandon, or follow-up route menu. **Forbidden:** a resolve-only modal that omits the terminal approve/route/handoff question until every item is cleared.
- **Many open items:** batch across turns when needed; each batch still ends with the terminal phase-planner gate question as the final `questions[]` entry.

**When no open items remain** — use the existing single terminal gate question for Step **5b**, Step **5c**, Step **5f**, or the relevant follow-up route menu.

### 5a — Determine route signal

Compare two signals:

1. **Parent hint** — the `Decomposition decision` sub-bullet from the parent's `Delivery phases` item N.
2. **Phase assessment** — the `Routing recommendation` line you just wrote under `### Decomposition assessment`.

Normalize the signals to one of:

- `delivery-phases`
- `pr-breakdown-single`
- `pr-breakdown-multi`
- `unknown`

Apply:

- If both signals agree on `delivery-phases`, next route is `delivery-phases`.
- If both signals agree on PR breakdown, next route is `pr-breakdown`; preserve single vs multi as `prBreakdownShape` (`"single"` or `"multi"`).
- **Single-PR and multi-PR** both run **`pr-breakdown`** inline on **this phase plan** with the matching `prBreakdownShape` — **forbidden:** retargeting `targetPlanPath` to the decomposition ancestor (see **development-process.md** § *Single-PR on a phase plan (draft location — binding)*).
- If parent hint is `Delivery phases` but assessment says PR breakdown, or the reverse, do not auto-spawn. Surface the conflict as an open item per **Step 5-open-items** and keep the terminal route/approval question last.
- If either signal is missing or low-confidence, do not auto-spawn. Surface the uncertainty as an open item per **Step 5-open-items** and keep the terminal route/approval question last.

### 5b-decompose — lane ownership (binding)

When route is **`pr-breakdown`** (single or multi on **this phase plan**), run **`pr-breakdown`** **inline on this phase-planner lane** with **`targetPlanPath`** = **this phase plan** and **`parentAgentRole: "phase-planner-agent"`**.

**Forbidden:**

- Setting **`targetPlanPath`** to the decomposition **ancestor** Master Plan for single-PR breakdown.
- Telling the developer to run **`pr-breakdown`** on the **`master-planner`** lane, open the Master Plan agent, or return to **`master-planner`** Step **7** / **`route-6`** because single-PR PR list drafting "belongs on the ancestor."
- Prose redirect such as *"switch to the master-master-planner lane for **`pr-breakdown`"* — the **invoker lane** stays **phase-planner**; the **write target** stays **this phase file**.

**Required:** Step **5b** structured choice and **`autoContinue`** cascade approval still run **on this lane** before inline **`pr-breakdown`**; merge completion per Step **5e**. After inline **`pr-plan`** with **`prPlanHandoffSkipped`**, Step **5f** owns implementation handoff on the **same** lane.

**Scope (does not apply):** When **no** active **`phase-planner`** child owns the phase row, **`master-planner`** Step **7** **`route-6`** → inline **`pr-breakdown`** on the Master Plan (**`parentAgentRole: master-plan-agent`**) remains normative — including direct Master Plan **PR breakdown** with no phase layer.

### 5b — Hand off next branch inline when clear

When this skill is running as a spawned child and `autoContinue` is not `false`, run the next decomposition branch **inline on this lane** **only** when route signal is clear:

- `delivery-phases` → load and follow **`delivery-phases/SKILL.md`** on **this** phase plan per [Inline handoff](#inline-handoff--phase-planner--delivery-phases--pr-breakdown-step-5b). **`delivery-phases`** drafts the full phase list first; **`new-plan`** expand uses **depth-first** ship-complete gates — do not expect all phase children in one pass.
- `pr-breakdown-multi` → load and follow **`pr-breakdown/SKILL.md`** on **this** phase plan with `prBreakdownShape: "multi"`. **`pr-breakdown`** honors **`### Sequencing`** for parallel vs sequential PR expand. Under Checkpoint trust, follow **`pr-breakdown`** § *Checkpoint turn UX (skill-local)* — Step **6** list-approval gate and Step **4** route gate when applicable.
- `pr-breakdown-single` → load and follow **`pr-breakdown/SKILL.md`** on **this** phase plan with `prBreakdownShape: "single"` — **same target file as multi-PR**; **forbidden:** ancestor retarget.

Before handoff, present the drafted phase plan body and the route signal via **AskQuestion** or **`mission_control_present_structured_choice`** in **one turn** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act* (`displayMarkdown` + `askQuestion`). Required options:

- **Approve phase plan and route**
- **Revise phase plan first**
- **Choose a different route**
- **Defer downstream decomposition**
- **More details for option _**

Only **Approve phase plan and route** authorizes inline decomposition handoff. Do not treat agreement between parent hint and assessment as developer approval.

### Cascade approval when `autoContinue: true` (binding)

When **`autoContinue`** is not `false` and the developer selects **Approve phase plan and route** (Step **5b**), that approval **propagates** as upstream consent for inline decomposition on **this same turn** — do **not** stop after entering inline **`pr-breakdown`** when the route is clear (**K = 1** or multi, depth-first eligible for PR index **1** when applicable).

Pass **`upstreamRouteApproved: true`** and **`skipPrBreakdownApprovalModal: true`** on the inline **`pr-breakdown`** handoff per [Inline handoff](#inline-handoff--phase-planner--delivery-phases--pr-breakdown-step-5b) when route signals agree on **`pr-breakdown`** (single or multi).

**Forbidden:** Opening **`pr-breakdown`** Step **6** structured choice when **`skipPrBreakdownApprovalModal: true`** and PR index **1** is depth-first eligible per **30_planning-target-resolution**.

**Required:** Same-turn **`approve-list`** act-after-select per **`pr-breakdown`** Step **6** (inline **`new-plan`** index **1** with `autoChainFirstPr: true`, then inline **`pr-plan`**) — merge completion per Step **5e**. Treat **`master-planner`** Step **7** route approval and **`phase-planner`** Step **5b** route approval as **equivalent upstream consent** for first PR expand on the decomposition lane.

After inline handoff begins, merge **`## Completion (inline)`** from the decomposition skill. If inline **`new-plan`** / **`pr-plan`** opened **`phase-planner`** or **`coding-session`** child lanes, keep `continuationStatus: "active"` and aggregate per step **5e**. Do not return terminal success upstream while those child lanes are active.

### 5c — Hand back when route is not clear or standalone

Per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act*. Do **not** use “Turn A/B” labels in developer-facing chat.

**Preferred (one assistant message):** **AskQuestion tool** with brief recap, or **`mission_control_present_structured_choice`** with:

- `displayMarkdown` — file link, parent decomposition hint, optional one-line assessment summary (not a full re-echo of §§ 1–4 if step **4f** already echoed them)
- `askQuestion` — route and follow-up options below

**Obsolete:** **recap-only** message (items 1–2) with structured choice deferred — call **`mission_control_present_structured_choice`** (items 1–2 in `displayMarkdown` + `askQuestion` same turn) or **AskQuestion tool** with brief recap.

Recap content:

1. A backtick path to the target `.plan.md` (prefer the hosting-absolute path; a `.sedea/operations/…/plans/…` path is also valid). Do **not** use a `file://` Markdown link or put backticks inside a Markdown link label.
2. The parent's indicative decomposition line for this phase: **`<Delivery phases | PR breakdown>`** (from step 3a).

**Structured route options** — one `option` per protocol branch (brief `label`; detail in `prompt`). Example `options`:

- **`delivery-phases`** — draft the § 5 **list** as child phases (`Delivery phases` heading).
- **`pr-breakdown`** — draft full § 5 **`PR breakdown`** on **this phase plan** (single-PR and multi-PR use the same draft location).
- **Revise a section** — the developer names § N and feedback; you apply one focused `StrReplace` and echo. For assessment-only edits, anchor on `## 4. Changes` … `### Decomposition assessment`.
- **More details for option _**

**Stop** after structured choice — wait for the developer's reply. Do **not** chain **`delivery-phases`** or **`pr-breakdown`** in the structured-choice message unless mission dispatch explicitly continues the session and route signal is clear.

## Step 5d — Follow-up turns

When the developer asks to revise § N, re-read that section and apply edits via `StrReplace`; echo the result; re-offer structured choice (prefer **`mission_control_present_structured_choice`** or AskQuestion in one message) when a pick is required.

When they choose **`delivery-phases`** or **`pr-breakdown`** via **AskQuestion**, run the chosen skill **inline** on this lane per **§ 5b** and [Inline handoff](#inline-handoff--phase-planner--delivery-phases--pr-breakdown-step-5b). Do **not** emit **`mission_control_spawn_agent`** for those skills. When the handoff ends the assistant turn while waiting for **`phase-planner`** or **`coding-session`** child results per step **5e**, close with structured choice per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** — do not prose-only stop after handoff.

### Plan entered execution — Plan Change offer (binding)

When this phase subtree has **entered execution** — any non-terminal **`coding-session`** child in **`activeLanes`**, or **`implementationHandoffStatus: spawned-coding-session`** on a PR under this phase — every follow-up / wait / continuation modal on **this** lane **must** include:

| Option id | Label (brief) | Action |
|-----------|---------------|--------|
| `plan-change` | Plan Change — revise plan and notify open children | Act below |
| `more-details` | More details for option _ | Elaborate; re-ask |

USER_CHECKPOINT — phase-planner continuation while phase execution is open (must include Plan Change).

**Plan Change act:**

1. Pick scope (phase §§1–4 / assessment / §5 list row wording, or a child PR plan path).
2. Apply material edit on the main hosting clone operations path.
3. Call **`mission_control_notify_child_lanes`** per § *Plan-change notify — emit-when* for each affected non-terminal child (one slug per call).
4. Re-offer the continuation modal — still include **`plan-change`** while execution remains open.

**Forbidden:** omit **Plan Change** once phase execution is open; prose-only wait on coding-session without a modal that includes **`plan-change`**; treat notify-**receive** as a substitute for this **offer**.

## Step 5e — Aggregate downstream result

**Inline `delivery-phases` / `pr-breakdown`:** Merge each decomposition skill’s **`## Completion (inline)`** into this skill’s ledger. If inline **`new-plan`** / **`pr-plan`** reports active **`phase-planner`** or **`coding-session`** lanes, keep the row open and add them to `activeLanes`. When inline decomposition reports **`prShipComplete`** for a PR under this phase, track it on the phase subtree ledger.

When Mission Control delivers a child result from **`phase-planner`** or **`coding-session`** (spawned from inline decomposition on this lane):

1. Match it by correlation id first, then by `outputs.targetPlanPath` / `outputs.targetPlanSlug`.
2. Copy downstream `spawnedPlans`, `activeLanes`, `openLedgerEntries`, and `remainingTasks` into this skill's result. When inline **`new-plan`** / **`pr-plan`** reports a new child plan, append `{ planPath, planSlug }` to **`outputs.spawnedPlans`** on the next terminal re-emit so Mission Control lane documents include PR plans created inline on this lane.
3. When result carries **`outputs.prShipComplete: true`**: record the PR index on this phase; when **every** PR plan under this phase (per **`### PR list`** on this file or inline **`pr-breakdown`** subtree) is **`ship-complete`**, set **`outputs.phaseShipComplete: true`**, **`outputs.shipPhase: done`**, **`outputs.rowStatus: closed`** for this phase plan.
3a. When result carries **`outputs.parentPlanningFollowUpNotification: "sent"`** with non-empty **`parentPlanningFollowUps`**: append each item to the **phase plan** or bubbled **`parentPlanPath`** **`## Follow-ups`** (create section at EOF if missing); track **`pendingParentFollowUps[]`** on this lane's ledger. **Do not** expand next PR/phase index — scheduling stays on a later turn. Bubble merged fields upstream via **re-emit updated** terminal or **`## Completion (inline)`** per `docs/spawn-ship-contracts.md` § *Upstream parent follow-up notification*.
4. **Re-emit updated terminal** (standalone spawned) or **`## Completion (inline)`** (when invoker runs this skill inline) with **`phaseShipComplete`** and **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`** from spawn **`inputs`** — so **`delivery-phases`** / **`master-planner`** can offer **`expand-next-eligible`** per `docs/spawn-ship-contracts.md` § *Upstream ship-complete notification*.
5. If downstream status is `success` and `continuationStatus: "terminal"`, this phase-planner lane may return `terminal` — unless **`phaseShipComplete`** should bubble upstream while **`continuationStatus: active`** on the parent decomposition lane.
6. If downstream status is `success` or `partial` with active lanes or remaining tasks, return `active`.
7. If downstream status is `failure`, `aborted`, or `abandoned`, return the same status upstream and include downstream errors.

Silence or missing downstream metadata is not completion; return `partial` and keep the phase row open.

#### Parallel **`hosting-repo-rules`** fork after **`coding-session`** terminal (fire-and-forget)

When Step **5e** aggregates a **`coding-session`** child terminal (MCP **`mission_control_send_agent_result`** — spawned from inline **`pr-plan`** §5d or §5f on this phase subtree), evaluate the parallel rules fork **in the same aggregation pass** as **`prShipComplete`** merge — mirror **`master-planner`** Step **7c** *Parallel **`hosting-repo-rules`** fork* semantics on the **phase subtree product PR row**.

**Spawn trigger (all required):**

| # | Condition |
|---|-----------|
| 1 | Plan-anchored run — `outputs.targetPlanPath` present on **`coding-session`** terminal |
| 2 | `outputs.repoRulesReconciliationStatus` is **`pending`** **or** product PR plan §5 lists `.mdc` action bullets not covered by `outputs.reconciledRepoRulesPaths` |
| 3 | Product terminal merge-ready — `outputs.prShipComplete: true` **or** documented deferral on the product row |

**Do not spawn when:** `outputs.repoRulesReconciliationStatus` is **`complete`** or **`skipped-none`**; §5 is `_None — no repo rule updates required for this PR._` only; scope is center/mission governance (route **Alignment Drift Brief** per rule **5** instead).

**When all triggers match:**

1. Emit fire-and-forget child spawn for **`hosting-repo-rules/SKILL.md`** — **same turn** as Step **5e** terminal merge when possible. Call MCP **`mission_control_spawn_agent`** per [Agent messaging (MCP)](#agent-messaging-mcp) and **`hosting-repo-rules/SKILL.md`** spawn contract. **Forbidden:** add the rules child to **`pendingByParent`**, **`activeLanes`** wait sets, or a separate **`shipRows`** entry.
2. Spawn **`inputs`** (from **`coding-session`** terminal + product PR plan):

| Input | Source |
|-------|--------|
| `targetPlanPath` | Product PR plan from **`coding-session`** `outputs.targetPlanPath` |
| `targetPlanSlug` | Same plan slug |
| `sourceCodingSessionCorrelationId` | **`coding-session`** child `correlationId` |
| `pendingRepoRulesPaths` | Gap between §5 bullets and `outputs.reconciledRepoRulesPaths`, or terminal handoff list |
| `repoRulesReconciliationStatus` | Echo from terminal — must be **`pending`** or deferral signal |
| `ledgerParent` | This phase plan slug (`outputs.targetPlanSlug`) or spawn **`inputs.ledgerParent`** |

3. On the **existing product PR row** under this phase subtree, set **`rulesUpdatesStatus: spawned`** and record **`hostingRepoRulesCorrelationId`**. Let the async child update **`rulesUpdatesStatus`** / **`rulesPrUrl`** on return.
4. **Continue phase delivery** — per-PR / phase expand and **`phaseShipComplete`** aggregation proceed **without** waiting on rules PR merge.

**Async rules child terminal merge:** When Mission Control later delivers **`hosting-repo-rules`** child terminal (MCP), match by **`hostingRepoRulesCorrelationId`**. Update product row **`rulesUpdatesStatus`** (`complete` | `failed` | `abandoned`) and optional **`rulesPrUrl`**. **Re-emit updated** terminal (standalone spawned) or **`## Completion (inline)`** (when invoker runs this skill inline) with merged ledger fields.

**Forbidden:** blocking next PR index or phase expand until rules PR merges; separate **`shipRows`** sub-row; adding rules lane to **`pendingByParent`**.

Normative overview: `docs/spawn-ship-contracts.md` § *Parallel **`hosting-repo-rules`** fork* and **`hosting-repo-rules/SKILL.md`** § *Spawn trigger*.

## Step 5f — Implementation handoff after inline pr-plan skip (binding)

When inline **`pr-plan`** merges into this lane with **`prPlanHandoffSkipped: true`** and **`implementationHandoffStatus: not-offered`**, **this phase-planner lane owns the next implementation handoff** — not the Master Plan lane, not a detached **`coding-session`** entry, and not prose redirect.

**Trigger:** inline **`new-plan`** / **`pr-breakdown`** completed inline **`pr-plan`** with **`skipPrPlanHandoffModal: true`** (typical after **`approve-list`** auto-expand of PR index **1**).

**Forbidden:**

- Telling the developer to start **`coding-session`** on another lane, open a detached session, or return to **`master-planner`** Step **7b** without offering spawn on **this** lane first.
- Treating **`skipPrPlanHandoffModal`** or the README spawn table as a permanent ban on spawning **`coding-session`** from **`phase-planner`**.
- Running **`coding-session`** procedures (worktrees, edits, ship chain) inline on this lane — spawn only.

**Required:** Close the turn with structured choice (**`mission_control_present_structured_choice`** or **AskQuestion** tool) per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant**. **`displayMarkdown`** recap: PR plan link, **`readyForImplementation`**, and that §5c was skipped on the inline **`pr-plan`** turn only.

| Option id | Label | Action |
|-----------|-------|--------|
| `start-coding-session` | Start coding session — spawn PR N | Run **§5f spawn** below when §5a-equivalent readiness passes |
| `reenter-pr-plan-5c` | Re-enter inline pr-plan §5c | Load **`pr-plan/SKILL.md`** inline on **this** lane for the same **`targetPlanPath`** and run §5c modal |
| `defer` | Defer implementation | No spawn; keep **`continuationStatus: active`** |
| `more-details` | More details for option _ | Elaborate; re-offer |

**Explicit developer demand to implement** (including strong wording after drift) counts as authorization to run **§5f spawn** — do not require **`master-planner`** §7b or detached entry first.

### §5f spawn — `coding-session` from phase-planner

When the developer picks **`start-coding-session`** (or explicit implement authorization) and planning readiness passes, spawn **`coding-session`** using the same payload contract as **`pr-plan/SKILL.md`** §5d:

1. Resolve **`targetPlanPath`**, **`targetPlanSlug`**, **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`**, **`ledgerParent`**, **`repoPath`** from the inline **`pr-plan`** merge / phase subtree ledger.
2. Set **`planningHandoffApproved: true`** when **`readyForImplementation: true`**; pass **`planningHandoffMode: sections-1-4-complete`**.
3. Set **`upstreamSkill: "phase-planner"`** (not **`pr-plan`**) in spawn **`inputs`**.
4. Cross-check **`../README.md`** § *Universal spawn preflight* and § *MCP spawn preflight* (rows M1–M8) when flag is on; **`skillPath`**: **`coding-session/SKILL.md`** under this mission.
5. **`initiatingPrompt`** must include the same Checkpoint handoff bullets as **`pr-plan/SKILL.md`** §5d step **2** (including § *Checkpoint turn UX* cross-ref when dispatch is Checkpoint trust).
6. Call MCP **`mission_control_spawn_agent`** with **`skillPath`**, dispatch-unique **`slug`**, **`name`** (`PH{parentIndex}-{semantic title}` per rule **50** § *Lane title prefix conventions*), **`description`**, **`inputs`**, optional **`warmUpRules`** / **`initiatingPrompt`** — **no** host-resolved identity keys. Record host-minted **`correlationId`** from tool result in **`outputs.spawnCorrelationId`** when returned.
7. Announce spawn; keep **`continuationStatus: active`**; aggregate child results per Step **5e**.

**Do not** re-run inline **`pr-plan`** §5c on the same turn unless the developer picked **`reenter-pr-plan-5c`**.

## Phase delivery ownership (binding)

After §§ 1–4 are drafted on this lane, **this phase-planner child lane owns phase delivery** until one of the terminal conditions below. The **Master Plan agent** (`master-planner` lane) must **not** re-offer §6 route menus, **`pr-breakdown`** approval, or phase-scoped expand options for the same phase while this lane is active.

In recaps, **link the target phase `.plan.md` first** — § 5 **`PR breakdown`** lives on that file for single-PR and multi-PR routes.

**Owns on this lane (through ship-complete or explicit defer/abandon):**

- Route approval after §§ 1–4 (**Step 5b** / **5c** structured choice)
- Inline **`delivery-phases`** / **`pr-breakdown`** on **this phase plan** (**§ 5b-decompose** — invoker lane stays **phase-planner**)
- Inline **`new-plan`** / **`pr-plan`** and nested **`phase-planner`** / **`coding-session`** spawns from that subtree
- Per-PR and phase ship aggregation (**Step 5e**)

**Terminal conditions** — set **`continuationStatus: terminal`** and bubble upstream **only** when:

1. **`outputs.phaseShipComplete: true`** — every PR under this phase is ship-complete per Step **5e**, **or**
2. The developer explicitly **defers** or **abandons** this phase subtree via structured choice, **or**
3. Unrecoverable **`failure`** / **`aborted`** on this lane with no retry path

**Forbidden while phase delivery is in progress:**

- Returning **`continuationStatus: terminal`** immediately after §§ 1–4 draft or route approval when inline decomposition or child lanes remain — use **`active`** and keep **`continuationOwner: "phase-planner-agent"`**
- Emitting a MCP result call that causes **`master-planner`** Step **7b** to offer **`route-6`**, **`pr-breakdown`**, or phase-scoped **`expand-eligible`** / **`expand-next-eligible`** for work this lane still owns
- Telling the developer to continue phase decomposition on the **Master Plan** lane when this **phase-planner** child lane is open — including *"run **`pr-breakdown`** on the **`master-planner`** lane"* or *"return to Master Plan agent / Step 7"* when **§ 5b-decompose** applies
- Calling **`mission_control_refocus_parent_lane`** while this child still owns **active** phase delivery (**`continuationStatus: active`**, open PR rows, or §5f pending) — refocus steers the developer to the parent lane and is equivalent to forbidden Master Plan handoff; **Required** only on true terminal per **§ MCP parent refocus** under **`## Completion (spawned)`**

When child terminal results bubble to inline **`new-plan`** / **`delivery-phases`** / **`master-planner`**, parents **acknowledge only** until **`phaseShipComplete`** or explicit defer/abandon — see **`new-plan`** step **5**, **`delivery-phases`** step **6b**, and **`master-planner`** Step **7b** *Phase-planner child active*.

## One choice per turn — surface observations

Match the discipline in **`master-planner`**: perform exactly what was chosen; do not silently expand scope. If you notice gaps (parent Changes bullets that do not map to a phase, diagram simplifications, assessment vs parent hint mismatch), list them as short **numbered notes** in **`displayMarkdown`** and apply **Step 5-open-items**: one scoped `questions[]` entry per note or batch item, then the current terminal phase-planner gate question last.

## Scope guard

This skill writes the **body** of the target phase plan — replacing the **`new-plan`** stub (or filling `_TBD_` placeholders) with the Phase plan template through §§ 1–4 plus **`### Decomposition assessment`**.

**Owns:** in-file §§ 1–4 + assessment; echo to chat for review.

**Out of scope here:** target plan frontmatter (left as **`new-plan`** set it); **link-only** updates on the ancestor **`Delivery phases`** row **N** (`Phase plan:` phase link; **`Plan:`** PR link after **`new-plan`** — **not** row-scoped PR breakdown blocks on the ancestor); § 6 Caveats (**inline `delivery-phases`** / **`pr-breakdown`** own those); spawning **`delivery-phases`** or **`pr-breakdown`** child lanes — those skills run inline; **`new-plan`** after § 5 exists is owned by inline decomposition; git / commit automation.

Wrong template stops live in step 1a — use **`master-planner`** or **`pr-plan`** protocol branches when the file is a Master Plan or PR plan.

Complete the step 5 handoff block, inline decomposition handoff, and any child-lane wait announcement **before** the MCP result call when spawned. When a wait ends the assistant turn, close with structured choice per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** — then stop after the MCP result call when applicable (see **`../README.md`** § *Terminal stop (normative)*).

## Completion (spawned)

### MCP result preflight (`mission_control_send_agent_result`)

| Step | Check |
|------|--------|
| R1 | Call **`mission_control_send_agent_result`** with **`status`**, **`summary`**, optional **`outputs`** / **`errors`** |
| R2 | **Forbidden args absent** — no **`correlationId`**, **`dispatchId`**, **`slotId`**, or other host-resolved keys |
| R3 | Populate **`outputs`** from the required field list below |
| R4 | Re-emit updated MCP result after user-requested follow-up on this lane (same spawn session; host resolves **`correlationId`**) |
| R5 | **`mission_control_refocus_parent_lane`** — **Required** when eligible per § *MCP parent refocus*; **forbidden** when **`outputs.continuationStatus`** is **`active`**, when **`outputs.phaseShipComplete`** is not **`true`**, when open PR rows or **`remainingTasks`** remain under this phase subtree, or when §5f implementation handoff was not yet offered while handoff is pending |

### MCP parent refocus (`mission_control_refocus_parent_lane`)

| Signal on this terminal | Refocus? |
|-------------------------|----------|
| **`continuationStatus: active`** | **Forbidden** |
| **`phaseShipComplete: false`** with open **`### PR list`** rows or non-empty **`remainingTasks`** | **Forbidden** |
| **`prPlanHandoffSkipped: true`** and §5f / **`implementationHandoffStatus: not-offered`** | **Forbidden** — work remains on this lane |
| Notify-only turns (child notification merge without skill terminal) | **Forbidden** |
| **`phaseShipComplete: true`**, explicit defer/abandon, or unrecoverable failure with no retry | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "phase-planner-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above.

**Binding:** Do **not** treat the first **`status: success`** terminal (§§1–4 drafted, inline **`pr-breakdown`**, PR 1 expanded) as skill completion eligible for parent refocus. **`mission_control_refocus_parent_lane`** is **not** the mechanism for notifying **`master-planner`** of progress — parent **ack-only** until **`phaseShipComplete`** per **`master-planner`** Step **7b**.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Required `outputs` fields:

- `outputs.targetPlanPath`, `outputs.targetPlanSlug`
- `outputs.parentPlanPath`, `outputs.parentPlanSlug`, `outputs.parentIndex`
- `outputs.decompositionAssessment`
- `outputs.routeDecision` — `delivery-phases` | `pr-breakdown` | `needs-user-decision`
- `outputs.routeApprovalStatus`, `outputs.prBreakdownShape` — `single` | `multi` | `unknown`
- `outputs.spawnedPlans` — **required whenever** inline **`delivery-phases`** / **`pr-breakdown`** / **`new-plan`** / inline **`pr-plan`** created child `.plan.md` files under this phase subtree. Array of `{ "planPath": "<absolute path>", "planSlug": "<slug>" }` (string paths allowed). Include **every** accumulated child PR/phase plan on **each** terminal re-emit — Mission Control lane documents ingest `spawnedPlans` from terminal `outputs`.
- `outputs.activeLanes`, `outputs.openLedgerEntries`, `outputs.remainingTasks`
- `outputs.continuationOwner`: `"phase-planner-agent"`
- `outputs.continuationStatus` — `active` while route approval, inline decomposition, nested **`phase-planner`** / **`coding-session`** child lanes, or phase ship work remains; `terminal` only per **Phase delivery ownership** ( **`phaseShipComplete`**, explicit defer/abandon, or unrecoverable failure)
- `outputs.phaseShipComplete` — `true` when every PR under this phase is ship-complete (§5e)
- `outputs.prShipComplete` — echo when aggregating a **`coding-session`** terminal for a PR under this phase
- Product PR row ledger (parallel rules fork) — per affected PR row when Step **5e** spawns or merges **`hosting-repo-rules`**: **`rulesUpdatesStatus`** (`not-spawned` | `spawned` | `in-progress` | `complete` | `failed` | `abandoned`), optional **`hostingRepoRulesCorrelationId`**, optional **`rulesPrUrl`**
- `outputs.parentPlanningFollowUpNotification`, `outputs.parentPlanningFollowUps`, `outputs.pendingParentFollowUps` — when §5e merged child parent follow-up notification

Stop after the MCP result call. Do not emit another child spawn for **`delivery-phases`** or **`pr-breakdown`** (see **`../README.md`** § *Terminal stop (normative)*).

## Completion (inline)

Report the fields below in prose to the invoker on the **same lane**. Do **not** emit terminal **`mission_control_send_agent_result`** or call **`mission_control_send_agent_result`** for **`phase-planner`** inline completion. Do **not** emit `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*). **Exception:** nested **`phase-planner`** or **`coding-session`** spawns from inline decomposition on this lane use [Agent messaging (MCP)](#agent-messaging-mcp).

**Primary path:** **`new-plan`** spawns this skill on a child lane. If another invoker runs inline, use the same `outputs` semantics as **`## Completion (spawned)`** in prose only.
