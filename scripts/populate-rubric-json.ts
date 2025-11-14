/**
 * Populate rubric_json for existing assignments
 * 
 * Parses grading_criteria text and saves structured rubric with max_points
 * to assignments.rubric_json column.
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { parseTeacherRubric } from '../src/lib/calculator/rubricParser';
import { isValidRubric } from '../src/lib/calculator/rubricBuilder';

// Load environment variables from .env file
config();

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  console.error('   Please set it in your .env file or export it:');
  console.error('   export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function populateRubricJson() {
  console.log('🔄 Starting rubric_json population...\n');

  try {
    // Fetch assignments that need rubric_json populated
    const assignments = await sql`
      SELECT 
        assignment_id,
        title,
        grading_criteria,
        total_points,
        rubric_json
      FROM grader.assignments
      WHERE grading_criteria IS NOT NULL 
        AND grading_criteria != ''
      ORDER BY created_at DESC
    `;

    console.log(`Found ${assignments.length} assignments with grading criteria\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const assignment of assignments) {
      const { assignment_id, title, grading_criteria, total_points, rubric_json } = assignment;

      // Skip if already has rubric_json
      if (rubric_json && isValidRubric(rubric_json)) {
        console.log(`⏭️  SKIP: "${title}" - already has valid rubric_json`);
        skipCount++;
        continue;
      }

      console.log(`\n📝 Processing: "${title}"`);
      console.log(`   Assignment ID: ${assignment_id}`);
      console.log(`   Total Points: ${total_points || 'not set'}`);

      try {
        // Parse the grading criteria
        const parsedRubric = parseTeacherRubric(
          grading_criteria,
          assignment_id,
          total_points
        );

        // Validate the parsed rubric
        if (!isValidRubric(parsedRubric)) {
          throw new Error('Parsed rubric failed validation');
        }

        console.log(`   ✅ Parsed ${parsedRubric.criteria.length} criteria:`);
        parsedRubric.criteria.forEach((c) => {
          console.log(`      - ${c.name}: ${c.max_points} pts (${c.levels.length} levels)`);
        });

        // Save to database
        await sql`
          UPDATE grader.assignments
          SET rubric_json = ${JSON.stringify(parsedRubric)}
          WHERE assignment_id = ${assignment_id}
        `;

        console.log(`   💾 Saved rubric_json to database`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ ERROR parsing rubric for "${title}":`, error instanceof Error ? error.message : error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Successfully processed: ${successCount}`);
    console.log(`   ⏭️  Skipped (already done): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total assignments: ${assignments.length}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount > 0) {
      console.log('⚠️  Some assignments failed to parse. Review the errors above.');
      console.log('   You may need to manually fix the grading_criteria format for those assignments.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
populateRubricJson()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
