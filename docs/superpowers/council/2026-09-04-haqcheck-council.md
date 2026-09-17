# LLM Council transcript — HaqCheck (2026-09-04)

Question: should a 1–4 student team build "HaqCheck" (Cedar-computed gig-worker welfare eligibility with cited rules) for WeMakeDevs × AWS First Commit, Sept 17–20 2026? Fallback: "ConsentLedger". Full framed question in the session scratchpad; summary of the brief is in §15 of the design spec.

## Advisor responses

**The Contrarian — REVISE.** Fatal flaw is dependency chaining: LLM-to-Cedar autoformalization, screenshot extraction, compressing actively litigated law into a few Cedar lines without a lawyer, and doing all of it live. The legal risk is worse than the OCR risk and a form fallback cannot fix it; a wrong verdict is misinformation to a precarious worker. The demo leans on one scripted disagreement between jurisdictions. Cedar itself is the right tool. Revise: keep the mechanism, reframe "verdict" as "eligibility estimate with cited clause, not legal advice" inside the UI, cut to one jurisdiction if the toggle is not solid by day 3.

**The First Principles Thinker — REVISE.** The rubric scores idea-tightness, AWS-centrality, one working feature, and the demo, not real-world impact. The defensible core is one sentence: the LLM never decides; Cedar does, and the verdict cites the exact rule. Cut OCR, localisation, and AgentCore Policy; form input from hour zero. Eligibility is structurally ABAC, so Cedar is real, not cosplay, if the pitch says so. Legal risk dissolves if you issue citations, not verdicts: "appeal a citation, not a vibe." Target Ship It.

**The Expansionist — APPROVE.** This is a general law-to-policy compiler; gig work is the wedge. Build the jurisdiction abstraction generically; the toggle is a platform primitive. The propose-then-verify loop is itself the product. AgentCore Policy is the story, not a stretch.

**The Outsider — REVISE.** A judge will not know what Cedar or a verifier is. The verifier checks syntax, not correctness; nobody in 3 minutes can distinguish "Cedar computed from the real rule" from "an LLM guessed and dressed it as Cedar." The named user (rider, cracked Android, patchy data) is not the demo user. Localisation is buried and will be cut first. Revise: cut the LLM compilation theatre, ship a hand-authored, versioned, cited ruleset, make the worker-facing explanation the star.

**The Executor — APPROVE with sequencing.** Hour 1 of day 1: hand-transcribe both rules into Cedar; that is the go/no-go. Never start with the LLM pipeline. Form input primary. Day 1 local Cedar verdicts; day 2 Lambda/API Gateway/DynamoDB and the toggle; day 3 Bedrock explanation; day 4 live compilation demo only if the system already works. The load-bearing demo prop is the policy diff and the determining policy ID. Legal mitigation is an on-screen disclaimer, not a blocker.

## Peer review (anonymised A–E; A=Executor, B=Outsider, C=Expansionist, D=Contrarian, E=First Principles)

All five reviewers named **E** strongest (rubric-first reasoning; verdict→citation reframe fixes demo, gimmick question, and legal risk at once) and **C** the biggest blind spot (scope expansion under a 4-day clock, no engagement with feasibility or legal harm).

What all five advisors missed, per the reviewers:
- Nobody proposed verifying the primary legal sources (Central Rules 2026 text, the Karnataka HC order) before the event, or consulting a labour-rights group; the legal facts in the brief were treated as ground truth.
- Cedar running locally is not legibly "AWS" to a judge; the Build It framing weakens "AWS at the core."
- Team skill risk: learning Cedar syntax in 4 days from zero.
- No rehearsal-failure contingency and no second demo case.
- PII exposure if real earnings screenshots were sent to Bedrock.
- Liability of publishing an "eligibility" tool on litigated law after the event.
- ConsentLedger was never seriously compared except by D.

## Chairman verdict

**Where the council agrees.** Cedar is the right engine, not a gimmick; the one-sentence differentiator is that the LLM never decides. Form input is primary. The legal risk is real and is best handled by product framing (citations, versioned rulebook, "estimate, not legal advice" in the UI) rather than a disclaimer slide. Ship It.

**Where the council clashes.** (1) LLM-to-Cedar compilation: product vs day-4 stretch vs cut. Ruling: shipped rulebook is hand-authored and reviewed; compilation is an honest drafting aid with human review, demoed only if it works. (2) Localisation: star vs cut. Ruling: keep EN + HI as a cheap off-critical-path call; Kannada if time.

**Blind spots the council caught.** Verify primary sources pre-event. Use Amazon Verified Permissions so the Cedar engine is unmistakably an AWS service. Rehearse two cases. Learn Cedar pre-event. Cutting screenshots removes the PII issue.

**Recommendation.** REVISE, then build HaqCheck as revised. Reject ConsentLedger as the primary; keep it only as the Day-1 go/no-go fallback because it reuses the same wiring.

**The one thing to do first.** Before Sept 17, obtain the two primary legal texts and write down the exact clauses and thresholds, while learning Cedar on toy policies. On Sept 17 hour 1, hand-transcribe those clauses into Cedar and run the boundary cases. Everything else waits on that.
