// Integration Test Setup and Utilities
// Shared utilities for integration tests using Neon development branch

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Use TEST_DATABASE_URL for integration tests, fallback to DATABASE_URL
const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDbUrl) {
    throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for integration tests');
}

export const testSql = neon(testDbUrl);

// JWT secret for test tokens
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Generate a unique test prefix for this test run
 */
export function generateTestPrefix(): string {
    return `test_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
    email?: string,
    password?: string,
    tenantName?: string
) {
    const testEmail = email || `${generateTestPrefix()}@test.com`;
    const testPassword = password || 'TestPass123!';
    const testTenant = tenantName || `Test Tenant ${randomBytes(4).toString('hex')}`;

    // Hash password
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Create tenant first
    const [tenant] = await testSql`
    INSERT INTO grader.tenants (tenant_name)
    VALUES (${testTenant})
    RETURNING tenant_id, tenant_name
  `;

    // Create user
    const [user] = await testSql`
    INSERT INTO grader.users (email, password_hash, tenant_id, full_name)
    VALUES (${testEmail}, ${passwordHash}, ${tenant.tenant_id}, 'Test User')
    RETURNING user_id, email, tenant_id
  `;

    return {
        userId: user.user_id,
        email: user.email,
        password: testPassword,
        tenantId: user.tenant_id,
        tenantName: tenant.tenant_name,
    };
}

/**
 * Generate a JWT token for a test user
 */
export function generateTestToken(userId: string, tenantId: string): string {
    return jwt.sign(
        {
            userId,
            tenantId,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

/**
 * Create a test student
 */
export async function createTestStudent(
    tenantId: string,
    studentName?: string
) {
    // Note: students table is FERPA compliant - no PII stored
    // Student names are stored in encrypted local bridge file only
    const [student] = await testSql`
    INSERT INTO grader.students (tenant_id)
    VALUES (${tenantId})
    RETURNING student_id, tenant_id
  `;

    return {
        id: student.student_id,
        studentName: studentName || 'Test Student', // For test purposes only
        tenantId: student.tenant_id,
    };
}

/**
 * Create a test assignment
 */
export async function createTestAssignment(
    tenantId: string,
    title?: string,
    criteria?: string
) {
    const assignmentTitle = title || `Test Assignment ${randomBytes(4).toString('hex')}`;
    const assignmentCriteria = criteria || 'Test grading criteria';

    const [assignment] = await testSql`
    INSERT INTO grader.assignments (title, teacher_criteria, tenant_id, total_points)
    VALUES (${assignmentTitle}, ${assignmentCriteria}, ${tenantId}, 100)
    RETURNING assignment_id, title, teacher_criteria, tenant_id
  `;

    return {
        id: assignment.assignment_id,
        title: assignment.title,
        criteria: assignment.teacher_criteria,
        tenantId: assignment.tenant_id,
    };
}

/**
 * Create a test submission
 */
export async function createTestSubmission(
    studentId: string,
    tenantId: string,
    verbatimText?: string
) {
    const text = verbatimText || 'This is a test essay for integration testing.';

    const [submission] = await testSql`
    INSERT INTO grader.submissions (
      student_id,
      verbatim_text,
      teacher_criteria,
      source_type,
      tenant_id
    )
    VALUES (
      ${studentId},
      ${text},
      'Test criteria',
      'text',
      ${tenantId}
    )
    RETURNING submission_id, student_id, verbatim_text, tenant_id
  `;

    return {
        id: submission.submission_id,
        studentRef: submission.student_id,
        verbatimText: submission.verbatim_text,
        tenantId: submission.tenant_id,
    };
}

/**
 * Clean up all test data for a specific tenant
 */
export async function cleanupTestTenant(tenantId: string) {
    try {
        // Delete in correct order due to foreign keys
        // Annotations are linked to submissions via submission_id
        await testSql`
      DELETE FROM grader.annotations 
      WHERE submission_id IN (
        SELECT submission_id FROM grader.submissions WHERE tenant_id = ${tenantId}
      )
    `;
        await testSql`DELETE FROM grader.submissions WHERE tenant_id = ${tenantId}`;
        await testSql`DELETE FROM grader.assignments WHERE tenant_id = ${tenantId}`;
        await testSql`DELETE FROM grader.students WHERE tenant_id = ${tenantId}`;
        await testSql`DELETE FROM grader.password_reset_tokens WHERE user_id IN (
      SELECT user_id FROM grader.users WHERE tenant_id = ${tenantId}
    )`;
        await testSql`DELETE FROM grader.users WHERE tenant_id = ${tenantId}`;
        await testSql`DELETE FROM grader.tenants WHERE tenant_id = ${tenantId}`;
    } catch (error) {
        console.error('Error cleaning up test tenant:', error);
        throw error;
    }
}

/**
 * Clean up test data by prefix (for older test data)
 */
export async function cleanupTestDataByPrefix(prefix: string = 'test_') {
    try {
        // Find test tenants
        const tenants = await testSql`
      SELECT tenant_id FROM grader.tenants 
      WHERE tenant_name LIKE ${prefix + '%'}
    `;

        // Clean up each tenant
        for (const tenant of tenants) {
            await cleanupTestTenant(tenant.tenant_id);
        }
    } catch (error) {
        console.error('Error cleaning up test data by prefix:', error);
        throw error;
    }
}

/**
 * Verify database connection
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
    try {
        const result = await testSql`SELECT 1 as connected`;
        return result[0]?.connected === 1;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}
