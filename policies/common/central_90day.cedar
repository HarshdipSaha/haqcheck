@id("IN-SSR2026-90day")
@source("Social Security (Central) Rules, 2026 (gazetted 8 May 2026): a platform/gig worker registered on e-Shram (Shram Suvidha) who has worked at least 90 days with an aggregator in the preceding financial year is eligible for notified social-security benefits. Exact rule number not confirmed against the primary gazette text as of sync time; encoded from consistent secondary reporting (Medianama, Business Standard, JSA, Lexology, May 2026).")
@confidence("secondary-source")
permit(
  principal,
  action == HaqCheck::Action::"claim",
  resource == HaqCheck::Benefit::"central_social_security"
) when {
  principal.eshramRegistered &&
  principal.daysWorkedLast12m >= 90
};
