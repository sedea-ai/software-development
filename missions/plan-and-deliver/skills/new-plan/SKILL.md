---
name: new-plan
description: >-
 Scaffold a new `.plan.md` plus `.state.yaml` sidecar under the dispatch-scoped plans union
 (`.sedea/operations/.../plans/` via explicit handover paths — not user-id path construction),
 with required frontmatter (name, overview, todos, isProject) and `parent` only in the sidecar. Resolves
 parent per planning-target-resolution; confirms parent before write except on
 indexed child spawn when parent + index N are already locked by session context,
 or when `upstreamSkill` is `debug-and-fix` (standalone root `parent: null` pre-locked).
 After an indexed handoff, may run **pr-plan** inline or spawn **phase-planner**. When run inline from
 **delivery-phases** or **pr-breakdown** under **master-planner**, reports Completion (inline) to the invoker.
 When spawned from an upstream decomposition agent that already approved the parent list, skips the child-stub populator approval
 modal and runs the populator immediately. Use under mission dispatch or
 when the developer asks to scaffold a plan via **new-plan** (standalone) or expand
 a parent list item **N** (indexed-child) from a numbered dual-title list.
designation:
  allowed: Ignite plan stubs from parent decomposition; operations plan sidecar rows
  forbidden: Application implementation; worktree ship; inline product code edits
inputs:
  mode:
    type: string
    description: Creation mode. Use indexed-child when expanding a parent list row; use standalone for ordinary new plans.
    required: false
    default: standalone
  parentPlanPath:
    type: string
    description: Parent plan path. Required when mode is indexed-child.
    required: false
  parentPlanSlug:
    type: string
    description: Parent plan slug. Required when mode is indexed-child.
    required: false
  index:
    type: number
    description: One-based child index from the parent's Delivery phases or PR list. Required when mode is indexed-child.
    required: false
  childKind:
    type: string
    description: Expected child body type, usually phase-planner or pr-plan. Required when mode is indexed-child.
    required: false
  requestedPopulatorSkill:
    type: string
    description: Optional populator skill to spawn after the child stub is wired.
    required: false
  decompositionKind:
    type: string
    description: Parent decomposition kind that produced this child, usually delivery-phases or pr-breakdown.
    required: false
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from the upstream decomposition agent.
    required: false
  upstreamSkill:
    type: string
    description: Skill that requested this child creation.
    required: false
  parentAgentRole:
    type: string
    description: When delivery-phases-agent or pr-breakdown-agent, report Completion (inline) to the invoker instead of mission_control_send_agent_result.
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/new-plan/SKILL.md"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
---

# New plan

Scaffold a standalone `.plan.md` and `.state.yaml` under the **dispatch-scoped plans union** (flat `.../plans/` directory from spawn handover or resolved parent plan path — see **Slug and filename**). On first write, frontmatter must be valid YAML and match the shape Sedea tooling expects (see **Write the plan template** and naming guidance in `.sedea/centers/software-development/docs/development-process.md` plus `.sedea/centers/software-development/rules/10_plan-naming-convention.mdc`).

**Resolution contract:** read `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` and follow it for target selection and snapshots. Resolve parents using **§ Parent derivation** below (explicit session/message → `plan-state resolve` → recent chat references).

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Default warm-up*. Often runs **inline** on invoker lane; manifest applies at spawn and warm-up replay. Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. **384 KiB cap:** frontmatter omits **`plan.mdc`**, **`development-process.md`** — explicit **`Read`** at named protocol steps. **No `alwaysApply` frontmatter flip.**

### `bootstrapRules` — host-resolved (Software Development center layer)

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap (≤10 KB); host merges when `centerSlug === software-development` |

### `skillWarmUp` — frontmatter `warmUpRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Slim spawn contracts, terminal stop |
| `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` | Target resolution, depth-first gates |

**Omitted from frontmatter (384 KiB spawn cap — runtime `Read`):** `plan.mdc`, `development-process.md` — load at named protocol steps. **`planning-mode-templates.md`** is intentionally omitted on the indexed-child stub path — inline **`pr-plan`** owns template **`Read`** when populating from Planning Modes templates.

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice, AskQuestion |
| `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` | Planning target resolution (role minimum) |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/new-plan/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight M1–M9, definitive `laneRules` |

## Agent messaging (MCP)

**MCP spawn/result skill.** Parent→child spawn and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*.

| Action | MCP tool |
|--------|----------|
| Parent spawn (when this skill emits a child lane) | **`mission_control_spawn_agent`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- Inline skills on this mission stay **inline-only** — no spawn wire change unless the protocol step explicitly spawns a child lane.
- **Relevant Links (post-write):** After scaffolding or materially editing `.plan.md` / `.state.yaml` under the plans union, call MCP **`mission_control_update_relevant_documents`** with the absolute plan path (`kind: plan`) — same turn preferred. **Skip** read-only loads and unchanged already-registered paths. Does **not** replace terminal `planPath` / `planSlug` outputs. See **`../README.md`** § *Relevant Links — post-write registration*.


## Triggers

Invocation context examples (mission dispatch and structured choices):

- Mission dispatch or explicit request to run **`new-plan`** (standalone or indexed-child).
- Natural language: scaffold a new plan file …; expand list item **N** under a parent’s `Delivery phases` or `### PR list` (then usually **`phase-planner`** or **`pr-plan`** on the child path).
- Free-form (“I need a plan for …”) — confirm scope, then **`new-plan`** standalone or indexed-child per **30_planning-target-resolution**.

The **developer** selects continuation per **30_planning-target-resolution** § *Sedea input channel*.

## Checkpoint turn UX (skill-local)

### Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.


Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`new-plan`**; invoker skills **`master-planner`**, **`delivery-phases`**, **`pr-breakdown`**, and **`quick-fix-plan`** document upstream decomposition gates — see those skills' § *Checkpoint turn UX* and **`quick-fix/plan.mdc`** §4 inline chain.

