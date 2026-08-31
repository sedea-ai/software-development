---
name: ad-hoc-prd
description: >-
 Scaffold a minimal Ad-Hoc PRD (bugs / small improvements) as
 `ad_hoc_<slug>_<hex>.ad-hoc-prd.md` under the resolved operations docs
 write root (`operationsDocsDirectory` under `.sedea/operations/.../docs/`;
 never construct `.sedea/operations/.../...` paths).
 Ad-Hoc PRD is upstream root input for **`master-planner`**; no existing `.plan.md`
 link is required. For **Ad-Hoc PRD creator** agent sessions — explicit
 mission dispatch or upstream agent only. Does not edit
 `.plan.md` files or run/spawn **`master-planner`** from this lane (invokers own downstream spawn).
designation:
  allowed: Scaffold ad-hoc PRD under operations docs; gather change-request evidence
  forbidden: Application code; Master Plan or PR plan edits; spawn master-planner; git ship
inputs:
  createIntent:
    type: boolean
    description: True when the upstream protocol selected the ad-hoc PRD branch.
    required: true
  title:
    type: string
    description: Non-empty title for the Ad-Hoc PRD.
    required: false
  details:
    type: string
    description: Change-request description used to draft Problem, Desired outcome, and Proposed solution.
    required: true
  operationsDocsDirectory:
    type: string
    description: Absolute workspace scope-level docs directory under .sedea/operations/.../docs/ from lane identity or spawn inputs.
    required: true
  sourceSummary:
    type: string
    description: Optional short summary of where this ad-hoc request came from.
    required: false
  roadmapHints:
    type: array
    description: Optional roadmap, related slug, or worktree hints from the upstream protocol.
    required: false
    default: []
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/ad-hoc-prd/SKILL.md"
  - ".sedea/centers/software-development/rules/31_dispatch-scope.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/10_plan-naming-convention.mdc"
---

# Ad-Hoc PRD

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Default warm-up*. Spawned from **`single-phase`** §3 or **`debug-and-fix`** §5c — **not** plan-and-deliver §3 (which uses **`author-prd`**). Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. Frontmatter matches this table. **384 KiB cap:** frontmatter omits **`development-process.md`** — explicit **`Read`** at named protocol steps. **No `alwaysApply` frontmatter flip.**

**Invoker `warmUpRules` override (binding):** On **`mission_control_spawn_agent`**, invokers merge skill frontmatter **`warmUpRules`** but **must add** the **invoking mission `plan.mdc`** — **`.sedea/centers/software-development/missions/single-phase/plan.mdc`** (§§1–3) or **`.sedea/centers/software-development/missions/debug-and-fix/plan.mdc`** (post-fix step **5c**) — **instead of** `plan-and-deliver/plan.mdc`. See **`../README.md`** § *Definitive `laneRules`* and each mission's spawn step.

### `bootstrapRules` — host-resolved (Software Development center layer)

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap (≤10 KB); host merges when `centerSlug === software-development` |

### `skillWarmUp` — frontmatter `warmUpRules`

| Path | Purpose |
|------|---------|
| *(invoker-supplied on spawn)* **Invoking mission `plan.mdc`** — **`single-phase/plan.mdc`** (§§1–3) or **`debug-and-fix/plan.mdc`** (§5c) | Mission protocol for this spawn — **not** `plan-and-deliver/plan.mdc` |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn contracts, terminal stop |
| `.sedea/centers/software-development/rules/10_plan-naming-convention.mdc` | Ad-hoc PRD filename slug |

