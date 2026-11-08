export function cleanRutInput(raw: string): string {
    return raw.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRutInput(raw: string): string {
    const cleaned = cleanRutInput(raw).slice(0, 9);
    if (cleaned.length <= 1) {
        return cleaned;
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    const dottedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${dottedBody}-${dv}`;
}

export function isValidRutSyntax(raw: string): boolean {
    const cleaned = cleanRutInput(raw);
    if (cleaned.length < 8 || cleaned.length > 9) {
        return false;
    }
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    return /^[1-9][0-9]{6,7}$/.test(body) && /^[0-9K]$/.test(dv);
}
