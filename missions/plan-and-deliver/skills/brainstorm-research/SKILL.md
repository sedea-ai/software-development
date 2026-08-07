---
name: brainstorm-research
description: >-
  Optional free-form research session on a spawned child lane. Produces a
  brainstorm report under `.sedea/operations/.../docs/` for downstream PRD,
  Ad-Hoc PRD, quick-fix planning, or debug handover. Invoked from Software Development mission
  intake when the developer selects brainstorm-first.
designation:
  allowed: Research, synthesize, and write brainstorm report under operations docs; approval gate
  forbidden: Application code; git ship; spawn downstream planning agents from this lane
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

**Intent:** **Brainstorm research agent** runs a free-form exploration with the developer, writes a structured report, and closes with **approve report** (hand off to Squad Leader for auto-chained downstream spawn) or **abandon dispatch** (direction not viable).

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

## Checkpoint turn UX (skill-local)

### Software Development center edit destination gate (binding)

When this skill would write under **`.sedea/centers/software-development/`**, open **USER_CHECKPOINT** per **`missions/plan-and-deliver/skills/README.md`** § *Software Development center edit destination gate* **before** any center write. Happy-path operations/plan writes do not open this gate. **Forbidden:** skip the gate; treat `sedea-centers/software-development` as Own on `sedea-ai/app`.


Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`brainstorm-research`**; invoking missions (**`plan-and-deliver`**, **`single-phase`**, **`quick-fix`**, **`debug-and-fix`**) document their own Squad Leader §2.5 **#external-wait** and failure/partial USER_CHECKPOINT gates — see each mission **`plan.mdc`** §2.5.

**Real-dispatch test loop (binding):** After merge, run one full **`brainstorm-research`** spawn on a Checkpoint dispatch through step **4** report approval and collect a developer verdict before the parent phase advances the next cross-mission skill PR — per **Planning protocol skills UX** § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

### Developer input vs external-wait (Checkpoint)

Under Checkpoint trust, **happy-path protocol steps auto-advance without a turn-end modal**. Emit **`mission_control_present_structured_choice`** or **AskQuestion** only at **USER_CHECKPOINT** markers in this skill, **implicit external-wait** surfaces, or **exception** paths.

**Developer-input** (continuation requires the **developer** to pick a modal option on **this lane**) is **not** external-wait. Step **4** report approval is **developer-input USER_CHECKPOINT** — **must** close the turn with structured choice; **Forbidden:** prose-only idle handoff (for example tell-me-when / review-and-reply / pick-in-chat substitutes for the modal).

**Active research (steps 1–3)** is **not** external-wait and **not** a turn-end gate by itself — the agent **Acts** (tools, synthesis, report write) until step **4** presents the report. **Forbidden:** prose-only turn endings that substitute a modal at step **4** with *I'll wait for your research direction* when the protocol step can still advance without a developer pick.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Open session | Auto-advance — free-form research chat until report-worthy material | exception: missing required spawn `inputs` → `partial` |
| **2** — Synthesize | Auto-advance when drafting from conversation | — |
| **3** — Write report | Auto-advance on successful write under docs write root | exception: write failure → `partial` |
| **4** — Present for approval | **Gate** — **first developer-pick gate on this lane** | Report approval (below) |
| **5** — On Approve report | Auto-advance to **`mission_control_refocus_parent_lane`** + terminal MCP result | — |
| **6** — On Abandon dispatch | Auto-advance to refocus + terminal MCP result | — |
| **Continue brainstorming** at step **4** | Auto-advance back to steps **1–3** on this lane | no gate until step **4** re-presents |

### Report approval gate (binding)

USER_CHECKPOINT — continue brainstorming, approve report, or abandon dispatch on this lane. defaultOptionId: continue-brainstorming

