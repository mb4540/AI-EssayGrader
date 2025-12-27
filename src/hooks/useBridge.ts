// React hook for bridge operations
// Provides state management and operations for the student identity bridge
// CRITICAL: Now user-scoped for FERPA compliance

import { useState, useCallback, useEffect } from 'react';
import { BridgeEntry, EncryptedBridgeFile, ImportResult } from '../bridge/bridgeTypes';
import { getBridgeStore } from '../bridge/bridgeStore';
import { useAuth } from '../contexts/AuthContext';
import {
  isFileSystemAccessSupported,
  chooseBridgeFile,
  saveBridgeFile,
  readBridgeFile,
  writeBridgeFile,
  saveBridgeToIndexedDB,
  loadBridgeFromIndexedDB,
  downloadBridgeFile,
  uploadBridgeFile,
} from '../bridge/storage';

export interface UseBridgeReturn {
  // State
  isLocked: boolean;
  students: BridgeEntry[];
  hasFileHandle: boolean;
  supportsFileSystem: boolean;

  // Operations
  createNew: (passphrase: string, metadata: { district?: string; school?: string; teacherName?: string }) => Promise<void>;
  unlock: (passphrase: string, file?: EncryptedBridgeFile) => Promise<void>;
  lock: () => void;

  // Student operations
  addStudent: (name: string, localId: string, classPeriod?: string) => BridgeEntry;
  updateStudent: (uuid: string, updates: { name?: string; localId?: string; classPeriod?: string }) => BridgeEntry;
  deleteStudent: (uuid: string) => void;
  findByUuid: (uuid: string) => BridgeEntry | null;
  findByLocalId: (localId: string) => BridgeEntry | null;
  findByName: (name: string) => BridgeEntry[];

  // Class period operations
  getClassPeriods: () => string[];
  addClassPeriod: (name: string) => void;
  removeClassPeriod: (name: string) => void;

  // File operations
  save: () => Promise<void>;
  exportFile: () => Promise<void>;
  importFile: () => Promise<void>;
  importCsv: (csvText: string) => Promise<ImportResult & { affectedUuids: string[] }>;

  // Loading state
  loading: boolean;
  error: string | null;
}

