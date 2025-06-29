export class PasswordHasher {
    private static hashingIterations = 100_000
    private static outputLength = 256
    private static algorithmName = "PBKDF2"
    private static hashType = "SHA-256"
    private static keyFormat = "raw" as const
    private static keyUsages: KeyUsage[] = ["deriveBits"]

    static async hash(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));

        const keyMaterial = await crypto.subtle.importKey(
            this.keyFormat,
            encoder.encode(password),
            { name: this.algorithmName },
            false,
            this.keyUsages,
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: this.algorithmName,
                salt,
                iterations: this.hashingIterations,
                hash: this.hashType,
            },
            keyMaterial,
            this.outputLength,
        );

        const saltB64 = btoa(String.fromCharCode(...salt));
        const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

        return `${saltB64}.${hashB64}`;
    }

    static async verify(password: string, hashedPassword: string): Promise<boolean> {
        const encoder = new TextEncoder();
        const [saltB64, hashB64] = hashedPassword.split(".");

        if (!saltB64 || !hashB64) return false;

        const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
        const storedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));

        const keyMaterial = await crypto.subtle.importKey(
            this.keyFormat,
            encoder.encode(password),
            { name: this.algorithmName },
            false,
            this.keyUsages,
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: this.algorithmName,
                salt,
                iterations: this.hashingIterations,
                hash: this.hashType,
            },
            keyMaterial,
            this.outputLength,
        );

        const derivedHash = new Uint8Array(derivedBits);

        return (
            derivedHash.length === storedHash.length &&
            derivedHash.every((b, i) => b === storedHash[i])
        );
    }
}
