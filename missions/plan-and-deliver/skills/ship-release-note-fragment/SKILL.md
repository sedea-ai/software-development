---
name: ship-release-note-fragment
description: >-
  Docs-only: promote one approved hosting unreleased release-note fragment onto
  origin/main via worktree → commit → PR → merge → cleanup. No developer
  structured-choice gates on the clean path (consent was capture-release-note
  approve-fragment). Designed for inline run from capture-release-note Step 6.
designation:
  allowed: >-
    Hosting worktree setup/attach; stage named fragment path(s) only; commit;
    push; create-pr; approval-gated merge when ready; post-merge worktree cleanup;
    return merge-proof fields to invoker
  forbidden: >-
    USER_CHECKPOINT / AskQuestion / mission_control_present_structured_choice on
    the clean path; product-code edits; pre-pr-review; pr-review disposition;
    deploy-walk; plan-reconcile; Squad Leader create-pr; expanding beyond fragment
    paths; mission_control_propose_dispatch_resolution
inputs:
  repoPath:
    type: string
    description: Absolute HOSTING_ROOT
    required: true
  hostingFragmentPath:
    type: string
    description: Absolute path to approved fragment on primary clone
    required: true
  hostingFragmentRelPath:
    type: string
    description: Repo-relative path under hosting (docs/release-notes/unreleased/…)
    required: true
  baseRef:
    type: string
    description: Integration ref for worktree / merge proof. Default origin/main.
    required: false
    default: origin/main
  centerFragmentPath:
    type: string
    description: Optional absolute center unreleased mirror (stage only if set and in-repo)
    required: false
laneRules:
  - ".sedea/centers/sedea/rules/6_git-commit-push-gate.mdc"
  - ".sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc"
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/ship-release-note-fragment/SKILL.md"
warmUpRules:
  - ".sedea/centers/software-development/missions/plan-and-deliver/skills/README.md"
  - ".sedea/centers/sedea/rules/7_stacked-pr-worktree-naming.mdc"
---

# Ship release-note fragment

**Inline from capture (primary).** [`capture-release-note`](../capture-release-note/SKILL.md) Step **6** reads and runs this skill **in-session** after approve + write. **Do not** spawn a child agent for this skill on the capture happy path.

**Consent:** Parent **`approve-fragment`** only. **Forbidden on the clean path:** any `USER_CHECKPOINT`, AskQuestion, or **`mission_control_present_structured_choice`**.

**Owns:** hosting worktree → stage named fragment path(s) → commit → push → inline **`create-pr`** → approval-gated merge when ready → post-merge cleanup → merge-proof fields for the invoker.

**Out of scope:** fragment drafting/approval; overlay edits; product code; deploy-walk; plan-reconcile; dispatch resolution.

## Agent messaging (MCP)

| Action | MCP tool |
|--------|----------|
| Workbench attach after worktree-setup | **`sedea_add_worktree_folder`** |
| Workbench detach after cleanup (when authorized) | **`sedea_remove_worktree_folder`** |

**Forbidden:** **`mission_control_propose_dispatch_resolution`**. When run **inline** from capture, do **not** call **`mission_control_send_agent_result`** — return Completion (inline) fields to the invoker. When ever spawned alone, use **`mission_control_send_agent_result`** per Completion (spawned).

## Checkpoint turn UX (skill-local)

Under Checkpoint trust, **auto-advance the full clean chain in the same turn** — no developer consent modals.

| Step | Checkpoint behavior | Gate |
|------|---------------------|------|
| Validate inputs | Auto-advance | exception: missing paths → failure fields |
| Worktree setup + attach | Auto-advance | exception: bootstrap / attach failure |
| Stage + commit + push | Auto-advance | exception: git failure |
| Inline create-pr | Auto-advance authorize-create-pr | exception: PR create failure |
| Merge when mergeDelegationReady | Auto-advance after rule **6** merge inspect | exception: policy / checks block |
| Post-merge cleanup + merge proof | Auto-advance | exception: proof missing after claimed merge |

