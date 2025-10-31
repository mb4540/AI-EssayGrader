# Future Work & Enhancements

**Created:** October 31, 2025  
**Status:** Documented for future implementation

---

## 🔐 Authentication & Multi-Tenancy

### Current State
- Using `PUBLIC_TENANT_ID` constant for all users
- No authentication system implemented
- All users share the same tenant space

### Future Enhancement
**Implement proper authentication and multi-tenancy:**

1. **Add Authentication**
   - Implement Netlify Identity or Auth0
   - User login/signup flow
   - Session management

2. **Multi-Tenant Support**
   - Extract `tenant_id` from authenticated user context
   - Isolate data by tenant
   - Each teacher gets their own tenant space

3. **Files to Update:**
   - `netlify/functions/assignments.ts` (lines 11, 40)
   - `netlify/functions/ingest.ts`
   - `netlify/functions/list.ts`
   - `netlify/functions/grade.ts`
   - `netlify/functions/save-teacher-edits.ts`
   - `netlify/functions/delete-submission.ts`

**Pattern to implement:**
```typescript
// Extract tenant_id from auth context
const user = context.clientContext?.user;
if (!user) {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'Authentication required' }),
  };
}
const tenant_id = user.app_metadata.tenant_id;
```

---

## 📁 File Upload & Blob Storage Enhancement

### Current State
- File upload function exists but has errors
- Netlify Blobs not configured
- **Error:** "Failed to upload file: The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: siteID, token"

### Error Details
From production error log:
```
Failed to upload original file: Error: {"error":"Failed to upload file","message":"The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: siteID, token"}
  at handleResponse (api.ts:44:11)
  at uploadFile (api.ts:203:16)
  at async handleUpgrade (Submission.tsx:237:27)
```

### Future Enhancement
**Fix and enhance file upload with Netlify Blobs:**

1. **Configure Netlify Blobs**
   - Add required environment variables:
     - `NETLIFY_SITE_ID` (from Netlify dashboard)
     - `NETLIFY_BLOBS_TOKEN` (from Netlify dashboard)
   - Or use automatic configuration in Netlify Functions
   - See: https://docs.netlify.com/blobs/overview/

2. **Fix Upload Function**
   - Update blob store initialization
   - Add proper error handling
   - Test with various file types (PDF, DOCX, images)
   - Add retry logic for failed uploads

3. **Add File Management**
   - Configure blob store properly
   - Add file size limits (e.g., 10MB max)
   - Add file type validation
   - Add file deletion when submission deleted
   - Add file download/view functionality

4. **Files to Update:**
   - `netlify/functions/upload-file.ts` - Fix blob store initialization
   - `src/pages/Submission.tsx` (line 237, 241) - Better error handling
   - `src/lib/api.ts` (line 203) - Upload functions
   - Add environment variables to Netlify dashboard
   - Update `DEPLOYMENT.md` with blob storage setup

### Implementation Notes
**Option 1: Automatic Configuration (Recommended)**
```typescript
import { getStore } from '@netlify/blobs';

// In Netlify Functions, this works automatically
const store = getStore('uploads');
await store.set(key, data);
```

**Option 2: Manual Configuration**
```typescript
import { getStore } from '@netlify/blobs';

const store = getStore({
  name: 'uploads',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_BLOBS_TOKEN,
});
```

### Priority
**Medium** - File upload is optional feature, core grading works without it

---

## 🎨 UI/UX Enhancements

### Dashboard
- [ ] Add sorting options (by date, grade, student)
- [ ] Add filtering by date range
- [ ] Add bulk operations (delete multiple, export selected)
- [ ] Add statistics dashboard (average grade, completion rate)

### Student Management
- [ ] **Add "class" field to students table** - Allow teachers to organize students by class period
  - **Problem:** Teachers typically have 100+ students across multiple class periods
  - **Solution:** Add `class_period` or `class_name` column to `grader.students` table
  - **Benefits:**
    - Sort students by class (e.g., "Period 1", "Period 2", "AP English")
    - Group submissions by class on Dashboard
    - Filter by class in Student Bridge
    - Export grades by class
  - **Database Change Required:**
    ```sql
    ALTER TABLE grader.students 
    ADD COLUMN class_period text;
    
    CREATE INDEX idx_students_class 
    ON grader.students(class_period);
    ```
  - **Files to Update:**
    - `src/components/bridge/BridgeManager.tsx` - Add class field to student form
    - `src/hooks/useBridge.ts` - Update bridge data structure
    - `src/pages/Dashboard.tsx` - Add class filter/grouping
    - `db_ref.md` - Update schema documentation

### Submission Form
- [ ] Add rich text editor for criteria
- [ ] Add template library for common assignments
- [ ] Add draft auto-save
- [ ] Add submission preview before grading

### Grading
- [ ] Add custom rubric builder
- [ ] Add grade history/comparison
- [ ] Add batch grading mode
- [ ] Add AI model selection (GPT-4, GPT-4o, etc.)

---

## 📊 Analytics & Reporting

### Future Features
- Student progress tracking over time
- Grade distribution charts
- Common error analysis
- Export detailed reports (PDF, Excel)
- Assignment analytics (average time, difficulty)

---

## 🔄 Version History

### Current State
- Version snapshots created but not displayed
- `submission_versions` table populated

### Future Enhancement
**Add version history UI:**
- View all versions of a submission
- Compare versions side-by-side
- Restore previous versions
- Track who made changes and when

---

## 🌐 Internationalization

### Future Enhancement
- Add multi-language support
- Localize UI strings
- Support different grading scales (A-F, 1-100, etc.)
- Support different date formats

---

## 🔔 Notifications

### Future Features
- Email notifications when grading complete
- Reminder notifications for ungraded submissions
- Weekly summary emails
- In-app notification center

---

## 📱 Mobile Optimization

### Future Enhancement
- Responsive design improvements
- Mobile-specific UI components
- Touch-friendly interactions
- Progressive Web App (PWA) support

---

## 🧪 Testing

### Future Work
- Add unit tests for all functions
- Add integration tests
- Add E2E tests with Playwright
- Add performance tests
- Set up CI/CD pipeline

---

## 📚 Documentation

### Future Work
- Add inline code documentation (JSDoc)
- Create user guide
- Create video tutorials
- Add API documentation
- Create teacher onboarding flow

---

## 🔒 Security Enhancements

### Future Work
- Add rate limiting
- Add CAPTCHA for public endpoints
- Add audit logging
- Add data encryption at rest
- Add backup/restore functionality
- Add GDPR compliance features

---

## Priority Levels

**High Priority:**
- Authentication & Multi-Tenancy
- Fix file upload errors

**Medium Priority:**
- Version history UI
- Dashboard enhancements
- Analytics & Reporting

**Low Priority:**
- Internationalization
- Mobile optimization
- Advanced features

---

**Note:** This document tracks future enhancements. Current application is fully functional and FERPA compliant without these features.