**Omitted from frontmatter (384 KiB spawn cap — runtime `Read`):** `development-process.md` — load at named protocol steps.

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice for missing inputs |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/ad-hoc-prd/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/rules/31_dispatch-scope.mdc` | Dispatch scope + explicit plan/docs paths |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight |

**Intent:** **Ad-Hoc PRD creator agent** turns a short **change request** (bug or small improvement) into a **minimal Ad-Hoc PRD** — a **standalone root artifact**. **Master Plans** and all other plans are **downstream** of the PRD (see **development-process**); this skill does **not** require or resolve a parent `.plan.md`, and does **not** spawn **`master-planner`** from this lane.

### Downstream `master-planner` (invoker-owned — binding)

This skill **never** emits **`mission_control_spawn_agent`** for **`master-planner`**. Downstream Master Plan work is **invoker protocol**, not ad-hoc PRD scope:

| Invoker | After terminal PRD approval (`developerApprovedPrd: true`) |
|---------|-----------------------------------------------------------|
| **`single-phase`** Squad Leader | **Same leader turn:** auto-chain **`single-phase/plan.mdc`** §4 seed compile → §5 spawn **`master-planner`** (no duplicate PRD approval on leader) |
| **`debug-and-fix`** Squad Leader | Continue post-fix protocol per **`debug-and-fix/plan.mdc`** — **`ad-hoc-prd`** captures fix context; **`master-planner`** only when developer routes to **`plan and deliver`** / **`single-phase`**, not by default from §5c alone |

**Forbidden:** reading "does not spawn **`master-planner`**" as "no **`master-planner`** on the dispatch" — **`single-phase`** §5 **`master-planner`** spawn is **expected** after this child terminal. **`outputs.prdRef`** / **`outputs.prdPath`** are the handoff inputs for §4 seed compile on the invoker lane.

**File type:** **`.ad-hoc-prd.md`** so tooling recognizes the shape (§§ 1–3 + **Master Plan** placeholder line).

## Agent messaging (MCP)

**MCP spawn/result skill.** Parent→child spawn and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*.

| Action | MCP tool |
|--------|----------|
| Parent spawn (when this skill emits a child lane) | **`mission_control_spawn_agent`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- Inline skills on this mission stay **inline-only** — no spawn wire change unless the protocol step explicitly spawns a child lane.


## When this skill applies

**Actor:** **Ad-Hoc PRD creator agent** — session that runs after **explicit invocation** (mission dispatch or upstream agent). **Developers do not invoke skills by name**; routing is always an agent decision.

**Act in this turn** when **`ad-hoc-prd`** is engaged **and** the dispatch / handoff supplies **all** of:

1. **Create intent** — upstream step chose the ad-hoc change-request path (e.g. plan protocol “ad-hoc task description” branch).
2. **Title** — non-empty title for the Ad-Hoc PRD (handoff fields or captured change-request summary).
3. **Details** — non-empty change-request body.
4. **Docs write root** — resolve per **`.sedea/centers/software-development/rules/31_dispatch-scope.mdc`** § *Docs write root resolution* from **`operationsDocsDirectory`** in spawn **`inputs`** / lane identity.

If **`operationsDocsDirectory`** does not resolve, stop with `partial` and report `outputs.missingFields` (for example `["operationsDocsDirectory"]`); do not invent a path or continue with a guessed operations path. In standalone mode, collect missing **title** / **details** via **AskQuestion**, **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act*.

**Details:** Payload text — change-request description, thread excerpt, labeled context — use to draft **§1 Problem**, **§2 Desired outcome**, and **§3 Proposed solution**. If thin, use concise **TBD** bullets and say what to confirm.

**Optional context** (never required): roadmap hints, related slugs, or worktree paths may appear in the payload; they do **not** replace title + body and do **not** force a **`Plan:`** link to an existing `.plan.md`.

## Complexity guard

Ad-hoc means **shorter PRD input**, not lower delivery scrutiny. Do not use this branch to bypass decomposition or implementation validation.

- Capture broad scope, multi-system impact, unclear acceptance criteria, data migration, security/auth, rollout risk, or test uncertainty in **§3 Proposed solution** as explicit risks / unknowns.
- If the request is obviously larger than a small change, still write the short PRD when inputs are sufficient, but set `outputs.complexityGuard: "needs-master-plan-assessment"` and include the reasons in `outputs.remainingTasks`.
- Leave all complexity scoring, decomposition routing, and downstream agent spawning to **`master-planner`** and later skills.

## Gitlink checkout ship target (binding)

When the change request implies shipping from a **hosting gitlink checkout** — a product repo path (for example `extension-template/`) or a center submodule under **`.sedea/centers/<slug>/`** per [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Three-repo submodule taxonomy* — the Ad-Hoc PRD **must** record an explicit **Gitlink promotion scope** decision. **Forbidden:** implicit exclusion or `_TBD_` when the ship target is clearly a gitlink checkout.

| Detection signal | Examples |
|------------------|----------|
| **`details`** or **`roadmapHints`** | Named product repo path, center submodule checkout, "ship from extension-template" |
| Explicit ship-path language | Worktree under a hosting gitlink, submodule pointer promotion |

**Required PRD line:** `**Gitlink promotion scope:** <in-scope | follow-up | excluded>` — see § *Ad-Hoc PRD file shape (template)*.

| Value | Meaning |
|-------|---------|
| **`in-scope`** | Hosting gitlink promotion is part of this dispatch ship chain |
| **`follow-up`** | Substantive source-repo ship now; hosting gitlink promotion deferred with documented follow-up |
| **`excluded`** | Explicit out-of-scope with rationale (not silent omission) |

When gitlink checkout is detected and the line is missing or `_TBD_`, treat as an **open item** at step **5** — offer scoped resolution before **Approve PRD**. Set `outputs.gitlinkPromotionScope` on terminal result (`in-scope` | `follow-up` | `excluded` | `not-applicable`).

## Docs write root (required to write)

New Ad-Hoc PRDs are written under the **resolved docs write root** per **`.sedea/centers/software-development/rules/31_dispatch-scope.mdc`** § *Docs write root resolution*:

| Priority | Source | Write root |
|----------|--------|------------|
| 1 | **`operationsDocsDirectory`** from spawn **`inputs`** or lane identity | That absolute scope-level `docs/` directory under `.sedea/operations/` |

If **`operationsDocsDirectory`** does not resolve, stop with `partial` and report `outputs.missingFields` naming the gap. Do **not** construct **`.sedea/operations/.../docs/`** from user-id, **`joint`**, or mtime heuristics; do **not** write under legacy **`joint/docs/`** or per-dispatch bundle `docs/`.

Create **`docs/`** under the resolved write root when missing.

**Lookup:** When checking for an existing file by basename, search **only** under the resolved docs write root for this protocol.

## Refresh lane display (when stale)

After **`title`** / change-request scope is clear (before writing the Ad-Hoc PRD):

1. Compare the visible tab **title** / **hover** to this lane's work (ad-hoc title or problem summary).
2. When spawn labels are **generic or wrong**, call MCP **`mission_control_update_lane_display`** on **this lane only** with **`title`** = `PRD-{semantic title}` (ad-hoc **`title`** or problem summary) and optional **`description`** / **`hoverDescription`** (max lengths in [`.sedea/centers/sedea/rules/9_display-metadata-authority.mdc`](.sedea/centers/sedea/rules/9_display-metadata-authority.mdc)). See [rule **50**](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Lane title prefix conventions*.
3. **Skip** when spawn labels already match scope.
4. **Forbidden:** **`mission_control_update_dispatch_display`** from a child lane.

See [`.sedea/centers/software-development/rules/50_mission-control-display-metadata-discipline.mdc`](../../../../rules/50_mission-control-display-metadata-discipline.mdc) § *Child lane — refresh own slot when labels are stale*.

## Checkpoint turn UX (skill-local)

### Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.


Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`ad-hoc-prd`**; invoker missions **`single-phase`** and **`debug-and-fix`** document their own Squad Leader gates — see **`single-phase/plan.mdc`** §3 / §2 and **`debug-and-fix/plan.mdc`** §5c for spawn and leader-lane resume tables.

**Real-dispatch test loop (binding):** After merge, run one full **`ad-hoc-prd`** spawn on a Checkpoint dispatch through step **5** PRD approval and collect a developer verdict before the parent phase advances the next cross-mission skill PR — per **Planning protocol skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Validate inputs | Auto-advance when spawn `inputs` supply all required fields | **Gate** when required fields missing — [Missing inputs gate](#missing-inputs-gate-binding) |
| **2–3** — Template + filename | Auto-advance | — |
| **4** — Write `.ad-hoc-prd.md` | Auto-advance on successful write | exception: write failure → `failure` / `partial` |
| **Refresh lane display** | Auto-advance when spawn labels already match scope | run MCP display update then auto-advance when stale |
| **Post-write MCP result** (`developerApprovedPrd: false`) | External-wait on invoker leader — Squad Leader **acks only** | **not** permission to advance **`single-phase`** §4 or **`debug-and-fix`** §7 |
| **5** — Present for approval | **Gate** — **first developer-pick gate on this lane** | PRD approval (below) |
| **5a** — Open-item resolution | **Gate** — apply pick, return to step **5** | same multi-question approval shape |
| **6** — On approve | Auto-advance to terminal **`mission_control_send_agent_result`** | — |
| **7** — On revise | Auto-advance back to step **5** | — |

### Missing inputs gate (binding)

When **`createIntent`**, **`title`**, **`details`**, or resolvable **`operationsDocsDirectory`** are missing and the invoker cannot supply them on the leader lane:

USER_CHECKPOINT — provide missing ad-hoc PRD inputs on this lane.

| Option id | Label |
|-----------|--------|
| `provide-title` | Supply title |
| `provide-details` | Supply change-request details |
| `defer` | Defer — return partial result to invoker |
| `more-details` | More details for option _ |

- **Next-step resolution:** Auto-advance to step **2** when all required inputs resolve — no `USER_CHECKPOINT` on happy-path spawn handoff with complete `inputs`.

## Steps

1. **Validate inputs** — `createIntent === true`, non-empty `title`, non-empty `details`, and resolvable **docs write root** (see § *Docs write root*).

   - **Next-step resolution:** Auto-advance to step **2** when validation passes — no `USER_CHECKPOINT` on happy path. When required fields are missing, open [Missing inputs gate](#missing-inputs-gate-binding) or return `partial` with `outputs.missingFields` when the skill cannot collect on this lane.

2. **Use** **§ Ad-Hoc PRD file shape (template)** below — no external template file.

   - **Next-step resolution:** Auto-advance to step **3** — no `USER_CHECKPOINT` on this step.

3. **Filename:** `ad_hoc_<slugified-title>_<8-hex>.ad-hoc-prd.md` — slugify title (lowercase, non-alphanumerics → `_`, collapse repeats, max ~48 chars) + `_<random 8 hex>` (`crypto.randomBytes(4).toString('hex')` or equivalent).

   - **Next-step resolution:** Auto-advance to step **4** — no `USER_CHECKPOINT` on this step.

4. **Write** under the resolved docs write root:
 - `# <Title>` — handoff title (not the filename).
 - **`Master Plan:`** line — `_TBD_` plus one sentence that **`master-planner`** will create the `.plan.md` from this Ad-Hoc PRD and the developer should paste or link that path here when it exists (do **not** invent a plan path).
 - **`## 1–3`** sections filled from handoff details; `_TBD_` where unavoidable + say what is missing.
 - When § *Gitlink checkout ship target* applies, populate **`Gitlink promotion scope`** per template — **forbidden** `_TBD_` on that line when ship target is clearly a gitlink checkout.

   - **Relevant Links (post-write):** After a successful create or material revise write, call MCP **`mission_control_update_relevant_documents`** with the absolute Ad-Hoc PRD path (`kind: prd`) on this lane — same turn preferred. **Skip** when already registered this session with no content change. Does **not** replace terminal `prdPath` / `prdRef`. See **`../README.md`** § *Relevant Links — post-write registration*.

   - **Next-step resolution:** Auto-advance to step **5** after successful write — emit non-terminal **`mission_control_send_agent_result`** with `developerApprovedPrd: false` when the invoker protocol requires leader ack before step **5**; do **not** treat that ack as PRD approval.

