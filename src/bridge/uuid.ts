// UUID generation utilities

export const newUuid = (): string => {
  // Use native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback to manual UUID v4 generation
  return pseudoV4();
};

function pseudoV4(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  
  // Set version (4) and variant bits
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  
  const hex = [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// Removed unused isUuid function - never called in codebase
// If needed in future, can restore from git history
