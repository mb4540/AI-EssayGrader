#!/usr/bin/env node

/**
 * Generate Initial Bridge File from Database Backup
 * 
 * This script:
 * 1. Connects to the database
 * 2. Reads student data from the backup table
 * 3. Generates an encrypted bridge file
 * 4. Saves it locally for the teacher
 * 
 * Run BEFORE the migration to remove PII!
 * 
 * Usage:
 *   node database/generate-bridge-from-backup.js
 * 
 * Environment Variables Required:
 *   NEON_DATABASE_URL - Database connection string
 */

import { neon } from '@neondatabase/serverless';
import { webcrypto } from 'crypto';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

// Polyfill crypto for Node.js
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto;
}

// Import bridge crypto functions
const PBKDF2_ITERATIONS = 210000;
const AES_KEY_LENGTH = 256;

async function deriveKey(passphrase, salt, iterations = PBKDF2_ITERATIONS) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt']
  );
}

async function encryptJson(obj, passphrase) {
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

async function generateHmac(data, passphrase) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return arrayBufferToBase64(signature);
}

function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('Generate Initial Bridge File from Database Backup');
  console.log('='.repeat(70));
  console.log('');

  // Check for database URL
  if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable not set');
    console.error('');
    console.error('Please set it in your .env file or export it:');
    console.error('  export NEON_DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  // Connect to database
  console.log('📡 Connecting to database...');
  const sql = neon(process.env.NEON_DATABASE_URL);

  try {
    // Check if backup table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'grader' 
        AND table_name = 'students_backup_20251026'
      ) as exists
    `;

    if (!tableCheck[0].exists) {
      console.error('❌ Error: Backup table does not exist');
      console.error('');
      console.error('Please run the migration script first to create the backup:');
      console.error('  psql $NEON_DATABASE_URL -f database/migrations/001_remove_student_pii.sql');
      process.exit(1);
    }

    // Fetch student data from backup
    console.log('📥 Fetching student data from backup table...');
    const students = await sql`
      SELECT 
        student_id,
        student_name,
        district_student_id,
        created_at
      FROM grader.students_backup_20251026
      ORDER BY student_name
    `;

    console.log(`✅ Found ${students.length} students in backup`);
    console.log('');

    if (students.length === 0) {
      console.log('⚠️  No students found in backup table');
      console.log('Nothing to export. Exiting.');
      process.exit(0);
    }

    // Get passphrase from user
    console.log('🔐 Bridge File Encryption');
    console.log('');
    console.log('You need to create a strong passphrase to encrypt the bridge file.');
    console.log('This passphrase will be required to unlock the bridge in the app.');
    console.log('');
    console.log('⚠️  IMPORTANT: Store this passphrase securely!');
    console.log('   If you lose it, you will not be able to access student names.');
    console.log('');

    const passphrase = await promptUser('Enter passphrase (min 8 characters): ');

    if (passphrase.length < 8) {
      console.error('❌ Error: Passphrase must be at least 8 characters');
      process.exit(1);
    }

    const passphraseConfirm = await promptUser('Confirm passphrase: ');

    if (passphrase !== passphraseConfirm) {
      console.error('❌ Error: Passphrases do not match');
      process.exit(1);
    }

    console.log('');
    console.log('🔒 Encrypting bridge file...');

    // Build bridge payload
    const now = new Date().toISOString();
    const roster = students.map((s) => ({
      uuid: s.student_id,
      localId: s.district_student_id || '',
      name: s.student_name,
      createdAt: s.created_at.toISOString(),
      updatedAt: s.created_at.toISOString(),
    }));

    const payload = {
      district: 'Migrated from database',
      school: '',
      teacherName: '',
      roster,
    };

    const dataToEncrypt = {
      version: '1.0',
      createdAt: now,
      payload,
    };

    // Encrypt
    const { ciphertext, iv, salt, iterations } = await encryptJson(
      dataToEncrypt,
      passphrase
    );

    // Generate HMAC
    const payloadString = JSON.stringify(payload);
    const hmac = await generateHmac(payloadString, passphrase);

    // Create encrypted bridge file
    const encryptedBridge = {
      version: '1.0',
      ciphertextB64: arrayBufferToBase64(ciphertext),
      ivB64: arrayBufferToBase64(iv),
      saltB64: arrayBufferToBase64(salt),
      iterations,
      hmacB64: hmac,
    };

    // Save to file
    const outputPath = resolve(process.cwd(), 'students.bridge.json.enc');
    writeFileSync(outputPath, JSON.stringify(encryptedBridge, null, 2));

    console.log('');
    console.log('✅ Bridge file generated successfully!');
    console.log('');
    console.log('📄 File saved to:', outputPath);
    console.log('📊 Students exported:', students.length);
    console.log('');
    console.log('='.repeat(70));
    console.log('NEXT STEPS:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. ✅ Bridge file created: students.bridge.json.enc');
    console.log('2. 🔐 Store your passphrase securely (you will need it!)');
    console.log('3. 📂 Back up the bridge file to a safe location');
    console.log('4. 🚀 Import the bridge file in the app (/bridge route)');
    console.log('5. ✅ Verify all students are visible in the bridge');
    console.log('6. 🗄️  Run the migration to remove PII from database');
    console.log('');
    console.log('⚠️  DO NOT delete the backup table until you have verified');
    console.log('   the bridge file works correctly in the application!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
