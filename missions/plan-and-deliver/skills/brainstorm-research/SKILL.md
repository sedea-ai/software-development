---
name: brainstorm-research
description: >-
  Optional analysis-first research session on a spawned child lane. Tracks developer
  requests (questions and tasks), runs DB queries, scripts, log/CSV analysis, and web
  search, maintains an interim request log, then writes a final brainstorm report under
  `.sedea/operations/.../docs/` when the developer approves. Invoked from Software
  Development mission intake when the developer selects brainstorm-first.
designation:
  allowed: >-
    Analysis-first research (DB queries, temp scripts, CSV/data files, log analysis,
    web search, codebase/docs reads); request-ledger tracking; interim request-log
    writes under operations docs; final report write on approval; dual structured-choice
    gates
  forbidden: >-
    Skip substantive analysis to synthesize conclusions; write final report while any
    request is open; application code in hosting repos; git ship; spawn downstream
    planning agents from this lane
inputs:
  invokerMissionSlug:
    type: string
    description: >-
      Mission that spawned this lane (plan-and-deliver, single-phase, quick-fix,
      debug-and-fix).
    required: true
  operationsDocsDirectory:
    type: string
    description: Absolute workspace scope-level docs directory under .sedea/operations/.../docs/ from lane identity or spawn inputs.
    required: true
  researchTopic:
    type: string
    description: Optional short title for the research session and report filename.
    required: false
  researchPrompt:
    type: string
    description: Optional opening question, problem area, or scope hint from Squad Leader intake.
    required: false
  openingSeeds:
    type: string
    description: Optional remainder text from the dispatch opening message after command phrase.
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/brainstorm-research/SKILL.md"
  - ".sedea/centers/software-development/rules/31_dispatch-scope.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/docs/development-process.md"
  - ".sedea/centers/software-development/rules/10_plan-naming-convention.mdc"
---

# Brainstorm research

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Definitive `laneRules`*. Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. **Invoker `warmUpRules` override (binding):** merge skill frontmatter **`warmUpRules`** but **add** the **invoking mission `plan.mdc`** (§§1–2.5) — **not** full plan-and-deliver unless that mission is the invoker.

### `bootstrapRules` — host-resolved (Software Development center layer)

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap |

### `skillWarmUp` — frontmatter `warmUpRules`

