import { useEffect, useState } from 'react';

export const OTP_RESEND_SECONDS = 90;

export function otpSendLabel(sent: boolean, waiting: boolean, seconds: number) {
  if (waiting) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return sent ? 'Resend' : 'Send OTP';
}

export function useOtpCooldown() {
  const [sentTo, setSentTo] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const markSent = (target: string) => {
    setSentTo(target);
    setSecondsLeft(OTP_RESEND_SECONDS);
  };

  const clearSent = () => {
    setSentTo('');
    setSecondsLeft(0);
  };

  const isSentTo = (target: string) => sentTo.length > 0 && sentTo === target;
  const isWaiting = (target: string) => isSentTo(target) && secondsLeft > 0;

  return { secondsLeft, markSent, clearSent, isSentTo, isWaiting };
}
