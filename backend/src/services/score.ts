import crypto from 'node:crypto';
import { HttpException } from '../middlewares/exceptionHandler.js';
import type { ScoreResponse } from '../models/types.js';
import { formatRut, isValidRut, normalizeRut } from '../utils/rut.js';

export class ScoreService {
    /**
     * Computes a deterministic credit risk score in the inclusive range [0, 100]
     * from a canonical normalized RUT using SHA-256 hashing.
     *
     * Same RUT (regardless of dots/lowercase 'k') -> identical score.
     * Different RUTs -> uniformly distributed scores across [0, 100].
     */
    public calculateDeterministicScore(rawRut: string): number {
        const canonicalRut = normalizeRut(rawRut);
        const digest = crypto
            .createHash('sha256')
            .update(`riesgo-financiero:v31:${canonicalRut}`)
            .digest();

        const uint32 = digest.readUInt32BE(0);
        return uint32 % 101;
    }

    /**
     * Validates the requested RUT and builds the score response payload.
     */
    public getScoreByRut(rawRut: string): ScoreResponse {
        if (!isValidRut(rawRut)) {
            throw new HttpException(
                400,
                `El RUT "${rawRut}" no tiene un formato o dígito verificador chileno válido.`,
                'INVALID_RUT'
            );
        }

        const formattedRut = formatRut(rawRut);
        const score = this.calculateDeterministicScore(rawRut);
        const fecha = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

        return {
            rut: formattedRut,
            score,
            fecha,
        };
    }
}

export const scoreService = new ScoreService();
