import type { Pool } from 'pg';

import { IdempotencyKey, IdempotencyKeyGenerator } from './idempotency-key';

/**
 * Idempotency middleware for ensuring operations are only executed once
 */
export class IdempotencyMiddleware {
    constructor(private pool: Pool) {}

    /**
     * Execute an operation with idempotency protection
     */
    async execute<T>(
        key: string,
        operation: () => Promise<T>,
        ttlMinutes: number = 60
    ): Promise<T> {
        const client = await this.pool.connect();

        try {
            // Check if key exists
            const existingKey = await this.getKey(client, key);

            if (existingKey && !existingKey.isExpired()) {
                // Return cached response
                return existingKey.responseData as T;
            }

            // Execute operation
            const result = await operation();

            // Store the result
            const idempotencyKey = new IdempotencyKey(
                key,
                crypto.randomUUID(),
                ttlMinutes,
                result as Record<string, unknown>
            );

            await this.storeKey(client, idempotencyKey);

            return result;
        } finally {
            client.release();
        }
    }

    /**
     * Check if a key exists and is valid
     */
    async isKeyValid(key: string): Promise<boolean> {
        const client = await this.pool.connect();

        try {
            const existingKey = await this.getKey(client, key);
            return existingKey !== null && !existingKey.isExpired();
        } finally {
            client.release();
        }
    }

    /**
     * Get cached response for a key
     */
    async getCachedResponse<T>(key: string): Promise<T | null> {
        const client = await this.pool.connect();

        try {
            const existingKey = await this.getKey(client, key);

            if (existingKey && !existingKey.isExpired()) {
                return existingKey.responseData as T;
            }

            return undefined;
        } finally {
            client.release();
        }
    }

    /**
     * Store a key in the database
     */
    private async storeKey(client: unknown, key: IdempotencyKey): Promise<void> {
        await client.query(
            `INSERT INTO eventsourcing.idempotency_keys 
       (key, request_id, response_data, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key) DO UPDATE SET
       request_id = EXCLUDED.request_id,
       response_data = EXCLUDED.response_data,
       created_at = EXCLUDED.created_at,
       expires_at = EXCLUDED.expires_at`,
            [
                key.key,
                key.requestId,
                JSON.stringify(key.responseData),
                key.createdAt,
                key.expiresAt,
            ]
        );
    }

    /**
     * Get a key from the database
     */
    private async getKey(client: unknown, key: string): Promise<IdempotencyKey | null> {
        const result = await client.query(
            `SELECT key, request_id, response_data, created_at, expires_at
       FROM eventsourcing.idempotency_keys
       WHERE key = $1`,
            [key]
        );

        if (result.rows.length === 0) {
            return undefined;
        }

        const row = result.rows[0];
        return IdempotencyKey.deserialize({
            key: row.key,
            requestId: row.request_id,
            responseData: row.response_data,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
        });
    }

    /**
     * Clean up expired keys
     */
    async cleanupExpiredKeys(): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query(
                `DELETE FROM eventsourcing.idempotency_keys 
         WHERE expires_at < NOW()`
            );
        } finally {
            client.release();
        }
    }

    /**
     * Generate key from HTTP request
     */
    static generateFromRequest(
        method: string,
        path: string,
        body?: Record<string, unknown>,
        headers?: Record<string, string>
    ): string {
        return IdempotencyKeyGenerator.generate(method, path, body, headers);
    }

    /**
     * Generate key from operation
     */
    static generateFromOperation(
        operation: string,
        tenantId: string,
        resourceId?: string
    ): string {
        return IdempotencyKeyGenerator.generateForOperation(operation, tenantId, resourceId);
    }
}
