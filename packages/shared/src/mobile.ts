import { z } from 'zod';

export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const mobileSchema = z
  .string()
  .trim()
  .regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number');

/** Keeps only digits and trims to 10 characters — use on every mobile input field. */
export function normalizeMobileInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function maskMobile(mobile: string): string {
  if (mobile.length < 6) return '••••••';
  return `${mobile.slice(0, 2)}•••••${mobile.slice(-3)}`;
}
