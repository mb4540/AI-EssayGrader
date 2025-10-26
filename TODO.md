# FastAI Grader - To-Do List

**Last Updated:** 2025-10-08  
**Current Branch:** `feature/additional-enhancements`  
**Status:** Ready for next development session

---

## 🔴 High Priority Tasks

### 1. Fix Blob Storage for Image Persistence
**Status:** Not Working  
**Issue:** Images are not being persisted after upload

**Investigation Needed:**
- Check if `ALLOW_BLOB_STORAGE` environment variable is set correctly
- Verify Netlify Blobs configuration
- Test image upload flow in both localhost and production
- Check `upload-image` Netlify function
- Verify database stores image URLs correctly
- Test image retrieval on submission view

**Files to Review:**
- `netlify/functions/upload-image.ts`
- `src/pages/Submission.tsx` (handleTextExtracted, uploadImage)
- `.env` (ALLOW_BLOB_STORAGE setting)
- Netlify environment variables

**Expected Behavior:**
- Upload image → OCR extracts text → Image stored in Netlify Blobs
- Image URL saved to database
- Image displays on subsequent views of submission
- Works for Single Essay and Draft Comparison modes

---

### 2. Add Google Cloud Document AI API for OCR
**Status:** Not Started  
**Goal:** Provide alternative to Tesseract.js for better OCR accuracy

**Requirements:**
- Add Google Cloud Document AI as optional OCR provider
- Allow user to choose between Tesseract.js and Google Cloud
- Add settings toggle in Settings modal
- Store API credentials securely
- Maintain backward compatibility with Tesseract.js

**Implementation Steps:**
1. Add Google Cloud Document AI SDK to dependencies
2. Create new Netlify function for Google Cloud OCR
3. Add settings option to choose OCR provider
4. Update VerbatimViewer to use selected provider
5. Add Google Cloud API key to environment variables
6. Update documentation

**Files to Create/Modify:**
- `netlify/functions/google-ocr.ts` (new)
- `src/components/SettingsModal.tsx` (add OCR provider toggle)
- `src/components/VerbatimViewer.tsx` (support both providers)
- `.env.example` (add GOOGLE_CLOUD_API_KEY)
- `src/pages/Help.tsx` (document new option)

**Benefits:**
- Better OCR accuracy for handwritten text
- Faster processing
- Support for more languages
- Better handling of complex layouts

---

### 3. Code Cleanup and Refactoring
**Status:** Not Started  
**Goal:** Improve code quality, remove duplication, optimize performance

**Areas to Address:**

#### A. Code Organization
- [ ] Review all components for single responsibility
- [ ] Extract common utilities to shared files
- [ ] Consolidate API calls into centralized service
- [ ] Review and optimize state management

#### B. Performance Optimization
- [ ] Implement code splitting (reduce bundle size from 940KB)
- [ ] Lazy load routes and heavy components
- [ ] Optimize image loading and caching
- [ ] Review and optimize re-renders

#### C. Type Safety
- [ ] Review all TypeScript types
- [ ] Add missing type definitions
- [ ] Remove any `any` types
- [ ] Ensure proper error handling types

#### D. Code Quality
- [ ] Remove console.logs in production
- [ ] Add JSDoc comments to complex functions
- [ ] Standardize error handling
- [ ] Review and improve accessibility

#### E. Testing
- [ ] Add unit tests for utility functions
- [ ] Add integration tests for API calls
- [ ] Test error scenarios
- [ ] Test edge cases

**Files to Review:**
- All files in `src/components/`
- All files in `src/lib/`
- All files in `netlify/functions/`
- `src/pages/` components

---

### 4. Add Login and Multi-Tenancy
**Status:** Not Started  
**Goal:** Support multiple teachers with separate data

**Requirements:**

#### A. Authentication
- Choose auth provider (Netlify Identity, Auth0, Clerk, Supabase Auth)
- Implement login/logout flow
- Protect routes requiring authentication
- Add user profile management

#### B. Multi-Tenancy
- Add `user_id` or `teacher_id` to all database tables
- Filter all queries by current user
- Ensure data isolation between users
- Add user management for admins