| Path | Purpose |
|------|---------|
| *(invoker-supplied on spawn)* **Invoking mission `plan.mdc`** | Mission protocol for brainstorm-first intake |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn contracts, terminal stop |
| `.sedea/centers/software-development/docs/development-process.md` | § *Brainstorm research (optional pre-intake)* |
| `.sedea/centers/software-development/rules/10_plan-naming-convention.mdc` | Report filename slug |

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice for research and approval |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/brainstorm-research/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/rules/31_dispatch-scope.mdc` | Dispatch scope + explicit docs paths |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight |

**Intent:** **Brainstorm research agent** runs an **analysis-first** session with the developer. It tracks every developer **request** (questions **or** imperative tasks such as *count how many …*, *make a CSV with …*, *query the database for …*), executes analysis via tools, maintains an interim **request log** (no conclusions), proposes next steps grounded in the **intake task**, and writes the **final report** (conclusions + handoff) only after all requests are **`done`** and the developer approves. A **post-write revision gate** runs before terminal handoff to the Squad Leader.

**This skill never** emits **`mission_control_spawn_agent`** for **`author-prd`**, **`ad-hoc-prd`**, **`quick-fix-plan`**, or **`debug-and-fix`** — the **invoking Squad Leader** auto-spawns the downstream agent after terminal approval per the invoker mission **`plan.mdc`** §2.5.

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

**Actor:** **Brainstorm research agent** — spawned child lane only.

**Act when** the invoker selected **`brainstorm-first`** at mission intake and supplied **`invokerMissionSlug`** plus **`operationsDocsDirectory`** per **`.sedea/centers/software-development/rules/31_dispatch-scope.mdc`** § *Docs write root resolution*.

If **`invokerMissionSlug`** is missing or **`operationsDocsDirectory`** does not resolve, stop with `status: "partial"`, `outputs.missingFields` populated — do not write files.

## Analysis toolkit (binding)

The lane exists to **perform analysis** before synthesizing conclusions. Use tools as the research question requires:

| Kind | Examples |
|------|----------|
| **Database** | Write and execute read-only queries; summarize row counts and aggregates |
| **Data files** | Temp scripts to parse CSV, JSON, logs, or exports; produce counts or derived files |
| **Logs** | Search and analyze application or system logs for patterns, errors, volumes |
| **Web** | Search the internet for documentation, benchmarks, or external facts |
| **Codebase / docs** | Read, grep, and trace code paths; cite paths in outcomes |

**Forbidden:** jump to synthesis, recommendations, or final report write **without** running substantive analysis when the intake task or open requests require it. **Forbidden:** treat chat-only speculation as fulfillment of a task-form request that requires tool execution.

## Request ledger (binding)

Track every developer **request** for the session — not only question-form phrasing.

| Field | Rule |
|-------|------|
| **Request item** | One row: request text + **`open`** or **`done`** + outcome note (count, file path, query result, summary) |
| **Seed** | Step **1** seeds the ledger from **`researchPrompt`**, **`openingSeeds`**, and intake chat |
| **Append** | New developer messages on **`continue-analyzing`** or free-form chat append new rows as **`open`** |
| **Complete** | Mark **`done`** only after analysis ran and the outcome note is recorded |
| **Gate rule** | **Forbidden:** offer **`approve-write-report`** while any request is **`open`** |

## Checkpoint turn UX (skill-local)

### Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.


Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`brainstorm-research`**; invoking missions (**`plan-and-deliver`**, **`single-phase`**, **`quick-fix`**, **`debug-and-fix`**) document their own Squad Leader §2.5 **#external-wait** and failure/partial USER_CHECKPOINT gates — see each mission **`plan.mdc`** §2.5.

**Real-dispatch test loop (binding):** After merge, run one full **`brainstorm-research`** spawn on a Checkpoint dispatch through the **analysis gate**, final report write, **post-write revision gate**, and terminal approval — collect a developer verdict before the parent phase advances the next cross-mission skill PR — per **Planning protocol skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path protocol steps auto-advance without a turn-end modal**. Emit **`mission_control_present_structured_choice`** or **AskQuestion** only at **USER_CHECKPOINT** markers in this skill, **implicit external-wait** surfaces, or **exception** paths.

**Developer-input** gates (**analysis gate**, **post-write revision gate**) **must** close the turn with structured choice — **Forbidden:** prose-only idle handoff (for example tell-me-when / review-and-reply / pick-in-chat substitutes for the modal).

**Active analysis (steps 1–2)** is **not** external-wait — the agent **Acts** (tools, ledger updates, interim file writes) until step **3** presents the analysis gate.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Intake anchor | Auto-advance — seed request ledger from spawn inputs | exception: missing required spawn `inputs` → `partial` |
| **2** — Analysis loop | Auto-advance — execute open requests; update interim file | exception: unrecoverable tool failure → note in ledger, stay `open` |
| **3** — Analysis gate | **Gate** — first developer-pick gate | [Analysis gate](#analysis-gate-binding) |
| **4** — On continue-analyzing | Auto-advance back to step **2** | no gate until step **3** re-presents |
| **5** — On approve-write-report | Auto-advance — verify all requests **`done`**; write final report | exception: open requests remain → re-present step **3** |
| **6** — Post-write revision gate | **Gate** | [Post-write revision gate](#post-write-revision-gate-binding) |
| **7** — On revise-report | Auto-advance — edit report; re-present step **6** | — |
| **8** — On approve-report-send | Auto-advance to refocus + terminal MCP result | — |
| **9** — On Abandon dispatch | Auto-advance to refocus + terminal MCP result | — |

### Analysis gate (binding)

USER_CHECKPOINT — continue analyzing, approve final report write, or abandon dispatch on this lane. defaultOptionId: continue-analyzing

**Spawned lane — MCP structured choice (binding):** Call **`mission_control_present_structured_choice`** (recap in **`displayMarkdown`**; options in **`askQuestion`**) per **`../README.md`** § *Recap, structured choice, act* and **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**.

Recap **must** include: intake task anchor, request ledger table (open/done), and **proposed next steps** for open requests tied to the intake task.

| Option id | Label |
|-----------|--------|
| `continue-analyzing` | Continue analyzing — run more analysis or fulfill open requests |
| `approve-write-report` | Approve — all requests done, write final report |
| `abandon-dispatch` | Abandon dispatch — direction not viable |
| `more-details` | More details for option _ |

**Forbidden at analysis gate:** listing **`approve-write-report`** as the first mission-specific option or using **`defaultOptionId: approve-write-report`**; offering **`approve-write-report`** while any request is **`open`**; prose-only recap with bullet menus; ending without structured choice on spawned lanes.

### Post-write revision gate (binding)

USER_CHECKPOINT — revise report, approve and send to Squad Leader, or abandon dispatch on this lane. defaultOptionId: revise-report

| Option id | Label |
|-----------|--------|
| `revise-report` | Revise report — update conclusions before handoff |
| `approve-report-send` | Approve report — send to Squad Leader |
| `abandon-dispatch` | Abandon dispatch — direction not viable |
| `more-details` | More details for option _ |

**Forbidden at post-write gate:** listing **`approve-report-send`** as the first mission-specific option or using **`defaultOptionId: approve-report-send`**; skipping this gate after the first final report write; ending without structured choice on spawned lanes.

## Research session (steps)

1. **Intake anchor** — Restate `researchTopic`, `researchPrompt`, and `openingSeeds` when present. State the **intake task** this session serves. Seed the **request ledger** from intake text and any developer messages so far (questions **or** tasks).

   - **Next-step resolution:** Auto-advance to step **2**.

2. **Analysis loop** — For each **`open`** request, run analysis per **Analysis toolkit**. Record outcomes in the ledger; mark **`done`** when fulfilled. Update the interim request-log file (see **Interim request log shape**). Propose **next steps** mentally for step **3** recap.

   - **Relevant Links (post-write):** After a successful create or material revise write of the interim file, call MCP **`mission_control_update_relevant_documents`** with the absolute path (`kind: other`) on this lane — same turn preferred. **Skip** when already registered this session with no content change.

   - **Next-step resolution:** Auto-advance to step **3** when at least one analysis pass completed or all seeded requests are addressed — no gate on this step.

3. **Analysis gate** — Recap intake task, request ledger, and **proposed next steps** in **`displayMarkdown`**. Open [Analysis gate](#analysis-gate-binding) via **`mission_control_present_structured_choice`** or **AskQuestion** — **same turn**, not prose-only.

   - **Next-step resolution:** **Gate** — developer pick required before steps **4–9**.

4. **On Continue analyzing** — Append any new developer requests from chat to the ledger as **`open`**. Return to step **2**.

   - **Next-step resolution:** Auto-advance through analysis work — no gate until step **3** re-presents.

5. **On Approve write report** — Verify every request is **`done`**. If any remain **`open`**, re-present step **3** with explanation — **do not** write the final report. When all are **`done`**, synthesize conclusions and write the final report under the docs write root as `brainstorm_<slug>_<8hex>.brainstorm-report.md` (kebab slug from title; regenerate hex on collision once).

   - **Relevant Links (post-write):** After a successful final report write, call MCP **`mission_control_update_relevant_documents`** with the absolute report path (`kind: other`).

   - **Next-step resolution:** Auto-advance to step **6**.

6. **Post-write revision gate** — Recap report path and §5 Handoff summary excerpt in **`displayMarkdown`**. Open [Post-write revision gate](#post-write-revision-gate-binding) — **same turn**, not prose-only.

   - **Next-step resolution:** **Gate** — developer pick required before terminal handoff.

7. **On Revise report** — Edit the final report per developer feedback; return to step **6**.

   - **Next-step resolution:** Auto-advance through edits — gate at step **6** after update.

8. **On Approve report send** — Set `developerApprovedReport: true`, `abandonMission: false`, `continuationStatus: "terminal"`, `continuationOwner: "squad-leader"`. Call **`mission_control_refocus_parent_lane`** immediately before the MCP result call. Populate **`downstreamHandoffSummary`** and **`downstreamSpawnTarget`** per **Downstream mapping**.

   - **Next-step resolution:** Auto-advance to terminal MCP result.

9. **On Abandon dispatch** (either gate) — Set `developerApprovedReport: false`, `abandonMission: true`, `continuationStatus: "terminal"`, `continuationOwner: "squad-leader"`. Call **`mission_control_refocus_parent_lane`** then MCP result with `outputs.abandonReason` when stated.

   - **Next-step resolution:** Auto-advance to terminal MCP result.

## Downstream mapping (binding)

| `invokerMissionSlug` | `downstreamSpawnTarget` | Squad Leader auto-chain (invoker-owned) |
|----------------------|-------------------------|----------------------------------------|
| `plan-and-deliver` | `author-prd` | §2.5 → §3 **`author-prd`** with `prdDescription` + `sourceMaterials` from report |
| `single-phase` | `ad-hoc-prd` | §2.5 → §3 **`ad-hoc-prd`** with `details` from report |
| `quick-fix` | `quick-fix-plan` | §2.5 → §3 **`quick-fix-plan`** with synthesized bullets from report |
| `debug-and-fix` | `enrich-debug-intake` | §2.5 → §2 issue context enriched; continue §3 **`debug-and-fix`** |

## Completion (spawned)

### MCP result preflight (`mission_control_send_agent_result`)

| Step | Check |
|------|--------|
| R1 | Call **`mission_control_send_agent_result`** with **`status`**, **`summary`**, optional **`outputs`** / **`errors`** |
| R2 | **Forbidden args absent** — no **`correlationId`**, **`dispatchId`**, **`slotId`**, or other host-resolved keys |
| R3 | Populate **`outputs`** from the required field list below |
| R4 | Re-emit updated MCP result after user-requested follow-up on this lane (same spawn session; host resolves **`correlationId`**) |
| R5 | **`mission_control_refocus_parent_lane`** — **Required** on Approve / Abandon terminal per procedure steps 8–9; **forbidden** while **`continuationStatus: active`** |

### MCP parent refocus (`mission_control_refocus_parent_lane`)

| Signal on this terminal | Refocus? |
|-------------------------|----------|
| **`continuationStatus: active`** (analysis / pre-approval) | **Forbidden** |
| **Approve report send** / **Abandon dispatch** (**`continuationStatus: terminal`**) | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "brainstorm-research-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above. See **`../README.md`** § *Parent refocus on terminal*.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Emit **exactly one** line on its own: `mission_control_send_agent_result` immediately followed by a single JSON object on the **same** line. Required keys: `version` (1), `correlationId`, `status`, `summary`, `outputs`, `errors` (use `[]` when none).

Required `outputs` fields:

- `outputs.brainstormReportPath`
- `outputs.brainstormReportRef` — `@`-prefixed path for handoff
- `outputs.brainstormRequestsPath` — absolute path to interim request log when written
- `outputs.brainstormRequestsRef` — `@`-prefixed path to interim request log when written
- `outputs.reportTitle`
- `outputs.operationsDocsDirectory`
- `outputs.invokerMissionSlug`
- `outputs.developerApprovedReport` — `true` only on **Approve report send**
- `outputs.abandonMission` — `true` only on **Abandon dispatch**
- `outputs.abandonReason` — optional string when abandoning
- `outputs.downstreamSpawnTarget` — see **Downstream mapping**
- `outputs.downstreamHandoffSummary` — required when `developerApprovedReport: true`
- `outputs.continuationOwner`
- `outputs.continuationStatus`
- `outputs.missingFields`
- `outputs.remainingTasks`

**Continuation:**

- During active analysis before final report approval: `continuationOwner: "brainstorm-research-agent"`, `continuationStatus: "active"`, `developerApprovedReport: false`, `abandonMission: false`.
- On terminal approve or abandon: `continuationOwner: "squad-leader"`, `continuationStatus: "terminal"`.

**Forbidden:** `developerApprovedReport: true` with empty `downstreamHandoffSummary`. **Forbidden:** spawning downstream agents from this lane.

Stop after the MCP result call (see **`../README.md`** § *Terminal stop (normative)*).

## Interim request log shape (template)

Save under the docs write root as `brainstorm_<slug>_<8hex>.brainstorm-requests.md` (same slug/hex family as the final report when possible). **Request log only — no conclusions.**

```markdown
# Request log — <title>

