# Spawn and ship contracts (on-demand)

**On-demand reference.** Load via step-bound `Read` from skills that **emit or merge child terminals** — not in default `warmUpRules` for every spawned lane. Normative owner: slim [`skills/README.md`](../skills/README.md); this doc holds upstream notification merge rules, parallel fork contracts, worktree drain gate, notify preflight detail, and parent refocus tables.

Cross-ref: [`development-process.md`](../../docs/development-process.md) § *Depth-first plan-tree traversal*; rule **4** § *MCP notify protocol*.

---

## Spawn handover inputs (plan-writing chain)

Normative slim table: [`skills/README.md`](../skills/README.md) § *Spawn handover inputs*. Path-resolution priority and on-demand load: rule **30** § *Plans write path resolution*.

**Omit **`plansBasePath`** when:** dispatch uses flat `plans/` root only; resolve JSON returns **`plansBasePath: null`**.

**Nested path shape (binding):** **`.sedea/operations/<scope>/plans/YYYY-MM/<dispatch-slug>/`** — validated by **`plan-resolve-plans-write-dir.mjs`**. **Forbidden:** user-id, **`joint`**, dispatch mtime, or **`ls -lt`** heuristics — rule **31** § *Plans and docs paths*.

**Resolve helper (binding):** from **`HOSTING_ROOT`**:

```bash
.sedea/centers/sedea/scripts/run-sedea-node.sh \
  .sedea/centers/software-development/missions/plan-and-deliver/scripts/plan-state.mjs \
  resolve-plans-write-dir --json \
  ${PLANS_BASE_PATH:+--plans-base-path "$PLANS_BASE_PATH"} \
  ${TARGET_PLAN_PATH:+--target-plan-path "$TARGET_PLAN_PATH"} \
  ${PARENT_PLAN_PATH:+--parent-plan-path "$PARENT_PLAN_PATH"}
```

**Resolution priority:** **`plansBasePath`** → **`targetPlanPath`** dirname → **`parentPlanPath`** dirname → flat **`plans/`** root.

**Skills that honor and propagate (Phase A):**

| Skill | Write | Spawn propagate |
|-------|-------|-----------------|
| **`new-plan`**, **`master-planner`**, **`phase-planner`** | Resolve **`writeDir`** before scaffold | **`plansBasePath`** in spawn **`inputs`** when JSON non-null |
| **`delivery-phases`**, **`pr-breakdown`** | Resolve from session **`inputs`** | Inline **`new-plan`** handoff row + standalone spawn **`inputs`** |
| **`coding-session`** | — | **`targetPlanPath`** only at spawn |

**Sidecar:** nested first write sets **`plansMonthBucket: YYYY-MM`** (PR 1); flat-root omits.

---

### Planning open-item modal contract

Planning composition skills that surface review gaps before approval use the same modal shape as **`author-prd/SKILL.md`** Step **10**. This applies when a planning lane presents open items in generated PRDs, Master Plans, phase plans, PR breakdowns, plan stubs, or PR plans before the developer approves, revises, defers, or starts implementation.

**Detect open items before building the modal.** Open items include unresolved `TBD` markers, missing required plan sections, contradictions, incomplete acceptance or handoff details, blocked readiness states, and any agent-discovered decision that would otherwise be hidden in prose.

**When open items exist — one modal, multiple questions:**

- **`displayMarkdown`** renders a numbered list of the open items. Each item states the document location, the gap, why the decision matters, and the agent-proposed resolution options.
- **`askQuestion.questions`** contains **one entry per open item**. Each question has its own `id`, `prompt`, and item-scoped `options` (for example accept a proposed resolution, choose an alternate resolution, mark not applicable, defer as follow-up, gather more evidence, or request more details for that item).
- **The final question in the array** is always the terminal approval / routing question for the gate, with options such as approve, revise, defer, start implementation, or **More details for option _** as appropriate for the skill.
- **Forbidden:** combining all open-item decisions into one `questions` entry; mixing item-resolution options with terminal approve / revise options in the same question; emitting a resolve-only modal that omits the terminal approval / routing question.
- **Many open items:** batch across turns when one modal would be impractical. Each batch still includes the terminal approval / routing question last, so the developer can approve with remaining gaps explicitly documented when the skill allows it.

**When no open items remain** (or only visible follow-up notes the developer may accept as-is), use a single terminal approval / routing question with the gate's normal options and **More details for option _**.

**Act after selection.** Apply selected item resolutions only after the developer picks them in the modal, rewrite or re-check the affected artifact, then return to the same modal shape until the gate reaches its terminal branch. Do **not** treat writing the draft, rendering the recap, or silence as approval.

**Reference implementations (planning):**

| Skill | Recap + structured choice (same turn) | Act |
|-------|---------------------------------------|-----|
| **`pr-breakdown`**, **`delivery-phases`** | §5d link + one-line summary + §6 modal | §6 act-after-select (depth-first); **`pr-breakdown`** **`approve-list`** may auto-expand PR **1** inline under **`master-planner`** |
| **`pr-plan`** | §5c recap + modal (skipped when `skipPrPlanHandoffModal` auto-chain) | §5d spawn |
| **`author-prd`**, **`ad-hoc-prd`** | Step 10 / 5 recap + open-item elaboration; **one `questions` entry per open item**, then Approve/Revise as **last** question | Step 10a / 5a apply resolution for answered item; step 11 / 6 terminal on Approve |
| **`master-planner`** | §7 draft + §7 approval modal same turn; §7a status + §7b next moves | §7c |
| **`phase-planner`** | §4f echo / §5c route modal; Step **5f** after **`prPlanHandoffSkipped`** | §5b inline decompose / Step **5f** **`coding-session`** spawn |
| **`new-plan`** | stub + parent link + populator gate | populator spawn |