5. **Present for approval** — Recap the new file with a backtick path (prefer the hosting-absolute path; a `.sedea/operations/…/docs/…` path is also valid) and a one-line summary of §§1–3. Do **not** use a `file://` Markdown link or put backticks inside a Markdown link label. Use **AskQuestion**, **`mission_control_present_structured_choice`** per **`../README.md`** § *Recap, structured choice, act* and **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**.

USER_CHECKPOINT — approve, revise, or resolve open items on this Ad-Hoc PRD before invoker downstream steps.

 **Detect open items** before building the modal: `_TBD_` bullets in §§1–3, missing or `_TBD_` **Gitlink promotion scope** when § *Gitlink checkout ship target* applies, explicit risks or unknowns in **§3 Proposed solution**, thin or ambiguous acceptance criteria, and `outputs.complexityGuard: needs-master-plan-assessment`.

 **When open items exist** — **one modal, multiple questions**:
 - **`displayMarkdown`:** numbered list — each open item elaborated (section, gap text, why a decision matters, agent-proposed resolution options).
 - **`askQuestion.questions`:** **one entry per open item** — each with its own `id`, `prompt`, and `options` scoped to **that item only** (for example accept proposed resolution A/B, mark not applicable, defer to planner, gather more evidence). **Forbidden:** merging all open-item picks into a single `questions` entry.
 - **Last question** (always final in the array): `id` e.g. `prd-approval`, `prompt` summarizing readiness to approve or revise, `options`: **Approve PRD**, **Revise PRD**, **More details for option _**.
 - **Forbidden:** one combined question whose `options` mixes per-item resolution picks with **Approve PRD** / **Revise PRD**; a separate resolve-only modal that omits **Approve PRD** / **Revise PRD** until all items are cleared.
 - **Many open items:** batch across turns when one modal would be impractical; **each batch still ends with** the **Approve PRD** / **Revise PRD** question as the **last** `questions` entry.

 **When no open items remain** — single `questions` entry with minimum options:
 - **Approve PRD** — developer accepts this Ad-Hoc PRD for **`master-planner`** input
 - **Revise PRD** — edit the `.ad-hoc-prd.md` on this lane, then return to step 5
 - **More details for option _**

 Do **not** treat the write alone as developer approval.