**Intake task:** <anchor from researchPrompt / openingSeeds / intake chat>
**Invoker mission:** `<invokerMissionSlug>`

| # | Request | Status | Outcome |
|---|---------|--------|---------|
| 1 | count how many rows in … | done | 1,842 rows; query saved in Sources |
| 2 | make a CSV of top 10 … | open | — |

## Sources consulted

<Paths, queries, URLs, temp script paths, artifact paths>
```

## Final report file shape (template)

Written only on step **5** after all requests are **`done`** and the developer picks **`approve-write-report`**, then revised through step **6–7** as needed.

```markdown
# <Title>

**Invoker mission:** `<invokerMissionSlug>`
**Downstream target:** `<downstreamSpawnTarget>`
**Request log:** `<path to brainstorm-requests.md>`

## 1. Research question

<What was explored?>

## 2. Findings

<Key observations grounded in analysis outcomes from the request ledger>

## 3. Recommendation

<Preferred direction and rationale>

## 4. Risks and open questions

<What remains uncertain>

## 5. Handoff summary

<Concise block the Squad Leader copies into the next spawn initiatingPrompt / intake fields>

## Sources consulted

<Paths, URLs, queries, temp scripts, and data artifacts used>
```

## Out of scope

- Does **not** create PRDs, plans, or PR plan sidecars — downstream skills own those artifacts.
- Does **not** call MCP **`mission_control_propose_dispatch_resolution`** — Squad Leader proposes **`abandoned`** when `abandonMission: true`.
