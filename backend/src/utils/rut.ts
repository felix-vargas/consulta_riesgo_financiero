/**
 * Chilean RUT validation, normalization, and formatting utilities.
 */

/**
 * Strips dots, spaces, and hyphens, returning uppercase digits + verifier char (e.g. "123456789" or "12345678K").
 */
export function cleanRut(rawRut: string): string {
    return rawRut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Computes the Módulo 11 check digit ('0'-'9' or 'K') for a numeric RUT body.
 */
export function computeRutCheckDigit(bodyDigits: string): string {
    let sum = 0;
    let multiplier = 2;

    for (let i = bodyDigits.length - 1; i >= 0; i--) {
        sum += Number(bodyDigits[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);
    if (remainder === 11) {
        return '0';
    }
    if (remainder === 10) {
        return 'K';
    }
    return String(remainder);
}

/**
 * Checks whether a structurally valid RUT also satisfies the strict mathematical Módulo 11 check digit.
 */
export function hasValidMod11CheckDigit(rawRut: string): boolean {
    if (!isValidRut(rawRut)) {
        return false;
    }
    const cleaned = cleanRut(rawRut);
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return computeRutCheckDigit(body) === dv;
}

/**
 * Validates that a string has a valid Chilean RUT structure (7 to 8 digits + check digit 0-9 or K,
 * with or without dots/hyphen, e.g. "12.345.678-9", "12345678-9", "76.543.210-3").
 */
export function isValidRut(rawRut: string): boolean {
    if (!rawRut || typeof rawRut !== 'string') {
        return false;
    }

    const trimmed = rawRut.trim();
    if (!/^[0-9]{1,2}(\.?[0-9]{3}){2}-?[0-9kK]$|^[0-9]{7,8}-?[0-9kK]$/.test(trimmed)) {
        return false;
    }

    const cleaned = cleanRut(trimmed);
    if (cleaned.length < 8 || cleaned.length > 9) {
        return false;
    }

    const body = cleaned.slice(0, -1);
    return /^[1-9][0-9]{6,7}$/.test(body);
}

/**
 * Formats a RUT into canonical dotted representation (e.g., "12.345.678-9").
 */
export function formatRut(rawRut: string): string {
    const cleaned = cleanRut(rawRut);
    if (cleaned.length < 2) {
        return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    const dottedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${dottedBody}-${dv}`;
}

/**
 * Returns the canonical hyphenated RUT without dots (e.g., "12345678-9") for comparisons and deterministic hashing.
 */
export function normalizeRut(rawRut: string): string {
    const cleaned = cleanRut(rawRut);
    if (cleaned.length < 2) {
        return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return `${body}-${dv}`;
}
