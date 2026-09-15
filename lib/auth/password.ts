import bcrypt from 'bcrypt';

const COST_FACTOR = 12;

/**
 * Hashes a plain text password using bcrypt.
 * The cost factor is intentionally set to 12 to balance security and performance,
 * taking enough time to deter brute-force attacks without degrading user experience.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, COST_FACTOR);
}

/**
 * Verifies a plain text password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}