# Bharat Builds Tour (WeMakeDevs × AWS Builder Center) — Understanding Doc

> Understanding only. No ideation, no plan. Compiled 2026-09-04 from https://www.wemakedevs.org/aws and its sub-pages (Playwright), plus web search for context on AWS Builder Center Student Rewards.

---

## 1. What this is

**Bharat Builds Tour** is "India's largest hackathon series for students", run by **WeMakeDevs** in collaboration with **AWS Builder Center**. It is a **six-city, six-stop hybrid hackathon tour** across India running **September to December 2026**. Each stop is a separate hackathon with its own theme, deadlines and prizes, all under one shared rulebook.

Tagline: *"A learning-by-building tour for university students, run with the people who built the cloud. Ship something worth putting on your resume, win from a prize pool worth ₹1 crore, and get fast-tracked into interviews at Amazon."*

Key hooks:
- **Prize pool worth ₹1 crore** across the tour, in **gadgets and cloud credits** (not cash).
- **Fast-track Amazon interviews** for top projects from **pre-final year (batch of 2028)** and **final year (batch of 2027)** students. Screening round is skipped; the project stands in for it.
- Every stop is **hybrid**: in-person at the venue city (limited seats) **or** online from anywhere in India. Both are judged on the **same problem statement, same criteria, same panel, same prizes**.
- **Completely free** to join.

---

## 2. Tour structure

| Stop | Name | Dates | Online | In-person |
|---|---|---|---|---|
| 01 | **First Commit** | Sept 17–20, 2026 | Sept 17–20 (Thu–Sun), anywhere in India | Sept 19, **Polaris School of Technology, Bangalore, Karnataka** |
| 02–06 | "Bharat Builds, city still to be announced" | TBA | TBA | TBA |

- Cities are revealed **one at a time**. Everyone registered for the tour hears first.
- **One tour registration covers all six stops**; you then **check in** to each hackathon individually as it opens.
- You can participate in **every** stop.

---

## 3. Who can join (eligibility)

- **University students across India**, aged **18 or over**.
- Must have **two accounts**:
  1. A **WeMakeDevs account** (wemakedevs.org sign-up), used to register and check in.
  2. An **AWS Builder Center profile** with **verified university enrollment** (via SheerID). Your entry is checked against this profile at every stop.
- **Student verification is mandatory for scoring**: "no entry is scored at any stop until your university enrollment is verified on AWS Builder Center." Site advises doing it right after registering.
- Tour organizers, judges, AWS and WeMakeDevs staff may attend but **cannot win prizes**.
- Fast-track interviews are additionally restricted to **2028 (pre-final) and 2027 (final year)** graduating batches.

---

## 4. Teams

- **Solo or teams of up to 4.**
- Each member **registers individually** under their own account; a captain cannot register the team.
- **One submission per team**, **one team per person per stop**.
- **Mixed teams allowed**: some members in person, some online.

---

## 5. Stop 01 — "First Commit" (the one that's live now)

**Registered count at time of capture: 2,281.** Countdown showed ~13 days to start (from Sept 4).

**Format:** four days.

| Day | What happens (from schedule page) |
|---|---|
| Thu Sept 17 | **Kickoff.** "The clock starts, online, from anywhere in India. Teams form, repos get made." |
| Fri Sept 18 | **Build.** "A full day of it, with AWS mentors on call for the parts that fight back." |
| Sat Sept 19 | **Bangalore opens.** In-person venue (Polaris School of Technology) launches; online continues. |
| Sun Sept 20 | **Demos.** "Three minutes each, on the call, and the weekend closes." |

> ⚠️ Exact hours are **not yet published**: "The hours are being finalised: the kickoff call, mentor sessions, and the deadline the clock stops on. They land on this page first." Check https://www.wemakedevs.org/aws/first-commit/schedule closer to the date.

**Workshops run the week before** the event (week of ~Sept 10–16) for people new to AWS.

### 5.1 Theme
**Open.** "Bring the problem. We'll bring the shelf. The theme is open. Build something real, something yours. What matters is that it works and you can show it."

### 5.2 Tracks — you do NOT pick one when entering
"Nothing to pick when you enter. Build It and Ship It are decided by what your project turns out to be, and Best UI is open to both."

