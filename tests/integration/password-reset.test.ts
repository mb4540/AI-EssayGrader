// Password Reset Flow Integration Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    testSql,
    createTestUser,
    generateTestToken,
    createTestStudent,
    createTestSubmission,
    cleanupTestTenant,
} from './setup';
import crypto from 'crypto';

describe('Password Reset Flow Integration Tests', () => {
    let testUser: any;
    let testStudent: any;
    let testSubmission: any;

    beforeAll(async () => {
        testUser = await createTestUser();
        testStudent = await createTestStudent(testUser.tenantId);
        testSubmission = await createTestSubmission(testStudent.id, testUser.tenantId);
    });

    afterAll(async () => {
        await cleanupTestTenant(testUser.tenantId);
    });

    it('should create a password reset token for a user', async () => {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Insert token
        const [inserted] = await testSql`
      INSERT INTO grader.password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${testUser.userId}, ${tokenHash}, ${expiresAt})
      RETURNING reset_token_id, user_id, token_hash, expires_at
    `;

        expect(inserted).toBeDefined();
        expect(inserted.user_id).toBe(testUser.userId);
        // Verify token can be retrieved by hash
        const [found] = await testSql`
      SELECT * FROM grader.password_reset_tokens WHERE token_hash = ${tokenHash}
    `;
        expect(found).toBeDefined();
        expect(found.user_id).toBe(testUser.userId);
    });

    it('should invalidate token after use', async () => {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Insert token
        await testSql`
      INSERT INTO grader.password_reset_tokens (user_id, token_hash, expires_at)
      VALUES (${testUser.userId}, ${tokenHash}, ${expiresAt})
    `;

        // Simulate using token: mark used_at
        const usedAt = new Date();
        await testSql`
      UPDATE grader.password_reset_tokens SET used_at = ${usedAt}
      WHERE token_hash = ${tokenHash}
    `;

        // Token should no longer be considered valid (used_at not null)
        const [stillValid] = await testSql`
      SELECT * FROM grader.password_reset_tokens WHERE token_hash = ${tokenHash} AND used_at IS NULL
    `;
        expect(stillValid).toBeUndefined();
    });
});
