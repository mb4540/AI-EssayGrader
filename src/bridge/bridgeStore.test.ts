// Unit tests for bridge store (state management)
import { describe, it, expect, beforeEach } from 'vitest';
import { BridgeStore } from './bridgeStore';

describe('BridgeStore', () => {
  let store: BridgeStore;

  beforeEach(() => {
    store = new BridgeStore();
  });

  describe('Initial State', () => {
    it('should start locked', () => {
      expect(store.isLocked()).toBe(true);
    });

    it('should return null payload when locked', () => {
      expect(store.getPayload()).toBeNull();
    });

    it('should return empty students array when locked', () => {
      expect(store.getAllStudents()).toEqual([]);
    });
  });

  describe('Create New Bridge', () => {
    it('should create new bridge with metadata', async () => {
      await store.createNew('test-passphrase', {
        district: 'Test District',
        school: 'Test School',
        teacherName: 'Test Teacher',
      });

      expect(store.isLocked()).toBe(false);
      const payload = store.getPayload();
      expect(payload).not.toBeNull();
      expect(payload?.district).toBe('Test District');
      expect(payload?.school).toBe('Test School');
      expect(payload?.teacherName).toBe('Test Teacher');
      expect(payload?.roster).toEqual([]);
    });

    it('should create bridge without optional metadata', async () => {
      await store.createNew('test-passphrase', {});

      expect(store.isLocked()).toBe(false);
      const payload = store.getPayload();
      expect(payload).not.toBeNull();
      expect(payload?.roster).toEqual([]);
    });
  });

  describe('Add Student', () => {
    beforeEach(async () => {
      await store.createNew('test-pass', {});
    });

    it('should add student and generate UUID', () => {
      const student = store.addStudent('John Doe', 'S12345');

      expect(student.name).toBe('John Doe');
      expect(student.localId).toBe('S12345');
      expect(student.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(student.createdAt).toBeDefined();
      expect(student.updatedAt).toBeDefined();
    });

    it('should add student to roster', () => {
      store.addStudent('Jane Smith', 'S67890');

      const students = store.getAllStudents();
      expect(students).toHaveLength(1);
      expect(students[0].name).toBe('Jane Smith');
    });

    it('should prevent duplicate local IDs', () => {
      store.addStudent('Student 1', 'S001');

      expect(() => {
        store.addStudent('Student 2', 'S001');
      }).toThrow('Student with local ID "S001" already exists');
    });

    it('should allow different students with different IDs', () => {
      store.addStudent('Student 1', 'S001');
      store.addStudent('Student 2', 'S002');

      expect(store.getAllStudents()).toHaveLength(2);
    });

    it('should throw error when bridge is locked', () => {
      store.lock();

      expect(() => {
        store.addStudent('Test', 'S001');
      }).toThrow('Bridge is locked');
    });
  });

  describe('Update Student', () => {
    let studentUuid: string;

    beforeEach(async () => {
      await store.createNew('test-pass', {});
      const student = store.addStudent('Original Name', 'S001');
      studentUuid = student.uuid;
    });

    it('should update student name', async () => {
      // Wait 10ms to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = store.updateStudent(studentUuid, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.localId).toBe('S001');
      expect(updated.updatedAt).not.toBe(updated.createdAt);
    });

    it('should update student local ID', () => {
      const updated = store.updateStudent(studentUuid, { localId: 'S999' });

      expect(updated.name).toBe('Original Name');
      expect(updated.localId).toBe('S999');
    });

    it('should update both name and local ID', () => {
      const updated = store.updateStudent(studentUuid, {
        name: 'New Name',
        localId: 'S999',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.localId).toBe('S999');
    });

    it('should prevent duplicate local IDs on update', () => {
      store.addStudent('Another Student', 'S002');

      expect(() => {
        store.updateStudent(studentUuid, { localId: 'S002' });
      }).toThrow('Student with local ID "S002" already exists');
    });

    it('should throw error for non-existent UUID', () => {
      expect(() => {
        store.updateStudent('non-existent-uuid', { name: 'Test' });
      }).toThrow('Student with UUID "non-existent-uuid" not found');
    });
  });

  describe('Delete Student', () => {
    let studentUuid: string;

    beforeEach(async () => {
      await store.createNew('test-pass', {});
      const student = store.addStudent('Test Student', 'S001');
      studentUuid = student.uuid;
    });

    it('should delete student', () => {
      store.deleteStudent(studentUuid);

      expect(store.getAllStudents()).toHaveLength(0);
      expect(store.findByUuid(studentUuid)).toBeNull();
    });

    it('should throw error for non-existent UUID', () => {
      expect(() => {
        store.deleteStudent('non-existent-uuid');
      }).toThrow('Student with UUID "non-existent-uuid" not found');
    });
  });

  describe('Find Operations', () => {
    beforeEach(async () => {
      await store.createNew('test-pass', {});
      store.addStudent('John Doe', 'S001');
      store.addStudent('Jane Smith', 'S002');
      store.addStudent('John Smith', 'S003');
    });

    it('should find student by UUID', () => {
      const students = store.getAllStudents();
      const uuid = students[0].uuid;

      const found = store.findByUuid(uuid);
      expect(found).not.toBeNull();
      expect(found?.uuid).toBe(uuid);
    });

    it('should return null for non-existent UUID', () => {
      const found = store.findByUuid('non-existent');
      expect(found).toBeNull();
    });

    it('should find student by local ID', () => {
      const found = store.findByLocalId('S002');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Jane Smith');
      expect(found?.localId).toBe('S002');
    });

    it('should return null for non-existent local ID', () => {
      const found = store.findByLocalId('S999');
      expect(found).toBeNull();
    });

    it('should find students by name (partial match)', () => {
      const found = store.findByName('John');

      expect(found).toHaveLength(2);
      expect(found.map((s) => s.name)).toContain('John Doe');
      expect(found.map((s) => s.name)).toContain('John Smith');
    });

    it('should find students case-insensitively', () => {
      const found = store.findByName('john');

      expect(found).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      const found = store.findByName('Nonexistent');
      expect(found).toEqual([]);
    });
  });

  describe('CSV Import', () => {
    beforeEach(async () => {
      await store.createNew('test-pass', {});
    });

    it('should import students from CSV', async () => {
      const csv = `name,localId
John Doe,S001
Jane Smith,S002
Bob Johnson,S003`;

      const result = await store.importFromCsv(csv);

      expect(result.added).toBe(3);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(store.getAllStudents()).toHaveLength(3);
    });

    it('should skip header row', async () => {
      const csv = `Student Name,Student ID
John Doe,S001`;

      const result = await store.importFromCsv(csv);

      expect(result.added).toBe(1);
      expect(store.getAllStudents()[0].name).toBe('John Doe');
    });

    it('should update existing students', async () => {
      store.addStudent('Old Name', 'S001');

      const csv = `name,localId
New Name,S001`;

      const result = await store.importFromCsv(csv);

      expect(result.added).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(0);
      expect(store.findByLocalId('S001')?.name).toBe('New Name');
    });

    it('should skip unchanged students', async () => {
      store.addStudent('John Doe', 'S001');

      const csv = `name,localId
John Doe,S001`;

      const result = await store.importFromCsv(csv);

      expect(result.added).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const csv = `name,localId
John Doe,S001
,S002
Jane Smith,`;

      const result = await store.importFromCsv(csv);

      expect(result.added).toBe(1);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(3);
      expect(result.errors[1].row).toBe(4);
    });

    it('should ignore empty lines', async () => {
      const csv = `name,localId
John Doe,S001

Jane Smith,S002
`;

      const result = await store.importFromCsv(csv);

      expect(result.added).toBe(2);
    });
  });

  describe('Lock/Unlock', () => {
    it('should lock bridge', async () => {
      await store.createNew('test-pass', {});
      store.addStudent('Test', 'S001');

      store.lock();

      expect(store.isLocked()).toBe(true);
      expect(store.getPayload()).toBeNull();
      expect(store.getAllStudents()).toEqual([]);
    });

    it('should unlock bridge with encrypted data', async () => {
      // Create and export
      await store.createNew('test-pass', {
        district: 'Test District',
      });
      store.addStudent('John Doe', 'S001');
      const exported = await store.export();

      // Lock and create new store
      store.lock();
      const newStore = new BridgeStore();

      // Unlock with exported data
      await newStore.unlock(exported, 'test-pass');

      expect(newStore.isLocked()).toBe(false);
      expect(newStore.getPayload()?.district).toBe('Test District');
      expect(newStore.getAllStudents()).toHaveLength(1);
      expect(newStore.getAllStudents()[0].name).toBe('John Doe');
    });

    it('should fail to unlock with wrong passphrase', async () => {
      await store.createNew('correct-pass', {});
      const exported = await store.export();

      const newStore = new BridgeStore();
      await expect(
        newStore.unlock(exported, 'wrong-pass')
      ).rejects.toThrow();
    });
  });

  describe('Export', () => {
    it('should export encrypted bridge', async () => {
      await store.createNew('test-pass', {
        district: 'Test District',
      });
      store.addStudent('Test Student', 'S001');

      const exported = await store.export();

      expect(exported.version).toBe('1.0');
      expect(exported.ciphertextB64).toBeDefined();
      expect(exported.ivB64).toBeDefined();
      expect(exported.saltB64).toBeDefined();
      expect(exported.iterations).toBe(210000);
      expect(exported.hmacB64).toBeDefined();
    });

    it('should throw error when locked', async () => {
      await expect(store.export()).rejects.toThrow('Bridge is locked');
    });
  });
});
