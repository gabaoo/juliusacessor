// Shared instance-name rules — used by the onboarding form (frontend) and the
// createInstance server function (backend) so validation is consistent.

/** Pattern the backend requires: only unaccented letters, numbers, hyphen and underscore. */
export const INSTANCE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const INSTANCE_NAME_ERROR =
  "O nome da instância deve conter apenas letras sem acento, números e hífens, sem espaços.";

/**
 * Sanitize a raw instance name: strips accents, lowercases, and converts spaces
 * and any invalid character into a hyphen. Keeps a trailing hyphen so it can be
 * used live while the user is still typing.
 */
export function sanitizeInstanceName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-") // spaces / invalid chars -> hyphen
    .replace(/-{2,}/g, "-") // collapse repeated hyphens
    .replace(/^-+/, ""); // no leading hyphen
}

/** Returns an error message if the (already sanitized) name is invalid, else null. */
export function validateInstanceName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return "O nome da instância deve ter ao menos 3 caracteres.";
  if (trimmed.length > 60) return "O nome da instância é muito longo (máx. 60 caracteres).";
  if (!INSTANCE_NAME_REGEX.test(trimmed)) return INSTANCE_NAME_ERROR;
  return null;
}
