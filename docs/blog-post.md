# Cedar Decides. The LLM Just Talks.

A delivery rider on Swiggy in Bangalore is covered by 2 welfare laws right now, and neither one agrees with the other about when she qualifies.

The actual gap is narrower and weirder than most people assume: 2 live, competing rulebooks, and nothing sits between a worker and those rulebooks to say yes, no, or which one applies.

Here's the mess, concretely. The Social Security (Central) Rules, 2026, gazetted on 8 May 2026, set a 90-day work threshold on a single aggregator, enforced through e-Shram or Shram Suvidha registration. Work 90 days on one platform and you're in. Then on 4 July 2026, the Karnataka High Court, in an interim order from Justice M Nagaprasanna in *Internet and Mobile Association of India & Ors. v. State of Karnataka & Ors.*, ordered Swiggy, Zomato (Eternal Ltd on paper by then), Zepto, and Urban Company to pay into a separate state welfare fund under the Karnataka Platform-Based Gig Workers (Social Security and Welfare) Act, 2025. Same workers, 2 regimes, genuinely different tests, and they're in active legal tension right now. Not settled, not reconciled, just both live.

Go look at the apps that already exist for this. They're directories. Lists of schemes, links to government portals, PDFs of the Act. None of them tell you: given your platform, your city, your days worked, are you eligible, under which law, and here's the clause that says so. That's the product HaqCheck is: a verifier, not a directory.

## Cedar decides, the LLM only explains

Plenty of "AI for legal eligibility" projects quietly let a language model make the call and then dress it up with citations afterward. That's a liability generator wearing a helpful face.

HaqCheck doesn't do that. The decision comes from hand-authored Cedar policies, evaluated through Amazon Verified Permissions. I wrote every policy by hand: tagged with an `@id`, an `@source`, and a `@confidence`, each one checked against a real source before it shipped. There are 2 separate AVP policy stores: one Central-only, one Karnataka overlay that layers the state rules on top of Central. A backend call to `/evaluate` hits `IsAuthorized` per benefit with the worker's details as inline entities, and whatever comes back (ALLOW, DENY, and which policy ID actually fired) maps to one of 3 verdicts: Eligible, Not eligible, Not applicable. Every verdict carries the rule that decided it. Every case gets logged to DynamoDB along with the rulebook version that produced it, because these laws are moving targets and I wanted a paper trail I could point back to later. Run the rider from the opening through this and she gets one clean answer under Central, one under Karnataka, whichever actually applies to her platform and city, each one with a rule number attached instead of a shrug.

Only after Cedar has already decided does the LLM get involved. `/explain` runs on Bedrock Nova Lite through the Strands Agents SDK, and its only job is to take the verdict and the cited rule and say it back in plain English, Hindi, or Kannada. It doesn't get a vote. It can't override Cedar and it can't invent a new outcome. I gave it a digit guardrail: if it produces a number that isn't already sitting in the verdict payload, the output gets rejected. That one rule exists because the whole project falls apart the moment a model starts making up its own version of a 90-day threshold.

Decide first, with something auditable. Then let something that can talk explain it, never the other way round. I've taken to calling this verdict-then-voice, mostly because the digit guardrail only makes sense once you see the split.

The stack underneath is boring on purpose: Lambda, API Gateway as an HTTP API, DynamoDB, Bedrock, Amplify Hosting for the frontend. Everything scales to zero. Weekend cost stays under a dollar, not counting whatever the Bedrock calls run up. Criterion 2 of this hackathon's judging is literally labeled "Built on AWS: where you win or lose," and the organizers say outright that AWS belongs at the core of the project, not in the README. That's exactly why Cedar and AVP had to be the thing making the decision, not a service name bolted on to check a box. Every other piece of the stack exists to serve that one promise: verdict-then-voice, all the way down.

## The part that actually fought back

The Cedar and AVP wiring was mechanical once I understood the shape of it. What actually slowed me down was sourcing.

2 live legal regimes means 2 sets of citations, and neither one was sitting in a clean, obtainable primary document when I went looking. I couldn't get my hands on the exact gazette text for the Central Rules, so the 90-day rule is encoded from consistent reporting across Medianama, Business Standard, JSA, and Lexology, without the notification itself in hand. Same story with the Karnataka order: I don't have the case or writ petition number confirmed against the primary text, so it's encoded from BusinessToday, Bar & Bench, Medianama, and LiveLaw all agreeing on the same facts.

I had 2 options here. Pretend I'd verified the primary source, or say so honestly and tag it. I went with `@confidence("secondary-source")` right there in the policy annotation, on both regimes. It's the honest call, and it's still on my list to go find the actual gazette notification and the actual court order text before I'd call this finished. If I only get to fix one thing after submission, that's the one.

Then there was the frontend, which fought back more than I expected for something that isn't really the point of the project. The first pass was fine and forgettable, the kind of interface every AI coding tool reaches for by default unless you tell it not to. I pushed a full redesign after that, then looked at it again and started ripping out the tells: a colored border-left doing duty as a status stripe, box-shadow doing all the depth work. I ended up pulling in the design system from my own portfolio site instead: ink, paper, tangerine, Instrument Serif italic paired with Commissioner, one accent color used sparingly, no grey ramp, depth built from alpha and blur instead of shadows. Then a Lighthouse pass to get performance, accessibility, and best practices all sitting near the top on mobile, plus a few pieces of motion that actually mean something: a stamp animation when a verdict lands, a sliding toggle between jurisdictions, staggered reveals instead of everything popping in at once. None of that changes what the app decides. All of it changes whether anyone believes what it decided.

## Where it stands

The backend has 25 unit tests passing with no AWS needed, plus 15 live test cases run straight against the deployed AVP stores. What isn't done yet: the Amplify deployment and the demo video, both last on the list before submission. No hosted link to hand you today. If you're reading this before those land, that part's still coming.

I used Claude Code for planning, for a good chunk of the code, and for review, and I'm saying that plainly because the hackathon rules ask for it. What I didn't let it do is write the policies. Every Cedar rule was authored against a source I checked myself. The citation research ran over search, done by me, because a model guessing at what a plausible Indian labor rule might say is exactly the failure mode this whole project exists to prevent. The facts came first. The policies came after.

HaqCheck is a hackathon submission for WeMakeDevs × AWS Bharat Builds Tour, Stop 01, "First Commit," built over the 17-20 September 2026 weekend in Bangalore. It's an eligibility estimate with citations attached, not legal advice. If you're a gig worker trying to work out which welfare law actually covers you, please still go talk to someone whose job that actually is.
