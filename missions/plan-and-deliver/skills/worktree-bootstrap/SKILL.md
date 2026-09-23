---
name: worktree-bootstrap
description: >-
 **Deprecated (read-only).** Normative bootstrap is center **`worktree-setup.sh`**
 on **`coding-session`** (fast bootstrap inside setup; map hint **`bootstrapStatus`**).
 This skill remains for in-flight dispatch drain and **exception-only** inline retry
 when setup failed — not spawn-by-default. Does not commit, spawn deploy-walk, or run
 the ship chain. Does not implement product code on open PRs, or edit plan files unless
 the spawner requests a skip attestation path.
designation:
  allowed: Exception-only bootstrap retry when center worktree-setup failed; attested skip flags
  forbidden: Product implementation; ship chain; default-path setup substitution
inputs:
  worktreePath:
    type: string
    description: Absolute path to the git worktree root (WORKTREE_ROOT).
    required: true
  hostingRoot:
    type: string
    description: Absolute path to the primary hosting clone (HOSTING_ROOT) — parent of .sedea/ on disk; must contain scripts/bootstrap-worktree-dev.sh when dot-sedea selects a script bootstrap mode.
    required: true
  targetPlanPath:
    type: string
    description: Absolute or workspace-relative PR plan path when plan-anchored.
    required: false
  targetPlanSlug:
    type: string
    description: PR plan slug when plan-anchored.
    required: false
  worktreeName:
    type: string
    description: Worktree name (`-b` on `git worktree add`) in the worktree.
    required: false
  bootstrapSkipFlags:
    type: array
    description: >-
      Optional --skip-* flags only when dot-sedea and the hosting bootstrap script
      document attested partial setup on the parent lane (ignored on repos whose
      script accepts but does not honor skip flags).
    required: false
    default: []
  ledgerParent:
    type: string
    description: Ledger parent slug/path copied from coding-session.
    required: false
  upstreamSkill:
    type: string
    description: Skill that spawned this lane — usually coding-session.
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/2_ask-question-instructions.mdc"
  - ".sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/worktree-bootstrap/SKILL.md"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/plan.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc"
  - ".cursor/rules/dot-sedea.mdc"
---

# Worktree bootstrap

> **Hosting-repository worktree lifecycle:** The parent must use `worktree-setup.sh` to create the worktree and `worktree-cleanup.sh` to remove it when authorized. Do not invoke `git worktree add` or `git worktree remove` directly.

