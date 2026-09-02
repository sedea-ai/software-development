# plan-and-deliver — spawn contracts

This mission uses **three execution shapes** (see **`.sedea/centers/sedea/skills/README.md`** for dual-mode authoring). Parent resume for the **Squad Leader** is in **`../plan.mdc`** § **Spawn, wait, and parent resume** (planning §§3–7) and § **8** (ship oversight). Host spawn/result protocol is in **`.sedea/centers/sedea/rules/4_mission.mdc`**.

## Normative execution mode (plan-and-deliver)

**Do not infer mode from the presence of `## Completion (spawned)` alone** — many skills document both sections for dual-mode authoring. Use this table for **plan and deliver** on the **software-development** center.

| Skill | Normative mode on this mission | Invoker | Terminal / result |
|-------|----------------------------------|---------|-------------------|
| **`master-planner`** | **Spawned only** — new child lane; may emit **`coding-session`** spawn via inline **`pr-plan`** §5d on **this** lane (distinct from Squad Leader §§1–7 non-spawn) | Squad Leader §5 (`mission_control_spawn_agent`) | **`mission_control_send_agent_result`** on child lane |
| **`pr-plan`** | **Inline only** — same lane as invoker | **`new-plan`** step 4 (`parentAgentRole: new-plan-agent`) | **`## Completion (inline)`** — no `mission_control_send_agent_result` for **`pr-plan`** |
| **`pr-plan`** → **`coding-session`** | Spawn after §5c **Start coding session** (or **`phase-planner`** Step **5f** when inline **`pr-plan`** skipped §5c) | **`pr-plan`** lane, or **`phase-planner`** after **`prPlanHandoffSkipped`** | Child **`coding-session`** uses **`mission_control_send_agent_result`** |
| **`author-prd`** | **Spawned only** | Squad Leader §3 | Child terminal |
| **`ad-hoc-prd`** | Spawned (**`single-phase`** §3, **`debug-and-fix`** §5c — **not** plan-and-deliver §3) | **`single-phase`** / **`debug-and-fix`** Squad Leader | Child terminal |
| **`delivery-phases`**, **`pr-breakdown`**, **`new-plan`** | **Primary:** inline on **`master-planner`** / **`phase-planner`** lane on **`plan and deliver`** | Parent planning skill | Inline completion merged into parent |
| **`phase-planner`** | Spawned from inline **`new-plan`** (optional) | **`new-plan`** | Child terminal; **owns phase delivery** on its lane until **`phaseShipComplete`** or explicit defer/abandon — Master Plan lane ack-only meanwhile |
| **`phase-planner` + autoContinue** | Inline **`pr-breakdown`** on phase lane | **`phase-planner`** | inline §5 on phase plan |
| **`phase-planner` + single-PR** | **`pr-breakdown`** on phase plan | **`phase-planner`** | see **`phase-planner/SKILL.md`** §5b |
| **`coding-session`** | Spawned (from **`pr-plan`** §5d or **`phase-planner`** §5f) or detached entry | **`pr-plan`**, **`phase-planner`** (inline subtree), developer, dispatch | Child terminal + inline ship skills |
| **`hosting-repo-rules`** | **Spawned only** — detached parallel fork after **`coding-session`** terminal when spawn contract matches | **`master-planner`** Step **7c**, **`phase-planner`** Step **5e** (fire-and-forget — not **`pendingByParent`**) | Child **`mission_control_send_agent_result`**; parent updates product row **`rulesUpdatesStatus`** |
| **`pr-review`**, **`create-pr`**, **`deploy-walk`**, **`plan-reconcile`** | **Inline only** on active **`coding-session`** or **`hosting-repo-rules`** | **`coding-session`**, **`hosting-repo-rules`** | Prose to invoker ship lane — no separate child terminal |

**Dual-mode / common mistakes:** See table; detail in [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md). Glossary for colliding step labels: **`.sedea/centers/software-development/docs/development-process.md`** § *Agent glossary — step and section labels*.

## Inline execution (same lane)

When a skill runs **inline** on the invoker’s lane (not spawned via **`mission_control_spawn_agent`**):

- Report **`## Completion (inline)`** (or the mission’s inline-only result section) in **prose** to the invoker.
- Do **not** emit **`mission_control_send_agent_result`** under the inline section — MCP spawn/result tooling applies **only** under **`## Completion (spawned)`** (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*).
- Do **not** emit **`mission_control_spawn_agent`** unless the protocol step explicitly switches to spawned mode.

