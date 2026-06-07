const LEGACY_JOB_ID_PATTERN = /Applied for Job ID: ([0-9a-f-]{36})/i;
const CANDIDATE_MESSAGE_SPLIT = /\n\nCandidate [Mm]essage: /;

export function buildJobApplicationMessage(jobTitle: string, candidateMessage?: string) {
  const msg = candidateMessage?.trim() || 'No message provided';
  return `Applied for: ${jobTitle}\n\nCandidate message: ${msg}`;
}

export function extractLegacyJobId(message: string | null | undefined): string | null {
  if (!message) return null;
  return message.match(LEGACY_JOB_ID_PATTERN)?.[1] ?? null;
}

export function extractCandidateMessage(message: string): string {
  const parts = message.split(CANDIDATE_MESSAGE_SPLIT);
  if (parts.length > 1) {
    return parts[1]?.trim() || 'No message provided';
  }
  return 'No message provided';
}

export function enrichLegacyJobLeadMessage(message: string, jobTitle: string): string {
  return buildJobApplicationMessage(jobTitle, extractCandidateMessage(message));
}

export function parseJobLeadDisplay(message: string | null | undefined) {
  if (!message) {
    return { jobTitle: null as string | null, candidateMessage: null as string | null };
  }

  const appliedFor = message.match(/^Applied for: (.+?)(?:\n\n|$)/i);
  if (appliedFor) {
    return {
      jobTitle: appliedFor[1].trim(),
      candidateMessage: extractCandidateMessage(message),
    };
  }

  const legacyJobId = extractLegacyJobId(message);
  if (legacyJobId) {
    return {
      jobTitle: null,
      candidateMessage: extractCandidateMessage(message),
    };
  }

  return { jobTitle: null, candidateMessage: message };
}
