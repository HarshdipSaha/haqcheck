@id("KA-HC-2026-out-of-state")
@source("Same order: Internet and Mobile Association of India (IAMAI) & Ors. v. State of Karnataka & Ors., Karnataka High Court, interim order dated 4 July 2026 - the welfare fund is created under the Karnataka Platform-Based Gig Workers (Social Security and Welfare) Act, 2025 and covers workers engaged in Karnataka only.")
@confidence("secondary-source")
// Redundant with the permit's state check on purpose: a firing forbid is
// returned in determiningPolicies, so the engine itself says "Not applicable"
// with a citation instead of the UI guessing.
forbid(
  principal,
  action == HaqCheck::Action::"claim",
  resource == HaqCheck::Benefit::"ka_welfare_fund"
) unless {
  principal.state == "KA"
};
