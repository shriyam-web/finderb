/** Users who skipped mobile verification; kept in memory so the prompt returns on the next app launch. */
const skippedUsers = new Set<string>();

export function skipMobileGate(userId: string | null | undefined) {
  if (userId) skippedUsers.add(userId);
}

export function isMobileGateSkipped(userId: string | null | undefined) {
  return Boolean(userId && skippedUsers.has(userId));
}
