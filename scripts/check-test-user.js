// Script to check test user and verify password
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function checkTestUser() {
  console.log('🔍 Checking test user in database...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Check if users table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'grader' AND table_name = 'users'
    `;

    if (tables.length === 0) {
      console.log('❌ Users table does not exist');
      return;
    }

    console.log('✅ Users table exists\n');

    // Get test user
    const users = await sql`
      SELECT 
        user_id,
        tenant_id,
        email,
        password_hash,
        full_name,
        role,
        is_active,
        email_verified,
        created_at
      FROM grader.users
      WHERE email = 'test@example.com'
    `;

    if (users.length === 0) {
      console.log('❌ Test user not found\n');
      console.log('Creating test user...\n');
      
      // Get or create test tenant
      let tenants = await sql`
        SELECT tenant_id FROM grader.tenants WHERE tenant_name = 'Test School'
      `;
      
      let tenant_id;
      if (tenants.length === 0) {
        const newTenant = await sql`
          INSERT INTO grader.tenants (tenant_name, tenant_type)
          VALUES ('Test School', 'school')
          RETURNING tenant_id
        `;
        tenant_id = newTenant[0].tenant_id;
        console.log('✅ Created test tenant:', tenant_id);
      } else {
        tenant_id = tenants[0].tenant_id;
        console.log('✅ Found test tenant:', tenant_id);
      }

      // Create test user with password: testpass123
      const password_hash = await bcrypt.hash('testpass123', 12);
      
      const newUser = await sql`
        INSERT INTO grader.users (
          tenant_id,
          email,
          password_hash,
          full_name,
          role,
          is_active,
          email_verified
        )
        VALUES (
          ${tenant_id},
          'test@example.com',
          ${password_hash},
          'Test User',
          'teacher',
          true,
          true
        )
        RETURNING user_id, email, full_name
      `;
      
      console.log('✅ Created test user:', newUser[0]);
      console.log('\n📋 Credentials:');
      console.log('   Email: test@example.com');
      console.log('   Password: testpass123\n');
      
    } else {
      const user = users[0];
      console.log('✅ Test user found:');
      console.log('   User ID:', user.user_id);
      console.log('   Email:', user.email);
      console.log('   Full Name:', user.full_name);
      console.log('   Role:', user.role);
      console.log('   Active:', user.is_active);
      console.log('   Email Verified:', user.email_verified);
      console.log('   Tenant ID:', user.tenant_id);
      console.log('   Created:', user.created_at);
      console.log('\n🔐 Testing password...');
      
      // Test password
      const isValid = await bcrypt.compare('testpass123', user.password_hash);
      
      if (isValid) {
        console.log('✅ Password "testpass123" is CORRECT\n');
      } else {
        console.log('❌ Password "testpass123" is INCORRECT\n');
        console.log('Updating password to "testpass123"...');
        
        const new_hash = await bcrypt.hash('testpass123', 12);
        await sql`
          UPDATE grader.users
          SET password_hash = ${new_hash}
          WHERE user_id = ${user.user_id}
        `;
        
        console.log('✅ Password updated successfully\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTestUser();
