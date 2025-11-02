// Cryptographic operations for bridge file encryption
// Uses Web Crypto API (AES-GCM, PBKDF2, HMAC)

const PBKDF2_ITERATIONS = 210000;
const AES_KEY_LENGTH = 256;

/**
 * Derive an AES-GCM key from a passphrase using PBKDF2
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey', 'deriveBits']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt JSON data with AES-GCM
 */
export async function encryptJson(
  obj: unknown,
  passphrase: string
): Promise<{
  ciphertext: Uint8Array;
  iv: Uint8Array;
  salt: Uint8Array;
  iterations: number;
}> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const data = enc.encode(JSON.stringify(obj));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  );

  return { ciphertext, iv, salt, iterations: PBKDF2_ITERATIONS };
}

/**
 * Decrypt JSON data with AES-GCM
 */
export async function decryptJson(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  salt: Uint8Array,
  passphrase: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<unknown> {
  const key = await deriveKey(passphrase, salt, iterations);
  const dec = new TextDecoder();

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  return JSON.parse(dec.decode(plaintext));
}

/**
 * Generate HMAC for integrity verification
 */
export async function generateHmac(
  data: string,
  passphrase: string
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const dataBuffer = enc.encode(data) as BufferSource;
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  return arrayBufferToBase64(signature);
}

/**
 * Verify HMAC
 */
export async function verifyHmac(
  data: string,
  hmac: string,
  passphrase: string
): Promise<boolean> {
  const expectedHmac = await generateHmac(data, passphrase);
  return hmac === expectedHmac;
}

/**
 * Convert ArrayBuffer or Uint8Array to Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Removed unused zeroize function - was never called in codebase
// If needed in future, can restore from git history