export function useBridge(): UseBridgeReturn {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(true);
  const [students, setStudents] = useState<BridgeEntry[]>([]);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = getBridgeStore();
  const supportsFileSystem = isFileSystemAccessSupported();

  // CRITICAL: Require user_id for FERPA compliance
  const userId = user?.user_id;
  if (!userId) {
    console.warn('useBridge: No user_id available - bridge operations will fail');
  }

  // Sync component state with store state on mount
  useEffect(() => {
    // Check if store is already unlocked (from previous page)
    if (!store.isLocked()) {
      setIsLocked(false);
      setStudents(store.getAllStudents());
    }
  }, [store]);

  // Load bridge from IndexedDB on mount (fallback storage)
  useEffect(() => {
    if (!supportsFileSystem && userId) {
      loadBridgeFromIndexedDB(userId).then((data) => {
        if (data) {
          // Bridge file exists in IndexedDB, but still locked
        }
      }).catch(console.error);
    }
  }, [supportsFileSystem, userId]);

  // Refresh students list
  const refreshStudents = useCallback(() => {
    setStudents(store.getAllStudents());
    setIsLocked(store.isLocked());
  }, [store]);

  // Create new bridge
  const createNew = useCallback(async (
    passphrase: string,
    metadata: { district?: string; school?: string; teacherName?: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      await store.createNew(passphrase, metadata);
      refreshStudents();

      // Auto-save to storage (user-specific)
      if (!userId) {
        throw new Error('User ID required for bridge storage (FERPA compliance)');
      }
      const encrypted = await store.export();
      if (supportsFileSystem) {
        const handle = await saveBridgeFile(encrypted);
        setFileHandle(handle);
      } else {
        await saveBridgeToIndexedDB(encrypted, userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store, supportsFileSystem, refreshStudents]);

  // Unlock existing bridge
  const unlock = useCallback(async (passphrase: string, file?: EncryptedBridgeFile) => {
    setLoading(true);
    setError(null);
    try {
      let encryptedFile: EncryptedBridgeFile | undefined = file;

      // If no file provided, try to load from storage (user-specific)
      if (!encryptedFile) {
        if (!userId) {
          throw new Error('User ID required for bridge storage (FERPA compliance)');
        }
        if (supportsFileSystem) {
          const handle = await chooseBridgeFile();
          if (!handle) {
            setLoading(false);
            return;
          }
          encryptedFile = await readBridgeFile(handle);
          setFileHandle(handle);
        } else {
          const loaded = await loadBridgeFromIndexedDB(userId);
          if (!loaded) {
            throw new Error('No bridge file found. Please import or create a new bridge.');
          }
          encryptedFile = loaded;
        }
      }

      if (!encryptedFile) {
        throw new Error('No bridge file available');
      }

      await store.unlock(encryptedFile, passphrase);
      refreshStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store, supportsFileSystem, refreshStudents]);

  // Lock bridge
  const lock = useCallback(() => {
    store.lock();
    setFileHandle(null);
    refreshStudents();
  }, [store, refreshStudents]);

  // Add student
  const addStudent = useCallback((name: string, localId: string, classPeriod?: string): BridgeEntry => {
    try {
      const entry = store.addStudent(name, localId, classPeriod);
      refreshStudents();
      return entry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
      throw err;
    }
  }, [store, refreshStudents]);

  // Update student
  const updateStudent = useCallback((uuid: string, updates: { name?: string; localId?: string; classPeriod?: string }): BridgeEntry => {
    try {
      const entry = store.updateStudent(uuid, updates);
      refreshStudents();
      return entry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
      throw err;
    }
  }, [store, refreshStudents]);

  // Delete student
  const deleteStudent = useCallback((uuid: string): void => {
    try {
      store.deleteStudent(uuid);
      refreshStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
      throw err;
    }
  }, [store, refreshStudents]);

  // Find operations
  const findByUuid = useCallback((uuid: string) => store.findByUuid(uuid), [store]);
  const findByLocalId = useCallback((localId: string) => store.findByLocalId(localId), [store]);
  const findByName = useCallback((name: string) => store.findByName(name), [store]);

  // Save to current file handle or IndexedDB (user-specific)
  const save = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error('User ID required for bridge storage (FERPA compliance)');
      }
      const encrypted = await store.export();

      if (supportsFileSystem && fileHandle) {
        await writeBridgeFile(fileHandle, encrypted);
      } else {
        await saveBridgeToIndexedDB(encrypted, userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store, fileHandle, supportsFileSystem, userId]);

  // Export to new file
  const exportFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const encrypted = await store.export();

      if (supportsFileSystem) {
        const handle = await saveBridgeFile(encrypted);
        if (handle) {
          setFileHandle(handle);
        }
      } else {
        // Manual download for browsers without File System Access API
        downloadBridgeFile(encrypted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store, supportsFileSystem]);

  // Import from file
  const importFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let encrypted: EncryptedBridgeFile | null = null;

      if (supportsFileSystem) {
        const handle = await chooseBridgeFile();
        if (!handle) {
          setLoading(false);
          return;
        }
        encrypted = await readBridgeFile(handle);
        setFileHandle(handle);
      } else {
        encrypted = await uploadBridgeFile();
      }

      if (encrypted) {
        // Store in IndexedDB for future use (user-specific)
        if (!userId) {
          throw new Error('User ID required for bridge storage (FERPA compliance)');
        }
        await saveBridgeToIndexedDB(encrypted, userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supportsFileSystem]);

  // Import from CSV (returns affected UUIDs for optional Neon sync)
  const importCsv = useCallback(async (csvText: string): Promise<ImportResult & { affectedUuids: string[] }> => {
    try {
      const result = await store.importFromCsv(csvText);
      refreshStudents();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
      throw err;
    }
  }, [store, refreshStudents]);

  // Get class periods
  const getClassPeriods = useCallback((): string[] => {
    return store.getClassPeriods();
  }, [store]);

  // Add class period
  const addClassPeriod = useCallback((name: string): void => {
    try {
      store.addClassPeriod(name);
      refreshStudents(); // Trigger re-render
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add class period');
      throw err;
    }
  }, [store, refreshStudents]);

  // Remove class period
  const removeClassPeriod = useCallback((name: string): void => {
    try {
      store.removeClassPeriod(name);
      refreshStudents(); // Trigger re-render
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove class period');
      throw err;
    }
  }, [store, refreshStudents]);

  return {
    // State
    isLocked,
    students,
    hasFileHandle: !!fileHandle,
    supportsFileSystem,

    // Operations
    createNew,
    unlock,
    lock,

    // Student operations
    addStudent,
    updateStudent,
    deleteStudent,
    findByUuid,
    findByLocalId,
    findByName,

    // Class period operations
    getClassPeriods,
    addClassPeriod,
    removeClassPeriod,

    // File operations
    save,
    exportFile,
    importFile,
    importCsv,

    // Loading state
    loading,
    error,
  };
}

import React, { createContext, useContext, ReactNode } from 'react';

const BridgeContext = createContext<UseBridgeReturn | null>(null);

export function BridgeProvider({ children }: { children: ReactNode }) {
  const bridge = useBridge();
  return React.createElement(BridgeContext.Provider, { value: bridge }, children);
}

export function useBridgeContext() {
  const context = useContext(BridgeContext);
  if (!context) {
    throw new Error('useBridgeContext must be used within a BridgeProvider');
  }
  return context;
}
