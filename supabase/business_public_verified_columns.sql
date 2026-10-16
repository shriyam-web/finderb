-- Additive grant so the consumer app can read contact-verified flags
-- without 400ing the whole Business select (see security_lockdown.sql).
grant select (
  "emailVerified",
  "mobileVerified",
  "whatsappVerified"
) on public."Business" to anon, authenticated;
