// Submission Flow Integration Tests
// Tests the complete submission lifecycle: create, list, get, update, delete

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    testSql,
    createTestUser,
    generateTestToken,
    createTestStudent,
    createTestSubmission,
    cleanupTestTenant,
} from './setup';

describe('Submission Flow Integration Tests', () => {
    let testUser: any;
    let testToken: string;
    let testStudent: any;
    let testSubmission: any;

    beforeAll(async () => {
        // Create test user and student
        testUser = await createTestUser();
        testToken = generateTestToken(testUser.userId, testUser.tenantId);
        testStudent = await createTestStudent(testUser.tenantId);
    });

    afterAll(async () => {
        // Clean up all test data
        await cleanupTestTenant(testUser.tenantId);
    });

    describe('Create Submission', () => {
        it('should create a submission in the database', async () => {
            const submission = await createTestSubmission(
                testStudent.id,
                testUser.tenantId,
                'This is a test essay for integration testing.'
            );

            expect(submission).toBeDefined();
            expect(submission.id).toBeDefined();
            expect(submission.studentRef).toBe(testStudent.id);
            expect(submission.tenantId).toBe(testUser.tenantId);

            // Verify in database
            const [dbSubmission] = await testSql`
        SELECT * FROM grader.submissions WHERE submission_id = ${submission.id}
      `;

            expect(dbSubmission).toBeDefined();
            expect(dbSubmission.student_id).toBe(testStudent.id);
            expect(dbSubmission.tenant_id).toBe(testUser.tenantId);

            // Save for later tests
            testSubmission = submission;
        });

        it('should enforce tenant isolation', async () => {
            // Create another tenant
            const otherUser = await createTestUser();

            // Try to query the submission from the other tenant
            const results = await testSql`
        SELECT * FROM grader.submissions 
        WHERE submission_id = ${testSubmission.id} 
        AND tenant_id = ${otherUser.tenantId}
      `;

            expect(results).toHaveLength(0);

            // Cleanup
            await cleanupTestTenant(otherUser.tenantId);
        });
    });

    describe('List Submissions', () => {
        it('should list only submissions for the tenant', async () => {
            const submissions = await testSql`
        SELECT * FROM grader.submissions 
        WHERE tenant_id = ${testUser.tenantId}
        ORDER BY created_at DESC
      `;

            expect(submissions.length).toBeGreaterThan(0);
            expect(submissions.every((s: any) => s.tenant_id === testUser.tenantId)).toBe(true);
        });

        it('should not return submissions from other tenants', async () => {
            // Create another tenant with submission
            const otherUser = await createTestUser();
            const otherStudent = await createTestStudent(otherUser.tenantId);
            await createTestSubmission(otherStudent.id, otherUser.tenantId);

            // Query for original tenant
            const submissions = await testSql`
        SELECT * FROM grader.submissions 
        WHERE tenant_id = ${testUser.tenantId}
      `;

            // Should not include other tenant's submission
            expect(submissions.every((s: any) => s.tenant_id === testUser.tenantId)).toBe(true);

            // Cleanup
            await cleanupTestTenant(otherUser.tenantId);
        });
    });

    describe('Get Single Submission', () => {
        it('should retrieve a submission by ID', async () => {
            const [submission] = await testSql`
        SELECT * FROM grader.submissions 
        WHERE submission_id = ${testSubmission.id}
        AND tenant_id = ${testUser.tenantId}
      `;

            expect(submission).toBeDefined();
            expect(submission.submission_id).toBe(testSubmission.id);
            expect(submission.student_id).toBe(testStudent.id);
        });

        it('should return empty for non-existent submission', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const results = await testSql`
        SELECT * FROM grader.submissions 
        WHERE submission_id = ${fakeId}
        AND tenant_id = ${testUser.tenantId}
      `;

            expect(results).toHaveLength(0);
        });
    });

    describe('Update Submission', () => {
        it('should update teacher grade and feedback', async () => {
            const teacherGrade = 95;
            const teacherFeedback = 'Excellent work!';

            await testSql`
        UPDATE grader.submissions
        SET 
          teacher_grade = ${teacherGrade},
          teacher_feedback = ${teacherFeedback},
          updated_at = NOW()
        WHERE submission_id = ${testSubmission.id}
        AND tenant_id = ${testUser.tenantId}
      `;

            // Verify update
            const [updated] = await testSql`
        SELECT * FROM grader.submissions WHERE submission_id = ${testSubmission.id}
      `;

            expect(Number(updated.teacher_grade)).toBe(teacherGrade);
            expect(updated.teacher_feedback).toBe(teacherFeedback);
        });

        it('should not update submissions from other tenants', async () => {
            // Create another tenant
            const otherUser = await createTestUser();

            // Try to update original submission with other tenant ID
            const result = await testSql`
        UPDATE grader.submissions
        SET teacher_grade = 100
        WHERE submission_id = ${testSubmission.id}
        AND tenant_id = ${otherUser.tenantId}
        RETURNING *
      `;

            expect(result).toHaveLength(0);

            // Verify original submission unchanged
            const [original] = await testSql`
        SELECT teacher_grade FROM grader.submissions WHERE submission_id = ${testSubmission.id}
      `;
            const toDelete = await createTestSubmission(
                testStudent.id,
                testUser.tenantId
            );

            // Delete it
            await testSql`
        DELETE FROM grader.submissions 
        WHERE submission_id = ${toDelete.id}
        AND tenant_id = ${testUser.tenantId}
      `;

            // Verify deleted
            const results = await testSql`
        SELECT * FROM grader.submissions WHERE submission_id = ${toDelete.id}
      `;

            expect(results).toHaveLength(0);
        });

        it('should not delete submissions from other tenants', async () => {
            // Create another tenant
            const otherUser = await createTestUser();

            // Try to delete original submission with other tenant ID
            const result = await testSql`
        DELETE FROM grader.submissions
        WHERE submission_id = ${testSubmission.id}
        AND tenant_id = ${otherUser.tenantId}
        RETURNING *
      `;

            expect(result).toHaveLength(0);

            // Verify original submission still exists
            const [stillExists] = await testSql`
        SELECT * FROM grader.submissions WHERE submission_id = ${testSubmission.id}
      `;
            expect(stillExists).toBeDefined();

            // Cleanup
            await cleanupTestTenant(otherUser.tenantId);
        });
    });
});