**plan and deliver** normally spawns planning and ship skills on child lanes; inline sections exist for dual-mode authoring and same-lane ship steps. **`pr-review`**, **`create-pr`**, **`deploy-walk`**, and **`plan-reconcile`** are **inline-only** on **`coding-session`** (no **`## Completion (spawned)`** on those skills). **`pre-pr-review`** is **spawn-only** from **`coding-session`** — **forbidden** inline on the coding-session lane; **auto-spawn** = **`mission_control_spawn_agent`** + wait for child **`mission_control_send_agent_result`**, not self-execute review steps here.

**Inline `deploy-walk`:** Self-run agent steps per **`deploy-walk/SKILL.md`**; manual steps use **`USER_CHECKPOINT`**.

## software-development center edit destination gate (binding)

Applies to **all PRD and planning skills** on this center (incl. **`coding-session`** center git edits). Happy-path **`.sedea/operations/`** writes skip this gate.

**Trigger:** create/edit/move/delete under center git (rules, missions, skills, docs, `center.yaml`).

**Host context:** Resolve **`HOSTING_ROOT`** + **`dot-sedea.mdc`** **`ownCenters`**. **`centers-development-hosting-repo`** is the CE center development host — not app hosting. Expanded routing: [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md) § *Center edit destination gate*.

USER_CHECKPOINT — pick destination before center write.

| Option id | Label | Action |
|-----------|-------|--------|
| `ship-ce-center-rd` | Ship in `sedea-centers/software-development` | **`CENTER_WORKTREE_ROOT`**; PR to registry **`source`**. **Default on `centers-development-hosting-repo`**. |
| `ship-app-rd` | Ship in `sedea-ai/software-development` | App-focused host + app-specific process only. |
| `wrong-host-switch` | Wrong host — open CE development host | Stop writes; continue on authorized CE host. **Forbidden** when already on **`centers-development-hosting-repo`**. |
| `pause` | Pause | No writes |
| `more-details` | More details | Elaborate; re-ask |

**Defaults:** **`defaultOptionId: ship-ce-center-rd`** when **`HOSTING_ROOT`** is **`centers-development-hosting-repo`**.

**Forbidden:** center writes without gate; **`sedea-centers`** as Own on **`sedea-ai/app`**; submodule checkout edits without **`CENTER_WORKTREE_ROOT`**; CE work as “delegate to base center”.

Each skill points here — no divergent option tables.

## Recap, structured choice, act (plan-and-deliver)

Mission Control delivery: recap + modal + act. Canonical rules: **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** § **Context and structured choice**; hosting runtime **`.cursor/rules/mission-control-agent-runtime.mdc`**.

| Stage | Purpose |
|-------|---------|
| **Recap** | Plan link, one-line summary |
| **Structured choice** | Modal approval / gates (`AskQuestion` or **`mission_control_present_structured_choice`**) |
| **Act** | Spawn, terminal result, implementation after modal selection |

**Checkpoint trust:** Auto-advance happy-path steps; **`USER_CHECKPOINT`** at gates and exceptions only. **Forbidden:** prose-only exit when structured choice is required.

**On-demand:** Planning open-item modal contract and ship-path gate examples — [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md). Relevant Links registration — same doc § *Relevant Links*; rule **50** § *Relevant Links (documents)*.

## Planning spawn (summary)

Squad Leader §§3/§5 spawn **`author-prd`** / **`master-planner`**; decomposition runs **`delivery-phases`**, **`pr-breakdown`**, **`new-plan`**, **`pr-plan`**, **`phase-planner`** per **§ Normative execution mode**. Depth-first expansion: **`planning-mode-templates.md`** § *Depth-first plan-tree traversal*; rule **30** § *Depth-first expansion eligibility*.

**On-demand:** Full planning spawn table, implementation consent layers, and depth-first notify — [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md) § *Planning spawn*.

## Spawn handover inputs

| Input | When | Behavior |
|-------|------|----------|
| **`plansBasePath`** | Nested folder | Write dir; forward |
| **`targetPlanPath`** | Anchored plan | Authoritative path |
| **`parentPlanPath`** | Decomp child | Parent dirname |

