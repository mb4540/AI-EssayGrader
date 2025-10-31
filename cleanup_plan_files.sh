#!/bin/bash
# Cleanup and organize plan files
# Run this after reviewing MASTER_PLAN.md

echo "🧹 Cleaning up plan files..."

# Create archive directory
mkdir -p archive/old_plans

# Move obsolete files to archive
echo "📦 Archiving obsolete files..."
mv MIGRATION_DECISION.md archive/old_plans/ 2>/dev/null
mv COLUMN_NAME_FIX_SUMMARY.md archive/old_plans/ 2>/dev/null
mv ACTUAL_SCHEMA_ANALYSIS.md archive/old_plans/ 2>/dev/null
mv FINAL_FIX_SUMMARY.md archive/old_plans/ 2>/dev/null

# Move completed plans to archive
echo "✅ Archiving completed plans..."
mv DASHBOARD_REDESIGN_PLAN.md archive/ 2>/dev/null
mv schema_v2_proper_naming.sql archive/ 2>/dev/null

# Keep active files (no action needed, just list them)
echo ""
echo "📋 Active plan files (keeping):"
echo "  - MASTER_PLAN.md (⭐ START HERE)"
echo "  - FERPA_MIGRATION_PLAN.md"
echo "  - FERPA_IMPLEMENTATION_CHECKLIST.md"
echo "  - STUDENT_BRIDGE_DATABASE_ANALYSIS.md"
echo "  - migrations/schema_migration_ferpa_compliance.sql"
echo ""
echo "✨ Cleanup complete!"
echo ""
echo "🚀 Next step: Read MASTER_PLAN.md and start Phase 1"
