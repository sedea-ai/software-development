# Planning mode templates (on-demand)

On-demand reference for Software Development **planning modes** and plan-file templates. Planning skills load this doc at **named protocol steps** — not on every warm-up.

**Normative core** (Strategy, Development tools index, Cadence reference): [`development-process.md`](development-process.md).

**Cross-refs:** [`plan-and-deliver/plan.mdc`](../missions/plan-and-deliver/plan.mdc); [`spawn-ship-contracts.md`](../missions/plan-and-deliver/docs/spawn-ship-contracts.md) (spawn/ship); planning skills under `missions/plan-and-deliver/skills/`.

---

## Planning Modes

Per Strategy principle #2, planning happens in three modes, applied top-down: **architectural / code design**, **delivery phases**, and **PR breakdown**. Each addresses a different question — design says *what* will exist, delivery says *how the design decomposes* (into sub-phases or into PRs) *on its way to delivery*, and PR breakdown says *which coding-ready PRs* a PR-ready phase produces. PRs are the only units that ship; phases are organizing structure, not delivery units.

**Every level of the plan tree gets its own plan file.** A feature is a plan tree rooted at the **Master Plan** (one file per feature, mode #1). Every phase, sub-phase, and sub-sub-phase below it is its own standalone plan file authored from the **Phase plan template** in mode #2 — recursion stops only when a plan is decided to be **PR-ready**. Every PR is its own standalone plan file authored from the per-PR template in mode #3. Standalone files at every level keep each plan focused on a single granularity, let **a coding agent** work without broader-context distraction when working from a PR plan (Strategy #6), and make **indexed child expansion** via **`new-plan`** the natural way to grow any non-PR-ready entry one level down.

**The dual-title `Delivery phases | PR breakdown` section is the recursion point.** Both the Master Plan template (§ 6) and the Phase plan template (§ 5) end in a dual-title section whose heading is one of `Delivery phases` (children are sub-phase plans) or `PR breakdown` (children are PR plans, mode #3). The shared **§ 6 / § 5 contents rule** below the Phase plan template defines both shapes once. Until the decomposition decision is made, the heading reads `Delivery phases | PR breakdown` and the body is `_TBD_`.

**Roles and surfaces** — Agent definitions, GitHub, operations plan files, and the protocol are listed in **Development tools** (section above). Subsections below define **authoring conventions** (short bullets, LLM consumers, carve-outs) that apply across the three modes.

**Bullet-style convention.** Most bulleted sections across the three modes follow a short-bullet rule: aim for 2–3 words per bullet, never more than 5. **A long list of short bullets is always better than a short list of long sentences.** The rule exists because the primary reader is a human (the developer) scanning operations plan files to validate a design or trace delivery — humans process small, bite-sized chunks faster and more precisely than long prose, so terse bullets win.

**LLM-agent corollary.** When a section's primary consumer is an LLM agent (e.g. **a coding agent** reading a PR plan, **a pre-PR reviewer agent** in a **fresh agent session**, or **a reviewer agent** reading a PR description), the constraint becomes *whatever length lets the agent consume the section unambiguously*, not 2–5 words. Sometimes that's still short bullets (e.g. **Change scope** in mode #3 is the contract for **a coding agent** — terseness *is* the value, and a clipped bullet is unambiguous because it names a code-level concept the agent can ground on). Sometimes it's full sentences (e.g. **Reasoning** in mode #3 — **a coding agent** has to relay the *because* into a PR description for **a reviewer agent** and surface the same *because* in a **fresh pre-PR reviewer agent session**, and a 3-word bullet would force **a coding agent** to invent context). The author judges per section.

**Carve-outs from the short-bullet rule.** Sections that opt out, with reason:
- **PR list** (mode #3 set-level § 3) — a numbered list whose item lines (the PR slug or short title, bolded) follow the short-bullet rule, but whose **Single concern** sub-bullet inherits the per-PR § 1 sentence verbatim and is therefore full prose, not 2–5 words.
- **Reasoning** (mode #3 per-PR) — **a coding agent** (implementation + **fresh pre-PR reviewer agent session**) + **a reviewer agent**-facing; full sentences so the PR description carries faithful rationale.
- **Deploy test plan** (mode #3 per-PR) — each step must be unambiguous for the on-call.
- **Repo rules impact** (mode #3 per-PR § 5) — short bullets for **`.cursor/rules/*.mdc`** in the repo that receives the PR (hosting repo or hosting repo worktree); see **`.sedea/centers/software-development/rules/40_maintain-rules.mdc`**. **Not** Sedea center rules under **`.sedea/centers/`** — Software Development center changes use **`improve center rules`** on **`software-development`**; Sedea platform center rules use **`sedea`**. The `_None — …_` line is still short-bullet form.
- **Caveats** (mode #3 per-PR only) — **a coding agent** (implementation + **fresh pre-PR reviewer agent session**) + **a reviewer agent**-facing; full sentences so the PR description carries the concern faithfully. *In modes #1 and #2 Caveats is read by the developer during plan review and follows the short-bullet rule like the other planning bullets — short, scannable, sufficient.*

Each section says inline whether it follows the short-bullet rule or opts out.

### 1. Architectural / code design

The design mode answers: *what shape does the change take, and where does it land in the codebase?*

#### Master Plan template

A **Master Plan** operates at feature granularity. It has these sections only — sections 1–6 are required, section 7 is optional:

1. **Background.** 1–2 sentences about the feature from a hosting repo perspective.
2. **Benefits.** Short bullet points covering only the *why* — benefits to merchants or their customers, cost / effort reductions for the system, user-experience improvements. Follow the short-bullet rule from the bullet-style convention above.
3. **Related features.** Short bullet points capturing how this feature relates to others touching the same parts of the system. Per related feature, list the relationship type and what it implies for **delivery** or **scope**. **Ordering / concurrency** — *follows*, *precedes*, or *concurrent*, with the implied synchronization need (order, shared surface, rollout coupling). **Scope** — *narrows scope*, *widens scope*, or *shifts scope*, with a few words on *how* (less this feature must own, more it must cover, or boundaries / ownership that move). One bullet may combine ordering and scope when both apply. Follows the short-bullet rule.
4. **Architectural design.** One or more diagrams showing what the implementation will look like. Pick the diagram type(s) that best fit the feature:
 - **Component / architecture chart** — service topology, module boundaries, dependency direction.
 - **Flow chart** — control flow or data flow through new logic.
 - **Sequence diagram** — interactions between services, processes, or actors over time.
 - **State diagram** — lifecycle / state-machine changes.
 - **ER / schema diagram** — data model or database changes.
 - …whatever conveys the change most clearly.
 When drafting Mermaid, follow [`.sedea/centers/sedea/docs/mermaid-authoring.md`](.sedea/centers/sedea/docs/mermaid-authoring.md) — opaque ids (no reserved bare ids; never use uppercased reserved abbreviations such as `OPT`/`ALT`/`END`/`LOOP` as bare participant/node ids — prefer opaque id + label), sequence `Note` on a single physical line without HTML `<br/>` or bare semicolons (`;`), sequence message labels without bare `;`, and flowchart-only `<br/>` in quoted node labels.
5. **Changes.** Short bullet points listing what changes, how, and where, scoped at the feature level. Follows the short-bullet rule. Immediately after the change bullets, the **`master-planner`** protocol branch appends a **`### Decomposition assessment`** subsection (same short-bullet + one-line recommendation pattern as phase plans — see mode #2 below). That block records **kinds of change**, **PR count band**, **sequencing / coupling**, a **routing recommendation** (`Delivery phases`, multi-PR `PR breakdown`, or single-PR `PR breakdown`), and **confidence**, so **developer** can choose "Delivery Phase" or "PR Breakdown" with evidence before § 6 is drafted. After that block, **`master-planner`** appends **`### Complexity score (plan-scope signal)`** using the **table + overall score + band** shape and counting rules defined in **`master-planner`** Step 6c (**low** ≤ 10, **medium** 11–20, **high** > 20, where the score is the max of the three table rows). **High** means recommend **Route §6 → Delivery phases** on the **master-planner** lane — split the Master Plan into outcome-titled phase rows, each populated by **`phase-planner`** with lower scoped surface (see the protocol branch); separate Master Plans remain an optional alternative, not a prerequisite before §6.
6. **Delivery phases | PR breakdown.** Dual-title section: the heading is `Delivery phases` when the feature decomposes into one or more phase plans, or `PR breakdown` when the feature is small enough to break directly into PRs without an intermediate phase layer. When the heading is `Delivery phases`, the body is a **short numbered list** (see the **§ 6 / § 5 contents rule** below the Phase plan template in mode #2). Most features land on `Delivery phases`; tiny features that don't need a phase layer land on `PR breakdown` and skip mode #2 entirely. Until this section is drafted, its body may stay `_TBD_` **or** follow the **assessment-before-dual-title** pattern in the **§ 6 / § 5 contents rule** (assessment block already present from § 5, dual-title list still `_TBD_`).
7. **Caveats.** *Optional — omit if there are none.* Anything that needs special attention — known exceptions, edge cases, risks, or coupling that isn't obvious from the diagram or change list. Follows the short-bullet rule from the bullet-style convention above (developer-primary; one short bullet per concern is more scannable than a paragraph).

### 2. Delivery phases

The delivery-phases mode answers: *how does the design decompose on the way to delivery?* A phase is **never delivered directly**. It is either broken further into sub-phases (the next hierarchy level down) or split into PRs via mode #3 (PR breakdown) that are themselves the delivered units. Phases exist to step the design down from "one big shape" toward PR-sized chunks aligned with Strategy #4 (small chunks, fast to production).

**PR-readiness is decided per phase.** When you decide a phase will be split directly into PRs (no further sub-phases), you mark it a **PR-ready phase** — its dual-title section is titled `PR breakdown` and holds PR pointers via mode #3. Otherwise, the **delivery phase** is further decomposed into **sub-phases** — its dual-title section is titled `Delivery phases` and holds a **short numbered list** of summary entries pointing at each sub-phase's standalone plan file. The decision is made per phase, so PR breakdown is **optional and partial by design**: some phases of the same parent may be PR-ready while others decompose further. A phase having a PR breakdown is what makes it **PR-ready** — there is no further plan breakdown beyond it.

**This mode produces a standalone plan file per child phase.** Each item in the parent plan's dual-title `Delivery phases` **numbered list** corresponds to its own `<slug>.plan.md` authored from the **Phase plan template** below. The parent's section only carries short summaries with links — the body of every phase plan lives in its own file. This is what lets every plan stay scoped to a single granularity and keeps any plan a reader opens digestible in one screen.

#### Phase plan template

A **phase plan** is a standalone plan file that fills in one entry of a parent plan's dual-title `Delivery phases` section. The same phase plan template applies whether the parent is a **Master Plan** or another phase plan (recursion). It has these sections only — 1–5 are required, 6 is optional:

1. **Background.** 1–2 sentences on how this phase builds on the previous phase(s) and which part of the parent plan it covers.
2. **Scope.** One short sentence describing the scope at a high level, plus diagram(s) reused from the parent plan's **Architectural design** section with the parts this phase touches highlighted (annotation / color / callout). The highlight should convey both *which* parts the phase touches and *how* it touches them.
3. **Code design.** A diagram giving a visual representation of the change introduced by this phase. Pick the type that best fits, using the same menu as **Architectural design** in mode #1 (component, flow, sequence, state, ER, …). When drafting Mermaid, follow [`.sedea/centers/sedea/docs/mermaid-authoring.md`](.sedea/centers/sedea/docs/mermaid-authoring.md) — opaque ids (never use uppercased reserved abbreviations such as `OPT`/`ALT`/`END`/`LOOP` as bare participant/node ids — prefer opaque id + label); no bare `;` in sequence Notes or message labels; and do **not** mix flowchart-only syntax (`subgraph`, `classDef`, `<br/>` in labels) into `sequenceDiagram` blocks.
4. **Changes.** Short bullet list describing each change. Follows the short-bullet rule from the bullet-style convention above. Immediately after these bullets, the **`phase-planner`** protocol branch appends **`### Decomposition assessment`** — a short, explicit pass over **kinds of change** (count distinct *kinds*, not files), **PR count band** (single vs few vs many), **sequencing / coupling** (migrations, flags, cross-repo, etc.), a **routing recommendation** (`Delivery phases` vs multi-PR `PR breakdown` vs single-PR `PR breakdown`), and **confidence** (high / med / low). That block is **evidence for the next planning move**; the committed recursion shape is still the dual-title **heading** once `delivery-phases` / `pr-breakdown` runs. Until then, keep the dual-title heading as `Delivery phases | PR breakdown` and leave the dual-title **list** body as `_TBD_` after the assessment block (see **assessment-before-dual-title** below).
5. **Delivery phases | PR breakdown.** Dual-title section: the heading is `Delivery phases` when this phase decomposes further into sub-phases, or `PR breakdown` when it is PR-ready and decomposes directly into PRs. When the heading is `Delivery phases`, the body is a **short numbered list** (see the **§ 6 / § 5 contents rule** below). The **heading** is the committed decomposition decision once set; the **`### Decomposition assessment`** block (between § 4 and § 5 for phase plans, under § 5 for Master Plans) is the **pre-commitment sizing record** used to choose that heading. Until the decision is made, leave the heading as `Delivery phases | PR breakdown` and the list body `_TBD_` (with assessment already filled in by `master-planner` / `phase-planner` where those protocol branches have run).
6. **Caveats.** Same as mode #1 above — *optional*, short bullets for exceptions, risks, or coupling that needs special attention (e.g. feature-flag prerequisites, ordering constraints with other phases, migration sequencing). Follows the short-bullet rule.

#### § 6 / § 5 contents rule (shared by Master Plan and Phase plan templates)

**Assessment-before-dual-title.** For a Master Plan or Phase plan, the file may contain **`### Decomposition assessment`** (sizing and routing recommendation) **immediately above** the dual-title `## 6.` / `## 5.` section while the dual-title body is still `_TBD_`. Legacy plans may have only `_TBD_` under the dual heading; **`pr-breakdown`** ensures an assessment exists (inserting one if missing) before the developer picks `Delivery phases` vs multi-PR vs single-PR `PR breakdown`. The assessment does **not** replace the numbered child list or the mode #3 set-level template — it informs the choice.

**Single-PR on a phase plan (draft location — binding).** Typical chain: **`master-planner`** → **`delivery-phases`** → **`new-plan`** → **`phase-planner`**. When **`phase-planner`** records **single-PR** `PR breakdown` in **`### Decomposition assessment`**, **always** draft the full § 5 **`PR breakdown`** set-level block (**`### Single-concern strategy`**, **`### Sequencing`**, **`### PR list`**) on **this phase plan** — same shape as multi-PR phases; **K = 1** only changes list length.

1. **Default procedure (where the PR list is drafted).** Run inline **`pr-breakdown`** with **`targetPlanPath`** = **this phase plan** and `prBreakdownShape: "single"`. Retitle § 5 to **`PR breakdown`** when the set-level block is written. The decomposition **ancestor** (Master Plan **`Delivery phases`** row **N**) receives **link-only** updates: **`Phase plan:`** (phase link) and **`Plan:`** (PR link after **`new-plan`**) — **never** a row-scoped **`#### PR breakdown — row N`** block or duplicate **`### PR list`** on the ancestor.
2. **Phase lane ownership.** While **`continuationOwner: phase-planner-agent`**, the phase `.plan.md` (§§ 1–4, assessment, § 5 **`PR breakdown`**) is the **primary delivery document** in user-facing recaps — **link the phase file first**.
3. **Forbidden (agent failure).** Hoisting PR-list drafting to the ancestor Master Plan; **`StrReplace`** on the ancestor that inserts **`#### PR breakdown — row N`**, **`### Single-concern strategy`**, **`### Sequencing`**, or **`### PR list`** for a single-PR phase row; leaving phase § 5 as a pointer-only note when the route is **`pr-breakdown-single`**.

See **`phase-planner/SKILL.md`** Step **5b-decompose** and **`pr-breakdown/SKILL.md`** (single-PR uses **step 5s** on the phase target, same flow as multi-PR).

Every plan ends in a **dual-title section** — § 6 in the Master Plan, § 5 in a Phase plan — whose heading is one of two values, and whose body shape is determined by the heading:

- **Heading = `Delivery phases`** (the plan decomposes into child phases): a **short numbered list** — use Markdown ordered list syntax (`1.`, `2.`, `3.`, …), **one numbered item per child phase**. Under each numbered item, three nested sub-bullets (unordered `-` bullets are fine):
 - Sub-bullet 1: the child's decomposition decision — `Delivery phases` or `PR breakdown` (matches the child plan's own dual-title heading).
 - Sub-bullet 2: a one-line scope sentence (paraphrased from the child plan's § 2 Scope).
 - Sub-bullet 3: a Markdown link to the child plan's `.plan.md` file.

 List index **N** (1-based ordered list) is what the developer picks via **AskQuestion** (one `option` per index) when spawning a child via **`new-plan`**: keep list order and numbering in sync with `## N.` phase headings in the parent plan when you add those headings (same **N**, same sequence). Follows the short-bullet rule (each sub-bullet is one short line).

- **Heading = `PR breakdown`** (the plan is PR-ready and decomposes directly into PRs): the mode #3 set-level content — Single-concern strategy + Sequencing + **PR list**. The **PR list** sub-section is itself a **short numbered list** mirroring the Delivery phases shape (one numbered item per PR, with the PR's slug or short title bolded on the item line so **`new-plan`** can seed the child name from item **N**). See mode #3 below for the full set-level template, including the two sub-bullets each numbered item carries.

A short **optional intro paragraph** (one or two sentences) is allowed immediately under the heading and before the entries — useful when the decomposition needs a one-line framing the reader can't infer from the entries alone (e.g. "phases run in two parallel tracks"). Skip it when the entries speak for themselves; an empty intro is preferred over filler.

A non-PR-ready plan thus *only* lists short summaries pointing at child plans — never inlines a child's body. To break a child entry out into its own plan file, the developer picks list index **N** via **AskQuestion** per **30_planning-target-resolution** § *Sedea input channel*; the agent runs the **`new-plan`** protocol branch (**Development tools** § *Protocol branches*) with the parent plan resolved from chat context per **`.sedea/centers/software-development/rules/30_planning-target-resolution.mdc`**. **N** is the ordered-list index from the parent's numbered list of children — `Delivery phases` body when the heading is `Delivery phases`, or the `### PR list` sub-section when the heading is `PR breakdown`. **`new-plan`** seeds the child plan's name from the bolded item title on item **N**'s line (indexed-child mode). **Indexed-child stub:** the child file uses a **generic** scaffold (`## Overview`, `## Phasing`, `## Out of scope`) until **`phase-planner`** or **`pr-plan`** replaces the body with the Phase plan or per-PR template — that two-step split is intentional.

#### Depth-first plan-tree traversal (indexed spawn)

**List-first, expand-when-eligible.** When **`delivery-phases`** or **`pr-breakdown`** drafts a parent list, the plan file shows **every** phase or PR at high level. Each row's **`Plan:`** sub-bullet stays `_TBD_` (or an equivalent spawn placeholder) until that row becomes **eligible** for **`new-plan`** indexed spawn. **Do not** scaffold all children in one approval pass.

**Ship-complete gate (normative).** A row is eligible for indexed spawn only when every **blocking** predecessor is **ship-complete** on the **`plan and deliver`** §8 ship ledger (`shipPhase: done`, `rowStatus: closed`, or explicit `deferred` / `abandoned` per developer choice on that dispatch). Planning-handoff signals alone (`readyForImplementation`, populated §§1–4) do **not** unlock the next row.

| Parent list | Blocking rule |
| --- | --- |
| **`Delivery phases`** (phase rows) | **Always sequential.** Phase **N+1** is not eligible until phase **N** is ship-complete — meaning every PR plan under phase **N** meets the ship-complete bar above (`shipPhase: done` + `rowStatus: closed`, or explicit `deferred` / `abandoned`). |
| **`### PR list`** (PR rows) | **Stage-aware** per **`### Sequencing`** below. |

**PR stages (reuse set-level `### Sequencing`).** The mode #3 set-level template already records which PRs are chained vs parallel (bullet stages such as *Stage 1 (sequential): PR 1 → PR 2; Stage 2 (parallel): PR 3, PR 4*). Agents **parse** that subsection — do not invent a parallel syntax elsewhere.

- **Sequential chain** (within one stage, or `→` between PR numbers): PR **k+1** is not eligible until PR **k** is ship-complete.
- **Parallel stage** (comma-separated PRs in one stage label): all PRs in that stage may become eligible **together** once the **prior stage** is fully ship-complete (every PR in the prior stage meets the ship-complete bar above).
- **Single PR** (`### Sequencing` notes one PR): only item **1** exists; no sibling gate.

**List approval vs expand.** Structured choice on **`delivery-phases`** / **`pr-breakdown`** separates **approve list** (wording + order + sequencing) from **expand eligible row(s)** (run **`new-plan`** only for indices that pass the gate). On **`pr-breakdown`** inline under **`master-planner`** or **`phase-planner`**, **`approve-list`** may **auto-expand PR index 1** in the **same** act-after-select turn when depth-first eligible — then inline **`new-plan`** → inline **`pr-plan`** (§§1–4, verbatim **Single concern** from the list row). PR **2+** and re-expand still use **`expand-eligible`**. **`delivery-phases`** unchanged (approve list does not auto-expand). See those skills §6 and **`.sedea/centers/software-development/rules/30_planning-target-resolution.mdc`** § *Depth-first expansion eligibility*.

**Upstream notification (spawn chain).** When a **`coding-session`** child finishes **plan-reconcile** with the PR **merged**, **main** fast-forwarded, and the target plan **archived** (`shipPhase: done`, `rowStatus: closed`), the child terminal **`mission_control_send_agent_result`** must set **`outputs.prShipComplete: true`** and include **`parentPlanPath`**, **`parentPlanSlug`**, **`parentIndex`** from spawn inputs. Mission Control delivers that result to the **parent lane** (`pr-plan` → inline **`new-plan`** → **`pr-breakdown`** / **`phase-planner`** → **`master-planner`**). Each parent **re-emits an updated** terminal result (same `correlationId`) after merging child ship status so upstream agents can run **`expand-eligible`** / **`expand-next-eligible`** without waiting for manual **Ship recap** on the Squad Leader lane. When every PR under a phase is **`prShipComplete`**, **`phase-planner`** sets **`outputs.phaseShipComplete: true`** for **`delivery-phases`** / **`master-planner`**. Contract detail: **`missions/plan-and-deliver/skills/README.md`** § *Upstream ship-complete notification*.

### 3. PR breakdown

The PR-breakdown mode answers: *how does a PR-ready plan decompose into individual, coding-ready PRs?* Each PR is a single-concern deliverable (Strategy #6) that can ship to production on its own. This mode applies to any plan whose dual-title section is titled `PR breakdown` — typically a **PR-ready phase plan**, but also a **Master Plan** for features small enough to skip the phase layer entirely. PR breakdown is therefore optional and partial: only PR-ready plans go through this mode.

**Each PR has its own standalone plan file.** Like phase plans (mode #2), PR plans are standalone — but where phase plans separate by *granularity*, PR plans separate by *coding agent isolation*. A PR plan is the artifact handed to **a coding agent**, who must not be confused by broader feature / phase context. Keeping the PR plan scoped to a single concern keeps **them** focused on a single concern (Strategy #6).

The responsibilities of **a coding agent** do not stop at the code change. **They** also produce the prompt for **a PR-creating agent**, which writes the PR description. That description must give **a reviewer agent** *complete context* — including *why* a change was made and *which alternatives were considered and rejected* — so **a reviewer agent** can respond with actionable feedback rather than exploratory prompts. The same per-PR material must support a **fresh pre-PR reviewer agent session** (see **Development tools** § *Pre-PR reviewer agent*) before those dedicated reviewer-agents run. **A coding agent** cannot invent that reasoning without the per-PR plan carrying it explicitly. This is why the per-PR template below contains **Background** and **Reasoning** sections in addition to the change-scope / tests / deploy-plan answers.

The breakdown answers five core questions split across two scopes:

| Set level (PR-ready plan's dual-title `PR breakdown` section) | Per PR (standalone PR plan file) |
| --- | --- |
| 1. How is single-concern enforced across the whole set? | 3. What is the change scope of this PR? |
| 2. Which PRs are chained vs parallel? | 4. What tests need to be written? |
| | 5. What is the test plan before and after deployment? |

…plus the supporting Background + Reasoning sections per PR so **a PR-creating agent** can draft a description **a reviewer agent** can act on — and so **a coding agent** can run a **fresh pre-PR reviewer agent session** from the same artifact.

The set-level content fills the PR-ready plan's dual-title section (Master Plan § 6 or Phase plan § 5) when it is titled `PR breakdown`. Every PR pointer in that list links to a standalone PR plan file authored from the per-PR template.

#### PR sizing — test cases and kinds of changes

**Canonical source (center sync contract).** This subsection is the **authoritative** definition of PR sizing for the **software-development** center. When buckets, kinds-of-change rules, or test-case counting change, edit **here first**, then align:

- **`.sedea/centers/software-development/rules/20_efficient-pr-shipping.mdc`** § *Keep PRs small and focused* (ship-lane summary)
- **`.sedea/centers/software-development/missions/plan-and-deliver/skills/pr-breakdown/SKILL.md`** § *Step 5a — Infer PR boundaries from the parent plan* (operational application)
- **`master-planner`** / **`phase-planner`** § *Decomposition assessment* (routing bands `single` | `few (2–5)` | `many (6+)` only — sizing metrics reference this subsection)

Do **not** change thresholds (**≤ 10** / **11–20** / **21+**) or the kinds-vs-lines rule in a single downstream file alone.

Two metrics support the breakdown decision — which PRs to carve out, and how heavy each candidate ends up:

1. **Test-case count.** Estimate the test cases each candidate PR introduces or meaningfully changes — unit + integration / snapshot + exploratory recordings, each enumerated case counted once. Buckets: **≤ 10** simple, **11–20** mid-sized, **21+** heavy. A heavy PR is a *signal to investigate* splitting — it is not automatically wrong. Do not split if the only available split runs within one kind of change (instance batching), or if the result is a half-shipped feature (Strategy #4 trumps size).
2. **Kinds of changes.** Count *distinct kinds* of changes — not raw lines and not raw files. N instances of the same kind (the same shape applied to N similar files) is **one kind**, not N kinds. Threading the same prompt fragment into 8 generators is one kind with 8 instances; **a reviewer agent** reads the first instance carefully and skims the rest, and **a pre-PR reviewer agent** does the same. Splitting by call-path or by file is rarely justified when the kinds across both halves are identical.

Raw changed-line count is **not** a size signal in this process. Downstream copies must stay aligned with this subsection per the sync contract above.

**When to run sizing.** **`### Decomposition assessment`** is authored at the end of **`master-planner`** § 5 and **`phase-planner`** § 4 (same metrics as this subsection), *before* the dual-title section is populated — so **developer** and **`pr-breakdown`** together choose `delivery-phases`, a multi-item **`pr-breakdown`**, or a **one-item `### PR list`** with full context. If a plan predates that block, **`pr-breakdown`** inserts it before the decision gate.

#### Set-level template (PR-ready plan's dual-title `PR breakdown` section)

When a PR-ready plan's dual-title section is titled `PR breakdown` and populated, it has these sub-sections in order:

1. **Single-concern strategy.** 1–2 sentences on how this PR-ready plan keeps each PR single-concern (Strategy #6) — typically: "every PR maps to exactly one user-visible behavior change or one internal contract change; no PR mixes concerns". Optionally followed by a short bullet list of concerns that were tempting to bundle but were intentionally split (short-bullet rule per the convention above).
2. **Sequencing.** How PRs relate in time — **this subsection is the machine-readable gate** for depth-first PR expansion (see **Depth-first plan-tree traversal** above). Pick whichever form conveys it most clearly:
 - Bullet list grouped by stage: *Stage 1 (sequential): PR 1 → PR 2; Stage 2 (parallel): PR 3, PR 4*. Numbers match the `### PR list` ordering so cross-references resolve at a glance. Label each stage **`(sequential)`** or **`(parallel)`** so agents can parse blocking vs concurrent PRs.
 - Small dependency diagram (Mermaid graph or similar) — optional supplement; the staged bullet form remains authoritative for **`new-plan`** eligibility when both exist.
 When the bullet form is used, follows the short-bullet rule.
3. **PR list.** A **short numbered list** — use Markdown ordered list syntax (`1.`, `2.`, `3.`, …), one numbered item per PR, in roughly the sequencing order from the **Sequencing** sub-section above. A **single numbered item** is valid when the whole plan ships as one coding-ready PR (then **`new-plan`** indexed spawn for item **1** → per-PR plan → **`pr-plan`**). Each numbered item carries the PR's slug or short title on the item line, **bolded** so the **`new-plan`** protocol branch (digit-only **N** in session) can read it as the new plan's name; under each numbered item, two nested sub-bullets (unordered `-` bullets are fine):
 - Sub-bullet 1: **Single concern.** A one-line **PR description seed** — the exact per-PR § 1 sentence **`pr-plan`** copies verbatim into the child plan (no paraphrase when `parentRowSingleConcern` is passed); **a reviewer agent** can scan the set in one glance.
 - Sub-bullet 2: **Plan.** A Markdown link to the standalone PR plan file, or _TBD_ until **`new-plan`** creates the child for item **N** (indexed spawn).

 The index **N** is the digit-only indexed-child argument to **`new-plan`** — invoking **`new-plan`** with the parent locked and **N**=`3` on a parent plan whose dual-title section is `PR breakdown` spawns the standalone PR plan file for the third numbered item. This section is **carved out** of the short-bullet rule on the **Single concern** sub-bullet — that bullet inherits the per-PR Single-concern sentence and is full prose, not 2–5 words. The bolded item line itself follows the short-bullet rule (a slug or 2–5-word title).

#### Per-PR plan template

Each PR's standalone plan file has these sections only — sections 1–7 are required, section 8 is optional. Sections 1–3 keep **a coding agent** on a single concern; sections 4 and the prose of section 2 give **them** what they need so **a PR-creating agent** can draft a complete PR description for **a reviewer agent** — and so **a coding agent** can run a **fresh pre-PR reviewer agent session** from the same text.

1. **Single concern.** One sentence stating the single concern this PR addresses (e.g. *"Add the `feature_flag_x_enabled` field to the merchant config schema and surface it in the admin UI read path."*). This sentence is also what shows up next to the PR's bullet in the parent PR-ready plan's PR list, and is the basis for the PR title.
2. **Background.** 2–3 sentences narrowly scoped to this PR — the relevant prior state of the codebase, and the gap, decision, or upstream change this PR is responding to. Oriented for **a reviewer agent** reading the PR cold *and* for **a coding agent** in a **fresh pre-PR reviewer agent session**: enough context that **they** can understand *why this PR exists* without opening the parent plan. Do **not** restate the broader feature / phase context — **a coding agent** must stay focused on the single concern; this section only carries the narrow slice of context needed for the PR description.
3. **Change scope.** Short bullet list of what changes, how, and where. Follows the short-bullet rule from the bullet-style convention above — terseness is the contract for **a coding agent**: anything outside this list is outside the PR. (This is a section where the LLM corollary still resolves to short bullets, because each bullet names a code-level concept the agent can ground on.)
4. **Reasoning.** Why this PR makes the choices it does, in two parts. The bullet-length rule does **not** apply here — items are full sentences, since each entry needs to make the reasoning unambiguous for **a reviewer agent** (via the PR description), for **a coding agent** relaying to **a PR-creating agent**, and for **a coding agent** in a **fresh pre-PR reviewer agent session**.
 - **Why this approach.** The design decisions made in this PR and *why each was made*. Capture the *because* for every non-obvious choice — naming, layering, where logic is placed, what is reused vs introduced, what is kept backwards-compatible.
 - **Considered & rejected.** Alternatives that were considered but not taken, each with the reason it was rejected. This gives **a reviewer agent** maximum signal and the same signal to **a coding agent** in a **fresh pre-PR reviewer agent session**: capturing "we considered X and rejected it because Y" short-circuits "did you think about X?" comments and lets **a reviewer agent** give actionable feedback on the chosen path.
5. **Repo rules impact.** Short bullet list for **a coding agent** — which **`.cursor/rules/*.mdc`** files in the **hosting repo** (the repo that receives this PR) should be **added or updated** after the code change lands, and **one line each** on *what* guidance to add or adjust (new boundary, deployment constraint, error-handling pattern, layout rule, …). Follows the short-bullet rule; paths are relative to that repo's root. When this PR does not warrant any rule change, write a single bullet: `_None — no repo rule updates required for this PR._` This section is **plan-first** for long-lived agent guidance (see **`.sedea/centers/software-development/rules/40_maintain-rules.mdc`**); it is **not** required to duplicate the GitHub PR description body unless **a coding agent** chooses to surface it under "Notes for the reviewer".

 **Align hosting-repo rules before commit and push.** The §5 list is not only planning intent — it is the **coding checklist against the hosting-repo diff**. Before asking for review or running rule **20** § *Commit and push cadence*, **a coding agent** reconciles every §5 bullet with the worktree diff: bullets that call for **update** / **extend** / **add** a named **`.cursor/rules/*.mdc`** file must have the corresponding edit **in the same PR** (preferred) or an explicit follow-up commit in the same worktree before merge; bullets that say **no file edit** / **verify only** / **skip unless …** are satisfied by confirming the code obeys the existing rule (no `.mdc` change). If a rule edit is genuinely deferred, **revise §5 in the plan** in the same window so a **fresh pre-PR reviewer agent session** and **reviewer-agents** do not see plan ↔ repo drift. **Executable ship step:** [plan-and-deliver `coding-session/SKILL.md` § *Repo rules reconciliation (binding)*](../missions/plan-and-deliver/skills/coding-session/SKILL.md#repo-rules-reconciliation-binding) (pre-PR); post-review **`.mdc`** edits via [Post-review repo rules handoff](../missions/plan-and-deliver/skills/coding-session/SKILL.md#post-review-repo-rules-handoff) when inline **`pr-review`** assigns **Rule-update required**.
6. **Tests to write.** Check this repo's specific rule for writing tests if exists. If the rule does not exist write: *No testing rules exist for this repo.*
7. **Deploy test plan.** Two **numbered GFM task lists** (Markdown `1. [ ]`, `2. [ ]`, `3. [ ]` — *not* dash bullets, *not* bare numbered items without checkboxes), under a **`**Status:**`** lifecycle marker. Section shape:

 ```markdown
 ## 7. Deploy test plan

 **Status:** drafted *(YYYY-MM-DD: PR plan drafted.)*

 ### Before deploy

 1. [ ] First step.
 2. [ ] Second step.

 ### After deploy

 1. [ ] First post-deploy check.
 2. [ ] Second post-deploy check.
 ```

 The **`**Status:**`** line tracks the section's lifecycle: `drafted` (PR plan written, nothing deployed yet) → `deployed` (PR landed in the target env; After-deploy steps unlocked) → `done` (all checks complete). Each transition appends a dated `*(YYYY-MM-DD: <note>)*` entry; history is **append-only** and serves as the audit trail for what was verified when. The **`deploy-walk`** protocol branch drives this lifecycle: it **auto-runs** agent-executable steps (tests, scripts, automatable checks) and flips boxes on pass; **manual** steps are presented for the developer with agent assistance. Plans authored without the lifecycle marker still validate (legacy form), but `deploy-walk` will surface the missing-marker case as a flag and recommend adding it.

 **Sub-sections:**
 - **Before deploy** — what to verify locally / in staging before merging the PR.
 - **After deploy** — what to verify in production after the PR ships (smoke checks, monitors / alerts to watch, rollback trigger conditions).

 **After deploy prerequisite (binding — product gitlink ships):** When the PR ships code via a **product submodule** (for example **`app`**) or any path where hosting gitlink promotion applies, the first **`### After deploy`** item (or plan author note above the numbered list) must state that manual smoke requires **hosting product gitlink promoted to the merged source SHA**, **`HOSTING_ROOT`** refreshed (`git pull` + submodule update), and **Reload Window** before production/packaged verification. **`coding-session`** enforces this in [After deploy deploy-walk handoff](../missions/plan-and-deliver/skills/coding-session/SKILL.md#after-deploy-deploy-walk-handoff) — do not duplicate **`promote-submodule-pin`** as a §7 checkbox row (see ship-chain exclusion below).

 The bullet-length rule does **not** apply here: items can be full sentences, since each step needs to be unambiguous for **a coding agent** or the on-call. Numbering is required so reviewers and a **fresh pre-PR reviewer agent session** can reference each step by index (e.g. *"flag § 7 After-deploy 3"*) without counting; the same convention applies to § 8 Caveats. The `[ ]` / `[x]` checkbox is the contract the **`deploy-walk`** protocol branch uses — *no* checkbox means the step won't be picked up by `deploy-walk <N> done` and the step has to be tracked manually. Prefer **agent-executable** wording for automatable checks (named test command, script path, curl with URL) and reserve **manual** phrasing for UI, production dashboards, and judgment calls — see **`deploy-walk/SKILL.md`** § *Agent-executable vs manual steps*.

 **What NOT to include.** § 7 is the **PR-specific delta** on top of the baseline development process — anything covered by always-on rules, standing alerts, or the hosting repo’s **standing** pre-review commands (README, CONTRIBUTING, CI defaults, etc.) does not belong here. Center docs do **not** name hosting-repo rule paths; discover that repo’s baseline from its own docs when implementing. Specifically:

 - **Standing verify / review commands** — Do **not** paste the hosting repo’s normal lint/build/test (or equivalent) pre-review bar into § 7. § 7 captures what is **different for this PR** beyond that standing bar. Do **not** assume another hosting repo’s pipelines or copy baseline commands from this center doc.
 - **Local smoke curls when integration tests cover the same surface.** If § 6 Tests to write includes an integration test that exercises the new endpoint / handler / job, do not also list a `curl http://localhost:<port>/...` step in **Before deploy**. The integration test is the contract; a localhost curl is a strictly weaker version of it. List a local smoke curl only when there is no integration test (because the surface is hard to integration-test) or when the curl exercises a real external dependency the integration test mocks.
 - **Ship-chain and mission-protocol steps (binding).** Do **not** list steps in **`### Before deploy`** or **`### After deploy`** that duplicate work **`coding-session`** runs automatically on the mission dispatch ship chain. **Forbidden in § 7:** `plan-reconcile` / archive PR plan; pre-PR review; create PR; PR review; approve or merge PR; `git pull origin main` on hosting root; worktree setup / attach / cleanup; **`promote-submodule-pin`**; dispatch resolution / Squad Leader closure; generic "run the ship chain" or "follow mission protocol step N" rows. Actions agents perform on every ship pass belong in **`coding-session/SKILL.md`** — not in the PR plan checklist. **`plan-reconcile`** runs **inline on the active `coding-session` lane while the dispatch is still open** — **never** "when dispatch closes" or "after dispatch resolution" (dispatch closure ends all agent lanes). **After deploy** lists **PR-specific production verification only** (smoke, monitors, rollback triggers for **this change**).

 When applying these exclusions leaves a section empty (e.g. **Before deploy** with no PR-specific prep), write the section as a single italic line — *"None — covered by § 6 tests and the hosting repo’s standing pre-review checks (not duplicated here)."* — rather than leaving it blank.

 **Frontmatter capstone todo (`deploy-test-plan-verified`).** Every PR plan's YAML `todos:` list must include one entry **after** implementation todos, **before** `isProject:`:

 ```yaml
 todos:
 - id: deploy-test-plan-verified
 content: >-
 Mark done only when every Before-deploy and After-deploy step is checked
 (`[x]`) and the deploy section `**Status:**` reads `done` (walk via `deploy-walk`,
 or edit manually). Independent of PR merge; run inline `plan-reconcile` on the active
 `coding-session` lane while the dispatch is open when you want reconcile/archive after merges
 — not after dispatch resolution.
 status: pending
 ```

 In real files **`todos:` already exists** — append only the **new** list item (same indentation as sibling todos: two spaces before `-`, four before `content` / `status`, six before each `>-` continuation line) after the last implementation todo, before `isProject:`.

 - **Purpose** — Agents and developers see a single row that stays `pending` until the deploy checklist is fully verified, even when every § 7 box is already `[x]` on disk (e.g. if someone edited Markdown without running **`deploy-walk`**). The todo is the **capstone**: mark `done` only in sync with `**Status:**` `done`.
 - **Who flips it** — The **`deploy-walk`** protocol branch flips this todo from `pending` → `done` in the **same turn** as the `StrReplace` that sets `**Status:**` `deployed` → `done` after the last After-deploy checkbox (see that protocol branch's *Frontmatter capstone* subsection). If you close the walk manually (edit the plan file without `deploy-walk`), flip the todo yourself.
 - **`plan-reconcile` is not auto-triggered.** Finishing the deploy walk (or this todo) does **not** run `plan-reconcile` protocol branch. **`plan-reconcile`** reconciles **merged** PRs, archive candidates, and follow-ups triage — a different cadence. Run **`plan-reconcile` inline on the active `coding-session` lane** when linked PRs have merged and you want reconcile/archive — **before** Squad Leader **`mission_control_propose_dispatch_resolution`**. **Forbidden:** deferring reconcile to "when dispatch closes" (dispatch closure ends all agent lanes). See the **`plan-reconcile`** protocol branch *When to trigger* guardrail and **development-process.md** § *Plan reconcile triggers*.
8. **Caveats.** *Optional — omit if there are none.* Free-form bullets for exceptions, risks, or agent-relevant warnings (e.g. feature-flag dependencies, schema-migration timing, rollback caveats). The short-bullet rule does **not** apply here: bullets may be full sentences, since this section faces **a coding agent** (implementation + **fresh pre-PR reviewer agent session**) and **a reviewer agent** — **a coding agent** carries Caveats into the PR description's "Notes for the reviewer" field (GitHub UI label), and **a reviewer agent** needs the concern spelled out unambiguously. (This is the divergence from mode #1 / mode #2 Caveats, which are developer-only and do follow the short-bullet rule.)

Sections 1, 2, 3, 4, 6, 7, and 8 (when present) flow into the PR description that **a coding agent** has **a PR-creating agent** write — single concern → PR title and summary; Background → "Context"; Change scope → "What changed"; Reasoning → "Why this approach" and "Alternatives considered"; Tests to write → "Tests"; Deploy test plan → "Verification / deploy plan"; Caveats → "Notes for the reviewer" (for **a reviewer agent** and for a **fresh pre-PR reviewer agent session**). Section **5 (Repo rules impact)** is primarily for **coding + workspace rules** alignment; it may be summarized in the PR description optionally but its contract is to list **which** rule files to touch — and **those hosting-repo `.mdc` edits land with the code before merge** unless §5 explicitly defers them (see **Align hosting-repo rules before commit and push** above).