Omit `plansBasePath` for flat root. rule **30**; [`spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md).

## Ship spawn (detached / coding-session chain)

**On-demand:** [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md) — parallel **`hosting-repo-rules`** fork, worktree-bootstrap drain gate D1–D5, worktree removal ownership detail.


Detached/nested ship lanes — **`## Completion (spawned)`** vs inline per skill.

| Skill | Typical spawner | Outputs section | §8 ship phase hints |
|-------|-----------------|-----------------|---------------------|
| `coding-session` | **`pr-plan`** §5d / **`phase-planner`** §5f / dispatch | `## Implementation handoff result` | `implementing`; ship gates in **`coding-session/SKILL.md`** |
| `hosting-repo-rules` | **`master-planner`** / **`phase-planner`** after **`coding-session`** terminal | `## Completion (spawned)` | parallel fork — [`spawn-ship-contracts`](../docs/spawn-ship-contracts.md) |
| `worktree-bootstrap` | **Deprecated** — inline retry only | legacy contract | `worktree` |
| `pre-pr-review` | `coding-session`, **`hosting-repo-rules`** | Step 8 — Report and result | `pre-pr-review`; `recommendation: go` |

**Not §8 host-sync children:** inline **`pr-review`**, **`create-pr`**, **`deploy-walk`**, **`plan-reconcile`**, and deprecated inline **`worktree-bootstrap`** retry — milestones **must** ship §8 fields on the next **`coding-session`** terminal re-emit (see § *§8 terminal contract* below).

The Squad Leader **§8** ship ledger updates via Mission Control **host sync** when ship child lanes emit terminals with required **`outputs`**. See **`../plan.mdc`** §8 *Mission Control host sync* and **development-process.md** § *Leader-lane §8 host sync*.


### §8 terminal contract (ship skills)

When a ship skill finishes a milestone on a **detached** lane, the terminal **`mission_control_send_agent_result`** **must** include **`targetPlanPath`**, **`shipPhase`**, and **`rowStatus`** (host may infer phase when documented). **Do not** nudge manual recap on the leader dispatch. Field hints: § *Mission Control section 8 sync* in each ship `SKILL.md`.

## Inline-only (no spawn)

| Skill | Invoker | Result section | §8 ship ledger |
|-------|---------|------------------|----------------|
| `pr-review` | Active **`coding-session`** or **`hosting-repo-rules`** agent on its lane | `## Inline result for coding-session` (coding) or invoker prose (rules) | Invoker re-emit with `shipPhase: pr-review` — host sync when §8 fields present |
| `create-pr` | Active **`coding-session`** or **`hosting-repo-rules`** agent on its lane | `## Completion (inline)` | `pr-open` via invoker terminal re-emit — no separate child terminal |
| `deploy-walk` | Active **`coding-session`** agent on its lane (Before deploy after commit, After deploy after merge, or deploy phrases) | `## Completion (inline)` | `deploy-walk` via **`coding-session`** terminal re-emit — no separate child terminal |
| `plan-reconcile` | Active **`coding-session`** agent on its lane (after deploy, stale worktree pick, or *plan reconcile* phrase) | `## Completion (inline)` | `reconcile` / `done` via **`coding-session`** terminal re-emit — no separate child terminal |

**`pr-review`**, **`create-pr`**, **`deploy-walk`**, and **`plan-reconcile`** return through the **active ship invoker** (**`coding-session`** or **`hosting-repo-rules`**). §8 updates on the leader dispatch via invoker terminal re-emit and host sync when documented (**`../plan.mdc`** §8).



## Required terminal notification (all spawned children)

Every **spawned** child ends with **one parent notification** on its lane via MCP **`mission_control_send_agent_result`**:

| Field | Rule |
|-------|------|
| **`status`**, **`summary`** | Required |
| **`outputs`**, **`errors`** | Optional per skill **`## Completion (spawned)`** |
| **`correlationId`** | **Forbidden** in MCP args — host resolves from child lane spawn context |

Re-emit an **updated** MCP result after user-requested follow-up on that lane (same spawn session).

Populate **`outputs`** from the skill's **`## Completion (spawned)`** and any referenced domain section above.

**MCP result protocol:** see rule **4** § *MCP result protocol* — tool descriptor on workspace server; forbidden identity keys in § *Host-resolved identity* above.

## Definitive `bootstrapRules` (Software Development center layer — plan and deliver)

When Mission Control dispatches **`centerSlug === software-development`**, the host merges this path into **`effectiveWarmUp`** after the Sedea bootstrap layer (PRD §5.4; host resolver ships in phase 6 PR 3):

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap (≤10 KB) — mirrors **`.sedea/centers/sedea/rules/bootstrap.mdc`** pattern |

Spawned skill **`SKILL.md`** § *Warm-up manifest* tables document this row under **`bootstrapRules`**. **`laneRules`** and **`skillWarmUp`** tables in the same section are unchanged by bootstrap authoring alone — numbered Software Development rules stay **`alwaysApply: true`** until the flip PR lands.

## Definitive `laneRules` (plan and deliver)

Normative minimum **`laneRules`** paths per lane role — merged into **`effectiveWarmUp`** after Sedea and Software Development **`bootstrapRules`** per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md). Host-owned storage; invokers supply on **`mission_control_spawn_agent`** when skill frontmatter alone does not carry role minimums (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Lane warm-up manifest*).

