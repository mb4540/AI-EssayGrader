#!/bin/bash
# Git Branch Cleanup Script
# This script deletes merged branches that are no longer needed

echo "🧹 Starting Git Branch Cleanup..."
echo ""

# Delete local checkpoint branches
echo "Deleting checkpoint branches..."
git branch -d WorkingSoftwareCKPoint-20251031-182407UTC
git branch -d WorkingSoftwareCKPoint-20251031-202430UTC
git branch -d WorkingSoftwareCKPoint-20251031-205351UTC
git branch -d WorkingSoftwareCKPoint-20251031-223831UTC
git branch -d WorkingSoftwareCKPoint-20251114-153920UTC
git branch -d WorkingSoftwareCKPoint-20251123-090128UTC
git branch -d WorkingSoftwareCKPoint-20251124-091256UTC

echo ""
echo "Deleting merged feature branches..."
git branch -d feature/class-period-organization
git branch -d feature/class-period-organization-20251102
git branch -d feature/cleanup-refactor
git branch -d feature/dashboard-enhancements
git branch -d feature/email-password-reset
git branch -d feature/enhanced-print-20251114
git branch -d feature/enhanced-print-download
git branch -d feature/enhancements-20251102-092938
git branch -d feature/enhancements-20251102-094640
git branch -d feature/enhancements-20251114
git branch -d feature/fix-assignment-modal
git branch -d feature/gemini-enhancements
git branch -d feature/inline-annotations
git branch -d feature/next-enhancements
git branch -d feature/next-improvements
git branch -d feature/rubric-driven-grading
git branch -d feature/test-fixes
git branch -d feature/ui-polish-and-enhancements

echo ""
echo "✅ Local branches cleaned up!"
echo ""
echo "Now cleaning up remote branches on GitHub..."
echo ""

# Delete remote checkpoint branches
git push origin --delete WorkingSoftwareCKPoint-20251031-182407UTC
git push origin --delete WorkingSoftwareCKPoint-20251031-202430UTC
git push origin --delete WorkingSoftwareCKPoint-20251031-205351UTC
git push origin --delete WorkingSoftwareCKPoint-20251031-223831UTC
git push origin --delete WorkingSoftwareCKPoint-20251114-153920UTC
git push origin --delete WorkingSoftwareCKPoint-20251123-090128UTC
git push origin --delete WorkingSoftwareCKPoint-20251124-091256UTC

# Delete remote merged feature branches
git push origin --delete feature/class-period-organization
git push origin --delete feature/class-period-organization-20251102
git push origin --delete feature/enhancements-20251114
git push origin --delete feature/fix-assignment-modal
git push origin --delete feature/gemini-enhancements
git push origin --delete feature/inline-annotations
git push origin --delete feature/next-enhancements
git push origin --delete feature/next-improvements
git push origin --delete feature/rubric-driven-grading
git push origin --delete feature/test-fixes
git push origin --delete feature/ui-polish-and-enhancements

echo ""
echo "✅ Remote branches cleaned up!"
echo ""
echo "Remaining branches:"
git branch -a | grep -v "remotes/origin/HEAD"
echo ""
echo "🎉 Cleanup complete!"
