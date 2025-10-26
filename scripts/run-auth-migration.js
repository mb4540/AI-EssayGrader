// Script to run authentication tables migration
// This creates the tenants and users tables and adds a test user

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('🚀 Starting authentication tables migration...\n');

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please add it to your .env file');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'migrations', 'schema_migration_auth_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('🔗 Connecting to database...\n');

    // Split SQL into individual statements (simple split on semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;

      try {
        await sql.unsafe(statement);
        
        // Log progress for key operations
        if (statement.includes('create table')) {
          const tableName = statement.match(/create table.*?(\w+\.\w+)/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('insert into')) {
          const tableName = statement.match(/insert into.*?(\w+\.\w+)/i)?.[1];
          console.log(`✅ Inserted data into: ${tableName}`);
        } else if (statement.includes('create index')) {
          const indexName = statement.match(/create index.*?(\w+)/i)?.[1];
          console.log(`✅ Created index: ${indexName}`);
        }
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message && err.message.includes('already exists')) {
          console.log(`⏭️  Skipped (already exists)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✨ Migration completed successfully!\n');
    console.log('📋 Test credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: testpass123');
    console.log('   Tenant: Test School\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration();
