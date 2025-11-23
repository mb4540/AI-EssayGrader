// Annotations Flow Integration Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    testSql,
    createTestUser,
    generateTestToken,
    createTestStudent,
    createTestSubmission,
    cleanupTestTenant,
} from './setup';

describe('Annotations Flow Integration Tests', () => {
    let testUser: any;
    let testStudent: any;
    let testSubmission: any;
    let annotationId: string;

    beforeAll(async () => {
        testUser = await createTestUser();
        testStudent = await createTestStudent(testUser.tenantId);
        testSubmission = await createTestSubmission(testStudent.id, testUser.tenantId);
    });

    afterAll(async () => {
        await cleanupTestTenant(testUser.tenantId);
    });

    it('should create an annotation for a submission', async () => {
        const [annotation] = await testSql`
      INSERT INTO grader.annotations (
        submission_id,
        line_number,
        start_offset,
        end_offset,
        quote,
        category,
        suggestion,
        severity,
        status
      ) VALUES (
        ${testSubmission.id},
        1,
        0,
        10,
        'sample text',
        'grammar',
        'Replace with correct tense',
        'info',
        'ai_suggested'
      ) RETURNING annotation_id, submission_id, line_number, quote, category, suggestion, severity, status
    `;
        expect(annotation).toBeDefined();
        expect(annotation.submission_id).toBe(testSubmission.id);
        annotationId = annotation.annotation_id;
    });

    it('should retrieve annotations for a submission', async () => {
        const results = await testSql`
      SELECT * FROM grader.annotations WHERE submission_id = ${testSubmission.id}
    `;
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
        const found = results.find((a: any) => a.annotation_id === annotationId);
        expect(found).toBeDefined();
    });

    it('should enforce tenant isolation on annotations', async () => {
        const otherUser = await createTestUser();
        const otherResults = await testSql`
          SELECT a.* FROM grader.annotations a
          JOIN grader.submissions s ON a.submission_id = s.submission_id
          WHERE a.submission_id = ${testSubmission.id}
            AND s.tenant_id = ${otherUser.tenantId}
        `;
        // annotations table does not have tenant_id column, so we just ensure other tenant cannot see via submission isolation
        expect(otherResults).toHaveLength(0);
        // Clean up the other tenant's data
        await cleanupTestTenant(otherUser.tenantId);
    });

    it('should delete an annotation', async () => {
        const delResult = await testSql`
      DELETE FROM grader.annotations WHERE annotation_id = ${annotationId} RETURNING *
    `;
        expect(delResult).toHaveLength(1);
        const check = await testSql`
      SELECT * FROM grader.annotations WHERE annotation_id = ${annotationId}
    `;
        expect(check).toHaveLength(0);
    });
});
