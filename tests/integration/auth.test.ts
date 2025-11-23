// Authentication Flow Integration Tests
// Tests user registration, login, and token validation

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    testSql,
    createTestUser,
    generateTestToken,
    cleanupTestTenant,
    generateTestPrefix,
} from './setup';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Authentication Flow Integration Tests', () => {
    let testTenantId: string;

    afterAll(async () => {
        // Clean up any remaining test data
        if (testTenantId) {
            await cleanupTestTenant(testTenantId);
        }
    });

    describe('User Registration', () => {
        it('should create a new user with hashed password', async () => {
            const email = `${generateTestPrefix()}@test.com`;
            const password = 'TestPassword123!';
            const tenantName = `Test Tenant ${Date.now()}`;

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create tenant
            const [tenant] = await testSql`
        INSERT INTO grader.tenants (tenant_name)
        VALUES (${tenantName})
        RETURNING tenant_id, tenant_name
      `;

            testTenantId = tenant.tenant_id;

            // Create user
            const [user] = await testSql`
        INSERT INTO grader.users (email, password_hash, tenant_id, full_name)
        VALUES (${email}, ${passwordHash}, ${tenant.tenant_id}, 'Test User')
        RETURNING user_id, email, tenant_id
      `;

            expect(user).toBeDefined();
            expect(user.email).toBe(email);
            expect(user.tenant_id).toBe(tenant.tenant_id);

            // Verify password is hashed
            const [dbUser] = await testSql`
        SELECT password_hash FROM grader.users WHERE user_id = ${user.user_id}
      `;
            expect(dbUser.password_hash).not.toBe(password);
            expect(dbUser.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
        });

        it('should not allow duplicate emails', async () => {
            const email = `${generateTestPrefix()}@test.com`;
            const user = await createTestUser(email);
            testTenantId = user.tenantId;

            // Try to create another user with same email
            await expect(async () => {
                await testSql`
          INSERT INTO grader.users (email, password_hash, tenant_id)
          VALUES (${email}, 'hash', ${user.tenantId})
        `;
            }).rejects.toThrow();
        });
    });

    describe('User Login', () => {
        it('should validate correct credentials', async () => {
            const password = 'TestPassword123!';
            const user = await createTestUser(undefined, password);
            testTenantId = user.tenantId;

            // Get user from database
            const [dbUser] = await testSql`
        SELECT user_id, email, password_hash, tenant_id
        FROM grader.users
        WHERE email = ${user.email}
      `;

            // Verify password
            const isValid = await bcrypt.compare(password, dbUser.password_hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const correctPassword = 'TestPassword123!';
            const wrongPassword = 'WrongPassword456!';
            const user = await createTestUser(undefined, correctPassword);
            testTenantId = user.tenantId;

            // Get user from database
            const [dbUser] = await testSql`
        SELECT password_hash FROM grader.users WHERE email = ${user.email}
      `;

            // Verify wrong password fails
            const isValid = await bcrypt.compare(wrongPassword, dbUser.password_hash);
            expect(isValid).toBe(false);
        });

        it('should return empty for non-existent user', async () => {
            const results = await testSql`
        SELECT * FROM grader.users WHERE email = 'nonexistent@test.com'
      `;

            expect(results).toHaveLength(0);
        });
    });

    describe('Token Generation and Validation', () => {
        it('should generate valid JWT token', () => {
            const userId = 'test-user-id';
            const tenantId = 'test-tenant-id';

            const token = generateTestToken(userId, tenantId);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            expect(decoded.userId).toBe(userId);
            expect(decoded.tenantId).toBe(tenantId);
        });

        it('should reject invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => {
                jwt.verify(invalidToken, JWT_SECRET);
            }).toThrow();
        });

        it('should reject expired token', () => {
            const userId = 'test-user-id';
            const tenantId = 'test-tenant-id';

            // Create token that expires immediately
            const expiredToken = jwt.sign(
                { userId, tenantId },
                JWT_SECRET,
                { expiresIn: '0s' }
            );

            // Wait a moment
            setTimeout(() => {
                expect(() => {
                    jwt.verify(expiredToken, JWT_SECRET);
                }).toThrow();
            }, 100);
        });

        it('should extract user and tenant from token', () => {
            const userId = 'test-user-123';
            const tenantId = 'test-tenant-456';

            const token = generateTestToken(userId, tenantId);
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            expect(decoded.userId).toBe(userId);
            expect(decoded.tenantId).toBe(tenantId);
            expect(decoded.exp).toBeDefined(); // Expiration time
        });
    });

    describe('Tenant Isolation', () => {
        it('should create separate tenants for different users', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            expect(user1.tenantId).not.toBe(user2.tenantId);

            // Cleanup
            await cleanupTestTenant(user1.tenantId);
            await cleanupTestTenant(user2.tenantId);
        });

        it('should not allow access to other tenant data', async () => {
            const user1 = await createTestUser();
            const user2 = await createTestUser();

            // Query user1 with user2's tenant
            const results = await testSql`
        SELECT * FROM grader.users 
        WHERE user_id = ${user1.userId}
        AND tenant_id = ${user2.tenantId}
      `;

            expect(results).toHaveLength(0);

            // Cleanup
            await cleanupTestTenant(user1.tenantId);
            await cleanupTestTenant(user2.tenantId);
        });
    });
});
