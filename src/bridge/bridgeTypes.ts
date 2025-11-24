// AI-EssayGrader Bridge Types
// Local-only student identity management

export type BridgeEntry = {
  uuid: string;           // student_id from grader.students
  localId: string;        // district_student_id (teacher's local ID)
  name: string;           // student_name (never sent to cloud)
  classPeriod?: string;   // Optional: Class period/section (e.g. "1st Period", "Block A")
  createdAt: string;      // ISO timestamp
  updatedAt: string;      // ISO timestamp
};

export type BridgePayload = {
  district?: string;      // e.g., "Mansfield ISD"
  school?: string;        // e.g., "Asa Low Intermediate"
  teacherName?: string;   // Optional: teacher who created bridge
  classPeriods?: string[]; // Available class periods (e.g., ["Period 1", "Period 2"])
  roster: BridgeEntry[];  // Array of student mappings
};

export type BridgeMetadata = {
  version: string;        // Bridge file format version
  createdAt: string;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    saltB64: string;
    iterations: number;   // 210000 recommended
  };
  cipher: {
    name: 'AES-GCM';
  };
};

export type EncryptedBridge = BridgeMetadata & {
  payload: BridgePayload;
  integrity: {
    hmac: string;
    algo: 'HMAC-SHA256';
  };
};

export type EncryptedBridgeFile = {
  version: string;
  ciphertextB64: string;
  ivB64: string;
  saltB64: string;
  iterations: number;
  hmacB64: string;
};

export type ImportResult = {
  added: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
};