**Skipped on clean path (binding):** plan completeness; worktree-open modal; coding-session three-stop model; **`pre-pr-review`**; **`pr-review`** disposition; Before/After deploy **`deploy-walk`**; **`plan-reconcile`**.

## Steps

### 1. Validate inputs

1. Require absolute **`repoPath`** (**`HOSTING_ROOT`**), **`hostingFragmentPath`**, and **`hostingFragmentRelPath`**.
2. Confirm the fragment file exists at **`hostingFragmentPath`**.
3. Default **`baseRef`** to **`origin/main`** when omitted.

- **Next-step resolution:** Auto-advance to Step **2**.

### 2. Hosting worktree

From **`repoPath`** / **`HOSTING_ROOT`**, run center **`worktree-setup.sh`** per [`.sedea/centers/sedea/rules/7_stacked-pr-worktree-naming.mdc`](.sedea/centers/sedea/rules/7_stacked-pr-worktree-naming.mdc) (docs-only fragment ship — use a short **`improve/`** or **`docs/`** worktree name). When hint **`nextAction: attach-required`**, MCP **`sedea_add_worktree_folder`**.

- **Next-step resolution:** Auto-advance to Step **3**.

### 3. Stage named fragment path(s)

1. Ensure **`hostingFragmentRelPath`** exists under **`WORKTREE_ROOT`** — copy from **`hostingFragmentPath`** when the file was written on the primary clone only.
2. Stage **named paths only** — the hosting fragment path, and **`centerFragmentPath`** only when set and that path is inside this repo checkout.
3. **Forbidden:** staging product code or unrelated docs.

- **Next-step resolution:** Auto-advance to Step **4**.

### 4. Commit and push

1. Commit with a message referencing the release-note fragment (for example `docs(release-notes): add unreleased fragment`).
2. Push the worktree branch to origin.

- **Next-step resolution:** Auto-advance to Step **5**.

### 5. Create PR and merge

1. Inline **`create-pr`** — Checkpoint auto-advance **`authorize-create-pr`** on the clean path ([`../create-pr/SKILL.md`](../create-pr/SKILL.md)).
2. When **`mergeDelegationReady`**, run rule **6** § *Merge inspect procedure*, then approve/merge — **no** extra consent modal (parent already approved the fragment).
3. **Forbidden:** merge without inspect readiness or while required checks fail.

- **Next-step resolution:** Auto-advance to Step **6**.

### 6. Cleanup and merge proof

1. Post-merge worktree cleanup when Path A/B ownership authorizes **this** **`WORKTREE_ROOT`**.
2. Verify merge proof from **`HOSTING_ROOT`**: `git fetch` then `git ls-tree -r --name-only origin/main -- docs/release-notes/unreleased/` contains **`hostingFragmentRelPath`** (or basename).
3. Return Completion fields to the invoker.

## Completion (inline)

| Field | Type | Notes |
|-------|------|-------|
| `fragmentShipStatus` | string | `merged` \| `failed` |
| `mergeProofVerified` | boolean | `true` when path proven on `origin/main` |
| `mergeProofPath` | string | Repo-relative path (= `hostingFragmentRelPath` when proven) |
| `prState` | string | `merged` when done |
| `prUrl` | string | When available |
| `prNumber` | number | When available |
| `errors` | array | `{ message }` on failure |

## Completion (spawned)

Not required for the capture happy path. If ever spawned alone: emit the same fields via **`mission_control_send_agent_result`**; still **no** clean-path structured choice.

## Anti-patterns (binding)

| Anti-pattern | Correct action |
|--------------|----------------|
| Structured choice / USER_CHECKPOINT on clean path | Auto-advance — consent was `approve-fragment` |
| Spawn coding-session for fragment ship | This skill owns fragment ship |
| Expand beyond fragment paths | Named paths only |
| Terminal success without merge proof | Verify path on `origin/main` |
| Inline create-pr from Squad Leader | Capture lane runs this skill after write |