#### C. Database Schema Changes
**Tables to Update:**
```sql
-- Add user_id to submissions
ALTER TABLE grader.submissions ADD COLUMN user_id TEXT;

-- Add user_id to assignments
ALTER TABLE grader.assignments ADD COLUMN user_id TEXT;

-- Create users table (if not using external auth)
CREATE TABLE grader.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### D. UI Changes
- Add login page
- Add user profile dropdown in header
- Add "My Account" settings page
- Update Dashboard to show only user's submissions
- Add user switcher for admins (optional)

#### E. Security Considerations
- Implement row-level security in database
- Validate user ownership on all API calls
- Prevent cross-user data access
- Secure API endpoints with auth tokens

**Files to Create/Modify:**
- `src/pages/Login.tsx` (new)
- `src/pages/Profile.tsx` (new)
- `src/lib/auth.ts` (new)
- All Netlify functions (add user validation)
- Database migration scripts
- `src/App.tsx` (add auth context)

**Migration Plan:**
1. Choose and implement auth provider
2. Create users table and migration
3. Add user_id to existing tables
4. Update all API functions to filter by user
5. Add login UI
6. Test thoroughly before production

---

## 📋 Additional Nice-to-Have Features

### 5. Export Individual Submission Reports
- Generate PDF reports for individual submissions
- Include essay, grade, and feedback
- Professional formatting for parent communication

### 6. Bulk Operations
- Grade multiple submissions at once
- Bulk delete submissions
- Bulk export to CSV

### 7. Analytics Dashboard
- Average grades by assignment
- Student progress over time
- Common grammar issues
- Grading trends

### 8. Email Notifications
- Email grade reports to students/parents
- Notify when grading is complete
- Weekly summary for teachers

### 9. Assignment Templates
- Pre-built rubrics for common essay types
- Share templates between teachers
- Import/export rubrics

### 10. Mobile Optimization
- Responsive design improvements
- Mobile-specific UI for grading on tablets
- Touch-friendly controls

---

## 🐛 Known Issues

### Image Persistence (Priority 1)
- Images not persisting after upload
- Need to debug blob storage

### Bundle Size Warning
- Main bundle is 940KB (should be < 500KB)
- Need code splitting implementation

---

## 📝 Notes from Last Session

### Recent Accomplishments (2025-10-08)
1. ✅ Component consolidation - VerbatimViewer reuse
2. ✅ Layout improvements - full width essays
3. ✅ Side-by-side image view for all drafts
4. ✅ Delete assignment feature
5. ✅ AI Settings modal with live customization
6. ✅ Updated Help page documentation
7. ✅ Safe Code Release automation

### Current State
- **Branch:** `feature/additional-enhancements`
- **Last Deploy:** Help page update to production
- **Build Status:** ✅ Passing
- **TypeScript:** ✅ No errors

### Environment
- **OpenAI Model:** gpt-4o-mini (configurable)
- **Database:** Neon PostgreSQL
- **Hosting:** Netlify
- **OCR:** Tesseract.js (client-side)

---

## 🚀 Getting Started Next Session

1. **Check Netlify Deployment:**
   - Verify latest changes deployed successfully
   - Test all features in production

2. **Start with Priority 1:**
   - Debug blob storage issue
   - Get images persisting correctly

3. **Review Code:**
   - Check for any issues from production
   - Review user feedback (if any)

4. **Plan Next Feature:**
   - Decide which task to tackle next
   - Create feature branch if needed

---

## 📚 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run Safe Code Release
./scripts/backup_and_promote.sh

# Create new feature branch
git checkout -b feature/your-feature-name
git push -u origin feature/your-feature-name

# Check current status
git status
git branch -a
```

---

## 🔗 Important Links

- **GitHub Repo:** https://github.com/mb4540/FastAIGrader
- **Netlify Dashboard:** (check your Netlify account)
- **Neon Database:** (check your Neon dashboard)
- **OpenAI API:** (check usage and costs)

---

**Remember:** Always test locally before deploying to production!
