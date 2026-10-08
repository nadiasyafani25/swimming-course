const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_PATTERN = /^[0-9+\-\s()]+$/;
const PHONE_MIN_DIGITS = 9;
const PHONE_MAX_DIGITS = 15;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function countPhoneDigits(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

export function isValidPhone(phone: string): boolean {
  const value = phone.trim();
  if (!value || !PHONE_ALLOWED_PATTERN.test(value)) return false;
  const digits = countPhoneDigits(value);
  return digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
}