| Track | What it means | Stack the judges expect | AWS account? |
|---|---|---|---|
| **Build It** | Build **locally** with the open-source AWS stack. "No account, no card, no bill." | **Strands Agents SDK** (agents, on local models), **PartyRock** (AI apps in the browser), **Cedar** (authorization as policy), **SAM CLI + LocalStack** (serverless on localhost), **OpenSearch, Firecracker, Corretto** ("the rest of it") | **No** |
| **Ship It** | **Deploy live on AWS and hand over a URL.** "Free credits cover the weekend, and the architecture is part of the score." | **Lambda, API Gateway, DynamoDB, S3** (scales to zero), **Amazon Bedrock** (foundation models), **Amplify Hosting, App Runner** (a URL in minutes), **Cognito, EventBridge, Step Functions** (the plumbing) | **Yes** (debit/RuPay OK, ~₹2 verification charge) |

### 5.3 Prizes (First Commit)

| Prize | Who | What | Notes |
|---|---|---|---|
| **Build It grand prize** | Winning team | **"Announcing soon" + $5,000 in AWS credits** | Credits, not cash |
| **Ship It grand prize** | Winning team | **"Announcing soon" + $5,000 in AWS credits** | Credits, not cash |
| **Best UI** (judged, open to both tracks) | **Every member of the team** | **Apple iPad** | "The best-designed project of the event: the one that is a pleasure to use, and not only a pleasure to describe." Judged on design and usability. |
| **Best Blog** (open to everyone) | One writer | **Amazon Alexa** | Write up what you built (problem, stack, what fought back). **Publish on AWS Builder Center** and **link it in your submission**. |
| **Tour swag** (open to everyone) | Ten participants | **Swag boxes** (tour kit) | Post about what you're building **while you build**, **tag WeMakeDevs**. Ten best posts win. |

- Total AWS credits across the two grand prizes: **$10,000**.
- The grand prize gadgets are "being finalised. They land on this page first, and everyone registered is told the same day."

### 5.4 Per-participant perks (First Commit)
- **$100 in AWS credits per participant**, on top of the normal free-tier credits for a new AWS account. Codes issued to registered participants; "redemption opens with registration".
- Access to AWS Builder Center **hands-on workshops** (hundreds of step-by-step labs), **free 8-hour sandboxes** (no own AWS account needed), **curated student learning paths** via Builder ID, and the **Toolbox** (SDKs, OSS projects, language resources).

### 5.5 Suggested idea directions (site says "none of these are briefs")
1. An agent that reads a confusing document and explains it: an electricity bill, a rental agreement, a syllabus.
2. A tool that automates the thing you do by hand every single week.
3. An app your hostel, your class, or your family group chat actually needs.
4. A local-language interface for something that only works in English.
5. A policy engine that decides who can access what, built on Cedar.
6. An offline-first app that survives bad wifi instead of waiting for it.

Framing: "They're the kind of small, real problem that wins this thing."

### 5.6 Judging criteria (First Commit) — "Four things, and the second one decides most of it."

| # | Criterion | What they say |
|---|---|---|
| 1 | **The idea** | "The theme is open, so the problem is yours to find. **A tiny problem solved well beats a big one solved vaguely.**" |
| 2 | **Built on AWS** — *"WHERE YOU WIN OR LOSE"* | Build It judged on the open-source stack (Strands, Cedar, SAM Local, PartyRock, OpenSearch). Ship It judged on the platform: **the services you chose, the architecture, the cost decisions**. "**AWS belongs at the core of the project and not in the README.**" |
| 3 | **The execution** | "Does it work? Not perfect, not polished. Working. **One feature that runs beats five that almost do.**" |
| 4 | **The demo** | "**Three minutes** to show what it does, who it is for, and where AWS fits. Practise it, because it counts." |

Additional judging notes:
- "We judge what you built, not what you spent." Local and deployed projects scored with the same care.
- **Cloud usage counts only in Ship It**, where architecture and cost decisions are part of the work.
- Best UI is judged on design and usability.
- Panel decision is **final**; scores are **not published or discussed**.

### 5.7 Submission (First Commit)
Three things, submitted **once per team** through the stop's submission form **before the deadline**:
1. **Public repository**
2. **Demo video, 2–3 minutes**
3. **Short writeup**: the problem, what you built, how AWS is used (and **name any AI coding tools used**)

- "A late submission isn't scored, whatever the reason."
- "Anything you can't demo doesn't count" — features that exist only in the writeup don't score.
- Optional extras: Builder Center blog link (Best Blog), social posts tagged WeMakeDevs (swag).

---

## 6. Shared tour rulebook (applies to all six stops)

Source: https://www.wemakedevs.org/aws/rules

