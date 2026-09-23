# Checkpoint skill calibration — Software Development center

Derived index of **Checkpoint trust** turn behavior for **software-development** plan-and-deliver skills and mission `plan.mdc` protocol surfaces. Authoritative sources remain each skill's `## Checkpoint turn UX (skill-local)` table and each mission `plan.mdc`.

**Related:**

- [USER_CHECKPOINT marker syntax](../../sedea/docs/user-checkpoint-marker-syntax.md) — marker authoring contract (sedea center)
- [Checkpoint trust — host governance](../../sedea/docs/checkpoint-ask-auto-advance-matrix.md) — platform `trustLevel`, StreamFinal, warm-up (sedea center)
- [Sedea mission calibration](../../sedea/docs/checkpoint-mission-calibration.md) — sedea-center mission skills and plans
- Parent rollout: governance marker rollout row 6 (`6_governance_matrix_66a5fdbe`)

**Rollout status (2026-06-28):** Documents **shipped** Software Development skill Checkpoint turn UX tables and aligned Software Development mission `plan.mdc` markers. Skills without a local table are **pending calibration**. Host/platform governance and per-center split reconciled after [#764](https://github.com/sedea-ai/app/pull/764) / [#765](https://github.com/sedea-ai/app/pull/765) — see [host governance](../../sedea/docs/checkpoint-ask-auto-advance-matrix.md) § Reconcile note.

**No cross-skill inheritance (binding):** This doc is a **derived** cross-ref for R&D only — prefer skill and plan sources.

---

## How to read this index

| Column | Meaning |
|--------|---------|
| **Step** | Skill step, protocol §, or named gate surface |
| **Checkpoint behavior** | `Auto-advance` on happy path, or `Gate` when structured choice is required |
| **Gate detail** | USER_CHECKPOINT prose, external-wait, exception routing, or deferred JIT note |
| **Source** | Authoritative artifact path under this center |

---

## Cluster A — Planning protocol skills (row 2)

| Skill | First developer-pick gate | Primary auto-advance chain | Source |
|-------|---------------------------|----------------------------|--------|
| **master-planner** | Step **3a** — multi-repo selection when ≥2 hosting repos | Steps **1–2** auto-advance; single-repo **3a** auto-advances | [`master-planner/SKILL.md`](../missions/plan-and-deliver/skills/master-planner/SKILL.md) § Checkpoint turn UX |
| **new-plan** | Step **3** — populator approval (when auto-authorize does not apply) | Indexed child validation, stub write, auto-authorize populator path | [`new-plan/SKILL.md`](../missions/plan-and-deliver/skills/new-plan/SKILL.md) § Checkpoint turn UX |
| **pr-breakdown** | Step **6** — approve PR list when K > 0 | Steps **1–5** through draft and **5d** notify | [`pr-breakdown/SKILL.md`](../missions/plan-and-deliver/skills/pr-breakdown/SKILL.md) § Checkpoint turn UX |
| **pr-plan** | **§5c** — start coding session (skipped when `skipPrPlanHandoffModal: true`) | Steps **1–4**, **5a–5b** | [`pr-plan/SKILL.md`](../missions/plan-and-deliver/skills/pr-plan/SKILL.md) § Checkpoint turn UX |
| **phase-planner** | *Pending calibration* | *Pending* | [`phase-planner/SKILL.md`](../missions/plan-and-deliver/skills/phase-planner/SKILL.md) |
| **delivery-phases** | Step **6** — approve phase list when K > 0 | Steps **1–5** through draft and **5d** notify | [`delivery-phases/SKILL.md`](../missions/plan-and-deliver/skills/delivery-phases/SKILL.md) § Checkpoint turn UX |
| **author-prd** | *Pending calibration* | *Pending* | [`author-prd/SKILL.md`](../missions/plan-and-deliver/skills/author-prd/SKILL.md) |
| **quick-fix-plan** | Inline **`pr-plan`** §5c — start coding session | Validate inputs, minimal parent, inline **`new-plan`** / **`pr-plan`** §§1–4 | [`quick-fix-plan/SKILL.md`](../missions/quick-fix/skills/quick-fix-plan/SKILL.md) § Checkpoint turn UX |

### master-planner — detail

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1** — Optional model audit | Auto-advance | — |
| **2** — Load development-process | Auto-advance | — |
| **3a** — Pick target repo(s) | **Gate** when multi-select required | USER_CHECKPOINT — pick which repo(s) this feature primarily touches |
| **3a** — Single-repo default | Auto-advance | — |
| **3b–3c** — Sync repos and load rules | Auto-advance | exception: dirty tree / linked worktree skip |
| **4+** | Deferred to JIT step PRs | — |

### pr-plan — detail

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1–4** — Identify, template, draft §§1–4 | Auto-advance | exception paths per skill |
| **§5c** — Implementation handoff | **Gate** | USER_CHECKPOINT — start coding session |
| **§5d** — Spawn coding-session | Act-after-select; **waiting** on child lane | external-wait — §5e child terminal; structured resume via §5e merge |
| **Skip §5c** | Auto-advance when `skipPrPlanHandoffModal: true` | inline pr-breakdown auto-chain |
| **Plan-change notify receive** | **Gate** on standalone spawned lane | USER_CHECKPOINT — plan change notification |

---

## Cluster B — Ship-chain skills (row 3)

**Worktree lifecycle:** Create worktrees with `worktree-setup.sh` and clean eligible worktrees with `worktree-cleanup.sh`; do not invoke `git worktree add` or `git worktree remove` directly.

| Skill | First developer-pick gate | Notable auto-advance surfaces | Source |
|-------|---------------------------|-------------------------------|--------|
| **coding-session** | Worktree-open gate **or** auto-authorize skip | Generic flow **1–4**, implementation **5–6**, clean ship cut-point, post-merge tail | [`coding-session/SKILL.md`](../missions/plan-and-deliver/skills/coding-session/SKILL.md) § Checkpoint turn UX |
| **pre-pr-review** | *None on happy path* — Step **8** always auto-emits terminal | Steps **1–7** fully auto-advance | [`pre-pr-review/SKILL.md`](../missions/plan-and-deliver/skills/pre-pr-review/SKILL.md) § Checkpoint turn UX |
| **deploy-walk** | Manual step await / Step **4** | Resolve plan, read §7, autonomous agent-executable pass | [`deploy-walk/SKILL.md`](../missions/plan-and-deliver/skills/deploy-walk/SKILL.md) § Checkpoint turn UX |
| **create-pr** | Pre-gh authorization gate | Pre-PR validation **1–4** auto-advance | [`create-pr/SKILL.md`](../missions/plan-and-deliver/skills/create-pr/SKILL.md) § Checkpoint turn UX |
| **plan-reconcile** | Inline closure gate (inline on coding-session) | Preview dry-run, list-candidates | [`plan-reconcile/SKILL.md`](../missions/plan-and-deliver/skills/plan-reconcile/SKILL.md) § Checkpoint turn UX |
| **hosting-repo-rules** | Worktree-open gate | Implement through review-ready | [`hosting-repo-rules/SKILL.md`](../missions/plan-and-deliver/skills/hosting-repo-rules/SKILL.md) § Checkpoint turn UX |
| **worktree-bootstrap** | Step **1** validate gate (exception-only inline retry) | Prerequisites when parent completed setup | [`worktree-bootstrap/SKILL.md`](../missions/plan-and-deliver/skills/worktree-bootstrap/SKILL.md) § Checkpoint turn UX |
| **pr-review** | Step **4** disposition (single-PR); batch mode skips gate | Batch mode auto-advance when **`batchShipAuthorized`** | [`pr-review/SKILL.md`](../missions/plan-and-deliver/skills/pr-review/SKILL.md) § Batch mode |

### coding-session — key gates (detail)

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| Pre-worktree validation | Auto-advance | exception: missing plan path |
| Auto-authorize (pr-plan / phase-planner spawn) | Auto-advance when eligible | exception → worktree-open gate |
| Worktree-open gate | **Gate** when layer 2 modal required | USER_CHECKPOINT — authorize worktree |
| Generic flow **1–4** | Auto-advance | exception: bootstrap / attach failure |
| Implementation **5–6** | Auto-advance | exception: blocking stop |
| Implementation continuation | Auto-advance when clean | **Gate** when criteria fail |
| Ship cut-point | Auto-advance when clean | **Gate** when criteria fail |
| Batch ship (`openPrBatch.length > 1`) | **`approve-ship-batch`** then auto-advance tail | Per [batch ship profile](.sedea/centers/sedea/docs/batch-ship-checkpoint-profile.md) |
| Post-merge tail | Auto-advance chain | exception: cleanup partial |
| After deploy deploy-walk | **Gate** — sole post-merge USER_CHECKPOINT | Manual step await (deploy-walk) |

**Skip worktree-open modal (binding):** When pr-plan / phase-planner spawn auto-authorize eligibility passes, layer 2 is satisfied without the worktree-open modal.

---

## Mission `plan.mdc` protocol surfaces (row 5 — Software Development)

Aligned warm-up tables and protocol **USER_CHECKPOINT** markers. Host merge for plan-and-deliver missions: `effectiveWarmUp = dedupe(sedeaBootstrapRules → softwareDevelopmentBootstrapRules → laneRules)`.

| Mission plan | Checkpoint warm-up binding | Protocol USER_CHECKPOINT markers (representative) | Source |
|--------------|---------------------------|---------------------------------------------------|--------|
| **plan-and-deliver** | Auto-advance substeps; gates at markers + external-wait | §2 PRD intake; §7 failure paths; §8 dispatch resolution | [`plan-and-deliver/plan.mdc`](../missions/plan-and-deliver/plan.mdc) § Lane warm-up manifest |
| **single-phase** | Same binding | Opening phrase mismatch; ad-hoc scope; complexity ceiling; dispatch resolution | [`single-phase/plan.mdc`](../missions/single-phase/plan.mdc) |
| **quick-fix** | Same binding | Opening phrase; scope intake; child failure; dispatch resolution | [`quick-fix/plan.mdc`](../missions/quick-fix/plan.mdc) |
| **debug-and-fix** | Same binding | Opening phrase; issue summary; partial debug; PR plan blocked; dispatch resolution | [`debug-and-fix/plan.mdc`](../missions/debug-and-fix/plan.mdc) |

**plan-and-deliver Squad Leader — key gates:**

| Protocol § | Checkpoint behavior | Gate |
|------------|---------------------|------|
| §1 Open dispatch | Auto-advance when phrase matches | — |
| §2 Collect PRD intake | **Gate** before Author PRD spawn | USER_CHECKPOINT — confirm PRD intake summary |
| §3–§7 child failures | **Gate** on failure / partial paths | Retry, revise, abandon picks |
| §8 Dispatch resolution | **Gate** when planning + ship gates allow | USER_CHECKPOINT — approve dispatch resolution |

---

## Cross-ref index — Software Development skills with Checkpoint turn UX tables

| # | Skill path (under `.sedea/centers/software-development/`) | Calibrated |
|---|----------------------------------------------------------------|------------|
| 1 | `missions/plan-and-deliver/skills/master-planner/SKILL.md` | yes |
| 2 | `missions/plan-and-deliver/skills/new-plan/SKILL.md` | yes |
| 3 | `missions/plan-and-deliver/skills/pr-breakdown/SKILL.md` | yes |
| 4 | `missions/plan-and-deliver/skills/pr-plan/SKILL.md` | yes |
| 5 | `missions/plan-and-deliver/skills/coding-session/SKILL.md` | yes |
| 6 | `missions/plan-and-deliver/skills/pre-pr-review/SKILL.md` | yes |
| 7 | `missions/plan-and-deliver/skills/deploy-walk/SKILL.md` | yes |
| 8 | `missions/plan-and-deliver/skills/create-pr/SKILL.md` | yes |
| 9 | `missions/plan-and-deliver/skills/plan-reconcile/SKILL.md` | yes |
| 10 | `missions/plan-and-deliver/skills/hosting-repo-rules/SKILL.md` | yes |
| 11 | `missions/plan-and-deliver/skills/worktree-bootstrap/SKILL.md` | yes |
| 12 | `missions/quick-fix/skills/quick-fix-plan/SKILL.md` | yes |
| 13 | `missions/plan-and-deliver/skills/delivery-phases/SKILL.md` | yes |

### delivery-phases — detail

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| **1–3** — Identify, load doc, read dual-title | Auto-advance on happy path | exception: wrong template / missing target |
| **4** — Decision gate | Auto-advance when `routeLock: delivery-phases` | **Gate** when `_TBD_` and no route lock — USER_CHECKPOINT decomposition route |
| **5** — Draft (**5a–5d**) | Auto-advance through **5d** notify | — |
| **6** — Approve phase list | **Gate** when **K > 0** | USER_CHECKPOINT — approve list |
| **6b** — Child aggregation | #external-wait on spawned **`new-plan`** / **`phase-planner`** | Resume modal before turn end |

---

## Maintenance policy (Software Development)

| Trigger | Action |
|---------|--------|
| Software Development skill adds/removes/moves a **USER_CHECKPOINT** marker | Update skill `Checkpoint turn UX` table; refresh cluster summary here |
| Software Development mission `plan.mdc` gate changes | Update mission plan; refresh mission table above |
| New Software Development skill ships with calibration table | Append cross-ref index row |

**Verification (Software Development scope):**

```bash
find .sedea/centers/software-development -path '*/skills/*/SKILL.md' \
  -exec rg -l 'Checkpoint turn UX \(skill-local\)' {} \;
rg -l 'Checkpoint trust \(binding\)' .sedea/centers/software-development/**/plan.mdc
```

---

## Spot-check (Software Development skills)

1. Confirm dispatch `trustLevel: checkpoint`.
2. Walk to first documented **Gate** — happy-path steps auto-advance without turn-end modals.
3. At USER_CHECKPOINT, confirm structured choice opens.
4. Replay skip paths (coding-session auto-authorize, pr-plan `skipPrPlanHandoffModal`).
5. Record verdict in skill PR plan §7 After deploy.
6. **Batch ship:** run one multi-PR **`coding-session`** through **`approve-ship-batch`** and verify Phase A + B auto-advance per [batch ship profile](.sedea/centers/sedea/docs/batch-ship-checkpoint-profile.md).

See [host governance](../../sedea/docs/checkpoint-ask-auto-advance-matrix.md) for platform StreamFinal behavior.
