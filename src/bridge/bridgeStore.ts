// Bridge Store - In-memory state management for student identity bridge
// Handles CRUD operations, CSV import, and encryption/decryption

import { BridgeEntry, BridgePayload, EncryptedBridgeFile, ImportResult } from './bridgeTypes';
import { encryptJson, decryptJson, generateHmac, verifyHmac, arrayBufferToBase64, base64ToUint8Array } from './crypto';
import { newUuid } from './uuid';

const BRIDGE_VERSION = '1.0';

export class BridgeStore {
  private payload: BridgePayload | null = null;
  private passphrase: string | null = null;
  private locked: boolean = true;

  /**
   * Check if bridge is locked
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Get current payload (only when unlocked)
   */
  getPayload(): BridgePayload | null {
    if (this.locked) return null;
    return this.payload;
  }

  /**
   * Create a new bridge
   */
  async createNew(
    passphrase: string,
    metadata: { district?: string; school?: string; teacherName?: string }
  ): Promise<void> {
    this.payload = {
      district: metadata.district,
      school: metadata.school,
      teacherName: metadata.teacherName,
      roster: [],
    };
    this.passphrase = passphrase;
    this.locked = false;
  }

  /**
   * Unlock an existing bridge
   */
  async unlock(encryptedFile: EncryptedBridgeFile, passphrase: string): Promise<void> {
    try {
      // Decrypt the payload
      const ciphertext = base64ToUint8Array(encryptedFile.ciphertextB64);
      const iv = base64ToUint8Array(encryptedFile.ivB64);
      const salt = base64ToUint8Array(encryptedFile.saltB64);

      const decrypted = await decryptJson(
        ciphertext,
        iv,
        salt,
        passphrase,
        encryptedFile.iterations
      );

      // Verify HMAC
      const payloadString = JSON.stringify((decrypted as any).payload);
      const isValid = await verifyHmac(payloadString, encryptedFile.hmacB64, passphrase);

      if (!isValid) {
        throw new Error('HMAC verification failed - file may be tampered');
      }

      this.payload = (decrypted as any).payload;
      this.passphrase = passphrase;
      this.locked = false;
    } catch (err) {
      throw new Error('Failed to unlock bridge: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  /**
   * Lock the bridge (zeroize memory)
   */
  lock(): void {
    this.payload = null;
    this.passphrase = null;
    this.locked = true;
  }

  /**
   * Export encrypted bridge file
   */
  async export(): Promise<EncryptedBridgeFile> {
    if (this.locked || !this.payload || !this.passphrase) {
      throw new Error('Bridge is locked');
    }

    const dataToEncrypt = {
      version: BRIDGE_VERSION,
      createdAt: new Date().toISOString(),
      payload: this.payload,
    };

    const { ciphertext, iv, salt, iterations } = await encryptJson(
      dataToEncrypt,
      this.passphrase
    );

    // Generate HMAC for integrity
    const payloadString = JSON.stringify(this.payload);
    const hmac = await generateHmac(payloadString, this.passphrase);

    return {
      version: BRIDGE_VERSION,
      ciphertextB64: arrayBufferToBase64(ciphertext),
      ivB64: arrayBufferToBase64(iv),
      saltB64: arrayBufferToBase64(salt),
      iterations,
      hmacB64: hmac,
    };
  }

  /**
   * Add a student to the roster
   */
  addStudent(name: string, localId: string): BridgeEntry {
    if (this.locked || !this.payload) {
      throw new Error('Bridge is locked');
    }

    // Check for duplicates
    const existing = this.payload.roster.find(
      (entry) => entry.localId === localId
    );

    if (existing) {
      throw new Error(`Student with local ID "${localId}" already exists`);
    }

    const now = new Date().toISOString();
    const entry: BridgeEntry = {
      uuid: newUuid(),
      localId,
      name,
      createdAt: now,
      updatedAt: now,
    };

    this.payload.roster.push(entry);
    return entry;
  }

  /**
   * Update a student
   */
  updateStudent(uuid: string, updates: { name?: string; localId?: string }): BridgeEntry {
    if (this.locked || !this.payload) {
      throw new Error('Bridge is locked');
    }

    const entry = this.payload.roster.find((e) => e.uuid === uuid);
    if (!entry) {
      throw new Error(`Student with UUID "${uuid}" not found`);
    }

    // Check for duplicate localId if changing
    if (updates.localId && updates.localId !== entry.localId) {
      const duplicate = this.payload.roster.find(
        (e) => e.localId === updates.localId && e.uuid !== uuid
      );
      if (duplicate) {
        throw new Error(`Student with local ID "${updates.localId}" already exists`);
      }
    }

    if (updates.name) entry.name = updates.name;
    if (updates.localId) entry.localId = updates.localId;
    entry.updatedAt = new Date().toISOString();

    return entry;
  }

  /**
   * Delete a student
   */
  deleteStudent(uuid: string): void {
    if (this.locked || !this.payload) {
      throw new Error('Bridge is locked');
    }

    const index = this.payload.roster.findIndex((e) => e.uuid === uuid);
    if (index === -1) {
      throw new Error(`Student with UUID "${uuid}" not found`);
    }

    this.payload.roster.splice(index, 1);
  }

  /**
   * Find student by UUID
   */
  findByUuid(uuid: string): BridgeEntry | null {
    if (this.locked || !this.payload) return null;
    return this.payload.roster.find((e) => e.uuid === uuid) || null;
  }

  /**
   * Find student by local ID
   */
  findByLocalId(localId: string): BridgeEntry | null {
    if (this.locked || !this.payload) return null;
    return this.payload.roster.find((e) => e.localId === localId) || null;
  }

  /**
   * Find students by name (partial match, case-insensitive)
   */
  findByName(name: string): BridgeEntry[] {
    if (this.locked || !this.payload) return [];
    const searchLower = name.toLowerCase();
    return this.payload.roster.filter((e) =>
      e.name.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get all students
   */
  getAllStudents(): BridgeEntry[] {
    if (this.locked || !this.payload) return [];
    return [...this.payload.roster];
  }

  /**
   * Import students from CSV
   * Expected format: name,localId
   */
  async importFromCsv(csvText: string): Promise<ImportResult> {
    if (this.locked || !this.payload) {
      throw new Error('Bridge is locked');
    }

    const result: ImportResult = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const lines = csvText.split('\n').map((line) => line.trim());
    
    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const [name, localId] = line.split(',').map((s) => s.trim());

      if (!name || !localId) {
        result.errors.push({
          row: i + 1,
          error: 'Missing name or localId',
        });
        continue;
      }

      try {
        // Check if student already exists
        const existing = this.findByLocalId(localId);
        
        if (existing) {
          // Update if name changed
          if (existing.name !== name) {
            this.updateStudent(existing.uuid, { name });
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          // Add new student
          this.addStudent(name, localId);
          result.added++;
        }
      } catch (err) {
        result.errors.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Rotate passphrase (re-encrypt with new passphrase)
   */
  async rotatePassphrase(oldPassphrase: string, newPassphrase: string): Promise<void> {
    if (this.locked || !this.payload) {
      throw new Error('Bridge is locked');
    }

    if (this.passphrase !== oldPassphrase) {
      throw new Error('Old passphrase is incorrect');
    }

    this.passphrase = newPassphrase;
  }
}

// Singleton instance
let bridgeStoreInstance: BridgeStore | null = null;

export function getBridgeStore(): BridgeStore {
  if (!bridgeStoreInstance) {
    bridgeStoreInstance = new BridgeStore();
  }
  return bridgeStoreInstance;
}