5a. **On open-item resolution pick** — Apply the selected resolution for **that question's item** to the `.ad-hoc-prd.md`, then return to step 5 with the same multi-question approval shape.

   - **Next-step resolution:** Re-open step **5** PRD approval gate after each resolution pick.

6. **On approve** — Set `outputs.developerApprovedPrd: true`, ensure `prdRef` / `prdPath` / `prdTitle` reflect the approved file, then emit the terminal **`mission_control_send_agent_result`** with `continuationStatus: terminal` and `continuationOwner: "squad-leader"`.

   - **Next-step resolution:** Auto-advance to terminal MCP result — no additional `USER_CHECKPOINT` on this step.

7. **On revise** — Apply edits to the Ad-Hoc PRD file, then repeat step 5 until the developer approves or abandons (report `aborted` / `abandoned` only when they clearly stop).

   - **Next-step resolution:** Auto-advance back to step **5** — no `USER_CHECKPOINT` until step **5** presents the revised PRD.

## Completion (spawned)

**Spawn-ack (invoker context — binding):** Invokers (**`single-phase`** §3, **`debug-and-fix`** §5c) emit **`mission_control_spawn_agent`** for this lane on a **spawn-only turn** per [`.sedea/centers/sedea/rules/4_mission.mdc`](.sedea/centers/sedea/rules/4_mission.mdc) § *Spawn-ack semantics (binding)* — ack ≠ host spawn success; **forbidden** parallel spawn + wait modal on that turn. Cross-reference only; do **not** duplicate the full block here. This child lane owns PRD approval gates and terminal **`mission_control_send_agent_result`** — not invoker external-wait narration from **`transcriptOnly`** ack alone.