> **Deprecated (read-only):** Normative bootstrap is **`.sedea/centers/sedea/scripts/worktree-setup.sh`** on the **`coding-session`** lane — see [`coding-session/SKILL.md`](../coding-session/SKILL.md) § *Center worktree scripts (binding)* and § *Worktree bootstrap (mandatory)*. This skill file stays on disk until [drain criteria](../README.md#worktree-bootstrap-skill-drain-gate) pass; do **not** spawn by default.

## Warm-up manifest (spawned)

Per [`.sedea/centers/sedea/docs/lane-manifest-contract.md`](.sedea/centers/sedea/docs/lane-manifest-contract.md) and **`../README.md`** § *Default warm-up*. Host merge: `effectiveWarmUp = dedupe(bootstrapRules → laneRules → skillWarmUp)`. **Exception-only** inline retry on **`coding-session`** when center setup failed; manifest applies when spawned or warm-up replay. **No `alwaysApply` frontmatter flip.**

### `bootstrapRules` — host-resolved (Software Development center layer)

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/rules/bootstrap.mdc` | Sole Software Development `alwaysApply: true` bootstrap (≤10 KB); host merges when `centerSlug === software-development` |

### `skillWarmUp` — frontmatter `warmUpRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/software-development/missions/plan-and-deliver/plan.mdc` | Plan sidecar, worktree session |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn contracts, inline vs spawned |
| `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc` | Bootstrap profiles, hosting cwd |
| `.cursor/rules/dot-sedea.mdc` | Worktree bootstrap mode (hosting overlay) |

### `laneRules` — frontmatter `laneRules`

| Path | Purpose |
|------|---------|
| `.sedea/centers/sedea/rules/2_ask-question-instructions.mdc` | Structured choice on bootstrap retry |
| `.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc` | Ship lane context |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/worktree-bootstrap/SKILL.md` | This skill procedure |
| `.sedea/centers/software-development/missions/plan-and-deliver/skills/README.md` | Spawn preflight |

This skill prepares a fresh **`WORKTREE_ROOT`** after Mission Control attach. **Read dot-sedea first** — [`.cursor/rules/dot-sedea.mdc`](.cursor/rules/dot-sedea.mdc) § *Worktree bootstrap mode* and § *Fast bootstrap verification checklist* on the active hosting repo, then follow [`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`](.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc) § *Bootstrap profiles*.

| dot-sedea mode | What this skill runs |
|----------------|----------------------|
| **`script-bootstrap`** | `./scripts/bootstrap-worktree-dev.sh "$WORKTREE_ROOT"` from **primary** **`HOSTING_ROOT`** — linear phases per that repo's **`--help`** (orchestrator repos) |
| **`full`** | Bootstrap script, **full overlay** profile when dot-sedea § *Worktree bootstrap mode* names **`full`** |
| **`extensions-only-link`** | Bootstrap script, **linked-build overlay** profile per dot-sedea § *Worktree bootstrap mode* |
| **`submodule-init`** | `git submodule update --init --recursive` under **`WORKTREE_ROOT`** when no bootstrap script applies |

Full compile, linked primary-clone build artifacts, and add-on sync per dot-sedea apply **only** on **`full`** / linked-build overlay profiles — not on every script repo.

**Normative invocation (superseded):** **`coding-session`** maps **`bootstrapStatus`** from center **`worktree-setup.sh`** on the default path — **do not** invoke this skill after successful setup. **Exception-only:** **`coding-session`** may read this skill **inline** when setup failed and the developer attests retry (see [`coding-session/SKILL.md`](../coding-session/SKILL.md) § *Worktree bootstrap (inline mandatory)*). **Forbidden:** spawn (`mission_control_spawn_agent`) for this skill on the default path.

Running bootstrap is **not** developer approval for worktrees — layer 2 **`developerApprovedImplementation`** stays on the parent **`coding-session`** lane.

## Agent messaging (MCP)

**MCP spawn/result skill.** Parent→child spawn and child terminal result use MCP tools per **`.sedea/centers/sedea/rules/4_mission.mdc`** § *Agent-to-agent spawn protocol*.

| Action | MCP tool |
|--------|----------|
| Parent spawn (when this skill emits a child lane) | **`mission_control_spawn_agent`** |
| **This** spawned lane terminal (and terminal re-emits) | **`mission_control_send_agent_result`** |

**Binding:**

- Run **`../README.md`** § *MCP spawn preflight* (rows M1–M8) before every MCP spawn; **forbidden** host-resolved identity keys in MCP args (`correlationId`, `dispatchId`, `slotId`, … — see README § *Host-resolved identity*).
- Inline skills on this mission stay **inline-only** — no spawn wire change unless the protocol step explicitly spawns a child lane.


## Prerequisites (parent **`coding-session`** lane)

This skill **does not** create worktrees or attach them to Sedea. The parent lane must finish first (see [`coding-session/SKILL.md`](../coding-session/SKILL.md) § *Hard rules — git worktree vs workbench attach (binding)* and § *Generic flow (single repo)*):

1. **Center setup** — parent ran **`.sedea/centers/sedea/scripts/worktree-setup.sh`** from **`HOSTING_ROOT`**; worktree exists at **`worktreePath`**. **Forbidden on parent before retry:** **`sedea_add_worktree_folder`** before setup exits **0**, or inline **`git worktree add`** on the default path when the center script exists.
2. **`sedea_add_worktree_folder` only** — worktree is a workspace root in Mission Control when setup JSON **`nextAction`** is **`attach-required`**. **Forbidden:** editor **Add Folder to Workspace** or skipping MCP attach.

Then invoke **`worktree-bootstrap`** **inline** only when center setup failed and the developer attests retry — with **`worktreePath`** and **`hostingRoot`**. If **`worktreePath`** is missing or MCP attach failed, stop — do **not** substitute setup steps on this lane (see **Forbidden** in step 2 below).

## Structured choice (Mission Control)

When inline on **`coding-session`**, structured choice at [Step 1 validate gate](#step-1-validate-gate-binding) uses **AskQuestion** or **`mission_control_present_structured_choice`** per **`.sedea/centers/sedea/rules/2_ask-question-instructions.mdc`** and **`../README.md`** § *Recap, structured choice, act*. Bootstrap script failure after Step **2** hands back to the parent lane — do **not** open a second modal on this skill unless Step **1** must be re-run.

## Checkpoint turn UX (skill-local)

Under Checkpoint trust (`trustLevel: checkpoint`), auto-advance scripted happy-path steps; emit structured choice only at **USER_CHECKPOINT** markers in this section, implicit external-wait surfaces, or exception paths. **No cross-skill inheritance** — gate defaults here apply only to **`worktree-bootstrap`**; other ship-chain skills document their own markers.

**Real-dispatch test loop (binding):** After merge, run one inline **`worktree-bootstrap`** pass on a **`coding-session`** Checkpoint dispatch through [Step 1 validate gate](#step-1-validate-gate-binding) (exception-only inline retry after attested setup failure) and collect a developer verdict to close **Ship-chain skills UX** PR 8 — per parent § *Single-concern strategy*.

Marker syntax: [`.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md`](.sedea/centers/sedea/docs/user-checkpoint-marker-syntax.md).

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **Prerequisites** (parent **`coding-session`**) | Auto-advance when parent completed center setup + MCP attach | exception: missing **`worktreePath`** or attach failure — stop without substituting setup |
| **1** — Validate inputs and resolve mode | **Gate** on exception-only inline retry after validation succeeds | [Step 1 validate gate](#step-1-validate-gate-binding) |
| **2** — Run bootstrap | Auto-advance on happy path after gate approval | exception: script exit non-zero → `partial` + parent retry attestation |
| **3** — Report outcome | Auto-advance recap on **`## Completion (inline)`** handback | exception: `failed` with **`continuationStatus: active`** |

## Session orientation table (binding)

Give developers a **consistent state snapshot** during inline bootstrap retry so they can re-orient after reload or parallel work.

**When required:** At [Step 1 validate gate](#step-1-validate-gate-binding) only — render as the **first block** in `displayMarkdown`. **Forbidden:** omitting the table and substituting scattered one-liners on modal gates.

**Table shape (markdown):**

| Field | Value |
|-------|-------|
| Plan | `<targetPlanSlug>` @ `<targetPlanPath>` or — |
| Worktree | `<worktreePath>` from inline context |
| Branch | `<worktreeName>` from inline context or — |
| PR | — (pre-implementation — bootstrap retry) |
| Ship phase | `worktree` (parent **`coding-session`**) |
| Deploy scope | — |
| Review | — |
| Bootstrap | `<outputs.bootstrapMode>` · pending · success · failed |

**Population rules:** Same contract as [`.sedea/centers/software-development/missions/plan-and-deliver/skills/coding-session/SKILL.md`](../coding-session/SKILL.md) § *Session orientation table (binding)* — use inline context from the parent lane; never invent paths.

**Mandatory gates (this skill):** [Step 1 validate gate](#step-1-validate-gate-binding) only under Checkpoint — Steps **2–3** auto-advance on the happy path; bootstrap script failure surfaces via exception path on the parent **`coding-session`** lane per [Worktree bootstrap (inline mandatory)](../coding-session/SKILL.md#worktree-bootstrap-inline-mandatory--retry--exception-only).

## Step 1 — Validate inputs and resolve mode

Required:

- `worktreePath` — absolute worktree directory (exists, is a linked git worktree).
- `hostingRoot` — absolute **primary** hosting clone path the parent lane supplies (must contain **`scripts/bootstrap-worktree-dev.sh`** when a script mode applies).

1. Read **`.cursor/rules/dot-sedea.mdc`** § *Worktree bootstrap mode* when present on the hosting repo.
2. Set `outputs.bootstrapMode` to the dot-sedea mode: `script-bootstrap` | `full` | `extensions-only-link` | `submodule-init`.
3. When dot-sedea is absent and **`./scripts/bootstrap-worktree-dev.sh`** exists on **`hostingRoot`**, default `outputs.bootstrapMode` to **`full`** (script overlay per rule **20**).
4. When the mode requires the bootstrap script and the file is absent at **`hostingRoot`**, stop with `failure` and `outputs.bootstrapStatus: failed`, `outputs.bootstrapFailureReason` naming the missing script path.
5. When the mode is **`submodule-init`** and no script exists, proceed to step 2 — do not fail solely for a missing script.

**Note:** **`WORKTREE_ROOT`** may not contain the bootstrap script on disk; **`HOSTING_ROOT`** is the primary clone cwd for script invocation.

- **Next-step resolution:** Auto-advance through validation substeps **1–5** on the happy path — no `USER_CHECKPOINT` until [Step 1 validate gate](#step-1-validate-gate-binding) when inline on **`coding-session`** under Checkpoint trust. When validation fails (missing script, invalid paths), stop with `failure` / `partial` per step **4** — do **not** open the gate.

### Step 1 validate gate (binding)

When **`upstreamSkill`** is **`coding-session`** and inline validation succeeded (paths exist, **`outputs.bootstrapMode`** resolved, required script present when applicable), close Step **1** with structured choice **before** [Step 2 — Run bootstrap](#step-2--run-bootstrap).

**When required:** Exception-only inline retry path only — after center **`worktree-setup.sh`** failed on the parent lane and the developer attested retry. **Forbidden:** opening this gate on the default path when center setup already reported success-class **`bootstrapStatus`**. **Forbidden:** prose-only bootstrap recap without this gate under Checkpoint trust. **Forbidden:** emitting **`mission_control_send_agent_result`** from this skill on inline runs — the parent **`coding-session`** lane owns MCP results.

Put resolved **`worktreePath`**, **`hostingRoot`**, **`outputs.bootstrapMode`**, and any attested **`bootstrapSkipFlags`** in **`displayMarkdown`**. Include [Session orientation table (binding)](#session-orientation-table-binding) as the first block.

USER_CHECKPOINT — confirm validated inline bootstrap retry inputs and proceed to Step 2.

| Option id | Label (brief) | Act |
|-----------|---------------|-----|
| `confirm-run-bootstrap` | Confirm — run Step 2 bootstrap with resolved mode | Proceed to [Step 2 — Run bootstrap](#step-2--run-bootstrap) |
| `retry-with-skip-flags` | Retry with attested `--skip-*` flags | Re-validate with updated **`bootstrapSkipFlags`**; re-open this gate when applicable |
| `change-bootstrap-inputs` | Change worktree path or hosting root | Re-collect inline context from parent; re-run validation substeps **1–5** |
| `defer-inline-bootstrap` | Defer — hand back to coding-session without running bootstrap | Report to parent with **`continuationStatus: active`**; do **not** run Step **2** |
| `more-details` | More details for option _ | Elaborate; re-open this gate |

- **`defaultOptionId: confirm-run-bootstrap`** when validation passed, paths are absolute, and **`outputs.bootstrapMode`** matches dot-sedea / hosting overlay.
- **Next-step resolution:** Auto-advance through validation substeps **1–5** on the happy path — no `USER_CHECKPOINT` until this gate on the exception-only inline retry path.

**Spawned lane (deprecated drain):** When this skill is still spawned for in-flight dispatch drain, Step **1** auto-advances without this gate — spawned terminal contract unchanged.

## Step 2 — Run bootstrap

| `outputs.bootstrapMode` | Command (from **`HOSTING_ROOT`** unless noted) |
|-------------------------|-----------------------------------------------|
| **`script-bootstrap`** | `./scripts/bootstrap-worktree-dev.sh "<worktreePath>"` — append `bootstrapSkipFlags` only when dot-sedea documents honored skip flags |
| **`full`** | `./scripts/bootstrap-worktree-dev.sh "<worktreePath>"` + attested `bootstrapSkipFlags` when applicable |
| **`extensions-only-link`** | `./scripts/bootstrap-worktree-dev.sh "<worktreePath>"` with linked-build flags per dot-sedea § *Worktree bootstrap mode* and that repo's script **`--help`** + attested `bootstrapSkipFlags` when applicable |
| **`submodule-init`** | `cd "<worktreePath>" && git submodule update --init --recursive` — seed empty `.sedea/centers/*` from **`hostingRoot`** when init leaves an empty tree (see dot-sedea) |

The bootstrap script is idempotent where the hosting repo documents idempotency — safe to re-run after partial failure.

**Script-bootstrap repos:** submodule init, operations seed, deps, configure, and docker (when applicable) are owned by that repo's script — see **`--help`**, not this skill.

**Forbidden on this lane:** `git worktree add` / `remove` / `prune`, `sedea_add_worktree_folder` / `sedea_remove_worktree_folder`, hosting-repo product edits, `gh pr create`, spawning other plan-and-deliver skills. **Worktree removal ownership:** bootstrap never removes worktrees — see rule **20** § *Worktree removal ownership (binding)* and [`.sedea/centers/sedea/rules/0_hosting-repo.mdc`](.sedea/centers/sedea/rules/0_hosting-repo.mdc) § *Worktree ownership*.

## Step 3 — Report outcome

| Outcome | `outputs.bootstrapStatus` | Terminal `status` |
|---------|---------------------------|-------------------|
| Script or submodule-init exit 0 | `success` | `success` |
| Script or submodule-init exit non-zero | `failed` | `partial` |
| No applicable mode / missing script when required | `failed` | `partial` |

Capture a short stderr/stdout tail in `outputs.bootstrapFailureReason` when `failed`.

Set `outputs.continuationOwner: "worktree-bootstrap-agent"`. Set `outputs.continuationStatus: terminal` on `success`; `active` on `partial` when retry remains.

## Spawned result contract

When spawned by **`coding-session`**, populate at least:

- `outputs.worktreePath`
- `outputs.hostingRoot`
- `outputs.targetPlanPath`, `outputs.targetPlanSlug` (echo when supplied)
- `outputs.worktreeName` (echo when supplied)
- `outputs.bootstrapStatus` — `success` | `failed`
- `outputs.bootstrapMode` — `script-bootstrap` | `full` | `extensions-only-link` | `submodule-init`
- `outputs.bootstrapFailureReason` — when failed
- `outputs.bootstrapSkipFlags` — array used, or `[]`
- `outputs.ledgerParent`, `outputs.upstreamSkill`
- `outputs.continuationOwner`, `outputs.continuationStatus`

## Mission Control section 8 sync (spawned terminal)

When `targetPlanPath` is set, include on every terminal **`mission_control_send_agent_result`**:

| Field | Rule |
|-------|------|
| `targetPlanPath` | Absolute PR plan path — **required** when plan-anchored |
| `shipPhase` | `worktree` |
| `rowStatus` | `open` while bootstrap failed or parent still blocked; `closed` only when parent has moved past worktree setup (parent owns final row closure) |

## Completion (spawned)

### MCP result preflight (`mission_control_send_agent_result`)

| Step | Check |
|------|--------|
| R1 | Call **`mission_control_send_agent_result`** with **`status`**, **`summary`**, optional **`outputs`** / **`errors`** |
| R2 | **Forbidden args absent** — no **`correlationId`**, **`dispatchId`**, **`slotId`**, or other host-resolved keys |
| R3 | Populate **`outputs`** from the required field list below |
| R4 | Re-emit updated MCP result after user-requested follow-up on this lane (same spawn session; host resolves **`correlationId`**) |

Stop after the MCP result call. Do not emit another `mission_control_spawn_agent` on this lane (see **`../README.md`** § *Terminal stop (normative)*).

## Completion (inline)

Report the same `outputs` semantics in prose to the invoker on the **same lane** (or populate `outputs` on **`coding-session`** MCP result calls when this skill runs inline there). Do **not** emit `mission_control_spawn_agent`, `mission_control_send_agent_result`, or `mission_control_propose_dispatch_resolution`. Do **not** add a **MCP result** under this section.

**Primary path:** **`coding-session`** invokes this skill inline after attach and blocks implementation until **`outputs.bootstrapStatus: success`**. See [`../coding-session/SKILL.md`](../coding-session/SKILL.md) § *Worktree bootstrap (inline mandatory)*.

Before **`coding-session`** continues past Generic flow step 4: one recap line with `bootstrapStatus`, `bootstrapMode`, exit code, and failure tail when failed.