**Ship and ops skills:** **`coding-session`** (Checkpoint § *Checkpoint turn UX* — three-stop model (post-create-pr, **`pr-review`** disposition, After deploy manual); auto-advance happy path including review feedback (**`fix-now-session`** **same turn** — no modal; append **`proposedFollowUps`** to plan), create-PR follow-ups (**`approve-followups-create-pr`** **same turn**), rebase `--force-with-lease`, pre-merge **`delegate-merge-confirm`**; **`USER_CHECKPOINT`** at worktree-open when layer 2 required, **post-create-pr** after inline **`create-pr`**, implementation continuation (exception), repo rules reconciliation (exception), ship cut-point (exception), Non-Checkpoint/exception review-feedback and create-PR handoff only, and After deploy manual steps; center **`worktree-setup.sh`** bootstrap hints; **pre-PR ship gate** — no push/create-PR modals until **`pre-pr-review`** **`go`** except executive override; **auto** pre-PR spawn after cut-point + Before deploy; **auto** inline **create-pr** on clean **go**; inline **`pr-review`** (Checkpoint auto-disposition for CI/Must); **agent-delegated approve + merge** when authorized; **auto** post-merge cleanup when merged; inline **deploy-walk**; inline **plan-reconcile**), **`worktree-bootstrap`** (**deprecated** — exception-only inline retry; normative bootstrap is center setup on **`coding-session`**), **`pre-pr-review`** (Checkpoint § *Checkpoint turn UX* — spawn-only reviewer lane; Steps **1–8** auto-advance including Step **8** terminal + parent refocus; **no** developer-input **`USER_CHECKPOINT`** on this lane; findings hand back to **`coding-session`** [Review feedback approval gate](../coding-session/SKILL.md#review-feedback-approval-gate) — Checkpoint auto-implements). **`pr-review`** (Checkpoint § *Checkpoint turn UX* — auto-advance Steps **0–3a**, **1b**, and **5** on happy path; **`USER_CHECKPOINT`** at [Disposition gate](../pr-review/SKILL.md#step-4--report-and-disposition-gate) and [Post-fix commit/push gate](../pr-review/SKILL.md#post-fix-commitpush-gate-binding); cycle resume via **`coding-session`** [Post-create-pr handoff gate](../coding-session/SKILL.md#post-create-pr-handoff-gate) — **not** rule **2** external-wait). Step **4** disposition gate uses **contextual** `options` from triage counts (see § *Build disposition options*). Prefer **AskQuestion** or **`mission_control_present_structured_choice`** when recap and modal belong in one message. Gate detail: **`coding-session/SKILL.md`** § *Checkpoint turn UX*, § *Repo rules reconciliation gate*, § *Pre-PR ship gate (push/PR)*, § *Post-create-pr handoff gate*, and § *Implementation continuation gate*.

**Lane pick (no resolved target):** emit *Where we are now in the plan tree* snapshot, then structured choice per **30_planning-target-resolution** § *Sedea input channel* (MCP or split — not prose menus).

**Spawned child lanes:** Cloud/spawned agents lack the native AskQuestion tool. **Every turn** **must** call **`mission_control_present_structured_choice`** (MCP tool call, recap in **`displayMarkdown`**, options in **`askQuestion`**) or split per rule **2** priority **3**. Wire format: rule **2** § **`mission_control_present_structured_choice` MCP tool contract (binding)**. Gate templates: **`coding-session/SKILL.md`** § *Spawned lane — MCP structured choice (binding)*.

### Worktree removal ownership (binding)

**Do not remove worktrees you do not own.** Applies to every ship skill on **`coding-session`**, **`hosting-repo-rules`**, and **`plan-reconcile`** §5.

| Source | Contract |
|--------|----------|
| [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Worktree ownership* | Four preconditions before detach/remove |
| [`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`](.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc) § *Worktree removal ownership (binding)* | Software Development ship lanes |
| **`coding-session/SKILL.md`** § *Post-merge workspace cleanup* | Primary post-merge owner |
| **`plan-reconcile/SKILL.md`** §5 | Idempotent fallback only |

**Forbidden:** **`git worktree remove`**, **`git worktree prune`**, **`sedea_remove_worktree_folder`** on paths **this pass** did not create and mount; repo-wide cleanup from **`git worktree list`**; **`git worktree remove`** on **`HOSTING_ROOT`**. **`git worktree list` is read-only** when ownership is unclear — stop and use structured choice.

### Worktree-bootstrap skill drain gate

**`worktree-bootstrap`** is **deprecated** — normative bootstrap is center **`.sedea/centers/sedea/scripts/worktree-setup.sh`** on **`coding-session`**. Skill files remain **read-only** until all drain criteria pass; **do not delete** the skill directory in the deprecation PR.

| # | Gate (all required before skill file deletion) |
|---|-----------------------------------------------|
| **D1** | Phase 2 consumer wiring merged — **`coding-session`** and **`promote-submodule-pin`** call center setup + MCP attach/detach on the default path |
| **D2** | This deprecation PR merged — spawn table redirect, **`coding-session`** spawn-by-default removal, deprecate banner on **`worktree-bootstrap/SKILL.md`** |
| **D3** | Phase 4 docs sweep merged — **`development-process.md`**, rule **20**, and related prose no longer treat **`worktree-bootstrap`** as normative |
| **D4** | **Zero** open Mission Control dispatches with active **`worktree-bootstrap`** child lanes (in-flight sessions drained) |
| **D5** | **`verify-lane-warmup-parity.mjs --bootstrap full`** still passes with **`worktree-bootstrap`** role retained until **D4**; remove role from parity manifests only after **D1–D4** |

**Until drain:** Spawners **must not** emit **`mission_control_spawn_agent`** for **`worktree-bootstrap`** except documented break-glass; **`coding-session`** uses center setup hints and **inline** retry only. **`worktree-bootstrap`** is **not** a §8 host-sync child — bootstrap / `worktree` phase updates report via **`coding-session`** terminal re-emit only.

### Parallel **`hosting-repo-rules`** fork (fire-and-forget)

When **`coding-session`** terminal outputs satisfy the spawn contract in **`hosting-repo-rules/SKILL.md`** § *Spawn trigger*, parent **`master-planner`** / **`phase-planner`**:

| Behavior | Rule |
|----------|------|
| Spawn | **`mission_control_spawn_agent`** for **`hosting-repo-rules`** with handoff fields (`sourceCodingSessionCorrelationId`, `pendingRepoRulesPaths`, `repoRulesReconciliationStatus`) |
| Wait | **Do not** wait on rules PR merge before next PR row / phase expand |
| Ledger | Set product row **`rulesUpdatesStatus`** (`spawned` → `complete` \| `failed`); optional `hostingRepoRulesCorrelationId`, `rulesPrUrl` |
| Forbidden | Separate **`shipRows`** sub-row; adding rules child to **`pendingByParent`** |
| Scope escape | Center/mission gaps → **Alignment Drift Brief** (rule **5**) — not **`hosting-repo-rules`** |
| Mutual exclusion | Inline **`coding-session`** reconcile remains authoritative when satisfiable on product lane; parallel lane handles **`pending`** / deferred §5 after product terminal |

**Inline `pr-review` ship-chain note (binding):** After fix push when Steps **1–4** ran in-session, **`pr-review`** Step **5 (GitHub reconciliation)** is **not optional** — same assistant turn as push per rule **20** § *Commit and push cadence* step 3 and **`pr-review/SKILL.md`** § *Step 5 turn invariant*. Set **`outputs.githubReconciliationStatus: complete`** before **`mergeDelegationReady: true`**. Distinguish **`reconcile-github-only`** (Step 5 only) from **`rerun-pr-review`** (full triage) at **`coding-session`** post-create-pr and pre-merge gates.

## Upstream ship-complete notification (spawn chain)

Depth-first expansion ( **`development-process.md`** § *Depth-first plan-tree traversal*) requires parents to know when a child PR or phase is **ship-complete** before offering **`expand-eligible`** / **`expand-next-eligible`**. Two channels apply:

| Channel | When | Parent action |
|---------|------|---------------|
| **Spawn `mission_control_send_agent_result`** | **`coding-session`** child terminal after inline **`plan-reconcile`** with merge + main pull + archive | Parent merges **`prShipComplete`**; unlock next PR per **`### Sequencing`** |
| **Host sync on leader** | Detached **`coding-session`** terminal with §8 **`outputs`** | Squad Leader §8 row updates automatically — no manual recap |

### Required terminal fields — **`coding-session`** (reconcile complete)

When **`outputs.shipPhase`** is **`done`** and **`outputs.rowStatus`** is **`closed`** after inline **`plan-reconcile`**, also set:

| Field | Value |
|-------|--------|
| **`prShipComplete`** | `true` |
| **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`** | From spawn **`inputs`** when present ( **`pr-plan`** §5d ) |
| **`mainPullStatus`** | From **`plan-reconcile`** inline completion (`success` \| `skipped` \| `failed`) |
| **`archivedSlugs`** | Target slug when archived |

### Parent merge rules (normative)

Each parent **must** handle **`Mission Control: agent-result-response delivered.`** for its spawned children:

| Parent | Child | On **`prShipComplete`** | On **`phaseShipComplete`** | On **`parentPlanningFollowUpNotification: "sent"`** |
|--------|-------|-------------------------|----------------------------|-----------------------------------------------------|
| **`pr-plan`** | **`coding-session`** | Merge child ship fields; **re-emit updated** `mission_control_send_agent_result` (standalone) or **`## Completion (inline)`** (under **`new-plan`**) | — | Bubble **`parentPlanningFollowUps`**; **re-emit updated** |
| **`new-plan`** (inline) | **`coding-session`** via inline **`pr-plan`** | Merge §5b; propagate **`prShipComplete`** + index to **`pr-breakdown`** / **`phase-planner`** invoker | — | Propagate **`parentPlanningFollowUps`** in **`## Completion (inline)`** |
| **`pr-breakdown`** | inline **`new-plan`** / **`pr-plan`** chain | Mark **`childRows[N].status: ship-complete`**; compute **`expandEligibleIndices`**; **re-emit updated** terminal or offer **`expand-eligible`** on next turn | — | Append to parent plan **`## Follow-ups`**; track **`pendingParentFollowUps[]`** — no expand |
| **`phase-planner`** | **`coding-session`** (nested) or inline **`pr-breakdown`** rows | Track per-PR ship on phase subtree | When **all** PRs under phase are ship-complete → **`phaseShipComplete: true`** → notify **`new-plan`** / **`master-planner`** parent | Append to phase/master parent **`## Follow-ups`**; no expand |
| **`delivery-phases`** | **`phase-planner`** | — | Mark phase row **`ship-complete`**; offer **`expand-next-eligible`** for next phase index | Echo bubbled follow-ups to master plan when present |
| **`master-planner`** | **`pr-breakdown`** / **`delivery-phases`** inline + nested child results | Merge ledger; add **`expand-eligible`** / **`expand-next-eligible`** to Step **7b** when indices unlock | Same for next phase | Append to master plan **`## Follow-ups`**; ledger **`pendingParentFollowUps[]`** |

**Re-emit rule:** After merging a child ship-complete result, the parent re-sends `mission_control_send_agent_result` with updated `outputs` (same spawn `correlationId` resolved by the host) before stopping — so *its* parent receives fresh `outputs`. Silence on the child lane is **not** ship-complete.

## Upstream parent follow-up notification (spawn chain)

Depth-first delivery plans phases and PRs as work starts. During PR development, **`coding-session`** may discover scope-adjacent items that belong in **future** phase or PR planning — not in the current PR scope. Those items live on the PR plan **`## Follow-ups`** during the session; **`plan-reconcile`** drains them at archive. **Before ship-complete**, parents (**`master-planner`**, **`phase-planner`**, and intermediate **`pr-plan`** / **`new-plan`** bubble chain) need a **notification** so they can schedule future rows without waiting for archive.

| Channel | When | Parent action |
|---------|------|---------------|
| **Spawn `mission_control_send_agent_result` re-emit** | **`coding-session`** terminal when **`parentPlanningFollowUpNotification: "sent"`** | Parent appends to **parent plan** **`## Follow-ups`**; tracks **`pendingParentFollowUps[]`** on ledger — **does not** expand next PR/phase or run decomposition |
| **Host sync on leader** | Unchanged — §8 ship ledger only | Squad Leader §8 — not parent follow-up routing |

**Role boundary (binding):** **`coding-session`** **emits** structured follow-up items; it **must not** run **`delivery-phases`**, **`pr-breakdown`**, **`new-plan` expand**, edit master/phase **`### PR list`**, or perform planner / phase-planner / Squad Leader duties. Parents **schedule** future work on later turns — follow-ups inform planning; **`expand-eligible`** / **`expand-next-eligible`** still require **`prShipComplete`** / **`phaseShipComplete`** per § *Upstream ship-complete notification* above.

### Required terminal fields — **`coding-session`** (parent follow-up notify)

When **`outputs.parentPlanningFollowUpNotification`** is **`"sent"`**, also set:

| Field | Value |
|-------|--------|
| **`parentPlanningFollowUps`** | Non-empty array of `{ "text", "sourcePlanPath", "suggestedTarget?", "discoveredAt" }` — items for **parent** scheduling |
| **`parentPlanningFollowUpNotification`** | `"sent"` (first emit) or echo prior `"sent"` on re-emit until parent acknowledges upstream |
| **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`** | From spawn **`inputs`** when present — **required** when notification is **`"sent"`** |

When no parent-scheduling follow-ups this session, set **`parentPlanningFollowUpNotification: "none"`** and omit **`parentPlanningFollowUps`** or use `[]`.

**Trigger gates (coding-session):** emit after developer approves PR-plan **`## Follow-ups`** append when the bullet has **`(target: …)`** outside current PR scope **or** the developer explicitly marks *schedule on parent*; re-emit on ship milestones (`pr-open`, `pr-review`, terminal re-emit) when **`parentPlanningFollowUps`** is non-empty and notification not yet **`"sent"`**. PR-only follow-ups with no parent target may stay on the PR plan until **`plan-reconcile`** without upstream notification.

### Parent merge rules (normative)

Each parent **must** handle **`agent-result-response delivered`** with **`parentPlanningFollowUpNotification: "sent"`**:

| Parent | Child | Action |
|--------|-------|--------|
| **`pr-plan`** | **`coding-session`** | Merge **`parentPlanningFollowUps`**; bubble in **`outputs`**; **re-emit updated** terminal (standalone) or **`## Completion (inline)`** (under **`new-plan`**) |
| **`new-plan`** (inline) | via inline **`pr-plan`** | Propagate follow-up fields to invoker **`## Completion (inline)`** or re-emit |
| **`pr-breakdown`** / **`phase-planner`** | inline chain / nested **`coding-session`** | Append items to **parent plan** **`## Follow-ups`** (canonical sink); update **`pendingParentFollowUps[]`**; **do not** auto-expand next index |
| **`master-planner`** | bubbled from **`pr-breakdown`** / **`phase-planner`** | Same append to master or phase parent plan; keep **`continuationStatus: active`**; Step **7b** expand options unchanged until ship-complete |

**Re-emit rule:** Same as ship-complete — bubble **`parentPlanningFollowUps`** upward; parent **re-emits updated** terminal before stopping when standalone spawned.

### MCP notify preflight (`mission_control_notify_child_lanes`)

Parent planner skills (**`master-planner`**, **`phase-planner`**, **`pr-breakdown`**) call **`mission_control_notify_child_lanes`** after **material** plan edits that affect named child lanes (active **or** terminal **planner** slugs per rule **4** § *Planner-lane wake*). Normative protocol: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol*. Per-skill **emit-when** tables live in each skill § *Plan-change notify — emit-when*.

**Parent offer after execution (binding):** Once a plan under a planner lane has **entered execution** (open non-terminal **`coding-session`**, or **`implementationHandoffStatus: spawned-coding-session`**), that planner’s continuation / wait modals **must** offer a developer **`plan-change`** option (*Plan Change — revise plan and notify open children*) before relying on ad-hoc revise alone. Emit notify only after the material edit from that path (or an explicit same-message revise that names scope). **Receive** USER_CHECKPOINTs on children are **not** a substitute for this parent **offer**. Skills: **`master-planner`** Step **7b**, **`phase-planner`** Step **5d**, **`quick-fix-plan`** while aggregating an open **`coding-session`**.

| Step | Check |
|------|--------|
| N1 | Caller authority — this skill may notify descendant slugs only (rule **4** § *MCP notify protocol* caller table); **`coding-session`** and leaf skills **forbidden** |
| N2 | Required args present: **`summary`**, **`changeType`**, **`affectedPlanPaths`** (non-empty), **`targetSlugs`** (exactly one slug) |
| N3 | **Forbidden args absent** — no host-resolved identity keys (§ *Host-resolved identity* above), no **`notifyAllDescendants`** |
| N4 | **`targetSlugs`** contains exactly **one** dispatch-unique child slug per MCP call (v1); terminal **planner** slugs allowed per rule **4** § *Planner-lane wake* |
| N5 | **`affectedPlanPaths`** lists every operations plan path that grounds the change |
| N6 | Multiple children → **separate MCP calls** — one slug per call; **forbidden** empty or speculative **`targetSlugs`** |
| N7 | Include **terminal planner** slugs when **`affectedPlanPaths`** intersects their anchored plan; omit terminal **leaf** lanes (`coding-session`) per rule **4** § *Leaf-lane omission* — run registry lookup before spawn ( **`master-planner`** § *Spawn vs notify — phase-planner registry lookup*, **`new-plan`** § *Populator registry lookup*) |
| N8 | **First-time** expansion with no prior slug → **`mission_control_spawn_agent`** — when slug exists → notify, never duplicate spawn |

**Spawn vs notify (binding):**

| Mechanism | When | Tool |
|-----------|------|------|
| **Spawn** | New child lane / first-time row expansion — **no** prior slug for that plan path | **`mission_control_spawn_agent`** |
| **Notify (active)** | Material plan edit affects **existing** non-terminal child; handoff + re-read | **`mission_control_notify_child_lanes`** |
| **Notify (terminal wake)** | Material plan edit affects **existing terminal planner** slug for that plan path (add PR to ship-complete phase, etc.) | **`mission_control_notify_child_lanes`** — host **wakes** lane; child sets **`continuationStatus: active`** on re-emit |

**Depth-first + plan change:** When a **ship-complete** Delivery phases row or PR list row needs another PR, parents **notify** the sleeping **`phase-planner`** / **`pr-plan`** lane — **forbidden** duplicate spawn for the same **`targetPlanPath`** / parent index (rule **4** § *Spawn vs notify*).

Notify does **not** replace child terminal **`mission_control_send_agent_result`** merge on parent lanes (see **`phase-planner`** Step **5e**, **`pr-breakdown`** Step **6b**). Feature flag **`sedea.features.plan-change-notification`** must be on for host delivery (default off until dogfood PR 4).

**Child delivery checkpoint (receive) — binding:** Eligible **child** lanes that receive notify UserSend must implement § *Plan-change notification receive (child lane)* in their skill docs. v1 required skills:

| Skill | Receive section |
|-------|-----------------|
| **`coding-session`** | § *Plan-change notification receive (child lane)* — ship-lane recipient during PR implementation |
| **`phase-planner`** | § *Plan-change notification receive (child lane)* — mid phase delivery |
| **`master-planner`** | § *Plan-change notification receive (child lane)* — Master Plan child during decomposition |
| **`pr-plan`** | § *Plan-change notification receive (child lane)* — standalone spawned populator during §5c/§5e (inline invoker lanes use invoker receive sections) |

**Receive contract (all listed skills):** mandatory **`Read`** of each **`affectedPlanPaths`** entry; USER_CHECKPOINT with acknowledge / re-read-revise / plan-reconcile / escalate / stop-work options; **forbidden** terminal **`mission_control_send_agent_result`** solely due to notify; notify is **developer-input USER_CHECKPOINT**, not external-wait. Extend the table for other spawned plan-and-deliver children when dogfood surfaces gaps. Normative summary: **`.sedea/centers/sedea/rules/4_mission.mdc`** § *MCP notify protocol* § *Child agent duty*.

### Parent refocus on terminal (`mission_control_refocus_parent_lane`)

Spawned child lanes call **`mission_control_refocus_parent_lane`** on **true skill terminal** (not mid-flight **`continuationStatus: active`** re-emits) so the developer lands on the **immediate parent** lane before the MCP result. Ordering (when eligible): structured choice (if a gate is open) → **`mission_control_refocus_parent_lane`** → **`mission_control_send_agent_result`** → stop. See **`.sedea/centers/sedea/skills/README.md`** § *Optional parent refocus (`mission_control_refocus_parent_lane`)*.

| Skill | Refocus before MCP result? |
|-------|----------------------------|
| **`brainstorm-research`** | **Required** on Approve / Abandon terminal |
| **`pre-pr-review`** | **Required** (Step 8 **`go`** / **`no-go`**) |
| **`debug-and-fix`** (mission skill) | **Required** on all step-7/8 terminal outcomes |
| **`phase-planner`** | **Forbidden** while **`continuationStatus: active`**, **`phaseShipComplete: false`**, open **`### PR list`** rows, or §5f handoff pending; **Required** when **`phaseShipComplete: true`**, explicit defer/abandon, or unrecoverable failure with no retry |
| **`master-planner`** | **Forbidden** while **`continuationStatus: active`** or §7 **`caveatsApprovalStatus: pending`**; **Required** on true **`continuationStatus: terminal`** |
| **`author-prd`**, **`ad-hoc-prd`** | **Forbidden** while approval pending (**`continuationStatus: active`**); **Required** on Approve / Abandon terminal |
| **`delivery-phases`**, **`pr-breakdown`**, **`new-plan`**, **`pr-plan`** | **Forbidden** while **`continuationStatus: active`**, open children, or pending gates; **Required** on true **`continuationStatus: terminal`** when this skill runs **spawned** (standalone). Inline under a planner lane: no refocus (inline completion) |
| **`coding-session`** | **Required** on true ship / abandon / blocked terminal **when** a resolvable spawned parent exists; **omit** on detached / parentless entry (host would no-op) |
| **`hosting-repo-rules`** | **Forbidden** — fire-and-forget parallel fork; parent does not await focus handback |
| **`quick-fix-plan`** (quick-fix mission) | **Forbidden** while **`continuationStatus: active`** or open **`coding-session`**; **Required** on true skill terminal |

**Common mistake:** Emitting refocus on the first **`status: success`** terminal after §§1–4 + inline **`pr-breakdown`** while **`continuationStatus: active`** — milestone complete ≠ skill terminal eligible for refocus. See **`phase-planner/SKILL.md`** § *MCP parent refocus*.

**Forbidden globally on notify-only turns:** **`mission_control_refocus_parent_lane`** solely because a child notification arrived — merge notify, then continue ownership on this lane until a true terminal.

| Skill | Explicit “Stop after the MCP result is sent” in `## Completion (spawned)`? | Notes |
|-------|------------------------------------------------------------------------|--------|
| `author-prd` | Yes | Also forbids downstream planning spawns |
| `pr-plan` | Yes | May spawn **`coding-session`** in §5d before terminal (standalone) or inline under **`new-plan`**; one spawn per turn |
| `master-planner` | Yes | Procedure stop before terminal when `continuationStatus: active`; Step 7 runs **`delivery-phases`** / **`pr-breakdown`** inline on **later** user messages only; **`continuationStatus: terminal`** blocked while **`caveatsApprovalStatus: pending`** (§7 approve gate — see **`planner/SKILL.md`** *Draft §7 Caveats*) |
| `delivery-phases`, `pr-breakdown`, `new-plan` | Yes | `delivery-phases` / `pr-breakdown`: inline **`new-plan`** under planner; `new-plan`: inline under decomposition; see each skill § *Completion (spawned)* |
| Ship chain (`coding-session`, `pre-pr-review`) | Yes | Inline ship skills (`create-pr`, `deploy-walk`, `plan-reconcile`, `pr-review`) — see **`## Completion (inline)`** |
| `phase-planner` | Yes | Runs **`delivery-phases`** / **`pr-breakdown`** inline; may spawn nested **`phase-planner`** or **`coding-session`**; **MCP** spawn/result |

When authoring or reviewing a skill, duplicating the canonical sentence under **`## Completion (spawned)`** is encouraged but **not** required if this README is in **`warmUpRules`** or the spawn request passes it.


---

## Relevant Links — post-write registration


Mission Control **Relevant Links** refresh from warm-up, spawn `*Path` / `*Ref` inputs, terminal `outputs` keys ending in `Path` / `Ref`, ship-ledger merges, and **explicit** mid-session registration. There is **no** host auto-sniff of Write/StrReplace. Planning skills that create or materially edit ops artifacts **must** register those paths on the calling lane.

### MCP tool

| Tool | Caller | Purpose |
|------|--------|---------|
| **`mission_control_update_relevant_documents`** | Any agent on **this** lane | Append in-workspace paths to the **calling slot’s** `relevantDocuments` |

**Args (agent-facing):** `paths` — non-empty array of absolute (or workspace-relative) paths, or `{ path, kind?, label? }` objects. Optional `kind`: `plan` \| `prd` \| `skill` \| `rule` \| `other`. Host injects lane identity — **forbidden:** `dispatchId`, `slotId`, `correlationId` in args.

**Delivery:** Stdio MCP acks are transcript-only; the extension host stream mirror normalizes, dedupes, persists, and patches the panel.

### When to call (binding)

After **Write**, **StrReplace**, or equivalent that **creates or materially edits** a workspace file the lane wants visible in Relevant Links, call **`mission_control_update_relevant_documents`** on the **same turn** (or the next turn before StreamFinal) with those absolute paths.

| Call | Skip |
|------|------|
| New or materially edited ops plans, PRDs, brainstorm reports under **`operationsDocsDirectory`** / `.sedea/operations/**/{docs,plans}/` | Read-only `Read` / Grep with no write |
| Other authored workspace documents the developer should open from Relevant Links | Paths already registered this session with no content change |
| | Warm-up rules, every `@path` touch, sibling-dispatch folders, transient scratch, build artifacts |

**Authored or materially edited only** — do **not** blanket-register every path you read or the warm-up manifest.

### Kind hints

| Situation | Prefer |
|-----------|--------|
| Operations plan `.plan.md` / sidecar pair (plan body) | `kind: plan` |
| PRD / ad-hoc PRD under ops docs | `kind: prd` |
| Brainstorm report, misc ops docs | `kind: other` (or omit — host may infer) |

Optional **`label`** overrides the panel display name when the basename is opaque.

### Relationship to other refresh paths

| Path | Role |
|------|------|
| Warm-up / spawn `*Path` / `*Ref` | Initial seed — still call MCP for **mid-session** creates |
| Terminal `outputs` `*Path` / `*Ref` | Durable child handoff on **`mission_control_send_agent_result`** — does **not** replace mid-session register on the active lane |
| **`mission_control_update_lane_display`** / **`mission_control_update_dispatch_display`** | Tab / dispatch chrome only — **not** documents |

### Forbidden

| Pattern | Why |
|---------|-----|
| Register every read path or entire warm-up manifest | Noise; v1 control is skill wording |
| Supply host identity keys in MCP args | Host injects caller slot |
| Out-of-workspace / sibling-dispatch paths | Host rejects |
| Prose-only “add this to Relevant Links” without MCP | Panel does not update |
| Treating display-metadata MCP as a documents substitute | Wrong tool |

**Per-skill hooks:** `author-prd`, `ad-hoc-prd`, `brainstorm-research`, `master-planner`, `phase-planner`, `new-plan`, `pr-plan`, `pr-breakdown`, and `delivery-phases` each name the post-write call next to their Write/StrReplace steps. Cadence cross-refs: [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Relevant Links (documents)*; [development-process.md](../../../../docs/development-process.md) § *Agent UX pitfalls*.




Squad Leader steps **§3** and **§5** spawn child lanes for **`author-prd`** and **`master-planner`**. **`master-planner`** runs **`delivery-phases`**, **`pr-breakdown`**, and **`new-plan`** **inline**. **`phase-planner`** runs **`delivery-phases`** and **`pr-breakdown`** **inline** on its child lane. Inline **`new-plan`** runs **`pr-plan`** inline and may still spawn **`phase-planner`**. **Depth-first expansion:** parent lists show all rows; **`new-plan`** runs only for ship-eligible indices (phases sequential; PRs per **`### Sequencing`** stages) — see **development-process.md** § *Depth-first plan-tree traversal* and rule **30** § *Depth-first expansion eligibility*. Skills that support both modes still document **`## Completion (spawned)`** and **`## Completion (inline)`** — use **§ Normative execution mode** above for which mode applies on this mission.

| Skill | Typical invoker | Squad Leader ledger |
|-------|-----------------|---------------------|
| `author-prd` | Squad Leader §3 | Child lane owns PRD recap + approval at step **10** USER_CHECKPOINT ( **`## Checkpoint turn UX (skill-local)`** ); **one `questions` entry per open item, Approve/Revise last** — never resolve-only without Approve/Revise; leader §4 only after `terminal` + `developerApprovedPrd: true`; no nested child lanes |
| `master-planner` | Squad Leader §5 | Seed ledger; §6 ack when `continuationOwner: master-plan-agent` |
| `phase-planner` | inline **`new-plan`** spawn | Runs **`delivery-phases`** / **`pr-breakdown`** inline on **its child lane**; owns phase subtree through ship-complete; **`master-planner`** ack-only while **`continuationOwner: phase-planner-agent`** is active |
| `delivery-phases` | **`master-planner`** or **`phase-planner` inline** | Runs **`new-plan`** inline on invoker lane |
| `pr-breakdown` | **`master-planner`** or **`phase-planner` inline** | Same as delivery-phases |
| `new-plan` | **`delivery-phases`** / **`pr-breakdown` inline** | Indexed stub + parent link; **`pr-plan`** inline; may spawn **`phase-planner`** |
| `pr-plan` | **inline `new-plan`** on planner or phase-planner lane | Layer 1 handoff; §5d spawn on invoker lane, or **`phase-planner`** Step **5f** when §5c skipped via **`skipPrPlanHandoffModal`** |

Field-level `outputs` and `continuationStatus` rules: each skill’s **`## Completion (spawned)`**.

### Implementation consent before worktrees (two layers)

| Layer | Skill | Primary output |
|-------|-------|----------------|
| 1 — Planning handoff | `pr-plan` | `readyForImplementation`, `implementationHandoffStatus` — does **not** advance §8 `phase` past `not-started` |
| 2 — Worktree open | `coding-session` | `developerApprovedImplementation` after **`plan-ws-completeness.mjs`** passes or override in the worktree-open gate |

**`pr-plan` → `coding-session`:** sequential skills on **different lanes**. **`pr-plan`** drafts §§ 1–4 and may sketch §§ 5–8; after **AskQuestion** **Start coding session**, **`pr-plan`** emits **`mission_control_spawn_agent`** for **`coding-session`** (§5d). When inline under **`phase-planner`** with **`skipPrPlanHandoffModal`**, §5c is skipped on the **`pr-plan`** turn only — **`phase-planner`** Step **5f** offers the same §5d-equivalent spawn (or §5c re-entry) on the **phase-planner** lane; **forbidden** to redirect to detached entry or **`master-planner`** §7b as the default. The **child lane** then owns worktrees, workspace attach, **implementation in the worktree** (default), §§ 5–8 fill, and ship execution — not prompt-only handoff unless **`promptOnly: true`** or **Defer implementation**. Detached **`coding-session`** entry may use prompt-only or implement on that detached lane after layer 2. See **`pr-plan/SKILL.md`** § *Handoff to coding-session*, **`phase-planner/SKILL.md`** Step **5f**, and **`coding-session/SKILL.md`** § *Execution mode after worktree attach*.




---

## Default warm-up — cap exceptions and maintenance

**Warm-up cap exceptions (384 KiB host budget):**

Each spawned ship skill documents its manifest in **`SKILL.md`** § *Warm-up manifest (spawned)* or § *Warm-up manifest (inline)*. Frontmatter must match the documented table — **`verify-skill-manifest.mjs`** enforces table ↔ frontmatter parity, spawn preflight row **11** for definitive **`laneRules`** roles, and plan-change notify emit/receive governance lint (see § *Adding or removing a skill*).

| Skill | Frontmatter omits (vs default warm-up) | Runtime reads remain |
|-------|----------------------------------------|----------------------|
| **`master-planner`**, **`phase-planner`**, **`pr-plan`**, **`pr-breakdown`**, **`delivery-phases`** | `plan.mdc`, `development-process.md`, `planning-mode-templates.md` | Step-bound **`Read`**: slim **`development-process.md`** core; **`planning-mode-templates.md`** before template drafting; **`plan.mdc`** only §§ relevant to handoff (see each **`SKILL.md`**) — **not** full §§1–8 on every planning child |
| **`new-plan`** | `plan.mdc`, `development-process.md`, `planning-mode-templates.md` | Indexed-child **stub only** — intentionally **no** **`planning-mode-templates.md`** **`Read`**; inline **`pr-plan`** populator owns template reads when drafting |
| **`author-prd`** | `plan.mdc` (in **`laneRules`** §§1–3), `development-process.md` | **`plan.mdc`** via **`laneRules`**; slim **`development-process.md`** at named steps |
| **`ad-hoc-prd`**, **`quick-fix-plan`** | `development-process.md` | Named protocol steps **`Read`** **`development-process.md`** when cadence/templates apply |
| **`pre-pr-review`** | `plan.mdc`, `development-process.md` | Step 3 reads **`development-process.md`**; Step 4 loads **`inputs.targetPlanPath`** (PR plan, not Squad Leader **`plan.mdc`**) |
| **`coding-session`** | rule **30** only; assigned **`SKILL.md`** in **`laneRules`** for parity — **excluded** from spawn byte budget (host **`skillPath`** inject) | Explicit **`Read`** of rule **30** when resolving ambiguous `.sedea` paths; on-demand ship docs via step-bound **`Read`** |
| **`deploy-walk`**, **`plan-reconcile`** | All frontmatter warm-up keys (inline-only) | Inherit **`coding-session`** **`effectiveWarmUp`** — see each skill § *Warm-up manifest (inline)* |

Do **not** re-add omitted paths to **`pre-pr-review`** frontmatter without re-checking combined warm-up size — spawn rejects with **`warm-up-too-large`** when frontmatter + merged run-request rules exceed the host cap (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Run-request line*). **`verify-skill-manifest.mjs`** excludes the assigned skill's own **`SKILL.md`** from byte-budget totals when it appears in **`laneRules`** / **`warmUpRules`** — host always injects **`skillPath`** at spawn (lane-manifest-contract § *Spawn cap*).

**`pr-review`** and **`create-pr`** are inline-only — **no** frontmatter **`warmUpRules`**; they run **only** on the active **`coding-session`** lane (which includes this README and rule **20**). Do not dispatch **`pr-review`** or **`create-pr`** as standalone skill sessions.

**`pre-pr-review`** is **spawn-only** — **forbidden** inline on **`coding-session`**; do not dispatch **`pre-pr-review`** as a standalone session without **`coding-session`** spawn handover (see **`pre-pr-review/SKILL.md`** § *Standalone dispatch*).

### SKILL.md frontmatter (Mission Control spawn)

Mission Control **`skillResolver`** parses YAML frontmatter with strict unique keys. **`inputs`** must use **2-space** nesting (input name → field keys), not single-space flat keys — flat `inputs` breaks spawn with `skill-not-found` / duplicate key errors.

**Canonical shape** — copy from **`missions/plan-and-deliver/skills/author-prd/SKILL.md`**:

```yaml
inputs:
  inputName:
    type: string
    description: ...
    required: true
warmUpRules:
  - ".sedea/centers/..."
```

**Repair / verify:** from hosting repo root (with **`scripts/node_modules`** installed):

```bash
node .sedea/centers/software-development/missions/plan-and-deliver/scripts/fix-skill-frontmatter.mjs --write
node .sedea/centers/software-development/missions/plan-and-deliver/scripts/verify-skill-manifest.mjs
```

### Adding or removing a skill

When you add, rename, or remove a protocol branch under `missions/plan-and-deliver/skills/<name>/SKILL.md` (or under the **`prd`** mission), update the same change set:

1. **`center.yaml`** — add or remove the repo-relative path under that mission's **`skillEntries`** (and **`development-process.md`** § *Protocol branches* when the branch is user-facing).
2. **Verify** from the hosting repo root:

 ```bash
 node .sedea/centers/software-development/missions/plan-and-deliver/scripts/verify-skill-manifest.mjs
 ```

3. **plan-and-deliver only** — if the skill is **spawned**, ensure **`warmUpRules`** includes `missions/plan-and-deliver/plan.mdc`, this README, and the usual rules per § *Default warm-up* above; add **`## Completion (spawned)`** + host protocol line when applicable.

### Scripts (`plan-state.mjs`, `pr-review.mjs`)

- **Location:** `missions/plan-and-deliver/scripts/` for **`plan-state.mjs`** and **`plan-ws-completeness.mjs`**; canonical **`pr-review.mjs`** at **`.sedea/centers/sedea/scripts/pr-review.mjs`** (paths in skills and rule **20** are workspace-root relative from the hosting repo that contains **`.sedea/`** — see that repo’s **`.cursor/rules/`** for hosting-repo specifics).
- **Runtime:** **Node** (bundled with Sedea / VS Code) — see [`.sedea/centers/software-development/rules/31_dispatch-scope.mdc`](../../../rules/31_dispatch-scope.mdc) § *Hosting repo cwd (scripts)* and the hosting repo **`.cursor/rules/`**.
- **Vendor trees:** do not treat `scripts/**/node_modules/` or other installed dependencies as protocol documentation (center governance ends at `SKILL.md`, rules, and mission plans).
- **`verify-skill-manifest.mjs`** — compares **`center.yaml`** `skillEntries` to on-disk `SKILL.md` files; validates frontmatter YAML; lints **`warmUpRules`** / **`laneRules`** table ↔ frontmatter parity on spawned plan-and-deliver skills; enforces spawn preflight row **11** definitive **`laneRules`** for **`author-prd`**, **`master-planner`**, and **`coding-session`**; lints **`mission_control_spawn_agent`** spawn examples on master-planner skills (Software Development + Sedea maintenance copies) so string-typed **`inputs.parent`** never uses JSON **`null`** — wire encoding must be **`"parent":"null"`**; lints **plan-change notify governance** — parent emit (**`master-planner`**, **`phase-planner`**, **`pr-breakdown`**) N1–N8 preflight rows + child receive (**`coding-session`**, **`phase-planner`**, **`master-planner`**) USER_CHECKPOINT contract + README N1–N8 / v1 receive table (exit 0 = match + parity + spawn wire lint + notify lint).

---

## Relevant Links — post-write registration


Mission Control **Relevant Links** refresh from warm-up, spawn `*Path` / `*Ref` inputs, terminal `outputs` keys ending in `Path` / `Ref`, ship-ledger merges, and **explicit** mid-session registration. There is **no** host auto-sniff of Write/StrReplace. Planning skills that create or materially edit ops artifacts **must** register those paths on the calling lane.

### MCP tool

| Tool | Caller | Purpose |
|------|--------|---------|
| **`mission_control_update_relevant_documents`** | Any agent on **this** lane | Append in-workspace paths to the **calling slot’s** `relevantDocuments` |

**Args (agent-facing):** `paths` — non-empty array of absolute (or workspace-relative) paths, or `{ path, kind?, label? }` objects. Optional `kind`: `plan` \| `prd` \| `skill` \| `rule` \| `other`. Host injects lane identity — **forbidden:** `dispatchId`, `slotId`, `correlationId` in args.

**Delivery:** Stdio MCP acks are transcript-only; the extension host stream mirror normalizes, dedupes, persists, and patches the panel.

### When to call (binding)

After **Write**, **StrReplace**, or equivalent that **creates or materially edits** a workspace file the lane wants visible in Relevant Links, call **`mission_control_update_relevant_documents`** on the **same turn** (or the next turn before StreamFinal) with those absolute paths.

| Call | Skip |
|------|------|
| New or materially edited ops plans, PRDs, brainstorm reports under **`operationsDocsDirectory`** / `.sedea/operations/**/{docs,plans}/` | Read-only `Read` / Grep with no write |
| Other authored workspace documents the developer should open from Relevant Links | Paths already registered this session with no content change |
| | Warm-up rules, every `@path` touch, sibling-dispatch folders, transient scratch, build artifacts |

**Authored or materially edited only** — do **not** blanket-register every path you read or the warm-up manifest.

### Kind hints

| Situation | Prefer |
|-----------|--------|
| Operations plan `.plan.md` / sidecar pair (plan body) | `kind: plan` |
| PRD / ad-hoc PRD under ops docs | `kind: prd` |
| Brainstorm report, misc ops docs | `kind: other` (or omit — host may infer) |

Optional **`label`** overrides the panel display name when the basename is opaque.

### Relationship to other refresh paths

| Path | Role |
|------|------|
| Warm-up / spawn `*Path` / `*Ref` | Initial seed — still call MCP for **mid-session** creates |
| Terminal `outputs` `*Path` / `*Ref` | Durable child handoff on **`mission_control_send_agent_result`** — does **not** replace mid-session register on the active lane |
| **`mission_control_update_lane_display`** / **`mission_control_update_dispatch_display`** | Tab / dispatch chrome only — **not** documents |

### Forbidden

| Pattern | Why |
|---------|-----|
| Register every read path or entire warm-up manifest | Noise; v1 control is skill wording |
| Supply host identity keys in MCP args | Host injects caller slot |
| Out-of-workspace / sibling-dispatch paths | Host rejects |
| Prose-only “add this to Relevant Links” without MCP | Panel does not update |
| Treating display-metadata MCP as a documents substitute | Wrong tool |

**Per-skill hooks:** `author-prd`, `ad-hoc-prd`, `brainstorm-research`, `master-planner`, `phase-planner`, `new-plan`, `pr-plan`, `pr-breakdown`, and `delivery-phases` each name the post-write call next to their Write/StrReplace steps. Cadence cross-refs: [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Relevant Links (documents)*; [development-process.md](../../../../docs/development-process.md) § *Agent UX pitfalls*.



## Planning spawn (Squad Leader §3, §5, decomposition tree)


Squad Leader steps **§3** and **§5** spawn child lanes for **`author-prd`** and **`master-planner`**. **`master-planner`** runs **`delivery-phases`**, **`pr-breakdown`**, and **`new-plan`** **inline**. **`phase-planner`** runs **`delivery-phases`** and **`pr-breakdown`** **inline** on its child lane. Inline **`new-plan`** runs **`pr-plan`** inline and may still spawn **`phase-planner`**. **Depth-first expansion:** parent lists show all rows; **`new-plan`** runs only for ship-eligible indices (phases sequential; PRs per **`### Sequencing`** stages) — see **development-process.md** § *Depth-first plan-tree traversal* and rule **30** § *Depth-first expansion eligibility*. Skills that support both modes still document **`## Completion (spawned)`** and **`## Completion (inline)`** — use **§ Normative execution mode** above for which mode applies on this mission.

| Skill | Typical invoker | Squad Leader ledger |
|-------|-----------------|---------------------|
| `author-prd` | Squad Leader §3 | Child lane owns PRD recap + approval at step **10** USER_CHECKPOINT ( **`## Checkpoint turn UX (skill-local)`** ); **one `questions` entry per open item, Approve/Revise last** — never resolve-only without Approve/Revise; leader §4 only after `terminal` + `developerApprovedPrd: true`; no nested child lanes |
| `master-planner` | Squad Leader §5 | Seed ledger; §6 ack when `continuationOwner: master-plan-agent` |
| `phase-planner` | inline **`new-plan`** spawn | Runs **`delivery-phases`** / **`pr-breakdown`** inline on **its child lane**; owns phase subtree through ship-complete; **`master-planner`** ack-only while **`continuationOwner: phase-planner-agent`** is active |
| `delivery-phases` | **`master-planner`** or **`phase-planner` inline** | Runs **`new-plan`** inline on invoker lane |
| `pr-breakdown` | **`master-planner`** or **`phase-planner` inline** | Same as delivery-phases |
| `new-plan` | **`delivery-phases`** / **`pr-breakdown` inline** | Indexed stub + parent link; **`pr-plan`** inline; may spawn **`phase-planner`** |
| `pr-plan` | **inline `new-plan`** on planner or phase-planner lane | Layer 1 handoff; §5d spawn on invoker lane, or **`phase-planner`** Step **5f** when §5c skipped via **`skipPrPlanHandoffModal`** |

Field-level `outputs` and `continuationStatus` rules: each skill’s **`## Completion (spawned)`**.

### Implementation consent before worktrees (two layers)

| Layer | Skill | Primary output |
|-------|-------|----------------|
| 1 — Planning handoff | `pr-plan` | `readyForImplementation`, `implementationHandoffStatus` — does **not** advance §8 `phase` past `not-started` |
| 2 — Worktree open | `coding-session` | `developerApprovedImplementation` after **`plan-ws-completeness.mjs`** passes or override in the worktree-open gate |

**`pr-plan` → `coding-session`:** sequential skills on **different lanes**. **`pr-plan`** drafts §§ 1–4 and may sketch §§ 5–8; after **AskQuestion** **Start coding session**, **`pr-plan`** emits **`mission_control_spawn_agent`** for **`coding-session`** (§5d). When inline under **`phase-planner`** with **`skipPrPlanHandoffModal`**, §5c is skipped on the **`pr-plan`** turn only — **`phase-planner`** Step **5f** offers the same §5d-equivalent spawn (or §5c re-entry) on the **phase-planner** lane; **forbidden** to redirect to detached entry or **`master-planner`** §7b as the default. The **child lane** then owns worktrees, workspace attach, **implementation in the worktree** (default), §§ 5–8 fill, and ship execution — not prompt-only handoff unless **`promptOnly: true`** or **Defer implementation**. Detached **`coding-session`** entry may use prompt-only or implement on that detached lane after layer 2. See **`pr-plan/SKILL.md`** § *Handoff to coding-session*, **`phase-planner/SKILL.md`** Step **5f**, and **`coding-session/SKILL.md`** § *Execution mode after worktree attach*.




---

## Default warm-up — cap exceptions and maintenance

**Warm-up cap exceptions (384 KiB host budget):**

Each spawned ship skill documents its manifest in **`SKILL.md`** § *Warm-up manifest (spawned)* or § *Warm-up manifest (inline)*. Frontmatter must match the documented table — **`verify-skill-manifest.mjs`** enforces table ↔ frontmatter parity, spawn preflight row **11** for definitive **`laneRules`** roles, and plan-change notify emit/receive governance lint (see § *Adding or removing a skill*).

| Skill | Frontmatter omits (vs default warm-up) | Runtime reads remain |
|-------|----------------------------------------|----------------------|
| **`master-planner`**, **`phase-planner`**, **`pr-plan`**, **`pr-breakdown`**, **`delivery-phases`** | `plan.mdc`, `development-process.md`, `planning-mode-templates.md` | Step-bound **`Read`**: slim **`development-process.md`** core; **`planning-mode-templates.md`** before template drafting; **`plan.mdc`** only §§ relevant to handoff (see each **`SKILL.md`**) — **not** full §§1–8 on every planning child |
| **`new-plan`** | `plan.mdc`, `development-process.md`, `planning-mode-templates.md` | Indexed-child **stub only** — intentionally **no** **`planning-mode-templates.md`** **`Read`**; inline **`pr-plan`** populator owns template reads when drafting |
| **`author-prd`** | `plan.mdc` (in **`laneRules`** §§1–3), `development-process.md` | **`plan.mdc`** via **`laneRules`**; slim **`development-process.md`** at named steps |
| **`ad-hoc-prd`**, **`quick-fix-plan`** | `development-process.md` | Named protocol steps **`Read`** **`development-process.md`** when cadence/templates apply |
| **`pre-pr-review`** | `plan.mdc`, `development-process.md` | Step 3 reads **`development-process.md`**; Step 4 loads **`inputs.targetPlanPath`** (PR plan, not Squad Leader **`plan.mdc`**) |
| **`coding-session`** | rule **30** only; assigned **`SKILL.md`** in **`laneRules`** for parity — **excluded** from spawn byte budget (host **`skillPath`** inject) | Explicit **`Read`** of rule **30** when resolving ambiguous `.sedea` paths; on-demand ship docs via step-bound **`Read`** |
| **`deploy-walk`**, **`plan-reconcile`** | All frontmatter warm-up keys (inline-only) | Inherit **`coding-session`** **`effectiveWarmUp`** — see each skill § *Warm-up manifest (inline)* |

Do **not** re-add omitted paths to **`pre-pr-review`** frontmatter without re-checking combined warm-up size — spawn rejects with **`warm-up-too-large`** when frontmatter + merged run-request rules exceed the host cap (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Run-request line*). **`verify-skill-manifest.mjs`** excludes the assigned skill's own **`SKILL.md`** from byte-budget totals when it appears in **`laneRules`** / **`warmUpRules`** — host always injects **`skillPath`** at spawn (lane-manifest-contract § *Spawn cap*).

**`pr-review`** and **`create-pr`** are inline-only — **no** frontmatter **`warmUpRules`**; they run **only** on the active **`coding-session`** lane (which includes this README and rule **20**). Do not dispatch **`pr-review`** or **`create-pr`** as standalone skill sessions.

**`pre-pr-review`** is **spawn-only** — **forbidden** inline on **`coding-session`**; do not dispatch **`pre-pr-review`** as a standalone session without **`coding-session`** spawn handover (see **`pre-pr-review/SKILL.md`** § *Standalone dispatch*).

### SKILL.md frontmatter (Mission Control spawn)

Mission Control **`skillResolver`** parses YAML frontmatter with strict unique keys. **`inputs`** must use **2-space** nesting (input name → field keys), not single-space flat keys — flat `inputs` breaks spawn with `skill-not-found` / duplicate key errors.

**Canonical shape** — copy from **`missions/plan-and-deliver/skills/author-prd/SKILL.md`**:

```yaml
inputs:
  inputName:
    type: string
    description: ...
    required: true
warmUpRules:
  - ".sedea/centers/..."
```

**Repair / verify:** from hosting repo root (with **`scripts/node_modules`** installed):

```bash
node .sedea/centers/software-development/missions/plan-and-deliver/scripts/fix-skill-frontmatter.mjs --write
node .sedea/centers/software-development/missions/plan-and-deliver/scripts/verify-skill-manifest.mjs
```

### Adding or removing a skill

When you add, rename, or remove a protocol branch under `missions/plan-and-deliver/skills/<name>/SKILL.md` (or under the **`prd`** mission), update the same change set:

1. **`center.yaml`** — add or remove the repo-relative path under that mission's **`skillEntries`** (and **`development-process.md`** § *Protocol branches* when the branch is user-facing).
2. **Verify** from the hosting repo root:

 ```bash
 node .sedea/centers/software-development/missions/plan-and-deliver/scripts/verify-skill-manifest.mjs
 ```

3. **plan-and-deliver only** — if the skill is **spawned**, ensure **`warmUpRules`** includes `missions/plan-and-deliver/plan.mdc`, this README, and the usual rules per § *Default warm-up* above; add **`## Completion (spawned)`** + host protocol line when applicable.

### Scripts (`plan-state.mjs`, `pr-review.mjs`)

- **Location:** `missions/plan-and-deliver/scripts/` for **`plan-state.mjs`** and **`plan-ws-completeness.mjs`**; canonical **`pr-review.mjs`** at **`.sedea/centers/sedea/scripts/pr-review.mjs`** (paths in skills and rule **20** are workspace-root relative from the hosting repo that contains **`.sedea/`** — see that repo’s **`.cursor/rules/`** for hosting-repo specifics).
- **Runtime:** **Node** (bundled with Sedea / VS Code) — see [`.sedea/centers/software-development/rules/31_dispatch-scope.mdc`](../../../rules/31_dispatch-scope.mdc) § *Hosting repo cwd (scripts)* and the hosting repo **`.cursor/rules/`**.
- **Vendor trees:** do not treat `scripts/**/node_modules/` or other installed dependencies as protocol documentation (center governance ends at `SKILL.md`, rules, and mission plans).
- **`verify-skill-manifest.mjs`** — compares **`center.yaml`** `skillEntries` to on-disk `SKILL.md` files; validates frontmatter YAML; lints **`warmUpRules`** / **`laneRules`** table ↔ frontmatter parity on spawned plan-and-deliver skills; enforces spawn preflight row **11** definitive **`laneRules`** for **`author-prd`**, **`master-planner`**, and **`coding-session`**; lints **`mission_control_spawn_agent`** spawn examples on master-planner skills (Software Development + Sedea maintenance copies) so string-typed **`inputs.parent`** never uses JSON **`null`** — wire encoding must be **`"parent":"null"`**; lints **plan-change notify governance** — parent emit (**`master-planner`**, **`phase-planner`**, **`pr-breakdown`**) N1–N8 preflight rows + child receive (**`coding-session`**, **`phase-planner`**, **`master-planner`**) USER_CHECKPOINT contract + README N1–N8 / v1 receive table (exit 0 = match + parity + spawn wire lint + notify lint).

---

## Universal spawn preflight — MCP identity (on-demand detail)

### MCP spawn/result (MCP-only)

| Situation | Use |
|-----------|-----|
| All plan-and-deliver spawned skills | **`mission_control_spawn_agent`**; child uses **`mission_control_send_agent_result`** at terminal |

**Do not** emit duplicate spawn or terminal notifications for the same child when MCP already succeeded (host dedupes; agents must not double-emit intentionally).

### Host-resolved identity (MCP — binding)

When using MCP tools, agents supply **skill contract fields only**. **Never** pass these keys in MCP tool arguments (host rejects):

`correlationId`, `dispatchId`, `slotId`, `laneKey`, `agentId`, `parentAgentId`, `childAgentId`

| Role | Identity rule |
|------|----------------|
| **Parent spawn (MCP)** | Host mints **`correlationId`**; injects into child bootstrap and registry |
| **Child terminal (MCP)** | Host reads **`correlationId`** from child lane spawn context — omit from **`mission_control_send_agent_result`** args |

Full table: rule **4** § *Host-resolved identity*.

