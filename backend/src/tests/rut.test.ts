import { describe, expect, it } from 'vitest';
import {
    cleanRut,
    computeRutCheckDigit,
    formatRut,
    hasValidMod11CheckDigit,
    isValidRut,
    normalizeRut,
} from '../utils/rut.js';

describe('Chilean RUT utilities', () => {
    it('validates Chilean RUT formats with and without dots', () => {
        expect(isValidRut('12.345.678-9')).toBe(true);
        expect(isValidRut('12345678-9')).toBe(true);
        expect(isValidRut('12.345.678-5')).toBe(true);
        expect(isValidRut('76.543.210-3')).toBe(true);
        expect(isValidRut('11.111.111-1')).toBe(true);
        expect(isValidRut('6.490.504-K')).toBe(true);
        expect(isValidRut('6490504-k')).toBe(true);
    });

    it('rejects malformed RUT strings', () => {
        expect(isValidRut('abc-d')).toBe(false);
        expect(isValidRut('123-4')).toBe(false);
        expect(isValidRut('12.345.678-Z')).toBe(false);
        expect(isValidRut('')).toBe(false);
    });

    it('normalizes, formats, and checks Módulo 11 accurately', () => {
        expect(cleanRut('12.345.678-k')).toBe('12345678K');
        expect(normalizeRut('12.345.678-9')).toBe('12345678-9');
        expect(normalizeRut('123456789')).toBe('12345678-9');
        expect(formatRut('12345678-9')).toBe('12.345.678-9');
        expect(formatRut('6490504k')).toBe('6.490.504-K');
        expect(computeRutCheckDigit('12345678')).toBe('5');
        expect(hasValidMod11CheckDigit('12.345.678-5')).toBe(true);
        expect(hasValidMod11CheckDigit('6.490.504-K')).toBe(true);
    });
});
