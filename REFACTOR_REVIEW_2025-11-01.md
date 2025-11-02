# Refactor Review - Sat Nov  1 09:45:03 CDT 2025

## Code Style Compliance

### File Naming Issues


### TypeScript Type Issues

Files using `any` type:
- [ ] `src/test/helpers.tsx` - 4 occurrences
- [ ] `src/bridge/bridgeStore.ts` - 2 occurrences
- [ ] `src/components/GradePanel.tsx` - 21 occurrences
- [ ] `src/components/bridge/AddStudentModal.tsx` - 1 occurrences
- [ ] `src/components/bridge/BridgeManager.test.tsx` - 7 occurrences
- [ ] `src/components/AnnotationToolbar.tsx` - 3 occurrences
- [ ] `src/components/SettingsModal.tsx` - 1 occurrences
- [ ] `src/hooks/usePdfPages.ts` - 4 occurrences
- [ ] `src/lib/calculator/calculator.test.ts` - 1 occurrences
- [ ] `src/lib/api.ts` - 2 occurrences
- [ ] `src/lib/printAnnotated.ts` - 1 occurrences
- [ ] `src/lib/prompts/extractor.ts` - 1 occurrences
- [ ] `src/lib/api/piiGuard.ts` - 2 occurrences
- [ ] `src/lib/docx.ts` - 1 occurrences
- [ ] `src/pages/Submission.tsx` - 4 occurrences
- [ ] `src/pages/Help.tsx` - 5 occurrences

### Console.log Statements (Remove)

- [ ] src/test/helpers.tsx:189:  console.log = vi.fn();
- [ ] src/test/helpers.tsx:196:      console.log = originalConsole.log;
- [ ] src/components/CreateAssignmentModal.tsx:29:      console.log('✅ Assignment created successfully');
- [ ] src/components/CreateAssignmentModal.tsx:49:    console.log('📝 Creating assignment:', { title: title.trim(), document_type: documentType, has_criteria: !!criteria.trim() });
- [ ] src/components/CriteriaInput.tsx:39:  console.log('📤 Sending to enhance-rubric:', requestBody);
- [ ] src/components/CriteriaInput.tsx:74:    console.log('🎯 Enhance With AI clicked - Total Points:', totalPoints);
- [ ] src/components/CriteriaInput.tsx:78:      console.log('✅ Enhanced rubric received:', enhanced.substring(0, 100) + '...');
- [ ] src/components/VerbatimViewer.tsx:100:    console.log('Add annotation not yet implemented');
- [ ] src/lib/calculator/rubricParser.ts:34:  console.log('Extracted categories:');
- [ ] src/lib/calculator/rubricParser.ts:36:    console.log(`  - ${cat.name}: ${cat.points} pts (line ${cat.startLine})`);
- [ ] src/lib/calculator/rubricParser.ts:51:  console.log('Parsed criteria details:');
- [ ] src/lib/calculator/rubricParser.ts:53:    console.log(`  - ${c.name}: max_points=${c.max_points}, weight=${c.weight}, levels=${c.levels.length}`);
- [ ] src/lib/calculator/rubricParser.ts:55:      console.log(`    → ${l.label}: ${l.points} pts`);
- [ ] src/lib/calculator/rubricParser.ts:61:  console.log(`Calculated total max points: ${calculatedTotal} (expected: ${finalTotal})`);
- [ ] src/lib/calculator/rubricParser.ts:69:    console.log(`Scale factor: ${scaleFactor.toFixed(4)}`);
- [ ] src/lib/calculator/rubricParser.ts:84:      console.log(`  Scaled ${criterion.name}: ${originalMax} → ${criterion.max_points} pts`);
- [ ] src/lib/calculator/rubricParser.ts:89:    console.log(`New calculated total: ${newTotal.toFixed(2)}`);
- [ ] src/lib/docx.ts:92:    console.log('Unknown file type, defaulting to DOCX extraction');

## Component Quality

### Large Components (>300 lines)

- [ ] `src/components/AnnotatedTextViewer.tsx` -      301 lines (refactor to smaller components)
- [ ] `src/components/GradePanel.tsx` -      487 lines (refactor to smaller components)
- [ ] `src/components/bridge/BridgeManager.tsx` -      420 lines (refactor to smaller components)
- [ ] `src/components/AnnotationToolbar.tsx` -      408 lines (refactor to smaller components)
- [ ] `src/components/AnnotationViewer.tsx` -      380 lines (refactor to smaller components)
- [ ] `src/components/VerbatimViewer.tsx` -      448 lines (refactor to smaller components)
- [ ] `src/components/SettingsModal.tsx` -      309 lines (refactor to smaller components)
- [ ] `src/pages/Dashboard.tsx` -      525 lines (refactor to smaller components)
- [ ] `src/pages/Submission.tsx` -      688 lines (refactor to smaller components)
- [ ] `src/pages/Help.tsx` -      431 lines (refactor to smaller components)

## Testing Coverage

**Current Coverage:** ~4% test files
**Target:** 75%+ (per .windsurf/rules/testing.md)

