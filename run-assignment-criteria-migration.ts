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
    console.log('Adding grading_criteria column to assignments table...\n');
    
    await sql`
      ALTER TABLE grader.assignments 
      ADD COLUMN IF NOT EXISTS grading_criteria TEXT
    `;
    
    console.log('✅ Migration completed successfully!');
    console.log('The grading_criteria column has been added to assignments table.');
    console.log('Assignments can now store default grading criteria that auto-populate for submissions.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
