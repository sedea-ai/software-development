---
name: pr-breakdown
description: >-
 Decompose a target Master Plan or Phase plan into PRs (mode #3 set-level) under
 Sedea's New Feature Development Process. Verifies template stage, ensures
 **`### Decomposition assessment`** exists (inserts if missing), gates
 **Delivery phases** vs multi-PR vs single-PR **PR breakdown**, then drafts
 **`### Single-concern strategy`**, **`### Sequencing`**, and **`### PR list`**.
 Child PR stubs and **`Plan:`** lines follow **new-plan** indexed handoff (inline under **master-planner**; spawned when standalone); per-PR
 §§ 1–4 follow **pr-plan**. Target resolved per
 planning-target-resolution. Use under mission dispatch, **pr-breakdown**
 protocol branch, or natural language (decompose into PRs, draft PR breakdown).
designation:
  allowed: PR breakdown decomposition; Single-concern strategy, Sequencing, PR list on planning lane
  forbidden: Application implementation; worktree ship; spawn coding-session without pr-plan handoff
inputs:
  targetPlanPath:
    type: string
    description: Absolute or workspace-relative path to the Master Plan or Phase plan being decomposed.
    required: true
  targetPlanSlug:
    type: string
    description: Slug for the target plan.
    required: true
  parentAgentRole:
    type: string
    description: Upstream owner that invoked this skill inline, usually master-plan-agent or phase-planner-agent.
    required: false
  ledgerParent:
    type: string
    description: Slug/path of the ledger parent entry the Squad Leader tracks.
    required: false
  complexityBand:
    type: string
    description: Plan-scope complexity band copied from the upstream plan, when available.
    required: false
  complexityScore:
    type: number
    description: Plan-scope complexity score copied from the upstream plan, when available.
    required: false
  decompositionAssessment:
    type: string
    description: Current Decomposition assessment block from the upstream plan.
    required: false
  routeLock:
    type: string
    description: Optional upstream-selected route. When set to pr-breakdown, do not route back to delivery-phases unless the assessment creates a blocking conflict.
    required: false
  prBreakdownShape:
    type: string
    description: Optional upstream route detail for PR breakdown, single or multi.
    required: false
  plansBasePath:
    type: string
    description: >-
      Optional absolute handover path to a dispatch-scoped plans write folder.
      When omitted, resolve from target/parent plan paths or flat plans root fallback.
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/pr-breakdown/SKILL.md"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/30_planning-target-resolution.mdc"
---

# PR breakdown — mode #3 decomposition

This skill drives **mode #3** (set-level **PR breakdown**) under Sedea's New Feature Development Process. **Input:** a target **Master Plan** or **Phase plan** whose dual-title section (`Delivery phases | PR breakdown`) is undecided or is already **`PR breakdown`**. **Output:** that section drafted as **`### Single-concern strategy`**, **`### Sequencing`**, and **`### PR list`** (numbered child PRs). Each row is expanded **depth-first** per **`### Sequencing`** ship gates via **`new-plan`** (indexed — **inline** when this skill runs under **`master-planner`**), then **`pr-plan`** **inline** on that lane (see [`new-plan/SKILL.md`](../new-plan/SKILL.md) populator handoff).

The procedure below is a hard contract — do **not** skip steps, re-order them, or start drafting before stage is verified.

## Resolve plans write directory (binding)

Honor optional **`inputs.plansBasePath`** on every spawn handoff to downstream plan skills:

1. Collect **`inputs.plansBasePath`**, **`inputs.targetPlanPath`**, and parent plan path from session context when present.
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

3. Record resolved **`plansBasePath`** from JSON when non-null. When inline **`new-plan`** or standalone **`mission_control_spawn_agent`** for **`new-plan`** runs, include **`plansBasePath`** in handoff **`inputs`** when JSON **`plansBasePath`** is non-null — **forbidden** re-deriving flat-root paths when nested handover is active.

- **Next-step resolution:** Auto-advance to step **1** target verification once resolve completes — no `USER_CHECKPOINT` on happy path.

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

**Omitted from frontmatter (384 KiB spawn cap — runtime `Read`):** `plan.mdc`, `development-process.md`, `planning-mode-templates.md` — load at named protocol steps.

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice, AskQuestion |
| `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` | Planning target resolution (role minimum) |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/pr-breakdown/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight M1–M9, definitive `laneRules` |

## Agent messaging (MCP)

**MCP spawn/result/notify skill.** Parent→child spawn, plan-change notify, and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*.

| Action | MCP tool |
|--------|----------|
| Parent spawn (when this skill emits a child lane) | **`mission_control_spawn_agent`** |
| Parent plan-change notify (named non-terminal PR row owners) | **`mission_control_notify_child_lanes`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- `Read` **`docs/spawn-ship-contracts.md`** § *MCP notify preflight* (rows N1–N8) — then run notify preflight before every **`mission_control_notify_child_lanes`** call — cross-ref **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*.
- Inline skills on this mission stay **inline-only** — no spawn wire change unless the protocol step explicitly spawns a child lane.
- **Relevant Links (post-write):** After each Write/StrReplace that **materially edits** the target plan’s dual-title / **`### PR list`** (or assessment) block, call MCP **`mission_control_update_relevant_documents`** with the absolute plan path (`kind: plan`) — same turn preferred. **Skip** read-only loads and unchanged already-registered paths. See **`../README.md`** § *Relevant Links — post-write registration*.

### Plan-change notify — emit-when (`mission_control_notify_child_lanes`)

After a **material** decomposition or **`### PR list`** change on the target plan that affects named child row owners (active **or** terminal **`pr-plan`** per rule **4** § *Planner-lane wake*), notify each affected owner with a **separate** MCP call (one slug per call, v1). Apply in **depth-first expand** context — notify row owners when the list, sequencing, or per-row scope changes. Normative protocol: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*.

| Emit when | Target child slugs (examples) | Do not notify |
|-----------|------------------------------|---------------|
| PR list edit, **`### Sequencing`** change, or per-row scope change affects row owners | **`new-plan`** / **`coding-session`** child lanes for affected indices with non-terminal status; **terminal `pr-plan`** slugs when a new PR row is added on an existing plan path | Indices not yet expanded with no prior slug; empty or speculative **`targetSlugs`** |

**Forbidden:** empty or speculative **`targetSlugs`**; broadcast fan-out; duplicate spawn when a **`pr-plan`** slug exists for the plan path; using notify instead of **`mission_control_spawn_agent`** for **first-time** row expansion with no prior slug.

### MCP notify preflight (`mission_control_notify_child_lanes`)

| Step | Check |
|------|--------|
| N1 | Caller authority — **`pr-breakdown`** may notify descendant slugs for affected PR row owners only |
| N2 | Required args present: **`summary`**, **`changeType`**, **`affectedPlanPaths`** (non-empty), **`targetSlugs`** (exactly one slug) |
| N3 | **Forbidden args absent** — no host-resolved identity keys, no **`notifyAllDescendants`** |
| N4 | **`targetSlugs`** contains exactly **one** dispatch-unique child slug per call (terminal **`pr-plan`** slugs allowed per rule **4** § *Planner-lane wake*) |
| N5 | **`affectedPlanPaths`** includes the parent plan and affected child PR plans for the row |
| N6 | Multiple row owners → **separate MCP calls** (one slug per call, v1) |
| N7 | Include **terminal planner** slugs when **`affectedPlanPaths`** intersects; omit terminal **leaf** rows (`coding-session`) per rule **4** § *Leaf-lane omission* |
| N8 | **First-time** PR row expansion with no prior slug → **`mission_control_spawn_agent`** (inline **`new-plan`** or spawn) — when slug exists → notify, never duplicate spawn |

## Trigger

- Mission dispatch or explicit request to run the **`pr-breakdown`** protocol branch.
- Natural language: decompose into PRs, draft PR breakdown, PR breakdown.
- After **`master-planner`** when the developer has already chosen **`PR breakdown`** for § 6 — **`master-planner`** runs this skill **inline** on the same lane; this skill drafts § 6 and owns indexed PR-child creation (**`new-plan`** + inline **`pr-plan`** on that lane).
- After **`phase-planner`** when route is **`pr-breakdown`** — **`phase-planner`** runs this skill **inline** on the phase-planner lane with **`targetPlanPath`** = **the phase plan** (single-PR and multi-PR).

The **developer** picks the next move per **30_planning-target-resolution** § *Sedea input channel*.

## Checkpoint turn UX (skill-local)

### Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.


Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`pr-breakdown`**; other planning skills document their own markers.

**Real-dispatch test loop (binding):** After merge, run one full **`pr-breakdown`** spawn on a Checkpoint dispatch through Step **6** and collect a developer verdict before the parent phase advances the next **`pr-breakdown`** step PR — per **Planning protocol skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path** protocol steps (target verify, assessment insert, draft writes, step **5d** recap) **auto-advance without a turn-end modal**. Call **`mission_control_present_structured_choice`** or **AskQuestion** only at **USER_CHECKPOINT** markers in this section, **implicit external-wait** surfaces (spawned child **`mission_control_send_agent_result`** delivery), or **exception** paths.

**Developer-input** (continuation requires the **developer** to pick a modal option on **this lane**) is **not** external-wait. These are USER_CHECKPOINT surfaces — **must** close the turn with **`mission_control_present_structured_choice`** / **AskQuestion**, not prose *reply with results*, *tell me when*, or *waiting for child*:

| Situation | Normative gate |
|-----------|----------------|
| Dual-title section still `_TBD_` and no upstream route lock | Step **4** — [Decision gate](#step-4--decision-gate-when-the-heading-is-still-delivery-phases--pr-breakdown) |
| Step **5d** recap complete and **K > 0** | Step **6** — [Structured choice — Approval](#structured-choice--approval-interactive) |
| Step **6a** handoff ends turn while child lanes run | Structured choice per rule **2** § *Turn completion invariant* — not prose-only stop |
| Open items at Step **4** or Step **6** | **Step 4-open-items** — scoped `questions[]` per item; terminal gate question last |

**Implicit external-wait** (host may resume the lane when a child delivers **`mission_control_send_agent_result`** without a developer modal pick on **that** delivery turn): standalone spawned **`new-plan`** / nested **`coding-session`** children per Step **6b**. After merge, open the **next** structured-choice turn (expand / approve / defer) **before** StreamFinal when Step **6b** requires a developer pick — **not** prose *waiting for child*.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Identify target | Auto-advance on spawned handoff with locked `inputs` | exception: wrong template / missing target → structured pick |
| **2** — Load development-process | Auto-advance | — |
| **3** — Read target / dual-title section | Auto-advance on happy path | exception: ambiguous stage → structured pick |
| **3.5** — Decomposition assessment | Auto-advance when assessment exists or insert completes | — |
| **4** — Decision gate | Auto-advance when `routeLock: pr-breakdown` or upstream route already chosen | **Gate** when dual-title body is `_TBD_` and no route lock — **first developer-pick gate when route decision required** |
| **5** — Draft list (**5a–5d** / **5s**) | Auto-advance through write and step **5d** notify recap | — |
| **6** — Approve PR list | **Gate** when **K > 0** | Approve PR list (below) — **first developer-pick gate when Step **4** skipped or route-locked** |
| **6a** — Act-after-select | Auto-advance through chosen action on happy path | exception: revise / defer / abandon paths |
| **6b** — Aggregate child results | **waiting** on standalone spawned child lanes in flight | Host delivers child result → resume structured choice when expand / terminal merge requires developer pick |

### Inline invoker lane (binding)

When **`parentAgentRole`** is **`phase-planner-agent`**, this skill runs **inline on the active phase-planner child lane** with **`targetPlanPath`** = **the phase plan** — including single-PR (`prBreakdownShape: "single"`). The **write target** and **execution lane** align on the phase file.

**Forbidden:**

- Setting **`targetPlanPath`** to the decomposition **ancestor** Master Plan for single-PR breakdown.
- **`StrReplace`** on the ancestor that inserts **`#### PR breakdown — row N`**, row-scoped **`### PR list`**, or other set-level PR breakdown blocks (see **development-process.md** § *Single-PR on a phase plan (draft location — binding)*).
- Prose redirect to the **`master-planner`** lane, **`master-planner`** Step **7**, or *"open the Master Plan agent"* to draft single-PR breakdown on the ancestor.
- Treating ancestor file paths as permission to hand decomposition back to **`master-plan-agent`** while **`phase-planner-agent`** invoked this skill inline.

**Required:** Report **`## Completion (inline)`** to the **phase-planner** invoker on the **same** child lane; merge fields per **`phase-planner/SKILL.md`** Step **5e**. After writing § 5 on the phase plan, update the ancestor **`Delivery phases`** row **N** with **link-only** changes (`Phase plan:` phase link; **`Plan:`** PR link after **`new-plan`**) — **not** duplicate PR list content on the ancestor.

### Inline handoff — **pr-breakdown** → **`new-plan`** (step 6 act-after-select)

When **`parentAgentRole`** is **`master-plan-agent`** or **`phase-planner-agent`** (this skill inline under **`master-planner`** or **`phase-planner`**), run **`new-plan`** **inline on this lane** for **eligible** row index(es) only — **do not** emit **`mission_control_spawn_agent`** for **`new-plan`**. **Depth-first gate:** parse **`### Sequencing`** per **development-process.md** § *Depth-first plan-tree traversal* — expand only PR indices that are **ship-eligible** (sequential: lowest pending **N** whose prior PR in the chain is ship-complete; parallel stage: all pending indices in the current stage once the prior stage is fully ship-complete). Load `.sedea/centers/software-development/missions/plan-and-deliver/skills/new-plan/SKILL.md`, construct inline context per eligible row from the table below, follow that skill’s steps (including inline **`pr-plan`**), and merge each **`## Completion (inline)`** into this skill’s ledger (`childRows`, `spawnedPlans`, `activeLanes`, `openLedgerEntries`, `remainingTasks`). Inline **`new-plan`** may still spawn **`coding-session`** via inline **`pr-plan`** §5d.

| Inline context field | Value (per row **N**) |
|----------------------|------------------------|
| `mode` | `"indexed-child"` |
| `parentPlanPath` | Absolute path to this skill’s `targetPlanPath` |
| `parentPlanSlug` | This skill’s `targetPlanSlug` |
| `index` | Row number **N** (one or more eligible indices per expand pass — parallel stage may authorize multiple) |
| `childKind` | `"pr-plan"` |
| `requestedPopulatorSkill` | `"pr-plan"` |
| `ledgerParent` | `ledgerParent` from this skill’s inputs when present |
| `upstreamSkill` | `"pr-breakdown"` |
| `parentAgentRole` | `"pr-breakdown-agent"` |
| `decompositionKind` | `"pr-breakdown"` |
| `autoChainFirstPr` | `true` only when **`approve-list`** auto-expand runs on this lane (see §6 act-after-select); otherwise omit or `false` |
| `parentRowSingleConcern` | Full text of item **N** **Single concern** sub-bullet under **`### PR list`** (PR description seed — parse from parent `.plan.md` before handoff) |
| `plansBasePath` | Resolved JSON **`plansBasePath`** when non-null — omit when flat-root only |

**Parse `parentRowSingleConcern`:** Read the parent plan’s **`### PR list`** block; for ordered item **N**, take the nested **Single concern.** sub-bullet body (label may read `Single concern` or `Single concern.`). Trim leading/trailing whitespace only — do not paraphrase. That string is the PR description seed for inline **`pr-plan`** §1.

**Standalone spawned** path: emit **`mission_control_spawn_agent`** per row instead (see step 6 act-after-select). Include **`plansBasePath`** in spawn **`inputs`** when resolved JSON **`plansBasePath`** is non-null.

## Step 1 — Identify the target plan and verify stage

The skill operates on a **target** `.plan.md` resolved before this skill runs, per [`30_planning-target-resolution.mdc`](../../../../rules/30_planning-target-resolution.mdc) § *Resolution order*. Acknowledge the target slug in one line when this skill starts (e.g. *Target plan: `<slug>` (from prior structured choice).*). Resolve targets from session, snapshot, or explicit path — **planning-target-resolution** is normative. Do **not** infer the target from the IDE’s focused-file list alone.

If there is no resolved target, **stop** and emit a fresh *Where we are now in the plan tree* snapshot with **`AskQuestion`** or **`mission_control_present_structured_choice`** in **one turn** per **30_planning-target-resolution** § *Sedea input channel* and **`../README.md`** § *Recap, structured choice, act* (`displayMarkdown` + `askQuestion`). **Obsolete:** recap-only turn without structured choice. Then continue.

Acknowledge in one line: *"Target plan: `<slug>`."*

**Verify the stage** from the plan body and frontmatter (`kind:`), and the sidecar when it helps disambiguate. The target must be a **Master Plan** or **Phase plan**:

- **`kind: roadmap_topic`** or the file is clearly a **roadmap topic** → **stop** with: *"This is a roadmap topic. Roadmap topics do not decompose into PRs here. Open a child Master Plan and run **`pr-breakdown`** on that plan."*
- Body has **`## Single concern`** (PR plan template) → **stop** with: *"This is a PR plan. PR plans are leaves; they are not decomposed with **`pr-breakdown`**. Use **`coding-session`** or **`pr-review`** as appropriate."*
- Master Plan or Phase plan → proceed.
- Ambiguous (stub with no distinguishing sections yet) → use **AskQuestion** with one `option` per stage (Master Plan, Phase plan, PR plan); if not Master or Phase plan, **stop**.

Acknowledge: *"Stage: <Master Plan | Phase plan>; proceeding."*

- **Next-step resolution:** Auto-advance to Step **2** on valid Master or Phase plan — no `USER_CHECKPOINT` on this step.

### 1b — Ancestor write guard (phase-planner single-PR)

Run **after** stage verification when **`parentAgentRole`** is **`phase-planner-agent`** and **`targetPlanPath`** names the decomposition **ancestor** (Master Plan) instead of the **phase plan**.

**Stop** (agent failure — retarget before drafting):

> *"Single-PR **`PR breakdown`** after **`phase-planner`** must draft § 5 on **this phase plan**, not on the ancestor Master Plan. Re-run inline with `targetPlanPath` = the phase plan and `prBreakdownShape: \"single\"` per **development-process.md** § *Single-PR on a phase plan (draft location — binding)*."*

Return `partial` with `remainingTasks` naming the retarget — **not** permission to continue on the ancestor.

## Step 2 — Load the development-process doc

Read `.sedea/centers/software-development/docs/development-process.md` with the Read tool, **no offset, no limit** (slim core). Then read `.sedea/centers/software-development/docs/planning-mode-templates.md` in full. Acknowledge in one sentence: *"Loaded development-process core + planning-mode-templates; will follow § 3 PR breakdown set-level template + § 6/§ 5 contents rule."*

This is a **standards document**, not an executable plan — its sections describe the process you apply. Re-read on every invocation; do not rely on session memory.

- **Next-step resolution:** Auto-advance to Step **3** — no `USER_CHECKPOINT` on this step.

## Step 3 — Read the target plan and locate the dual-title section

Read the target plan in full. Locate the dual-title section — the last numbered section before optional Caveats:

- **Master Plan:** `## 6. Delivery phases | PR breakdown` or `## 6. PR breakdown`.
- **Phase plan:** `## 5. Delivery phases | PR breakdown` or `## 5. PR breakdown`.

Inspect the section and apply:

| Section state | Meaning | Action |
| --- | --- | --- |
| Heading is `Delivery phases \| PR breakdown` and the dual-title **list** is still `_TBD_` (assessment may or may not exist yet) | Decision pending on recursion shape | Step 3.5 → Step 4 → Step 5 when a PR-breakdown path is chosen |
| Heading is already `PR breakdown` with empty / `_TBD_` body (set-level sub-sections not yet drafted) | **PR breakdown** chosen; need set-level draft | Step 3.5 → **Skip step 4** → Step 5 (use **`### Decomposition assessment`** to choose single-item vs multi-item **`### PR list`**; default to **multi** if ambiguous — **flag** when assessment clearly says single but you drafted multiple) |
| Heading is already `PR breakdown` with all three sub-sections populated | Already drafted | Step 6 (handoff menu) |
| Heading is already `PR breakdown` with some sub-sections drafted, others `_TBD_` | Partially drafted | Step 5, filling only still-`_TBD_` sub-sections unless asked to replace existing text |
| Heading is already `Delivery phases` | Wrong skill | **Stop:** *"This plan’s decomposition is **`Delivery phases`**. Use the **`delivery-phases`** protocol branch on this plan to draft the phase list."* |

Acknowledge the state in one line.

- **Next-step resolution:** Auto-advance to Step **3.5** or Step **4** / **5** / **6** per section-state table — no `USER_CHECKPOINT` on happy path.

## Step 3.5 — Ensure `### Decomposition assessment`

Before **AskQuestion** (step 4) or before drafting set-level **`PR breakdown`** (step 5 when step 4 is skipped), the plan file must contain **`### Decomposition assessment`** so the **developer** and the agent share the same sizing snapshot.

1. If the plan body **already contains** the heading **`### Decomposition assessment`**, **read it** and acknowledge one line in chat — do **not** duplicate it.
2. Otherwise **infer** the same dimensions as **[`phase-planner` / § 4g — `### Decomposition assessment`](../phase-planner/SKILL.md)** (kinds of change, PR count band, sequencing / coupling, routing recommendation, confidence) — from the same inputs you will use in step 5a (Master: §§ 4–5; Phase: §§ 2–4). Then **`StrReplace`** insert the full **`### Decomposition assessment`** block **immediately above** the dual-title heading (`## 6. …` or `## 5. …`):
 - Use a unique `old_string` anchor of the form `## <N>. Delivery phases \| PR breakdown\n\n_TBD_` **or** `## <N>. PR breakdown\n\n_TBD_` (match the file exactly — include the chosen heading line).
 - `new_string` is: `### Decomposition assessment` + blank line + bullet lines + blank line + the same `## <N>. …` heading + `\n\n_TBD_`.

Do **not** remove an existing assessment authored by **`phase-planner`** / **`master-planner`** unless the **developer** asked to replace it.

- **Next-step resolution:** Auto-advance to Step **4** or Step **5** when assessment is present — no `USER_CHECKPOINT` on insert.

## Step 4 — Decision gate (when the heading is still `Delivery phases | PR breakdown`)

Run this step **only** when the dual-title heading is still the **dual** form and the list body is `_TBD_` (after step 3.5).

### Step 4-open-items — Open-item modal contract

Apply the shared planning open-item contract from `../README.md` to every **pr-breakdown** gate that can surface multiple unresolved items: route conflicts, parent-row mismatch warnings, single-vs-multi PR uncertainty, sequencing concerns, PR boundary observations, eligibility blockers, child-row expansion blockers, and list-approval caveats.

**When open items exist** — use **one modal with multiple `questions[]` entries**:

- **`displayMarkdown`:** numbered list of open items. For each item, include the target section or PR row, the gap/conflict/blocker, why it matters for single-concern or depth-first expansion, and the agent's proposed resolution options.
- **`askQuestion.questions`:** one scoped question per open item, with its own stable `id`, `prompt`, and item-only `options` (for example `accept-proposed-boundary`, `split-pr`, `merge-pr`, `revise-sequencing`, `defer-row`, `skip-no-change`, `more-details`). **Forbidden:** one combined question whose options mix decisions for several PR rows or concerns.
- **Final question:** always append the terminal pr-breakdown gate question last in the array. Use the normal gate for the current step: route decision, **Approve PR breakdown**, expand eligible PR row(s), revise, defer, or abandon. **Forbidden:** a resolve-only modal that omits list approval or expansion until every item is cleared.
- **Many open items:** batch across turns when needed; each batch still ends with the terminal pr-breakdown gate question as the final `questions[]` entry.

**When no open items remain** — use the existing single terminal gate question for Step **4**, Step **6**, or follow-up expansion.

When the skill was spawned with `routeLock: "pr-breakdown"` (or with `parentAgentRole: "master-plan-agent"` or `"phase-planner-agent"` after the developer chose **PR breakdown**), the route family is already decided upstream. Do not offer **Delivery phases** as a normal choice. Instead:

- If `### Decomposition assessment` recommends `PR breakdown` single-PR, use `pr_breakdown_single`.
- If it recommends `PR breakdown` multi-PR, or the recommendation is ambiguous but PR-ready, use `pr_breakdown_multi`.
- If it strongly recommends `Delivery phases`, stop and surface the conflict to the developer as an open item per **Step 4-open-items**: continue with PR breakdown anyway, switch to `delivery-phases`, or revise the assessment. Do not silently bounce to `delivery-phases`; keep the terminal route decision question last.

When no upstream route lock exists, use **AskQuestion** to ask:

> How should this plan recurse next? Use **`### Decomposition assessment`** as the default if you agree with it.

USER_CHECKPOINT — pick decomposition route (Delivery phases vs PR breakdown) on this lane.

**Three options (required):**

- **Delivery phases** (`id: delivery_phases`) — child entries are phase plans; the **`delivery-phases`** protocol branch owns that decomposition path.
- **PR breakdown — multiple PRs** (`id: pr_breakdown_multi`) — PR-ready; two or more executor-ready PRs.
- **PR breakdown — single PR** (`id: pr_breakdown_single`) — PR-ready; **one** numbered item in **`### PR list`** (then **`new-plan`** indexed item **1** creates the single child; **`pr-plan`** when available).

If the developer picks **`delivery_phases`**, **stop** with: *"Use the **`delivery-phases`** protocol branch on this plan — it sets the heading to **`Delivery phases`** and drafts the numbered list of child phases per the doc."* Do not draft anything in this skill; do not change the heading here.

If the developer picks **`pr_breakdown_multi`** or **`pr_breakdown_single`**, continue to step 5. Treat **`pr_breakdown_single`** as routing to **step 5s**; **`pr_breakdown_multi`** runs **5a–5d** with **K ≥ 2** expected (**K = 1** only on the single-PR path from step 4, or when step 4 was skipped and assessment forces one PR — see step 5).

- **Next-step resolution:** Auto-advance to Step **5** when route lock applies or developer selects **`pr_breakdown_*`** — no `USER_CHECKPOINT` when Step **4** is skipped.

## Step 5 — Draft the three sub-sections

The output is the three set-level sub-sections from **development-process.md** § 3: **`### Single-concern strategy`**, **`### Sequencing`**, **`### PR list`**.

**Routing:**

- If step 4 chose **`pr_breakdown_single`**, jump to **step 5s** — skip the multi-PR branch of 5a.
- If step 4 was **skipped** (heading already **`PR breakdown`**) and **`### Decomposition assessment`** recommends **single-PR** **`PR breakdown`**, use **step 5s** unless prior mission context explicitly demands multiple PRs — **flag** if you override the assessment.
- Otherwise use **5a–5d** for **multi-PR** decomposition (typical **K = 2–5**).

### 5a — Infer PR boundaries from the parent plan

**PR sizing metrics:** apply **`.sedea/centers/software-development/docs/planning-mode-templates.md`** § *PR sizing — test cases and kinds of changes* (canonical). Keep in sync with **`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`** § *Keep PRs small and focused* — edit the planning-mode-templates subsection first when buckets or kinds rules change.

Read the target plan’s earlier sections:

- **Master Plan:** § 4 Architectural design + § 5 Changes (including **`### Decomposition assessment`**, when present).
- **Phase plan:** § 2 Scope + § 3 Code design + § 4 Changes (including **`### Decomposition assessment`**, when present).

Pick PR boundaries that respect Strategy #6 (single concern per deliverable) and Strategy #4 (small chunks, fast to production):

- A PR is the **smallest deliverable unit** of this plan — one concern, one purpose, one reason to change. If two concerns are tempting to bundle, split them.
- PRs are ordered when there is a real sequencing constraint (schema migration before consumers; feature flag before code that reads it; contract change before UI that consumes it). Otherwise they can run in parallel.
- Aim for **2–5 PRs** in a typical multi-PR pass. **Exactly one PR** is a **first-class** outcome — use **step 5s** or **`pr_breakdown_single`**; do **not** treat it as an error. More than ~6 PRs usually means the plan should have stayed at **`Delivery phases`** first — **flag** when you proceed anyway.
- Each PR must be **shippable on its own** (Strategy #4): merging it should leave the system in a working state. Flag non-obvious reliance on flags, additive schema, or compat layers per PR.
- **Size each candidate PR by test-case count, not by lines** (canonical: **`planning-mode-templates.md`** § *PR sizing — test cases and kinds of changes*). For each PR under consideration, estimate **test cases** it introduces or meaningfully changes — unit + integration / snapshot + exploratory recordings, each enumerated case counted once. Buckets: **≤ 10** simple, **11–20** mid-sized, **21+** heavy (same thresholds as rule **20** § *Keep PRs small and focused*). Heavy is a signal to **investigate** splitting — not automatically wrong. Do not split within one **kind** of change (instance batching). Raw changed-line count is **not** a size signal.
- **Kinds-of-changes lens** (same canonical subsection). Count **distinct kinds** — N instances of the same shape across N files is one kind. **A reviewer agent** reads the first instance carefully and skims the rest. Split only when each half ships value on its own.

### 5b — Draft each sub-section per the doc’s § 3 set-level template

Apply **`planning-mode-templates.md`** § 3 *Set-level template* literally. The three sub-sections, in order:

#### `### Single-concern strategy`

One or two sentences on how this plan keeps each PR single-concern (Strategy #6). Tailor when the split is non-obvious. Optional short bullets (short-bullet rule) for tempting bundles you split; skip when the sentence is enough.

#### `### Sequencing`

How PRs relate in time — **authoritative for depth-first expand eligibility** (see **development-process.md** § *Depth-first plan-tree traversal*). Use staged bullets with explicit **`(sequential)`** or **`(parallel)`** labels, e.g. *Stage 1 (sequential): PR 1 → PR 2; Stage 2 (parallel): PR 3, PR 4*. Labels must match bolded titles in **`### PR list`**. Optional Mermaid supplements the bullets; when both exist, the staged bullet form governs **`new-plan`** gates. When emitting Mermaid, follow [`.sedea/centers/sedea/docs/mermaid-authoring.md`](.sedea/centers/sedea/docs/mermaid-authoring.md) (opaque ids, sequence `Note` single-line, no bare `;` in message labels, flowchart-only `<br/>`).

#### `### PR list`

A **short numbered list** — one item per PR, in roughly **`### Sequencing`** order. Each item line: PR **slug or short title**, **bolded**, so the **`new-plan`** protocol branch (indexed spawn) can derive the child name (see **`new-plan`** § *Indexed child spawn*). Under each item, two nested sub-bullets:

- **Single concern.** One-line **PR description seed** (full prose; carved out of the short-bullet rule) — this is the exact text inline **`pr-plan`** must copy into child **`## 1. Single concern`** when `parentRowSingleConcern` is passed (no paraphrase or tighten).
- **Plan.** A **`Plan:`** line whose placeholder **matches the parent file’s existing shape** when present; otherwise state the child file is pending after **`new-plan`** indexed spawn for this list item **N**. The relative Markdown link is filled when **`new-plan`** creates the child and updates the parent; **`plan-reconcile`** can repair wiring.

Optional: one short intro under `## <N>. PR breakdown` before **`### Single-concern strategy`** when framing helps; skip when unnecessary.

### 5s — Single PR (set-level)

Use when step 4 returned **`pr_breakdown_single`**, or when step 4 was skipped and **`### Decomposition assessment`** clearly recommends **single-PR** **`PR breakdown`**.

Draft the same three sub-headings on **this target plan** (phase plan when invoked from **`phase-planner`**):

- **`### Single-concern strategy`:** one or two sentences — the whole plan ships as **one** mergeable unit.
- **`### Sequencing`:** one short bullet such as *Single PR — no sibling ordering.*
- **`### PR list`:** **Exactly one** numbered item (`1. **<slug>**`). Derive **`<slug>`** from frontmatter `name:` or the plan title. **Single concern** sub-bullet = full PR description seed (proto-§ 1 for the whole change; verbatim into inline **`pr-plan`** §1). **Plan:** same placeholder contract as **5b** for item **1**.

Then run **5c** with **K = 1**.

### 5c — Write to the parent plan

Use `StrReplace` to mutate **only** the dual-title section (the `## <N>. Delivery phases | PR breakdown` or `## <N>. PR breakdown` heading **and** the `_TBD_` or empty body **directly under it**). Do **not** delete **`### Decomposition assessment`** when it sits **above** that heading.

Replace:

- The heading: `## <N>. Delivery phases | PR breakdown` → `## <N>. PR breakdown` (`<N>` is **6** for Master Plan, **5** for Phase plan).
- The body: `_TBD_` → optional intro + the three sub-sections from **5b** or **5s**.

**Bold** the PR slug on each item’s first line. Keep slugs short (about 2–5 words; kebab-case or `snake_case` per repo habit).

If the section is **partially drafted**, replace only still-`_TBD_` sub-sections — preserve the **developer**’s existing text unless they ask to revise it.

Do **not** modify any other section in the same call.

After writing, read the file back and confirm the section reads as intended.

### 5d — Notify draft (recap)

**Structured choice delivery** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** § **Context and structured choice**. Do **not** use implementation labels like “Turn A/B” in developer-facing chat.

After step **5c**, present step **6** handoff in **one turn** via **`mission_control_present_structured_choice`** or **AskQuestion tool** — put in **`displayMarkdown`** (or brief prose with the tool):

1. A backtick path to the target `.plan.md` (prefer the hosting-absolute path resolved by **`plan-state resolve`** or equivalent; a `.sedea/operations/…/plans/…` path is also valid). Do **not** use a `file://` Markdown link or put backticks inside a Markdown link label.
2. One line: *Drafted `## <N>. PR breakdown` with **K** PR rows — open the plan to review the full section.*

Do **not** mirror the full **`PR breakdown`** body in chat (no duplicated headings, tables, Mermaid fences, or numbered PR list). The plan file is the review surface.

Count **K** from numbered rows under **`### PR list`** before the approval modal (`K = 1` is valid on the single-PR path). If **K = 0**, treat as drafting failure — do not open structured-choice spawn paths; return failure or partial per **Completion (spawned)** / standalone handoff.

- **Next-step resolution:** Auto-advance to Step **6** structured choice after step **5d** recap — no `USER_CHECKPOINT` on substeps **5a–5d**.

**Obsolete:** separate recap-only pass without **`askQuestion`** — step **6** options belong on the **same** turn as the link + one-line summary.

## Step 6 — Hand back with next-move options

**Structured choice** then **act after the developer selects** — see **`../README.md`** § *Recap, structured choice, act (plan-and-deliver)*.

### Structured choice — Approval (interactive)

**Preferred:** **AskQuestion tool** (brief recap allowed in the same message) or **`mission_control_present_structured_choice`** with recap in `displayMarkdown` and options in `askQuestion` — one assistant message.

**Legacy split (when the tool and MCP structured choice are unavailable):** send the step **5d** recap, then a **separate** message with `mission_control_present_structured_choice`** (MCP structured choice; recap in `displayMarkdown` via MCP call).

Collect the developer’s choice via **AskQuestion**, **`mission_control_present_structured_choice`** only in the structured-choice message — not in the same message as spawns or **`mission_control_send_agent_result`**.

- When using split delivery (no AskQuestion tool), call **`mission_control_present_structured_choice`** with valid `displayMarkdown` + `askQuestion` — **no** prose recap in the same message as the MCP call when split per rule **2** priority **3**.
- Put every choosable path in **`options`** (`id` / `label`). Do **not** duplicate those choices as a numbered prose menu in the same turn.

USER_CHECKPOINT — approve drafted PR breakdown list before child expansion.

Required **`options`** (adapt labels; keep **K** visible in the **`prompt`** when helpful):

| Option id (illustrative) | Label (brief) |
| --- | --- |
| `approve-list` | Approve PR breakdown — expand first PR when eligible |
| `expand-eligible` | Expand eligible PR row(s) |
| `revise` | Revise PR breakdown first |
| `defer` | Defer child PR plan creation |
| `abandon` | Abandon this branch |
| `more-details` | More details for option _ |

- When **K > 0** and step **5d** recap is complete → open this gate via **`mission_control_present_structured_choice`** (spawned lanes) or **AskQuestion** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**. Apply **Step 4-open-items** when open items exist — this approval question stays last in `questions[]`.
- When **K = 0** → drafting failure; do **not** open this gate.
- **`defaultOptionId: approve-list`** when **K > 0** and no blocking open items remain.

**Checkpoint auto-advance does not apply** at Step **6** when **K > 0** and step **5d** recap is complete — the same turn must emit this gate via **`mission_control_present_structured_choice`** or **AskQuestion**.

When approval or expansion has open items (sequencing caveats, row-specific blockers, K/shape concerns, parent-row mismatches, or eligibility blockers), apply **Step 4-open-items**: put one scoped `questions[]` entry per item before this approval/expansion question, and keep this approval/expansion question last in the array.

**Inline under `master-planner` or `phase-planner`:** Structured-choice approval is mandatory before indexed **`new-plan`** handoff **except** when **`upstreamRouteApproved: true`** or **`skipPrBreakdownApprovalModal: true`** from **`phase-planner`** with **`autoContinue: true`** (see **Cascade route approval** in act-after-select below) — then run **`approve-list`** act-after-select **same turn** without opening Step **6** modal. Do **not** emit **`mission_control_send_agent_result`** for this skill when **`parentAgentRole`** is **`master-plan-agent`** or **`phase-planner-agent`** — report **`## Completion (inline)`** to the invoker instead. Run **`new-plan`** **inline** on this lane (no child lanes for **`new-plan`**); **`coding-session`** child lanes may open from inline **`pr-plan`**.

**Standalone (spawned):** After structured-choice approval, emit **`mission_control_send_agent_result`** with `continuationStatus: "active"` when spawning **`new-plan`** child lanes — **not** in the structured-choice message. On **revise**, run step **6a** then repeat recap → structured choice.

### Act after developer selects

In a **new** assistant turn after the developer selects an option in the approval modal:

| Choice | Action |
| --- | --- |
| **Cascade route approval** (no modal) | When **`upstreamRouteApproved: true`** OR **`skipPrBreakdownApprovalModal: true`** from inline **`phase-planner`** with **`autoContinue: true`**, and PR index **1** is depth-first eligible: treat as **`approve-list`** without re-asking — write § 5 set-level block on **this target plan** if not yet persisted, then **same turn** inline **`new-plan`** index **1** with `autoChainFirstPr: true` and `parentRowSingleConcern` from item **1**; merge inline **`new-plan`** / **`pr-plan`**. **Forbidden:** Step **6** modal on this path. **`master-planner`** Step **7** route approval and **`phase-planner`** Step **5b** route approval are **equivalent upstream consent** for first PR expand. |
| **Approve PR breakdown** (`approve-list`) | Record `developerApprovalStatus: "list-approved"`. **Inline under `master-planner` or `phase-planner`:** when PR index **1** is depth-first eligible per **30_planning-target-resolution** § *Depth-first expansion eligibility*, **same turn** run inline **`new-plan`** for index **1** only with `autoChainFirstPr: true` and `parentRowSingleConcern` from item **1** (see [Inline handoff](#inline-handoff--pr-breakdown--new-plan-step-6-act-after-select)); merge inline **`new-plan`** / **`pr-plan`** completion. When index **1** is not eligible, keep **`Plan:`** placeholders `_TBD_` and report why — do **not** run **`new-plan`**. **Standalone spawned:** keep **`Plan:`** placeholders `_TBD_` on **`approve-list`** alone — use **`expand-eligible`** to spawn. |
| **Expand eligible PR row(s)** (`expand-eligible`) | Parse **`### Sequencing`**; resolve eligible indices per **30_planning-target-resolution** § *Depth-first expansion eligibility*. **Inline:** run **`new-plan`** once per eligible index (parallel stage may be >1); merge each **`## Completion (inline)`**; record **`coding-session`** spawns in `activeLanes`. **Standalone spawned:** one **`mission_control_spawn_agent`** per eligible index. If none eligible, stop with reason (prior PR/stage ship incomplete) — do not spawn. |
| **Revise PR breakdown first** | Run step **6a**, then repeat recap → structured choice. Do **not** spawn children or emit terminal success until re-approved. |
| **Defer child PR plan creation** | Emit **`mission_control_send_agent_result`** with defer semantics; do not spawn. |
| **Abandon this branch** | Emit **`mission_control_send_agent_result`** with `status: "abandoned"` (or `partial` when work remains documented). |
| **More details for option _** | Elaborate in **`displayMarkdown`** (or brief prose), then **`askQuestion`** again on the **same** turn — no prose-only elaboration handoff. |

Do not return terminal **success** upstream until every indexed row has returned terminal status (inline or spawned **`new-plan`** + inline **`pr-plan`** / **`coding-session`**) or the developer explicitly defers/abandons the remaining rows (step **6b**).

## Step 6a — Follow-up turns

When the **developer** asks to revise the **`PR breakdown`** block, re-read that section, apply edits via `StrReplace`, then repeat **recap** (link + one-line **K** summary only) and **structured choice** — prefer **`mission_control_present_structured_choice`** or **AskQuestion** for recap + modal in one message; do **not** combine a full section echo with in one message.

When the **developer** chooses hand off or populate children in standalone use, run **`new-plan`** inline or emit child-spawn requests for **`new-plan`** / **`pr-plan`** instead of impersonating those skills’ full procedures in the same turn. When the handoff ends the assistant turn while waiting for a child result, close with structured choice per [`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`](.sedea/centers/sedea/rules/2_ask-question-instructions.mdc) § **Turn completion invariant** — do not prose-only stop after handoff.

## Step 6b — Aggregate indexed child results

**External-wait on standalone spawned children (binding):** When Step **6** act-after-select emits **`mission_control_spawn_agent`** for **`new-plan`** or announces wait on nested **`coding-session`** / inline **`pr-plan`** children, the handoff turn may end without a developer modal on **this** lane until Mission Control delivers **`mission_control_send_agent_result`**. That delivery is **implicit external-wait** — not prose *tell me when the child finishes*. On the **next** turn after merge, when **`expandEligibleIndices`** is non-empty or terminal status requires a developer pick, emit structured choice (prefer **`mission_control_present_structured_choice`** with one-line recap in `displayMarkdown`) before StreamFinal.

**Inline `new-plan` under `master-planner` or `phase-planner`:** After each inline **`new-plan`** row completes, merge its **`## Completion (inline)`** into `childRows` and `spawnedPlans`. If inline **`pr-plan`** reports handoff in progress or an active **`coding-session`** child, keep the row open and add the lane to `activeLanes`. When Mission Control delivers a **`coding-session`** child result, match by correlation id from inline **`pr-plan`** `spawnCorrelationId`, then `outputs.targetPlanPath` / `outputs.targetPlanSlug`.

**Ship-complete merge (spawn chain):** When a delivered result (inline **`new-plan`**, standalone **`new-plan`**, or nested **`coding-session`**) carries **`outputs.prShipComplete: true`** with **`parentIndex`** matching a **`### PR list`** row:

1. Set **`childRows[N].status: ship-complete`** (and echo **`shipPhase: done`**, **`rowStatus: closed`** on the row record when present).
2. Recompute **`expandEligibleIndices`** per **30_planning-target-resolution** § *Depth-first expansion eligibility* and parsed **`### Sequencing`**.
3. Set **`outputs.expandEligibleIndices`** on this lane's result; keep **`continuationStatus: active`** when eligible indices remain unexpanded.
4. **Re-emit updated terminal** (standalone spawned) or report **`## Completion (inline)`** (under **`master-planner`** / **`phase-planner`**) with fresh **`outputs`** — same **`correlationId`** — so upstream **`master-planner`** Step **7b** can surface **`expand-eligible`** when spawn-chain **`prShipComplete`** is present.
5. On the **next** structured-choice turn after merge, include **`expand-eligible`** in the modal when **`expandEligibleIndices`** is non-empty (prefer **`mission_control_present_structured_choice`** with one-line recap in `displayMarkdown`).

**Parent follow-up merge (spawn chain):** When a delivered result carries **`outputs.parentPlanningFollowUpNotification: "sent"`** with non-empty **`parentPlanningFollowUps`**:

1. Append each item to the **target master or phase plan** **`## Follow-ups`** (resolved from **`targetPlanPath`** on this skill or bubbled **`parentPlanPath`**).
2. Track **`pendingParentFollowUps[]`** on this lane's ledger — **do not** treat follow-ups as **`expand-eligible`** or auto-expand the next **`### PR list`** row.
3. **Re-emit updated** terminal or **`## Completion (inline)`** with merged follow-up **`outputs`** per `docs/spawn-ship-contracts.md` § *Upstream parent follow-up notification*.

**Standalone spawned `new-plan`:** When Mission Control delivers a child result from a spawned **`new-plan`** lane:

1. Match it to the ledger entry by correlation id first, then by `outputs.parentPlanSlug` + `outputs.parentIndex`.
2. If the result reports a created child plan (`outputs.planPath` / `outputs.planSlug`), add it to `spawnedPlans` and mark that row `created`.
3. If the result reports inline **`pr-plan`** handoff or an active **`coding-session`** child from inline **`pr-plan`**, keep the row open and add the lane to `activeLanes`.
4. If the result reports terminal completion with no remaining tasks, close that row as `completed`.
5. If the result is `partial`, keep the row open and copy its `remainingTasks`.
6. If the result is `failure`, `aborted`, or `abandoned`, mark the row blocked and ask the developer whether to retry that row, defer it, accept partial resolution, or abandon the branch.

Only return `continuationStatus: "terminal"` when every row is explicitly `completed`, `deferred`, `abandoned`, or `out_of_scope`, and no active inline **`pr-plan`** handoff or **`coding-session`** lanes remain for those rows. Silence or a missing row is not completion.

## One primary choice per turn — surface observations

Match the discipline in **`master-planner`**, **`delivery-phases`**, and **`phase-planner`**: perform exactly what was chosen; scope stays on the chosen pass. If you notice gaps (Changes bullets that do not map to a PR, sequencing tension, assessment vs draft mismatch), list short **numbered observations** in **`displayMarkdown`** and apply **Step 4-open-items**: one scoped `questions[]` entry per observation or batch item, then the current terminal pr-breakdown gate question last.

## Scope guard

**Owns:** the parent plan’s dual-title **`PR breakdown`** section (heading + set-level body); **step 3.5** may insert **`### Decomposition assessment`** above that heading when missing; **step 5d** recap notifies the developer (link + one-line **K** summary — not a full chat mirror).

**Out of scope:** renaming child plans after **`new-plan`** creates them; per-PR §§ 1–4 inline (**`pr-plan`** owns the body); later per-PR sections and worktrees (**`coding-session`**, **`plan-reconcile`** per **`development-process.md`**); edits outside the dual-title block (except the assessment insert in **3.5**); `git` / commit automation; **`Delivery phases`** list body (**`delivery-phases`**); roadmap topics and PR plans (step 1 stops).

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
| Inline under **`master-planner`** / **`phase-planner`** | **N/A** — use **`## Completion (inline)`**; no refocus |
| **`continuationStatus: active`**; open children; pending approval | **Forbidden** |
| **`continuationStatus: terminal`** on a **spawned** standalone run | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "pr-breakdown-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above. See **`../README.md`** § *Parent refocus on terminal*.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Required `outputs` fields:

- `outputs.targetPlanPath`, `outputs.targetPlanSlug`
- `outputs.decompositionKind`: `"pr-breakdown"`
- `outputs.childCount`, `outputs.developerApprovalStatus`
- `outputs.childRows` — `{index, title, status, planPath?, planSlug?, correlationId?, remainingTasks?, shipPhase?, rowStatus?}` — use **`status: ship-complete`** when **`prShipComplete`** merged for that index
- `outputs.expandEligibleIndices` — one-based PR indices eligible for **`expand-eligible`** after last ship-complete merge
- `outputs.spawnedPlans`, `outputs.activeLanes`, `outputs.openLedgerEntries`, `outputs.remainingTasks`
- `outputs.continuationOwner`: `"pr-breakdown-agent"`
- `outputs.continuationStatus` — `active` while approval, child creation, or population remains; `terminal` when all PR rows are closed, deferred, abandoned, or out of scope

Emit **`mission_control_send_agent_result`** only in **step 6 act-after-select** (after the developer responds to structured choice), or when announcing spawn wait / defer / abandon — **never** in the same message as recap-only or structured-choice approval. Stop after the MCP result call in that turn. Do not emit another `mission_control_spawn_agent` or run the next protocol step in the same turn as the MCP result call (see **`../README.md`** § *Terminal stop (normative)*).

## Completion (inline)

Report the fields below in prose to the invoker on the **same lane**. Do **not** emit `mission_control_spawn_agent`, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*).

**Primary path:** **`master-planner`** Step 7 or **`phase-planner`** Step 5 runs this skill **inline** (`parentAgentRole: "master-plan-agent"` or `"phase-planner-agent"`). Runs **`new-plan`** **inline** on the same lane (then inline **`pr-plan`**). Use the same `outputs` semantics as **`## Completion (spawned)`** in prose only — the invoker lane merges ledger fields. **Standalone** mission dispatch may still spawn this skill on a child lane; then use **`## Completion (spawned)`** and spawn **`new-plan`** child lanes per step 6.