**What you build**
- **The clock rule governs everything**: work starts when the stop opens and ends at the published deadline. "Everything below follows from it."
- **Prior work does not qualify.** Rewriting an old project doesn't make it eligible. Repo history that doesn't match the event window = disqualification.
- Pre-event **learning and planning are encouraged**; only project work must wait.
- Open-source libraries, frameworks, APIs, boilerplate and templates are **allowed**.
- **AI coding tools are allowed** but must be **disclosed in the writeup**.
- Credit all non-original work with proper licensing.
- **AWS must be demonstrably integrated**, shown in the demo. "AWS belongs in the project, not in the writeup."
- **You keep your IP.** WeMakeDevs and AWS may showcase the project and team names.

**Judging / disqualification**
- Same criteria, same panel for venue and online.
- Disqualifiers: plagiarism, misrepresented prior work, repository history mismatch.
- Winners announced on the stop page and by email to registered details.

**Conduct**
- WeMakeDevs Code of Conduct (https://www.wemakedevs.org/coc) applies online and in person.
- Harassment, cheating, or abuse of mentors/volunteers → immediate removal, no appeal.
- Venue rules and staff instructions are binding.

**Closing advice from the rules page:** "Ask before the clock starts rather than after. We would far rather answer a question than disqualify a project." Contact: contact@wemakedevs.org

---

## 7. Amazon fast-track interview — how it works and the fine print

**Flow:** Build (ship a project at any stop) → Shortlist (panel picks top projects) → Interview (straight to Amazon, screening round skipped).

- For **internship and full-time roles** via **Amazon's University Talent Acquisition Team**.
- Only **pre-final year (2028)** and **final year (2027)** students.
- Eligibility verified against **registration details + verified Builder Center profile**.
- **Prize shortlisting and interview forwarding are separate decisions.**

**Terms (Section 08 of rules):**
1. **No guarantee of employment** — an interview is not an offer.
2. Subject to **business requirements** (open roles, team capacity).
3. Must be currently enrolled with the specified expected graduation year, meet Amazon's minimum criteria, no active disciplinary action.
4. Panel selection is **discretionary and final**; no correspondence about evaluation.
5. Must be used within the communicated **timeframe**; unclaimed opportunities expire.
6. **No visa sponsorship, relocation, or compensation commitment** implied.
7. Amazon may **modify, suspend or withdraw** without notice.
8. Participation = **consent to share** submissions and personal info with Amazon recruitment.
9. **Non-transferable** — applies only to named individuals on the selected team.

---

## 8. What every participant gets ("What you carry home") — free at every stop, online or offline

- **Live workshops** with AWS experts (in the room and on stream)
- **Mentors on call** — office hours with AWS Solutions Architects all weekend
- **AWS credits** to build on real services
- **AWS Builder Center** community membership
- **WeMakeDevs certificate** of participation
- **WeMakeDevs skill badges**, earned stop after stop
- **Tour swag** (T-shirt) — **in-person attendees only**
- **Showcase**: standout projects from every city get a mention in the official WeMakeDevs wrap-up blog post

---

## 9. AWS Builder Center — "home base" and the Student Rewards program

The tour is effectively a funnel into AWS Builder Center (builder.aws.com). Two mandatory steps:

1. **Create your Builder Center profile** (link on site: https://bit.ly/abc-login) — two minutes, free, no credit card.
2. **Verify you're a student** (https://bit.ly/abc-verify) — via **SheerID**, on the same profile. Fill in profile (photo + About section).

**Student Rewards (up to $579 value)** — this is a general AWS program launched Aug 2026 (AWS committed $500M+ globally), not tour-specific, but the tour leans on it:

| Reward | Value | Unlock condition |
|---|---|---|
| 12 months **AWS Skill Builder Premium** (900+ courses, labs, exam prep, game-based learning) | $449 | Immediately on verification + completed profile |
| **AWS credits** | $10 | 7 badges |
| **AWS credits** | $20 more ($30 total) | 14 badges |
| **Foundational AWS certification exam voucher** | $100 | 21 badges |

Badges are earned by engaging on Builder Center: **publish articles, comment on others' posts, keep showing up**. Claim at https://bit.ly/abc-rewards.

Note: this ties directly into the **Best Blog** prize (publish your writeup on Builder Center) — doing so also earns badges toward the rewards.

---

## 10. Registration flow (as understood)

1. Create a **WeMakeDevs account** at wemakedevs.org (sign-up link: https://www.wemakedevs.org/sign-up?next=%2Faws%2Ffirst-commit%3Fresume%3Dregister).
2. **Register for the tour** on https://www.wemakedevs.org/aws (one-time; covers all six stops).
3. **Check in** to First Commit on https://www.wemakedevs.org/aws/first-commit.
4. Create **AWS Builder Center profile** and **verify student status** (mandatory for scoring).
5. Claim the **$100 AWS credit code** issued to registered participants (needed only for Ship It; new AWS account accepts debit/RuPay, ~₹2 verification).
6. Each teammate does steps 1–5 individually. Team formation happens at kickoff (Sept 17).
7. Optionally attend the **pre-event workshops** the week before.

---

## 11. Key dates (as of 2026-09-04)

| Date | Event |
|---|---|
| Now | Registration open; 2,281 registered |
| ~Sept 10–16 | Pre-event AWS workshops (exact times TBA) |
| **Thu Sept 17** | **Clock starts** (online kickoff; teams form, repos created) |
| Fri Sept 18 | Build day, mentors on call |
| **Sat Sept 19** | **In-person day, Bangalore** (Polaris School of Technology); online continues |
| **Sun Sept 20** | **Demos (3 min each, on call) and close** — submission deadline falls here, exact hour TBA |
| After | Winners announced on stop page + email; grand-prize gadgets announced "soon" |
| Sept–Dec 2026 | Stops 02–06 revealed one at a time |

---

## 12. Things that are still TBA / unknown

- Exact kickoff time, mentor session times, and **the submission deadline hour** (Sept 20).
- The **grand prize gadgets** for Build It and Ship It (only the $5,000 credits are confirmed).
- Cities and dates for stops 02–06.
- Whether the in-person day has its own separate agenda/judging slot vs. the Sunday online demos (site implies everyone demos Sunday on the call).
- Whether "one team per person per stop" allows a different team at a different stop (implied yes).

---

## 13. Reading between the lines — what the organizers are signalling

- **AWS-centrality is the deciding factor.** Criterion 2 is labelled "where you win or lose". A great app with AWS bolted on loses to a modest app where an AWS service is load-bearing.
- **Small and working beats big and vague.** Repeated three times in different words (idea, execution, demo).
- **The demo is scored**, not just the code. Three minutes, rehearsed, covering: what it does, who it's for, where AWS fits.
- **Ship It is judged on architecture and cost decisions**, so a serverless "scales to zero" design (Lambda + DynamoDB + S3 + API Gateway, Bedrock for the model) is exactly what they list.
- **Build It is judged on the open-source AWS stack**: Strands Agents SDK, Cedar, SAM Local/LocalStack, PartyRock, OpenSearch. Cedar appears in both the stack list *and* the idea list — it's being pushed.
- **Best UI is a real, separate, team-wide prize** (iPads for everyone) and is open regardless of track.
- There are **cheap side prizes** for effort outside the code: Builder Center blog post (Alexa), social posts tagged WeMakeDevs (swag).
- **Repo history is audited.** Start the repo on/after Sept 17; keep commit history honest; disclose AI tools.
- The tour's real business goal is **onboarding students onto AWS Builder Center** — every gate (registration, scoring, rewards) routes through it.

---

## 14. Source URLs

- Tour landing: https://www.wemakedevs.org/aws
- Tour rules + Amazon terms: https://www.wemakedevs.org/aws/rules
- First Commit overview: https://www.wemakedevs.org/aws/first-commit
- First Commit schedule: https://www.wemakedevs.org/aws/first-commit/schedule
- First Commit rules: https://www.wemakedevs.org/aws/first-commit/rules
- Venue: https://polariscampus.com/
- Builder Center workshops: https://builder.aws.com/build/workshops
- Builder Center sandboxes: https://builder.aws.com/workshops
- Builder Center toolbox: https://builder.aws.com/build/tools
- Builder Center profile: https://bit.ly/abc-login · verify: https://bit.ly/abc-verify · rewards: https://bit.ly/abc-rewards
- WeMakeDevs hackathons list: https://www.wemakedevs.org/hackathons
- Code of Conduct: https://www.wemakedevs.org/coc
- Community: Discord https://discord.gg/wemakedevs · WhatsApp channel https://whatsapp.com/channel/0029Va4vHhJ5Ejxvi1qEBs1F · X https://x.com/WeMakeDevs
- AWS Student Rewards background: https://www.aboutamazon.com/news/aws/aws-student-rewards-free-cloud-ai-training
- Contact: contact@wemakedevs.org