| Lane role | Definitive `laneRules` (in addition to bootstrap) |
|-----------|---------------------------------------------------|
| **Squad Leader** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/sedea/rules/4_mission.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/plan.mdc`, `.sedea/centers/software-development/docs/development-process.md` |
| **`author-prd` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/author-prd/SKILL.md`, `.sedea/centers/software-development/missions/plan-and-deliver/plan.mdc` (§§1–3) |
| **`brainstorm-research` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/brainstorm-research/SKILL.md`, `.sedea/centers/software-development/rules/31_dispatch-scope.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |
| **`ad-hoc-prd` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/ad-hoc-prd/SKILL.md`, `.sedea/centers/software-development/rules/31_dispatch-scope.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |
| **`master-planner` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/master-planner/SKILL.md`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |
| **`quick-fix-plan` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc`, `.sedea/centers/software-development/missions/quick-fix/skills/quick-fix-plan/SKILL.md`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |
| **`coding-session` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/sedea/rules/6_git-commit-push-gate.mdc`, `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/coding-session/SKILL.md` |
| **`phase-planner` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/phase-planner/SKILL.md`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |
| **`pre-pr-review` child** | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/pre-pr-review/SKILL.md`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |
| **`worktree-bootstrap` child** (deprecated — drain gate **D4**) | `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`, `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/worktree-bootstrap/SKILL.md`, `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` |

**Spawn binding exceptions** (`ad-hoc-prd`, **`quick-fix-plan`** mission `plan.mdc`) — [`spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md) § *Default warm-up*.


**Parity / verify:** **`verify-lane-warmup-parity.mjs --bootstrap full`** (and **`--bootstrap slim`** before alwaysApply flip); **`verify-warmup-bytes.mjs --table`** for per-role spawn byte CI; **`--enforce-spawn-byte-budget`** when CI enforce is enabled. Roles, sign-off, and spawn **`warmUpRules`** binding detail — [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md) § *Default warm-up — cap exceptions and maintenance*.

## Universal spawn preflight (all plan-and-deliver spawners)

Run the checklist **before every child spawn** on any lane (Squad Leader §§3/§5, **master-planner** Step 7, **pr-plan** §5d, ship-chain spawns). Host behavior is in **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol* (MCP-only, host-resolved identity); this section is the **plan-and-deliver** operator checklist.

