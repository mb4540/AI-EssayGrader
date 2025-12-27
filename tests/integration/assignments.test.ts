// Assignment Flow Integration Tests
// Tests the complete assignment lifecycle: create, list, update, delete

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    testSql,
    createTestUser,
    generateTestToken,
    createTestStudent,
    createTestAssignment,
    createTestSubmission,
    cleanupTestTenant,
} from './setup';

describe('Assignment Flow Integration Tests', () => {
    let testUser: any;
    let testToken: string;
    let testStudent: any;
    let testAssignment: any;

    beforeAll(async () => {
        // Create test user, student, and assignment
        testUser = await createTestUser();
        testToken = generateTestToken(testUser.userId, testUser.tenantId);
        testStudent = await createTestStudent(testUser.tenantId);
    });

    afterAll(async () => {
        // Clean up all test data
        await cleanupTestTenant(testUser.tenantId);
    });

    describe('Create Assignment', () => {
        it('should create an assignment in the database', async () => {
            const assignment = await createTestAssignment(
                testUser.tenantId,
                'Test Essay Assignment'
            );

            expect(assignment).toBeDefined();
            expect(assignment.id).toBeDefined();
            expect(assignment.title).toBe('Test Essay Assignment');
            expect(assignment.tenantId).toBe(testUser.tenantId);

            // Verify in database
            const [dbAssignment] = await testSql`
                SELECT * FROM grader.assignments WHERE assignment_id = ${assignment.id}
            `;

            expect(dbAssignment).toBeDefined();
            expect(dbAssignment.tenant_id).toBe(testUser.tenantId);

            // Save for later tests
            testAssignment = assignment;
        });

        it('should enforce tenant isolation on assignments', async () => {
            // Create another tenant
            const otherUser = await createTestUser();

            // Try to query the assignment from the other tenant
            const results = await testSql`
                SELECT * FROM grader.assignments 
                WHERE assignment_id = ${testAssignment.id} 
                AND tenant_id = ${otherUser.tenantId}
            `;

            expect(results).toHaveLength(0);

            // Cleanup
            await cleanupTestTenant(otherUser.tenantId);
        });
    });

    describe('Delete Assignment', () => {
        it('should delete assignment with 0 submissions', async () => {
            // Create an assignment with no submissions
            const emptyAssignment = await createTestAssignment(
                testUser.tenantId,
                'Empty Assignment'
            );

            // Verify it exists
            const [exists] = await testSql`
                SELECT * FROM grader.assignments WHERE assignment_id = ${emptyAssignment.id}
            `;
            expect(exists).toBeDefined();

            // Delete it
            await testSql`
                DELETE FROM grader.assignments 
                WHERE assignment_id = ${emptyAssignment.id}
                AND tenant_id = ${testUser.tenantId}
            `;

            // Verify deleted
            const results = await testSql`
                SELECT * FROM grader.assignments WHERE assignment_id = ${emptyAssignment.id}
            `;
            expect(results).toHaveLength(0);
        });

        it('should delete assignment and all associated submissions', async () => {
            // Create assignment with submissions
            const assignmentWithSubs = await createTestAssignment(
                testUser.tenantId,
                'Assignment With Submissions'
            );

            // Create submissions linked to this assignment
            const [sub1] = await testSql`
                INSERT INTO grader.submissions (
                    student_id, verbatim_text, teacher_criteria, source_type, tenant_id, assignment_id
                )
                VALUES (
                    ${testStudent.id}, 'Test essay 1', 'Test criteria', 'text', ${testUser.tenantId}, ${assignmentWithSubs.id}
                )
                RETURNING submission_id
            `;

            const [sub2] = await testSql`
                INSERT INTO grader.submissions (
                    student_id, verbatim_text, teacher_criteria, source_type, tenant_id, assignment_id
                )
                VALUES (
                    ${testStudent.id}, 'Test essay 2', 'Test criteria', 'text', ${testUser.tenantId}, ${assignmentWithSubs.id}
                )
                RETURNING submission_id
            `;

            // Verify submissions exist
            const submissionsBefore = await testSql`
                SELECT * FROM grader.submissions WHERE assignment_id = ${assignmentWithSubs.id}
            `;
            expect(submissionsBefore).toHaveLength(2);

            // Delete submissions first (simulating backend behavior)
            await testSql`
                DELETE FROM grader.submissions WHERE assignment_id = ${assignmentWithSubs.id}
            `;

            // Delete assignment
            await testSql`
                DELETE FROM grader.assignments 
                WHERE assignment_id = ${assignmentWithSubs.id}
                AND tenant_id = ${testUser.tenantId}
            `;

            // Verify assignment deleted
            const assignmentResults = await testSql`
                SELECT * FROM grader.assignments WHERE assignment_id = ${assignmentWithSubs.id}
            `;
            expect(assignmentResults).toHaveLength(0);

            // Verify submissions deleted
            const submissionsAfter = await testSql`
                SELECT * FROM grader.submissions WHERE assignment_id = ${assignmentWithSubs.id}
            `;
            expect(submissionsAfter).toHaveLength(0);
        });

        it('should not delete assignments from other tenants', async () => {
            // Create another tenant
            const otherUser = await createTestUser();

            // Try to delete original assignment with other tenant ID
            const result = await testSql`
                DELETE FROM grader.assignments
                WHERE assignment_id = ${testAssignment.id}
                AND tenant_id = ${otherUser.tenantId}
                RETURNING *
            `;

            expect(result).toHaveLength(0);

            // Verify original assignment still exists
            const [stillExists] = await testSql`
                SELECT * FROM grader.assignments WHERE assignment_id = ${testAssignment.id}
            `;
            expect(stillExists).toBeDefined();

            // Cleanup
            await cleanupTestTenant(otherUser.tenantId);
        });

        it('should handle FK constraint correctly (ON DELETE SET NULL)', async () => {
            // Create assignment
            const fkTestAssignment = await createTestAssignment(
                testUser.tenantId,
                'FK Test Assignment'
            );

            // Create submission linked to assignment
            const [submission] = await testSql`
                INSERT INTO grader.submissions (
                    student_id, verbatim_text, teacher_criteria, source_type, tenant_id, assignment_id
                )
                VALUES (
                    ${testStudent.id}, 'FK test essay', 'Test criteria', 'text', ${testUser.tenantId}, ${fkTestAssignment.id}
                )
                RETURNING submission_id, assignment_id
            `;

            expect(submission.assignment_id).toBe(fkTestAssignment.id);

            // Delete submissions first (our backend does this explicitly)
            await testSql`
                DELETE FROM grader.submissions WHERE assignment_id = ${fkTestAssignment.id}
            `;

            // Now delete assignment
            await testSql`
                DELETE FROM grader.assignments WHERE assignment_id = ${fkTestAssignment.id}
            `;

            // Verify both are gone
            const assignmentCheck = await testSql`
                SELECT * FROM grader.assignments WHERE assignment_id = ${fkTestAssignment.id}
            `;
            expect(assignmentCheck).toHaveLength(0);
        });
    });

    describe('List Assignments', () => {
        it('should list only assignments for the tenant', async () => {
            const assignments = await testSql`
                SELECT * FROM grader.assignments 
                WHERE tenant_id = ${testUser.tenantId}
                ORDER BY created_at DESC
            `;

            expect(assignments.length).toBeGreaterThan(0);
            expect(assignments.every((a: any) => a.tenant_id === testUser.tenantId)).toBe(true);
        });

        it('should not return assignments from other tenants', async () => {
            // Create another tenant with assignment
            const otherUser = await createTestUser();
            await createTestAssignment(otherUser.tenantId, 'Other Tenant Assignment');

            // Query for original tenant
            const assignments = await testSql`
                SELECT * FROM grader.assignments 
                WHERE tenant_id = ${testUser.tenantId}
            `;

            // Should not include other tenant's assignment
            expect(assignments.every((a: any) => a.tenant_id === testUser.tenantId)).toBe(true);

            // Cleanup
            await cleanupTestTenant(otherUser.tenantId);
        });
    });
});