**Real-dispatch test loop (binding):** After merge, run one full **`new-plan`** spawn on a Checkpoint dispatch through Step **3** and collect a developer verdict before the parent phase advances the next **`new-plan`** step PR — per **Planning protocol skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **Indexed child validation** (1–4) | Auto-advance on spawned handoff with locked `inputs` | exception: depth-first block / row problems |
| **Parent derivation** (standalone) | Auto-advance when parent locked (incl. `debug-and-fix` null root) | **Gate** when parent unresolved |
| **Write stub + sidecar** | Auto-advance | — |
| **After write 1–2** — parent `Plan:` link + child link | Auto-advance on happy path | open items per modal contract |
| **Auto-authorize populator** | Auto-advance (skip step 3) when upstream `delivery-phases` / `pr-breakdown` | — |
| **3** — Populator approval | **Gate** when auto-authorize does **not** apply — **first developer-pick gate on spawned lane** | [Populator approval gate](#populator-approval-gate-binding) |
| **4** — Populator handoff | Auto-advance after step 3 approval or auto-authorize | external-wait on spawned **`phase-planner`** — [Phase-planner spawn external-wait](#phase-planner-spawn-external-wait-binding); inline **`pr-plan`** follows that skill's gates |
| **5 / 5b** — Aggregate child results | External-wait on host-delivered child results; auto-advance merge on happy path | [Phase-planner spawn external-wait](#phase-planner-spawn-external-wait-binding) when child lane open |
| **6** — Non-indexed spawns | **Gate** when protocol branch pick required | [Non-indexed protocol branch gate](#non-indexed-protocol-branch-gate-binding) |

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path** stub write, parent `Plan:` link verification, and auto-authorize populator handoff **auto-advance without a turn-end modal**. **Developer-input** gates — parent confirmation (standalone), populator approval (step **3**), and non-indexed protocol branch (step **6**) — **must** close with **`mission_control_present_structured_choice`** / **AskQuestion**.

**Forbidden:** prose-only parent confirmation (*reply yes*, *OK?*) or idle child-wait handoff without structured resume options — conduct **1** § *No idle handoff*.

**Implicit external-wait** (host may deliver **`mission_control_send_agent_result`** from spawned **`phase-planner`** or inline **`pr-plan`** → **`coding-session`**) still requires [Phase-planner spawn external-wait](#phase-planner-spawn-external-wait-binding) or step **5b** resume structured choice before turn end per rule **2** § *External-wait / next-step modal* — **not** prose-only *waiting for child*.

**Forbidden:** classifying populator approval or parent confirmation as external-wait; ending step **4** after **`phase-planner`** spawn without structured resume options.

### Parent derivation confirmation gate (binding)

When **Parent derivation** runs on standalone / non-indexed path and parent is resolved but not yet confirmed (indexed-child spawn and **debug-and-fix null-root lock** skip this gate):

USER_CHECKPOINT — confirm parent slug or root delivery plan before writing stub files.

| Option id | Label (brief) |
| --- | --- |
| `confirm-parent` | Confirm parent — write stub now |
| `paste-different-slug` | Paste different parent slug |
| `use-null-root` | Use null root delivery plan |
| `defer` | Defer scaffold |
| `more-details` | More details for option _ |

- Apply **Parent derivation — Open-item modal contract** when multiple parent candidates remain — this confirmation question stays **last** in `questions[]`.
- **`defaultOptionId: confirm-parent`** when a single candidate is locked and no blocking open items remain.
- **Next-step resolution:** Auto-advance to stub write when parent is pre-locked by indexed-child spawn — no `USER_CHECKPOINT` on that path.
- **Skip (debug-and-fix null root — binding):** When spawn **`inputs.upstreamSkill`** is **`debug-and-fix`** (or **`initiatingPrompt`** / handover explicitly pre-locks root **`parent: null`** for code-promotion standalone), set sidecar **`parent: null`**, acknowledge in one line — `Parent: null (root delivery plan — locked by debug-and-fix)` — and **auto-advance** to stub write. **Forbidden:** treating that null as an error or missing parent; opening this confirmation gate (`confirm-parent` / `use-null-root`) for that spawn.

### Phase-planner spawn external-wait (binding)

After step **4** emits **`mission_control_spawn_agent`** for **`phase-planner`**, close the **same turn** with structured choice — **not** prose-only child-wait handoff.

USER_CHECKPOINT — phase-planner child lane spawned; pick resume path when child result arrives or to defer.

| Option id | Label (brief) |
| --- | --- |
| `child-result-received` | Child result received — merge per step **5** |
| `continue-on-child-lane` | Continue on phase-planner child lane |
| `defer-populator` | Defer population — keep stub only |
| `more-details` | More details for option _ |

- Host delivery of **`mission_control_send_agent_result`** from the **`phase-planner`** child may resume this lane — merge per step **5** before terminal MCP result.
- **Forbidden:** terminal **`mission_control_send_agent_result`** solely because spawn was emitted; prose-only child-wait handoff without modal options per rule **2** § *External-wait / next-step modal*.

### Non-indexed protocol branch gate (binding)

When step **6** applies (standalone spawn without `requestedPopulatorSkill`):

USER_CHECKPOINT — pick next protocol branch after stub write on this lane.

| Option id | Label (brief) |
| --- | --- |
| `fill-stub` | Fill stub sections on this lane |
| `run-pr-plan` | Run inline pr-plan when child stub is PR-shaped |
| `run-phase-planner` | Hand off to phase-planner when stub is phase-shaped |
| `defer` | Defer — return partial result |
| `more-details` | More details for option _ |

- **Next-step resolution:** Auto-advance through indexed-child path steps **1–5** — step **6** gate applies only on non-indexed standalone spawns.

### Inline handoff — **new-plan** → **`pr-plan`** (step 4)

When `requestedPopulatorSkill` is **`pr-plan`**, run that skill **inline on this lane** — **do not** emit **`mission_control_spawn_agent`** for **`pr-plan`**. Load `.sedea/centers/software-development/missions/plan-and-deliver/skills/pr-plan/SKILL.md`, construct inline context from the table below, follow that skill’s steps, and merge its **`## Completion (inline)`** fields into this skill’s ledger (`spawnedPlans`, `activeLanes`, `openLedgerEntries`, `remainingTasks`, `readyForImplementation`, `implementationHandoffStatus`). Inline **`pr-plan`** may still spawn **`coding-session`** per **`pr-plan`** §5d; this lane aggregates that child result per step **5b**.

| Inline context field | Value |
|----------------------|--------|
| `targetPlanPath` | Absolute path to the child stub `.plan.md` just written |
| `targetPlanSlug` | Slug from filename |
| `parentPlanPath` | Absolute path to the parent `.plan.md` |
| `parentPlanSlug` | Parent slug from spawn inputs |
| `parentIndex` | `index` from spawn inputs |
| `parentAgentRole` | `"new-plan-agent"` |
| `ledgerParent` | `ledgerParent` from spawn inputs when present |
| `upstreamSkill` | `"new-plan"` — forward spawn **`inputs.upstreamSkill`** when present (for example **`debug-and-fix`**) into inline **`pr-plan`** context |
| `parentRowSingleConcern` | From **`pr-breakdown`** inline handoff when present — PR description seed for item **N** |
| `skipPrPlanHandoffModal` | `true` when `autoChainFirstPr: true` from **`pr-breakdown`** **`approve-list`** auto-expand; **`true`** when spawn **`inputs.debugExitConfirmed: true`** with **`upstreamSkill: debug-and-fix`**; otherwise omit or `false` |
| `debugExitConfirmed` | `true` when spawn **`inputs.debugExitConfirmed: true`** (Squad Leader §5 debug code-promotion cascade) — forward to inline **`pr-plan`** |

When `requestedPopulatorSkill` is **`phase-planner`**, run § *Populator registry lookup — phase-planner* before step **4** spawn. When lookup finds an existing slug → **`mission_control_notify_child_lanes`** per **`../README.md`** § *Spawn vs notify* and report **`## Completion (inline)`** to invoker — **forbidden** duplicate spawn. When no slug → emit **`mission_control_spawn_agent`** per step **4**.

### Populator registry lookup — phase-planner (binding)

Before **`mission_control_spawn_agent`** for **`phase-planner`** on indexed-child path:

1. Resolve **`targetPlanPath`** from the child stub (existing link on parent row **N** or path about to be written).
2. Look up prior **`phase-planner`** slug from **`activeLanes`**, invoker **`spawnedPlans`**, or lane registry by **`targetPlanPath`** + **`parentIndex`**.
3. **Match found (active or terminal):** notify that slug; skip spawn; return **`populatorHandoff: notify-existing-phase-planner`** in **`## Completion (inline)`**.
4. **No match:** proceed with step **4** spawn unchanged.

When **`parentAgentRole`** is **`delivery-phases-agent`** or **`pr-breakdown-agent`** (this skill run **inline** from decomposition under **`master-planner`**), report **`## Completion (inline)`** to the invoker — do **not** emit **`mission_control_send_agent_result`**.

## Indexed child spawn (parent list item **N**)

This path applies when **before this skill runs** the parent `.plan.md` and the child index **N** are already resolved per **planning-target-resolution** (explicit path, snapshot choice, or mid-flow continuation after an **AskQuestion** pick of list index **N**). It expands one row from the parent’s dual-title section into its own plan file beside sibling plans.

When `mode: "indexed-child"` is supplied, treat the indexed path as mandatory and fail fast if any of `parentPlanPath`, `parentPlanSlug`, `index`, or `childKind` is missing. Do not fall back to free-form parent discovery in indexed-child mode; the upstream decomposition agent already locked the row, and guessing a parent would corrupt the plan tree.

The regular parent-confirmation gate below is **skipped** when that pre-resolution is explicit: acknowledge in one line — `Parent: <slug> (from <source>)` — then proceed to slug + filenames.

**Stub vs full template.** Indexed-child files use the **generic** scaffold in *Write the plan template* below (`## Overview`, `## Phasing`, `## Out of scope`). **`phase-planner`** or **`pr-plan`** replaces that body with the Phase or per-PR template — intentional two-step split; see **`.sedea/centers/software-development/docs/development-process.md`** (§ *§ 6 / § 5 contents rule*, **Indexed-child stub** paragraph).

1. **Read item N** from the parent’s dual-title section. Where the numbered list lives depends on the section heading:
 - **`Delivery phases`** (mode #2): the numbered list is the body of `## 6. Delivery phases` (Master Plan) or `## 5. Delivery phases` (Phase plan).
 - **`PR breakdown`** (mode #3): the numbered list is only under `### PR list` inside `## 6. PR breakdown` (Master) or `## 5. PR breakdown` (Phase). Ignore `### Single-concern strategy` and `### Sequencing` for index resolution.

 The **seed** for the child title is the **bolded title** on item **N**’s first line — strip the list marker (`1. `, …) and `**` markers. **Display title** (`name:` + H1) uses **sentence case** plus optional `<N>. ` prefix per § **Slug and filename** / **Write the plan template** → **Rules**. **Slug base** for filenames normalizes from the **raw** bolded string (before sentence case).
2. **Validate the requested child kind against the parent heading.**
 - `Delivery phases` parent heading requires `childKind: "phase-planner"` and `requestedPopulatorSkill: "phase-planner"` when a populator is requested.
 - `PR breakdown` parent heading requires `childKind: "pr-plan"` and `requestedPopulatorSkill: "pr-plan"` when a populator is requested.
 - If the requested kind conflicts with the parent heading, stop with `failure`; do not create a child file.
3. **Capture the exact `Plan:` line for item N.** The selected row must contain exactly one `Plan:` line. Accept `_TBD`, `_TBD_`, or a clear spawn-hint placeholder after `Plan:` for **new** stubs. When the row **already links** a `.plan.md`, **do not** create a duplicate child — run § *Populator registry lookup — phase-planner* (or equivalent for **`pr-plan`**) and notify the existing populator lane per rule **4** § *Spawn vs notify*; return **`partial`** only when lookup cannot resolve a slug and the parent link is untrusted. If the row has no `Plan:` line or has multiple `Plan:` lines, stop with `partial` and report the row problem.
4. **Capture parent row prose for the child stub.** When item **N** includes sub-bullets per the dev-process **§ 6 / § 5 contents rule** (decomposition decision, scope sentence, `Plan:`), treat that text as **already reviewed on the parent** — copy the scope sentence (and optional decomposition line) into the child `overview:` and `## Overview` when writing the stub. Do **not** ask the developer to re-approve that prose.

### Indexed child — Open-item modal contract

Apply the shared planning open-item contract from `../README.md` § *Planning open-item modal contract* when indexed-child validation surfaces multiple unresolved items before or after stub write: parent **`Plan:`** placeholder shape problems, duplicate or missing `Plan:` lines, child-kind vs parent-heading mismatch recoverable with developer input, thin or ambiguous parent row prose for the stub, depth-first eligibility blockers that need explicit defer/override, child stub YAML or overview issues, or blocked parent-link verification after write.

**When open items exist** — use **one modal with multiple `questions[]` entries**:

- **`displayMarkdown`:** numbered list — each item cites parent list item **N**, the `Plan:` line or stub field affected, the gap, why the decision matters for the plan tree, and the agent's proposed resolution options.
- **`askQuestion.questions`:** one scoped question per open item (for example `fix-plan-placeholder`, `accept-stub-overview`, `override-eligibility`, `revise-row-prose`, `defer`, `more-details`). **Forbidden:** one combined question mixing placeholder, stub, and populator decisions.
- **Final question:** append the normal terminal gate for the current step: confirm indexed expand, revise stub, defer population, abandon child, or approve populator handoff — per step **3** populator approval or post-write verification. **Forbidden:** resolve-only modals without the terminal routing question.
- **Many open items:** batch across turns when needed; each batch still ends with the terminal indexed-child gate question as the final `questions[]` entry.

**When no open items remain** — proceed with stub write, parent `Plan:` replacement, or populator handoff using the existing single terminal gate.

**Stop conditions**

- Heading still `Delivery phases | PR breakdown` or body `_TBD_` — stop; run **`delivery-phases`** or **`pr-breakdown`** (mission / structured choice) to decide decomposition first.
- **`PR breakdown`** but `### PR list` missing or `_TBD_` — stop; run **`pr-breakdown`** to draft the list first.
- Item **N** absent — stop; extend the parent list with the relevant skill, or pick a valid index.
- Requested `childKind` conflicts with the parent heading — stop; fix the upstream spawn request.
- Item **N** already has a linked `Plan:` target — stop with `partial`; report the existing target instead of creating a duplicate.
- **Depth-first eligibility failed** — stop with `partial` or `failure` and one-line reason:
 - **`Delivery phases` parent:** index **N > 1** and phase **N−1** is not **ship-complete** on §8 (`shipPhase: done`, `rowStatus: closed`, or explicit defer/abandon on the leader dispatch). See **development-process.md** § *Depth-first plan-tree traversal* and **30_planning-target-resolution** § *Depth-first expansion eligibility*.
 - **`PR breakdown` parent:** index **N** is not in the eligible set parsed from **`### Sequencing`** (prior sequential PR or prior parallel stage not ship-complete).
- **N ≥ 36** — stop with the wide-branching message (single-character filename prefix supports items **1–35**).

**Non-indexed name on the same pre-resolved parent:** if the session supplies a **free-text child name** instead of digit-only **N**, use that string as the plan name (sentence case rules apply); keep the parent from context; still skip the confirmation gate only when resolution rules say the parent is already locked.

**`N` alone with no name:** fall through to prompting for a name inline; parent stays as pre-resolved.

**Placement:** child files live in the same **flat** `plans/` directory as their siblings (the dispatch-scoped plans tree from spawn handover). Indexed children and every other plan file use that single folder — no extra plan subfolders for now.

Everything else (slug shape, frontmatter, sidecar, after-write steps, scope guard) matches the non-indexed path below.

## Parent derivation (context-aware)

A plan without a parent is a **root delivery plan** (`parent: null` in the sidecar) — files always live in the flat `plans/` directory for the active dispatch scope. There is **no** `roadmap-topics/` subtree for new plans. Resolve a candidate in this order (align with **planning-target-resolution**; highest confidence first), then confirm before writing (unless **Indexed child spawn** or **debug-and-fix null-root lock** already skipped the gate):

0. **Pre-locked null root (`upstreamSkill: debug-and-fix`)** — when spawn **`inputs.upstreamSkill`** is **`debug-and-fix`**, or handover / **`initiatingPrompt`** states null parent is expected and approved for standalone code-promotion: lock **`parent: null`**, acknowledge once, **skip confirmation**, continue to stub write. Do **not** fall through to steps 1–4 as if parent were missing.
1. **Explicit in session or message** — slug, path under `plans/`, or absolute `.sedea/operations/.../*.plan.md`.
2. **Session anchor** — from hosting repo root:

 ```bash
 node .sedea/centers/software-development/missions/plan-and-deliver/scripts/plan-state.mjs resolve --cwd "$PWD"
 ```

 Exit **0** means `$PWD` is inside a worktree listed in some plan’s sidecar; that plan is a strong passive parent candidate. Prefer explicit **`parentPlanPath`** / **`targetPlanPath`** from spawn **`inputs`** when present.
3. **Recent chat references** — last turns name a slug or absolute plan path.
4. **Nothing resolved** — ask the developer for a parent slug, or the literal `null` for a **root delivery plan** (`parent: null`).

Lock the parent using the bullets above; **planning-target-resolution** is normative for combining signals.

**Confirm** before writing on this path (unless **Indexed child spawn** or **debug-and-fix null-root lock** already skipped the gate). Wrong parent is the expensive failure mode.

### Parent derivation — Open-item modal contract

Apply the shared planning open-item contract from `../README.md` § *Planning open-item modal contract* when **parent derivation** surfaces multiple unresolved items: conflicting parent candidates, ambiguous session anchors, missing explicit `null` vs slug choice, or thin scope for a standalone root plan.

**When open items exist** — use **one modal with multiple `questions[]` entries**:

- **`displayMarkdown`:** numbered list of open items. For each item, include the candidate parent slug/path, the gap or conflict, why the parent choice matters for the plan tree, and the agent's proposed resolution options.
- **`askQuestion.questions`:** one scoped question per open item, with its own stable `id`, `prompt`, and item-only `options` (for example `accept-parent-candidate`, `use-null-root`, `paste-different-slug`, `defer`, `more-details`). **Forbidden:** one combined question whose options mix decisions for several parent candidates.
- **Final question:** always append the terminal **new-plan** parent-confirmation question last in the array: confirm write with resolved parent (or `null` for root), revise parent choice, defer scaffold, **More details for option _**. **Forbidden:** a resolve-only modal that omits parent confirmation until every item is cleared.
- **Many open items:** batch across turns when needed; each batch still ends with the terminal parent-confirmation question as the final `questions[]` entry.

**When no open items remain** — use the existing single terminal parent-confirmation question (confirm write · paste different slug · `null` root · defer · **More details for option _**).

Example recap line when no open items:

> Parent: `<parent-slug>` (from `plan-state resolve`). Open [Parent derivation confirmation gate](#parent-derivation-confirmation-gate-binding) to confirm write, paste a different slug, or `null` for a **root delivery plan**.

## Slug and filename

- **Name:** what the developer supplied (e.g. `Phase 4 rollout`), or derived from indexed spawn rules.
- **Filename prefix (indexed spawn, digit-only N):** single character `<C>` — digits `1`–`9` for items 1–9, letters `A`–`Z` for 10–35 (`10` → `A`, …). For indexed digit-only **N**, prefix `<C>_` on the basename; for free-named children and plain new plans, omit that prefix.
- **Title prefix (indexed spawn):** prepend `<N>. ` to **display title** in `name:` and H1; item 10 uses filename `A_...` but title prefix `10. `. Apply this prefix only for indexed digit-only **N**; omit for other spawns.
- **Slug base (indexed):** from raw bolded title only (normalized). **Slug base (non-indexed):** from user name, lowercased, spaces → `_` or `-`, match sibling conventions.
- **Suffix:** append 8 hex chars (e.g. `crypto.randomBytes(4).toString('hex')`) for uniqueness.
- **Paths:** under the dispatch-scoped flat `plans/` directory (same folder for `.plan.md` and `.state.yaml`). Indexed: `<C>_<slugBase>_<hex>.plan.md` / `.state.yaml`; otherwise `<slugBase>_<hex>.plan.md` / `.state.yaml`.

All new plans are sibling files in the flat `plans/` directory for the active dispatch scope. **Root delivery plan** means `parent: null` in the sidecar — same flat `plans/` path as child plans; never scaffold under `roadmap-topics/`.

### Handling 10–35 children

Letter mapping for items 10–35: `A` = 10 through `Z` = 35. Re-numbering siblings after reordering the parent list is **manual**: update filenames, sidecars, `Plan:` links, and title prefixes together when list order changes.

## Write the plan template

Two artefacts in one skill turn.

### 1. `<slug>.plan.md`

```markdown
---
name: <display name>
overview: <one-line overview the user gave, or inferred from the name>
todos:
 - id: <first_todo_slug>
 content: <describe the first concrete step>
 status: pending
isProject: false
---

# <display name>

## Overview

<free-form — mirror the overview field, expand if the user gave more context>

## Phasing

<stub: "TBD — fill in when scope settles.">

## Out of scope

<stub>
```

**Rules**

- **Display name** — indexed: `<N>. ` + sentence-cased bolded title. Non-indexed: sentence-cased user name; include a literal `<N>. ` prefix only when the user supplied it as part of the name.
- **Sentence case** for `name:`, H1, and (indexed) parent `Plan:` link text — see development-process tone. For indexed spawn, keep **slug** / filename base tied to the **raw** list line; apply sentence case to display fields only.
- **`parent:`** — record in **`<slug>.state.yaml`**; `.plan.md` frontmatter carries `name`, `overview`, `todos`, `isProject`, and related fields so Plan tooling keeps a stable shape.
- **Seed `todos:`** with one real first todo unless the developer asked for scope-only with empty todos.
- **`isProject: false`** unless they asked otherwise.
- **YAML quoting** — wrap `name:`, `overview:`, todo `content:` in double quotes when the value contains `: ` or ends with `:`, starts with YAML-significant characters, looks like `true`/`false`/`null`, etc. Re-read after write; if `name:` parsed as a nested object, re-quote.
- **Indexed child — parent row prose** — when step 4 under **Indexed child spawn** captured a scope sentence from item **N**, use it for `overview:` and `## Overview` instead of inventing new scope. Keep `## Phasing` as a short stub (for example *TBD — filled by phase-planner / pr-plan or follow-up decomposition.*). Do **not** treat parent-list prose as needing a second developer approval pass.

### 2. `<slug>.state.yaml`

```yaml
# Sidecar for operations plan runtime. Plan: <slug>.plan.md
parent: <resolved-parent-slug-or-null>
worktrees: []
prs: []
```

Always write the sidecar. `parent:` required; use YAML `null` unquoted for a **root delivery plan** or an explicit parent slug. Header comment matches `plan-state.mjs` output style.

## After writing

1. **Indexed spawn only — parent `Plan:` placeholder.** Under item **N** in `Delivery phases` or `### PR list`, replace the `_TBD` placeholder line for `Plan:` (whatever exact placeholder the parent template used — often a spawn hint at the same indent as sibling bullets) with a **relative** Markdown link to the child file: `[<sentence-cased title without N. prefix>](<slug>.plan.md)` (same directory as the parent plan). If the placeholder is already filled, one-line note and continue.

 Use the exact `Plan:` line captured during indexed-child validation as the `old_string`; include enough surrounding row context to replace only item **N**. The replacement must preserve the original indentation and label shape, changing only the pending target after `Plan:`. After replacement, read the parent file back and verify:

 - item **N** has exactly one `Plan:` link;
 - the link target is the relative child filename just created;
 - no sibling item changed.

 If verification fails, surface blocked parent-link issues as open items per **Indexed child — Open-item modal contract** before returning `partial`; include `plan-reconcile` in `remainingTasks` when the developer defers repair. Do not proceed to the populator spawn until the parent link is trustworthy or the developer explicitly accepts blocked state with documented defer.

2. **Link the child** in developer-facing recap using a backtick path to the real `.plan.md` (prefer the hosting-absolute path; a `.sedea/operations/…/plans/…` path is also valid). Do **not** use a `file://` Markdown link or put backticks inside a Markdown link label.

- **Next-step resolution:** Auto-advance to [Auto-authorize populator](#auto-authorize-populator-upstream-decomposition-spawn) or Step **3** populator approval after steps **1–2** verify — no `USER_CHECKPOINT` on stub write or parent `Plan:` link when auto-authorize applies.

### Auto-authorize populator (upstream decomposition spawn)

When **all** of the following are true, **skip** step 3 and go straight to step 4 after the child stub and parent `Plan:` link are written and verified:

| Condition | Required |
|-----------|----------|
| `mode` is `indexed-child` | Yes |
| `requestedPopulatorSkill` is set (`phase-planner` or `pr-plan`) | Yes |
| `upstreamSkill` is `delivery-phases` or `pr-breakdown` | Yes |

Rationale: **`delivery-phases`** and **`pr-breakdown`** already run structured-choice gates (**Approve … list** / **Expand eligible row(s)**) over the parent numbered list and enforce depth-first ship-complete eligibility before expand. Item **N** prose (scope sentence, decomposition hint) is reviewed there — re-asking on this lane is redundant.

Set `outputs.populatorApprovalStatus: "waived-upstream"` and one line: *Parent list approved upstream — hand off to `<requestedPopulatorSkill>` on the child stub* (`pr-plan` inline; `phase-planner` spawned).

**Still use step 3** when:

- `upstreamSkill` is absent, `new-plan`, or another lane (standalone / manual indexed expand).
- `requestedPopulatorSkill` is absent (stub-only create).
- The developer explicitly chose **Revise child stub first** or **Defer population** on a prior turn (re-open step 3).

3. **Populator approval gate (indexed spawn only — when not auto-authorized).** If this skill was spawned with `requestedPopulatorSkill` and [Auto-authorize populator](#auto-authorize-populator-upstream-decomposition-spawn) does **not** apply, present the created child stub and verified parent `Plan:` link to the developer before spawning the populator. Apply **Indexed child — Open-item modal contract** when stub review surfaces open items (thin overview, YAML quoting risk, parent link not yet verified). When open items exist, one scoped `questions[]` entry per item, then the terminal populator gate question last. Collect approval via **AskQuestion**, **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**, **`../README.md`** § *Planning open-item modal contract*, and **`../README.md`** § *Recap, structured choice, act* — **preferred:** stub link + modal in one message.

### Populator approval gate (binding)

USER_CHECKPOINT — approve child stub and populator handoff before inline pr-plan or phase-planner spawn.

| Option id | Label (brief) |
| --- | --- |
| `approve-populator` | Approve child stub and populate now |
| `revise-stub` | Revise child stub first |
| `defer-population` | Defer population |
| `abandon-child` | Abandon this child |
| `more-details` | More details for option _ |

- When stub write and parent `Plan:` link verify and auto-authorize does **not** apply → open this gate via **`mission_control_present_structured_choice`** (spawned lanes) or **AskQuestion** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**. Apply **Indexed child — Open-item modal contract** when open items exist — this approval question stays last in `questions[]`.
- When auto-authorize applies → **do not** open this gate; proceed to step **4** in the same turn after the stub and `Plan:` link verify.
- Only **`approve-populator`** authorizes populator handoff (inline **`pr-plan`** or spawn **`phase-planner`**). If the developer defers, return `partial` or `success` with `continuationStatus: "active"` and a `remainingTasks` item naming the deferred populator.
- **`defaultOptionId: approve-populator`** when stub and parent link verify and no blocking open items remain.

4. **Populator handoff (indexed spawn only).** When `requestedPopulatorSkill` is set and either auto-authorize applies **or** the developer approved step 3, hand off after the child stub and parent `Plan:` line are written and verified (do **not** stop for a stub-approval modal when auto-authorized).

 **`pr-plan`** (`childKind: "pr-plan"` or parent **`PR breakdown`**):

 1. Run **`pr-plan`** **inline** on this lane per [Inline handoff](#inline-handoff--new-plan--pr-plan-step-4).
 2. Merge inline completion fields; set `outputs.populatorSkill: "pr-plan"`, `outputs.populatorStatus` from inline handoff.
 3. **Stop on this lane after inline `pr-plan` drafts §§1–4** — run **`pr-plan`** §5c (and §5d when the developer picks **Start coding session**) **before** reporting terminal **`## Completion (inline)`** upstream — **except** when `skipPrPlanHandoffModal: true` (**`pr-breakdown`** **`approve-list`** auto-chain): inline **`pr-plan`** reports completion without §5c; merge `prPlanHandoffSkipped: true`, `implementationHandoffStatus: not-offered`, and **`invokerRole: phase-planner-agent`** when inline under a **`phase-planner`** subtree (echo from **`pr-plan`** **`## Completion (inline)`** when present). **Upstream handoff owner:** when the merge includes **`invokerRole: phase-planner-agent`**, bubble to **`pr-breakdown`** / **`phase-planner`** for Step **5f** — **forbidden** naming **`master-planner`** Step **7b** as owner on that path. When inline under **`master-planner`** only (no **`invokerRole: phase-planner-agent`** on the merge), **`master-planner`** Step **7b** may re-enter inline **`pr-plan`** §5c on **`targetPlanPath`**. **Forbidden:** finishing auto-authorized populator handoff in one turn and bubbling “PR plan complete” without §5c **unless** `skipPrPlanHandoffModal` applies.
 4. If inline **`pr-plan`** offered the §5c handoff menu or spawned **`coding-session`**, keep `continuationStatus: "active"` on this lane — follow-up turns continue inline **`pr-plan`** (§5c–§5e) before terminal **`mission_control_send_agent_result`**.
 5. Do **not** emit **`mission_control_spawn_agent`** for **`pr-plan`**.

 **`phase-planner`** (`childKind: "phase-planner"` or parent **`Delivery phases`**):

 1. Emit exactly one child-spawn request for `.sedea/centers/software-development/missions/plan-and-deliver/skills/phase-planner/SKILL.md`.
 2. Inputs: `targetPlanPath`, `targetPlanSlug`, `parentPlanPath`, `parentPlanSlug`, `parentIndex`, `ledgerParent`, `upstreamSkill: "new-plan"`.
 3. Emit **`mission_control_spawn_agent`**, then close the **same turn** with [Phase-planner spawn external-wait](#phase-planner-spawn-external-wait-binding) per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** — **forbidden** prose-only child-wait handoff.

- **Next-step resolution:** Auto-advance through inline **`pr-plan`** path on happy path — external-wait modal only after **`phase-planner`** spawn per [Phase-planner spawn external-wait](#phase-planner-spawn-external-wait-binding).

 **`pr-breakdown`**, nested decomposition, and **`plan-reconcile`** happen in their own mission steps after this skill finishes. If a center populator `SKILL.md` is ever absent, end after stub + parent link and point at **`development-process.md`**.

5. **Aggregate spawned `phase-planner` result.** When Mission Control delivers a **`phase-planner`** child result (spawned path only), match by correlation id first, then by `outputs.targetPlanPath` / `outputs.targetPlanSlug`.

 - **`continuationOwner: "phase-planner-agent"`** and **`continuationStatus: "active"`** → keep this `new-plan` result **`active`**; merge `remainingTasks`, `activeLanes`, and `openLedgerEntries`; report **`## Completion (inline)`** to the invoker as **wait-state only** (acknowledge — developer continues on the **phase-planner** child lane). Do **not** set invoker `terminal` or re-open **`master-planner`** §6 menus for this phase.
 - **`outputs.phaseShipComplete: true`** → merge ship fields; invoker may mark the parent row **`ship-complete`** and offer expand upstream per **`delivery-phases`** step **6b**.
 - `success` with **`continuationStatus: "terminal"`** and **`phaseShipComplete`** or explicit defer/abandon only → set this `new-plan` result to `terminal`; include the child plan in `spawnedPlans`.
 - `partial` → keep this `new-plan` result `active`; copy the populator `remainingTasks`, `activeLanes`, and `openLedgerEntries`.
 - `failure`, `aborted`, or `abandoned` → return the same status upstream with the child stub path and the populator errors; the upstream decomposition agent decides retry/defer/abandon for that row.
 - Missing or malformed populator outputs → return `partial` and keep the row open; silence is not completion.

 **Forbidden:** treating §§ 1–4 draft completion or route approval on **`phase-planner`** as **`new-plan` terminal** when the child still owns inline decomposition or ship work (**`phase-planner`** § *Phase delivery ownership*).

- **Next-step resolution:** External-wait until host delivers child result — reopen [Phase-planner spawn external-wait](#phase-planner-spawn-external-wait-binding) or merge per bullets above; no terminal MCP result while child lane is open.

5b. **Aggregate `coding-session` child result (inline `pr-plan` path).** When inline **`pr-plan`** spawned **`coding-session`** (§5d) and Mission Control delivers the child result:

 1. Match by `correlationId` from inline **`pr-plan`** `spawnCorrelationId`, then `outputs.targetPlanPath` / `outputs.targetPlanSlug`.
 2. Merge child `activeLanes`, `openLedgerEntries`, and `remainingTasks` into this skill’s ledger.
 3. Continue inline **`pr-plan`** §5e semantics on this lane (summarize for the developer; re-offer handoff when appropriate).
 4. When child **`outputs.prShipComplete`** is **`true`**: set **`outputs.prShipComplete: true`**, echo **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`** from this skill’s indexed spawn **`inputs`** (and child when present); merge **`shipPhase`**, **`rowStatus`**, **`mainPullStatus`**, **`archivedSlugs`**. Report these in **`## Completion (inline)`** to the invoker (**`pr-breakdown`** / **`phase-planner`** / standalone **`new-plan`** parent).
 4a. When child **`outputs.parentPlanningFollowUpNotification`** is **`"sent"`**: merge **`parentPlanningFollowUps`** into **`outputs`**; propagate in **`## Completion (inline)`** or re-emit so **`pr-breakdown`** / **`phase-planner`** / **`master-planner`** can append to parent plan **`## Follow-ups`** per `docs/spawn-ship-contracts.md` § *Upstream parent follow-up notification*.
 5. **Re-emit / propagate:** **Inline** under **`pr-breakdown`** or **`phase-planner`**: return **`## Completion (inline)`** with ship fields so the decomposition skill marks **`childRows[N].status: ship-complete`** and may offer **`expand-eligible`** on the next turn. **Standalone spawned `new-plan`:** re-emit **`mission_control_send_agent_result`** (same **`correlationId`**) with merged **`outputs`** before stopping.
 6. Return `partial` or `active` while the child lane is open; `terminal` only when inline **`pr-plan`** handoff is complete and no **`coding-session`** child remains open — **`prShipComplete`** may still leave the invoker **`active`** until upstream expand runs.

- **Next-step resolution:** External-wait on open **`coding-session`** child — continue inline **`pr-plan`** §5e before terminal result.

6. **Non-indexed spawns:** no populator handoff table — open [Non-indexed protocol branch gate](#non-indexed-protocol-branch-gate-binding) via **AskQuestion** / **`mission_control_present_structured_choice`** per **30_planning-target-resolution** § *Sedea input channel* and **`../README.md`** § *Recap, structured choice, act*.

- **Next-step resolution:** Auto-advance on indexed-child path — step **6** gate applies only when `mode` is not `indexed-child` or populator was not requested.

7. **Worktrees, broad `git` operations, and `## Child plans` on the parent** — owned by **`coding-session`**, **`plan-reconcile`**, and other cadence steps after this skill completes.

## Scope guard

This skill writes `.plan.md` + `.state.yaml`, optionally updates one `Plan:` line under the parent’s dual-title list (indexed spawn), may spawn **`phase-planner`**, and runs **`pr-plan`** **inline** on this lane. Worktree creation, PR prompts, archive bullets, and expanding the dual-title list beyond the chosen item **N** sit in **`coding-session`**, **`plan-reconcile`**, **`delivery-phases`**, and **`pr-breakdown`** as applicable.

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
| Inline under **`delivery-phases`** / **`pr-breakdown`** | **N/A** — use **`## Completion (inline)`**; no refocus |
| **`continuationStatus: active`**; open **`phase-planner`** / **`coding-session`**; pending populator | **Forbidden** |
| **`continuationStatus: terminal`** on a **spawned** standalone run | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "new-plan-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above. See **`../README.md`** § *Parent refocus on terminal*.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Required `outputs` fields:

- `outputs.planPath`, `outputs.planSlug`
- `outputs.parentPlanPath`, `outputs.parentPlanSlug`, `outputs.parentIndex` (indexed mode)
- `outputs.childKind`, `outputs.decompositionKind`
- `outputs.parentPlanLinkStatus` — `linked` | `already_linked` | `blocked`
- `outputs.populatorSkill`, `outputs.populatorApprovalStatus` (`waived-upstream` | `approved` | `deferred` | `not-requested`), `outputs.populatorStatus`
- `outputs.spawnedPlans`, `outputs.activeLanes`, `outputs.openLedgerEntries`, `outputs.remainingTasks`
- `outputs.continuationOwner`: `"new-plan-agent"`
- `outputs.continuationStatus` — `active` while populator approval, inline **`pr-plan`** handoff, a **`phase-planner`** child lane, a **`coding-session`** child from inline **`pr-plan`**, or row repair remains; `terminal` when stub, parent link, and populator handoff are complete
- `outputs.readyForImplementation`, `outputs.implementationHandoffStatus` — when inline **`pr-plan`** ran (echo from inline completion)
- `outputs.prShipComplete`, `outputs.shipPhase`, `outputs.rowStatus`, `outputs.mainPullStatus`, `outputs.archivedSlugs` — when step **5b** merged **`coding-session`** ship-complete
- `outputs.parentPlanningFollowUpNotification`, `outputs.parentPlanningFollowUps` — when step **5b** merged child parent follow-up notification

Complete write + parent confirmation (when required) + parent `Plan:` update (indexed) + populator handoff (inline **`pr-plan`** or **`phase-planner`** spawn / wait) **before** the MCP result call when **spawned**. **Inline** (`parentAgentRole` **`delivery-phases-agent`** or **`pr-breakdown-agent`**): use **`## Completion (inline)`** — no MCP result call. Do **not** emit **`mission_control_spawn_agent`** for **`pr-plan`** or **`new-plan`**. Stop after the MCP result call on spawned runs. Do not emit another `mission_control_spawn_agent` (except **`phase-planner`** or **`coding-session`** per above) or run the next protocol step in the same turn (see **`../README.md`** § *Terminal stop (normative)*).

## Completion (inline)

Report the fields below in prose to the invoker on the **same lane**. Do **not** emit `mission_control_spawn_agent` for **`new-plan`**, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*). **Exception:** step **4** may still emit **`mission_control_spawn_agent`** for **`phase-planner`**; inline **`pr-plan`** may emit **`mission_control_spawn_agent`** for **`coding-session`**.

**Primary path:** **`delivery-phases`** or **`pr-breakdown`** runs this skill **inline** under **`master-planner`** (`parentAgentRole: "delivery-phases-agent"` or `"pr-breakdown-agent"`). Use the same `outputs` semantics as **`## Completion (spawned)`** in prose only — the decomposition skill (then **master-planner**) merges ledger fields. **Standalone** mission dispatch may still spawn this skill on a child lane; then use **`## Completion (spawned)`** instead.
