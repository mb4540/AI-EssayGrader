import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Adding image_url column to submissions table...\n');
    
    await sql`
      ALTER TABLE grader.submissions 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `;
    
    console.log('✅ Migration completed successfully!');
    console.log('The image_url column has been added to submissions table.');
    console.log('Images can now be stored and retrieved from Netlify Blobs.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