### MCP result preflight (`mission_control_send_agent_result`)

| Step | Check |
|------|--------|
| R1 | Call **`mission_control_send_agent_result`** with **`status`**, **`summary`**, optional **`outputs`** / **`errors`** |
| R2 | **Forbidden args absent** — no **`correlationId`**, **`dispatchId`**, **`slotId`**, or other host-resolved keys |
| R3 | Populate **`outputs`** from the required field list below |
| R4 | Re-emit updated MCP result after user-requested follow-up on this lane (same spawn session; host resolves **`correlationId`**) |
| R5 | **`mission_control_refocus_parent_lane`** — when **Required** per § *MCP parent refocus* below; **forbidden** while **`continuationStatus: active`** |

### MCP parent refocus (`mission_control_refocus_parent_lane`)

| Signal on this terminal | Refocus? |
|-------------------------|----------|
| **`continuationStatus: active`** (approval pending; post-write ack) | **Forbidden** |
| **`continuationStatus: terminal`** (**Approve PRD** or abandon) | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "ad-hoc-prd-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above. See **`../README.md`** § *Parent refocus on terminal*.

**Forbidden:** structured-choice options whose primary purpose is parent-switch — use **`mission_control_refocus_parent_lane`** instead.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Required `outputs` fields:

- `outputs.prdPath`
- `outputs.prdRef`
- `outputs.prdTitle`
- `outputs.operationsDocsDirectory`
- `outputs.developerApprovedPrd` — `true` only when the developer selected **Approve PRD** on this lane; `false` on non-terminal results
- `outputs.missingFields`
- `outputs.gitlinkPromotionScope` — `in-scope` | `follow-up` | `excluded` | `not-applicable` from approved PRD line
- `outputs.roadmapHints`
- `outputs.complexityGuard`
- `outputs.activeLanes`
- `outputs.openLedgerEntries`
- `outputs.remainingTasks`
- `outputs.continuationOwner`
- `outputs.continuationStatus`

