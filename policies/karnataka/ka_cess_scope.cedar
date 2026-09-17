@id("KA-HC-2026-cess-scope")
@source("Internet and Mobile Association of India (IAMAI) & Ors. v. State of Karnataka & Ors., Karnataka High Court, interim order dated 4 July 2026 (Justice M Nagaprasanna): directed Swiggy, Zomato (Eternal Ltd), Zepto and Urban Company to deposit the per-ride welfare fee under the Karnataka Platform-Based Gig Workers (Social Security and Welfare) Act, 2025 for workers engaged in Karnataka, pending final disposal. Case/WP number not confirmed against the primary order as of sync time; encoded from consistent secondary reporting (BusinessToday, Bar & Bench, Medianama, LiveLaw, July 2026).")
@confidence("secondary-source")
permit(
  principal,
  action == HaqCheck::Action::"claim",
  resource == HaqCheck::Benefit::"ka_welfare_fund"
) when {
  principal.state == "KA" &&
  principal.platforms.containsAny(["zomato", "swiggy", "zepto", "urban_company"])
};