Host MCP spawn/result and forbidden identity keys — rule **4** § *Agent-to-agent spawn protocol*; detail in [`spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md).

### MCP spawn preflight (`mission_control_spawn_agent`)

| Step | Check |
|------|--------|
| M1 | Read target **`SKILL.md`** — confirm it documents MCP as primary (or MCP with MCP first) before switching off MCP-only |
| M2 | Every **`required: true`** input in skill frontmatter appears in MCP **`inputs`** with a valid value (see MCP spawn preflight) |
| M3 | Required MCP args present: **`skillPath`**, **`slug`**, **`name`**, **`description`**, **`inputs`** — camelCase keys match skill frontmatter |
| M4 | **Forbidden args absent** — no host-resolved identity keys (§ *Host-resolved identity* above) |
| M5 | Optional only when needed: **`warmUpRules`**, **`initiatingPrompt`** (≤ 32 KiB) |
| M6 | **`skillPath`** resolves under the correct center (Software Development skills under **`.sedea/centers/software-development/`**) |
| M7 | On tool validation failure: stop, fix the failing row, retry spawn — new successful spawn mints a **new** host **`correlationId`** |
| M8 | **`name`** / **`description`** — **lane title prefix** + semantic title per [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Lane title prefix conventions* and § *Lane title prefix (spawn `name`)* below; refresh stale child tab via **`mission_control_update_lane_display`** |
| M9 | **Spawn-ack semantics** — MCP response with **`transcriptOnly: true`** / **`hostMirrorRequired: true`** is **transcript acknowledgment only**, not host spawn success, child lane open, or **`correlationId`** delivery proof; spawn turn emits **`mission_control_spawn_agent` alone** — **forbidden** parallel spawn + wait modal on the same turn; verify host-visible child before external-wait narration — see [`.sedea/centers/sedea/rules/4_mission.mdc`](.sedea/centers/sedea/rules/4_mission.mdc) § *Spawn-ack semantics (binding)* |

Child terminal: use § *MCP result preflight* in the spawned skill’s **`## Completion (spawned)`** — call **`mission_control_send_agent_result`** at terminal (host resolves **`correlationId`**; omit host-resolved identity keys from MCP args).


### Lane title prefix (spawn `name`)

Before MCP row **M8**, set spawn **`name`** (and child lane **`title`** on refresh) to **`{prefix}-{semantic title}`** per [`.sedea/centers/software-development/rules/50_mission-control-display-metadata-discipline.mdc`](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Lane title prefix conventions*:

| Target skill | Prefix | `[N]` |
|--------------|--------|-------|
| **`author-prd`**, **`ad-hoc-prd`** | `PRD` | — |
| **`master-planner`** | `MP` | — |
| **`phase-planner`** | `PH{N}` | `parentIndex` (Delivery phases row) |
| **`coding-session`** | `PR{N}` | `parentIndex` (**`### PR list`** row) — **`pr-plan`** §5d and equivalent spawns |
| **`pre-pr-review`** | `Pre-PR Review` | — |

Truncate semantic title only when the full string exceeds rule **9** max **`title`** length (64).

### Terminal stop (normative for every spawned skill)

**This section is the canonical stop rule** for all **`## Completion (spawned)`** blocks in this mission, even when an individual `SKILL.md` ends that section after the host-protocol paragraph without repeating the sentence below.

After emitting **`mission_control_send_agent_result`**, **stop on that lane** for the current skill turn:

1. Do **not** emit another **`mission_control_spawn_agent`** unless a later user message on the same lane explicitly continues the skill (then call **`mission_control_send_agent_result`** again with updated **`outputs`** for the same spawn session).
2. Do **not** call MCP **`mission_control_propose_dispatch_resolution`** — only the **plan and deliver** Squad Leader closes the dispatch.
3. Do **not** run the next protocol step in the same turn after **`mission_control_send_agent_result`** (including “wait for child” announcements — the stop applies **after** the MCP result is sent).

**Canonical closing sentence** (optional in skill prose; meaning is required either way):

> Stop after the MCP result is sent.

**Order when gated:** structured choice → refocus (when eligible) → MCP result → stop. Refocus/detail: [`spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md).


## Default warm-up

Every **spawned** plan-and-deliver skill lists the paths below in frontmatter **`warmUpRules`** (Mission Control merges with optional run-request **`warmUpRules`**). **`skills/README.md`** (this file) is **required** on all of them so § *Terminal stop (normative)* loads even when an individual `SKILL.md` omits the closing sentence.

**All spawned skills** (planning + ship):

- `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` — slim spawn contracts, **terminal stop (normative)**; on-demand [`docs/spawn-ship-contracts.md`](../docs/spawn-ship-contracts.md) at terminal gates

**Planning skills** also include (frontmatter **`warmUpRules`**):

- `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` — plan-and-deliver planning roles (`master-planner`, `phase-planner`, `pr-plan`, `pr-breakdown`, `delivery-phases`, `new-plan`)
- `.sedea/centers/software-development/rules/10_plan-naming-convention.mdc` — **`ad-hoc-prd`**, **`quick-fix-plan`**
- `.sedea/centers/software-development/missions/quick-fix/plan.mdc` — **`quick-fix-plan`** only

**Squad Leader** and other lanes that need full mission protocol load **`plan.mdc`** and **`development-process.md`** via **`laneRules`** or explicit spawn **`warmUpRules`** — not via trimmed planning-skill frontmatter.

**Ship skills** also include:

- `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`
- `.sedea/centers/software-development/rules/30_planning-target-resolution.mdc` — **`pre-pr-review`** spawn only; **`coding-session`** omits rule **30** from frontmatter (384 KiB warm-up cap); use `inputs.targetPlanPath` and explicit `Read` of rule **30** when resolving ambiguous `.sedea` paths

