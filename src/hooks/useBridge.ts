// React hook for bridge operations
// Provides state management and operations for the student identity bridge

import { useState, useCallback, useEffect } from 'react';
import { BridgeEntry, EncryptedBridgeFile, ImportResult } from '../bridge/bridgeTypes';
import { getBridgeStore } from '../bridge/bridgeStore';
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
  addStudent: (name: string, localId: string) => BridgeEntry;
  updateStudent: (uuid: string, updates: { name?: string; localId?: string }) => BridgeEntry;
  deleteStudent: (uuid: string) => void;
  findByUuid: (uuid: string) => BridgeEntry | null;
  findByLocalId: (localId: string) => BridgeEntry | null;
  findByName: (name: string) => BridgeEntry[];
  
  // File operations
  save: () => Promise<void>;
  exportFile: () => Promise<void>;
  importFile: () => Promise<void>;
  importCsv: (csvText: string) => Promise<ImportResult>;
  
  // Loading state
  loading: boolean;
  error: string | null;
}

export function useBridge(): UseBridgeReturn {
  const [isLocked, setIsLocked] = useState(true);
  const [students, setStudents] = useState<BridgeEntry[]>([]);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = getBridgeStore();
  const supportsFileSystem = isFileSystemAccessSupported();

  // Load bridge from IndexedDB on mount (fallback storage)
  useEffect(() => {
    if (!supportsFileSystem) {
      loadBridgeFromIndexedDB().then((data) => {
        if (data) {
          // Bridge file exists in IndexedDB, but still locked
          console.log('Bridge file found in IndexedDB');
        }
      }).catch(console.error);
    }
  }, [supportsFileSystem]);

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
      
      // Auto-save to storage
      const encrypted = await store.export();
      if (supportsFileSystem) {
        const handle = await saveBridgeFile(encrypted);
        setFileHandle(handle);
      } else {
        await saveBridgeToIndexedDB(encrypted);
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

      // If no file provided, try to load from storage
      if (!encryptedFile) {
        if (supportsFileSystem) {
          const handle = await chooseBridgeFile();
          if (!handle) {
            setLoading(false);
            return;
          }
          encryptedFile = await readBridgeFile(handle);
          setFileHandle(handle);
        } else {
          const loaded = await loadBridgeFromIndexedDB();
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
  const addStudent = useCallback((name: string, localId: string): BridgeEntry => {
    try {
      const entry = store.addStudent(name, localId);
      refreshStudents();
      return entry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
      throw err;
    }
  }, [store, refreshStudents]);

  // Update student
  const updateStudent = useCallback((uuid: string, updates: { name?: string; localId?: string }): BridgeEntry => {
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

  // Save to current file handle or IndexedDB
  const save = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const encrypted = await store.export();
      
      if (supportsFileSystem && fileHandle) {
        await writeBridgeFile(fileHandle, encrypted);
      } else {
        await saveBridgeToIndexedDB(encrypted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [store, fileHandle, supportsFileSystem]);

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
        // Store in IndexedDB for future use
        await saveBridgeToIndexedDB(encrypted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import bridge');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supportsFileSystem]);

  // Import from CSV
  const importCsv = useCallback(async (csvText: string): Promise<ImportResult> => {
    try {
      const result = await store.importFromCsv(csvText);
      refreshStudents();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
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
