/**
 * Chilean RUT validation, normalization, and formatting utilities (Módulo 11).
 */

/**
 * Strips dots, spaces, and hyphens, returning uppercase digits + verifier char (e.g. "123456789" or "12345678K").
 */
export function cleanRut(rawRut: string): string {
    return rawRut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Computes the expected Módulo 11 check digit ('0'-'9' or 'K') for a numeric RUT body.
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
 * Validates a Chilean RUT string (supports with or without dots/hyphen) using Módulo 11.
 */
export function isValidRut(rawRut: string): boolean {
    if (!rawRut || typeof rawRut !== 'string') {
        return false;
    }

    const trimmed = rawRut.trim();
    if (!/^[0-9]{1,2}(\.?[0-9]{3}){1,2}-?[0-9kK]$/.test(trimmed)) {
        return false;
    }

    const cleaned = cleanRut(trimmed);
    if (cleaned.length < 7 || cleaned.length > 9) {
        return false;
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    if (!/^[1-9][0-9]*$/.test(body)) {
        return false;
    }

    return computeRutCheckDigit(body) === dv;
}

/**
 * Formats a RUT into canonical dotted representation (e.g., "12.345.678-5").
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
 * Returns the canonical hyphenated RUT without dots (e.g., "12345678-5") for comparisons and hashing.
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
