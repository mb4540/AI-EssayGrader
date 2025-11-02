// Storage layer for bridge files
// Supports File System Access API (Chrome/Edge) with IndexedDB fallback

import { EncryptedBridgeFile } from './bridgeTypes';

const INDEXEDDB_NAME = 'ai-essaygrader-bridge';
const INDEXEDDB_STORE = 'bridge';
// NOTE: Key is now user-specific to prevent cross-user data exposure (FERPA compliance)
const INDEXEDDB_KEY_PREFIX = 'encrypted-bridge-user-';

/**
 * Generate user-specific IndexedDB key
 * CRITICAL: This ensures each user's bridge data is isolated
 */
function getUserBridgeKey(userId: string): string {
  if (!userId) {
    throw new Error('userId is required for bridge storage (FERPA compliance)');
  }
  return `${INDEXEDDB_KEY_PREFIX}${userId}`;
}

// Type declarations for File System Access API
declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window.showOpenFilePicker === 'function' && typeof window.showSaveFilePicker === 'function';
}

/**
 * Choose a bridge file using File System Access API
 */
export async function chooseBridgeFile(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported() || !window.showOpenFilePicker) {
    throw new Error('File System Access API not supported');
  }

  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Bridge Files',
          accept: {
            'application/json': ['.bridge.json.enc'],
          },
        },
      ],
      multiple: false,
    });
    return fileHandle;
  } catch (err) {
    // User cancelled
    if (err instanceof Error && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Save bridge file using File System Access API
 */
export async function saveBridgeFile(
  data: EncryptedBridgeFile
): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported() || !window.showSaveFilePicker) {
    throw new Error('File System Access API not supported');
  }

  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: 'students.bridge.json.enc',
      types: [
        {
          description: 'Bridge Files',
          accept: {
            'application/json': ['.bridge.json.enc'],
          },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    return fileHandle;
  } catch (err) {
    // User cancelled
    if (err instanceof Error && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Read bridge file from FileSystemFileHandle
 */
export async function readBridgeFile(
  fileHandle: FileSystemFileHandle
): Promise<EncryptedBridgeFile> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text) as EncryptedBridgeFile;
}

/**
 * Write bridge file to FileSystemFileHandle
 */
export async function writeBridgeFile(
  fileHandle: FileSystemFileHandle,
  data: EncryptedBridgeFile
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

// ============================================================================
// IndexedDB Fallback (for Safari and browsers without File System Access API)
// ============================================================================

/**
 * Open IndexedDB
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INDEXEDDB_STORE)) {
        db.createObjectStore(INDEXEDDB_STORE);
      }
    };
  });
}

/**
 * Save bridge to IndexedDB (user-specific)
 * @param data - Encrypted bridge file
 * @param userId - User ID for data isolation (FERPA compliance)
 */
export async function saveBridgeToIndexedDB(
  data: EncryptedBridgeFile,
  userId: string
): Promise<void> {
  const db = await openIndexedDB();
  const key = getUserBridgeKey(userId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_STORE], 'readwrite');
    const store = transaction.objectStore(INDEXEDDB_STORE);
    const request = store.put(data, key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Load bridge from IndexedDB (user-specific)
 * @param userId - User ID for data isolation (FERPA compliance)
 */
export async function loadBridgeFromIndexedDB(userId: string): Promise<EncryptedBridgeFile | null> {
  const db = await openIndexedDB();
  const key = getUserBridgeKey(userId);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([INDEXEDDB_STORE], 'readonly');
    const store = transaction.objectStore(INDEXEDDB_STORE);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

// ============================================================================
// Manual Export/Import (for browsers without File System Access API)
// ============================================================================

/**
 * Download bridge file as a blob (manual export)
 */
export function downloadBridgeFile(data: EncryptedBridgeFile, filename: string = 'students.bridge.json.enc'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Upload bridge file from user (manual import)
 */
export function uploadBridgeFile(): Promise<EncryptedBridgeFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bridge.json.enc,application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text) as EncryptedBridgeFile;
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}
