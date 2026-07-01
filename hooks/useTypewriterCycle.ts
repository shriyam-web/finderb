import { useEffect, useState } from 'react';

type UseTypewriterCycleOptions = {
  typeDelayMs?: number;
  deleteDelayMs?: number;
  pauseMs?: number;
};

export function useTypewriterCycle(
  phrases: readonly string[],
  { typeDelayMs = 52, deleteDelayMs = 32, pauseMs = 2000 }: UseTypewriterCycleOptions = {},
) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0) return;

    const fullText = phrases[phraseIndex] ?? phrases[0];

    if (!isDeleting && displayText === fullText) {
      const pause = window.setTimeout(() => setIsDeleting(true), pauseMs);
      return () => window.clearTimeout(pause);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
      return;
    }

    const timeout = window.setTimeout(
      () => {
        if (isDeleting) {
          setDisplayText(fullText.slice(0, displayText.length - 1));
        } else {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }
      },
      isDeleting ? deleteDelayMs : typeDelayMs,
    );

    return () => window.clearTimeout(timeout);
  }, [phrases, phraseIndex, displayText, isDeleting, typeDelayMs, deleteDelayMs, pauseMs]);

  return displayText;
}