**Spawned lane — MCP structured choice (binding):** On spawned **`brainstorm-research`** lanes, **in order to use the AskQuestion modal**, call **`mission_control_present_structured_choice`** (recap in **`displayMarkdown`**; options in **`askQuestion`**) per **`../README.md`** § *Recap, structured choice, act* and **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`**.

| Option id | Label |
|-----------|--------|
| `continue-brainstorming` | Continue brainstorming — explore more sources or questions |
| `approve-report` | Approve report — send to Squad Leader |
| `abandon-dispatch` | Abandon dispatch — direction not viable |
| `more-details` | More details for option _ |

**Forbidden at step 4:** listing **`approve-report`** as the first mission-specific option or using **`defaultOptionId: approve-report`** — terminal handoff requires an explicit Approve pick after research continuation is offered first; prose-only recap with bullet menus; tell-me-when / review-and-reply handoff; ending without **`mission_control_present_structured_choice`** / **AskQuestion** on spawned lanes.

## Research session (steps)

1. **Open the session** — Restate `researchTopic`, `researchPrompt`, and `openingSeeds` when present. Ask what the developer wants to explore; follow free-form chat until enough material exists for a report (no fixed turn count).

   - **Next-step resolution:** Auto-advance through active research — no `USER_CHECKPOINT` on this step under Checkpoint trust.

2. **Synthesize** — Draft report sections from the conversation (see **Report file shape** below). Use tools (read codebase, search docs) when helpful; cite paths in **Sources consulted**.

   - **Next-step resolution:** Auto-advance to step **3** — no `USER_CHECKPOINT` on this step.

3. **Write report** — Resolve docs write root per **31_dispatch-scope.mdc** § *Docs write root resolution*; save under that directory as `brainstorm_<slug>_<8hex>.brainstorm-report.md` (kebab slug from title; regenerate hex on collision once).

   - **Relevant Links (post-write):** After a successful create or material revise write, call MCP **`mission_control_update_relevant_documents`** with the absolute report path (`kind: other`) on this lane — same turn preferred. **Skip** when already registered this session with no content change. Does **not** replace terminal `brainstormReportPath` / `brainstormReportRef`. See **`../README.md`** § *Relevant Links — post-write registration*.

   - **Next-step resolution:** Auto-advance to step **4** after successful write — no `USER_CHECKPOINT` on this step.

4. **Present for approval** — Recap report path and §5 Handoff summary excerpt in **`displayMarkdown`** when using **`mission_control_present_structured_choice`**. Open [Report approval gate](#report-approval-gate-binding) via **`mission_control_present_structured_choice`** or **AskQuestion** — **same turn**, not prose-only.

   - **Next-step resolution:** **Gate** — developer pick required before steps **5** / **6**.

5. **On Approve report** — Set `developerApprovedReport: true`, `abandonMission: false`, `continuationStatus: "terminal"`, `continuationOwner: "squad-leader"`. Call **`mission_control_refocus_parent_lane`** immediately before the MCP result call (see **`../README.md`** § *Parent refocus on terminal (`mission_control_refocus_parent_lane`)*). Populate **`downstreamHandoffSummary`** (concise prose for next spawn **`initiatingPrompt`**) and **`downstreamSpawnTarget`** per invoker (see **Downstream mapping**).

   - **Next-step resolution:** Auto-advance to terminal MCP result — no additional `USER_CHECKPOINT` on this step.

6. **On Abandon dispatch** — Set `developerApprovedReport: false`, `abandonMission: true`, `continuationStatus: "terminal"`, `continuationOwner: "squad-leader"`. Call **`mission_control_refocus_parent_lane`** then MCP result call with `outputs.abandonReason` when the developer stated one.

   - **Next-step resolution:** Auto-advance to terminal MCP result — no additional `USER_CHECKPOINT` on this step.

**On Continue brainstorming** — Continue steps **1–3** on this lane (more sources, questions, or report revision); return to step **4** when the report is updated.

   - **Next-step resolution:** Auto-advance through revision work — no gate until step **4** re-presents.

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
| R5 | **`mission_control_refocus_parent_lane`** — **Required** on Approve / Abandon terminal per procedure steps 5–6; **forbidden** while **`continuationStatus: active`** |

### MCP parent refocus (`mission_control_refocus_parent_lane`)

| Signal on this terminal | Refocus? |
|-------------------------|----------|
| **`continuationStatus: active`** (research / pre-approval) | **Forbidden** |
| **Approve report** / **Abandon dispatch** (**`continuationStatus: terminal`**) | **Required** |

Call **`mission_control_refocus_parent_lane`** (optional `{ "reason": "brainstorm-research-complete" }` — no host-resolved identity keys) **immediately before** **`mission_control_send_agent_result`** when **Required** above. See **`../README.md`** § *Parent refocus on terminal*.

**Message order on terminal turns:** optional recap → **`mission_control_present_structured_choice`** (when a gate is open) → **`mission_control_refocus_parent_lane`** (when required) → **`mission_control_send_agent_result`** (**last**).

Emit **exactly one** line on its own: `mission_control_send_agent_result` immediately followed by a single JSON object on the **same** line. Required keys: `version` (1), `correlationId`, `status`, `summary`, `outputs`, `errors` (use `[]` when none).

Required `outputs` fields:

- `outputs.brainstormReportPath`
- `outputs.brainstormReportRef` — `@`-prefixed path for handoff
- `outputs.reportTitle`
- `outputs.operationsDocsDirectory`
- `outputs.invokerMissionSlug`
- `outputs.developerApprovedReport` — `true` only on **Approve report**
- `outputs.abandonMission` — `true` only on **Abandon dispatch**
- `outputs.abandonReason` — optional string when abandoning
- `outputs.downstreamSpawnTarget` — see **Downstream mapping**
- `outputs.downstreamHandoffSummary` — required when `developerApprovedReport: true`
- `outputs.continuationOwner`
- `outputs.continuationStatus`
- `outputs.missingFields`
- `outputs.remainingTasks`

**Continuation:**

- During active research before report write or approval: `continuationOwner: "brainstorm-research-agent"`, `continuationStatus: "active"`, `developerApprovedReport: false`, `abandonMission: false`.
- On terminal approve or abandon: `continuationOwner: "squad-leader"`, `continuationStatus: "terminal"`.

**Forbidden:** `developerApprovedReport: true` with empty `downstreamHandoffSummary`. **Forbidden:** spawning downstream agents from this lane.

Stop after the MCP result call (see **`../README.md`** § *Terminal stop (normative)*).

## Report file shape (template)

```markdown
# <Title>

**Invoker mission:** `<invokerMissionSlug>`
**Downstream target:** `<downstreamSpawnTarget>`

## 1. Research question

<What was explored?>

## 2. Findings

<Key observations, options considered, constraints>

## 3. Recommendation

<Preferred direction and rationale>

## 4. Risks and open questions

<What remains uncertain>

## 5. Handoff summary

<Concise block the Squad Leader copies into the next spawn initiatingPrompt / intake fields>

## Sources consulted

<Paths, URLs, or tools used>
```

## Out of scope

- Does **not** create PRDs, plans, or PR plan sidecars — downstream skills own those artifacts.
- Does **not** call MCP **`mission_control_propose_dispatch_resolution`** — Squad Leader proposes **`abandoned`** when `abandonMission: true`.
