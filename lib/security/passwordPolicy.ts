/** Client-safe password rules — no Node crypto imports. */

export const PASSWORD_MIN_LENGTH_USER = 8;
export const PASSWORD_MIN_LENGTH_MERCHANT = 6;
export const PASSWORD_MAX_LENGTH = 128;

export function validatePasswordLength(
  password: string,
  minLength: number
): { ok: true } | { ok: false; error: string } {
  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { ok: false, error: `Password must be at least ${minLength} characters` };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    };
  }

  return { ok: true };
}

export function validateChangePasswordFields(input: {
  newPassword: string;
  confirmPassword: string;
  minLength?: number;
}): string | null {
  const minLength = input.minLength ?? PASSWORD_MIN_LENGTH_USER;

  const newPasswordCheck = validatePasswordLength(input.newPassword, minLength);
  if (!newPasswordCheck.ok) return newPasswordCheck.error;

  if (!input.confirmPassword.trim()) {
    return 'Please confirm your new password.';
  }

  if (input.newPassword !== input.confirmPassword) {
    return 'New password and confirmation do not match.';
  }

  return null;
}
