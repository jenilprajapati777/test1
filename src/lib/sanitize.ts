/**
 * Sanitizes input text:
 * 1. Strips HTML tags (e.g. <script>, <b>, etc.)
 * 2. Strips ASCII control characters (0x00 - 0x1F except newline, and 0x7F)
 * 3. Trims whitespace
 * 4. Caps maximum length
 */
export function sanitizeText(input: unknown, maxLength = 280): string {
  if (typeof input !== 'string') return '';

  // 1. Strip HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');

  // 2. Strip non-printable ASCII control characters (0-31 except \n \r, and 127)
  cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  // 4. Cap max length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

export function validateNonEmptyText(input: unknown, maxLength = 280): { valid: boolean; text: string; error?: string } {
  const sanitized = sanitizeText(input, maxLength);
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, text: '', error: 'Cannot be empty' };
  }
  return { valid: true, text: sanitized };
}