Set `continuationOwner` and `continuationStatus`:

- After the initial write (step 4), before developer approval: `continuationOwner: "ad-hoc-prd-agent"`, `continuationStatus: "active"`. Emit an **`mission_control_send_agent_result`** with `developerApprovedPrd: false` so the invoking Squad Leader **acknowledges only** — do **not** advance **`single-phase`** §4 or **`debug-and-fix`** §7 from that result alone.
- While required inputs are missing: `continuationOwner: "ad-hoc-prd-agent"`, `continuationStatus: "active"`, `developerApprovedPrd: false` — Squad Leader collects only when this skill cannot run step 5 (see missing-fields cases below).
- On developer **Approve PRD**: `continuationOwner: "squad-leader"`, `continuationStatus: "terminal"`, `developerApprovedPrd: true`, `prdRef` populated — invoking Squad Leader may continue (**`single-phase`** §4 → §5 **`master-planner`**, or **`debug-and-fix`** post-fix routing per that mission's `plan.mdc`).
- `partial` with `continuationStatus: "active"` when file writing fails or content is too thin to offer approval until clarification.

**Continuation ownership.** When spawned under **`single-phase`** or **`debug-and-fix`**, this lane owns the PRD approval gate (steps 5–7), mirroring **`author-prd`** approval semantics on plan-and-deliver. The **invoking Squad Leader** does **not** duplicate approval **AskQuestion** on the leader lane. This skill does not spawn **`master-planner`**. A child result with `developerApprovedPrd: false` is never permission to continue the invoking mission's downstream steps.

Ledger expectations:

- `activeLanes: []` when the PRD write succeeds; this skill starts no child lanes.
- `openLedgerEntries: []` when terminal.
- `remainingTasks` should include any missing clarifications, complexity warnings, or write failure recovery steps.

Error states:

- Missing required inputs → `status: "partial"`, no file write, `continuationStatus: "active"`, and `missingFields` populated.
- Missing docs write root (`operationsDocsDirectory` absent) → `status: "partial"`, no file write, `missingFields` naming the gap.
- File already exists at the generated path → generate a different 8-hex suffix once; if still blocked, return `failure`.
- Write failure → `status: "failure"` or `partial` if recoverable, with `errors[].message` and `remainingTasks`.

Stop after each **`mission_control_send_agent_result`** for the current turn (see **`../README.md`** § *Terminal stop (normative)*). When `continuationStatus` is `active`, the developer continues on **this** lane (approve, revise, or clarify); re-emit an **updated** MCP result call with the same `correlationId` when approval completes or scope changes. Do not emit another `mission_control_spawn_agent` or spawn **`master-planner`** from this skill.

## Completion (inline)

Report the fields below in prose to the invoker on the **same lane**. Do **not** emit `mission_control_spawn_agent`, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section (see **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Inline completion* and **`.sedea/centers/sedea/skills/README.md`** § *Completion (inline)*).

**Normative invokers:** **`single-phase`** §3 and **`debug-and-fix`** §5c run this skill **spawned only**. **`plan and deliver`** uses **`author-prd`** §3 instead — not this skill. If another invoker runs inline, use the same `outputs` semantics as **`## Completion (spawned)`** in prose only.

## Ad-Hoc PRD file shape (template)

Use this shape for every new **`.ad-hoc-prd.md`** file.

```markdown
# <Title>

**Master Plan:** _TBD — run **`master-planner`** using this Ad-Hoc PRD as input; replace this line with a link to the resulting `.plan.md` when it exists._

**Gitlink promotion scope:** <in-scope | follow-up | excluded | not-applicable> — required when ship target is a hosting gitlink checkout (product repo such as `extension-template/`, or center submodule under `.sedea/centers/<slug>/`). Record explicit developer decision; **forbidden** implicit exclusion.

## 1. Problem statement

<What is wrong or missing? Who is affected? Evidence / symptom?>

## 2. Desired outcome

<What “good” looks like — observable or testable when possible>

## 3. Proposed solution

<What to change, where, main steps, risks or unknowns>
```

## Out of scope

- Does **not** create or edit **`.plan.md`** files or sidecars (use **`new-plan`** / **`master-planner`** downstream).
- Does **not** auto-run or spawn **`master-planner`** on this lane. Invokers own downstream spawn — **`single-phase`** §4 → §5 after terminal approval; see § *Downstream `master-planner` (invoker-owned)* above.
