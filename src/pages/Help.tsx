import { BookOpen, Sparkles, FileText, Printer, Image, PenTool, LayoutDashboard, GraduationCap, Users, Shield, Download, Lock, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';

export default function Help() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
          title="Help Guide"
          subtitle="Simple guide for teachers"
        />
        {/* Introduction */}
        <Card className="mb-6 shadow-xl border-t-4 border-t-indigo-500">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
            <CardTitle className="text-2xl">Welcome to EssayEase! 👋</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              EssayEase is your intelligent grading assistant for all core subjects. Whether you're grading History essays, English papers, or Science reports, EssayEase reads student work and provides suggested grades and feedback. You're always in control and can change anything the AI suggests!
            </p>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="mb-6 shadow-xl border-t-4 border-t-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600" />
              Quick Start: Grade Your First Essay
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Go to the Grade Tab</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Click <strong>"Grade"</strong> in the top navigation bar. This is where you'll enter student work and get AI-assisted grading.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Select Student & Assignment</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Choose a student from the <strong>"Select Student"</strong> dropdown (requires unlocking your Bridge first). Optionally select an <strong>Assignment</strong> to auto-fill grading criteria.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Tip:</strong> No students yet? Go to the <strong>Students</strong> tab first to add your roster and unlock the Bridge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Add Grading Criteria</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Type in simple rules for grading. For example:
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800 font-mono text-sm">
                    <p className="text-amber-900 dark:text-amber-100">
                      "Check grammar, organization, and evidence. 100 points total."
                    </p>
                  </div>
                  <div className="mt-3 bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-900 dark:text-purple-100">
                      <strong>✨ Pro Tip:</strong> Click <strong>"Enhance With AI"</strong> to turn your simple rules into a detailed rubric automatically!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Upload the Student Essay</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    You have three easy options:
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <strong className="text-gray-900 dark:text-white">Text:</strong>
                        <span className="text-gray-700 dark:text-gray-300"> Copy and paste the essay directly</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Image className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <strong className="text-gray-900 dark:text-white">Image/PDF:</strong>
                        <span className="text-gray-700 dark:text-gray-300"> Upload a photo of handwritten work. Use the "AI Vision" toggle for best results with handwriting!</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <strong className="text-gray-900 dark:text-white">DOCX:</strong>
                        <span className="text-gray-700 dark:text-gray-300"> Upload a Word document</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Click "Run Grade"</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    The AI will read the essay and suggest a grade with detailed feedback. This usually takes 10-30 seconds.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center font-bold text-green-600 dark:text-green-300">
                  6
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Review and Adjust</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Look at the AI's suggestions. You can:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                    <li>Change the grade if you disagree</li>
                    <li>Edit or add to the feedback</li>
                    <li>Keep the AI's suggestions as-is</li>
                  </ul>
                  <div className="mt-3 bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      <strong>✅ Remember:</strong> You're the teacher! The AI is just making suggestions. Your judgment is what matters.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center font-bold text-green-600 dark:text-green-300">
                  7
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Save Your Grade</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Click <strong>"Save Final Grade"</strong> when you're happy with everything. The grade is now saved!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <Card className="mb-6 shadow-xl border-t-4 border-t-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <CardTitle className="text-2xl">Advanced Features</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            
            {/* Quick Links */}
            <div className="flex gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Jump to:</span>
              <a href="#dashboard-features" className="text-indigo-600 hover:underline">Dashboard</a>
              <span>•</span>
              <a href="#grade-features" className="text-indigo-600 hover:underline">Grade Tab</a>
              <span>•</span>
              <a href="#student-features" className="text-indigo-600 hover:underline">Students Tab (FERPA)</a>
            </div>

            {/* Dashboard Features */}
            <section id="dashboard-features" className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Dashboard Tab</h3>
              </div>
              
              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">View Modes</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Organize your submissions exactly how you want using the view toggle buttons:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">📋 List View</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      See everything at once. Sort by name, grade, or date by clicking column headers.
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">📂 By Assignment</p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Groups submissions into folders by assignment title. Great for grading a whole class set!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Management Tools</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li><strong>Delete Submission:</strong> Click the trash icon next to any submission to remove it permanently.</li>
                  <li><strong>Delete Assignment:</strong> In Assignment View, deleting a folder deletes ALL submissions inside it. Use with caution!</li>
                  <li><strong>Export CSV:</strong> Download all grades to a spreadsheet for your gradebook.</li>
                  <li><strong>AI Settings (⚙️):</strong> Click the gear icon to customize grading prompts, strictness, and more. Changes apply instantly!</li>
                </ul>
              </div>
            </section>

            {/* Grade Tab Features */}
            <section id="grade-features" className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 pt-4">
                <GraduationCap className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Grade Tab</h3>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Creating Assignments</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Save time by clicking <strong>"New Assignment"</strong> on the Dashboard first. You can pre-set the rubric once, and then just select that assignment from the dropdown when grading each student.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Draft Comparison</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Toggle <strong>"Draft Comparison"</strong> mode to upload a Rough Draft and a Final Draft side-by-side. The AI will grade the improvement between versions! Works for both typed text and handwritten images.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">PDF Annotations</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  For PDF/Word uploads, click the <strong>"Annotate"</strong> tab to mark up the paper directly:
                </p>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800 flex flex-wrap gap-4">
                  <span className="flex items-center gap-1 text-sm text-purple-900 dark:text-purple-100"><PenTool className="w-4 h-4"/> <strong>Highlight & Draw</strong></span>
                  <span className="flex items-center gap-1 text-sm text-purple-900 dark:text-purple-100"><FileText className="w-4 h-4"/> <strong>Add Comments</strong></span>
                  <span className="flex items-center gap-1 text-sm text-purple-900 dark:text-purple-100"><Printer className="w-4 h-4"/> <strong>Export with Markups</strong></span>
                </div>
              </div>
            </section>

            {/* Students Tab Features (FERPA) */}
            <section id="student-features" className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 pt-4">
                <Users className="w-6 h-6 text-amber-600" />
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Students Tab & Security</h3>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Shield className="w-8 h-8 text-amber-600 mt-1" />
                  <div>
                    <h4 className="font-bold text-lg text-amber-900 dark:text-amber-100 mb-2">🛡️ FERPA Compliance & The "Bridge" File</h4>
                    <p className="text-amber-800 dark:text-amber-200 mb-3">
                      EssayEase takes student privacy seriously. We use a unique <strong>"Bridge" system</strong> to keep student names safe:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-amber-800 dark:text-amber-200 text-sm">
                      <li><strong>Names stay local:</strong> Student names are encrypted in a file on YOUR computer. They are never sent to our cloud servers.</li>
                      <li><strong>Cloud sees IDs only:</strong> Our servers only see random codes (UUIDs). We don't know who "Student 12345" is—only you do!</li>
                      <li><strong>You hold the key:</strong> You must "Unlock" the Bridge with your passphrase every time you grade to see names.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Managing Your Bridge File</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  Because student names are stored locally, <strong>you must use the same computer</strong> (or transfer the Bridge file) to see your student roster.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2"><Download className="w-4 h-4" /> Export Bridge</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Save a backup copy to a secure USB drive or school network drive. Do this regularly!
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1 flex items-center gap-2"><Lock className="w-4 h-4" /> Import Bridge</p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Restore your roster on a new computer by importing your backup file.
                    </p>
                  </div>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li><strong>Lost passphrase:</strong> Since we don't store your data, we cannot reset your Bridge passphrase. Keep it safe!</li>
                  <li><strong>Class periods:</strong> Organize students by class period for easier filtering on the Dashboard.</li>
                  <li><strong>Bulk import:</strong> Use CSV import to add many students at once from your gradebook export.</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <Key className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">Passphrase Best Practices</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                      <li>Use a strong, memorable passphrase (e.g., a sentence only you know)</li>
                      <li>Consider rotating your passphrase each grading period</li>
                      <li>Always lock the Bridge when stepping away from your computer</li>
                      <li>Log out of EssayEase at the end of each session</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

          </CardContent>
        </Card>

        {/* Tips & Tricks */}
        <Card className="mb-6 shadow-xl border-t-4 border-t-amber-500">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950">
            <CardTitle className="text-2xl">💡 Tips & Tricks</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-900 dark:text-blue-100">
                  <strong>Start simple:</strong> Your grading criteria doesn't need to be perfect. Just write what you care about, and let AI help expand it.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-900 dark:text-green-100">
                  <strong>Review AI suggestions:</strong> The AI is smart but not perfect. Always read through its feedback before saving.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-purple-900 dark:text-purple-100">
                  <strong>Use assignments:</strong> Create assignments for essays you grade repeatedly. It saves tons of time!
                </p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-950 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                <p className="text-pink-900 dark:text-pink-100">
                  <strong>Handwritten essays:</strong> Take a clear photo in good lighting for best OCR results.
                </p>
              </div>
              <div className="bg-teal-50 dark:bg-teal-950 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
                <p className="text-teal-900 dark:text-teal-100">
                  <strong>Delete assignments carefully:</strong> When you delete an assignment, ALL submissions for that assignment are also deleted. Always double-check before confirming!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need More Help */}
        <Card className="shadow-xl border-t-4 border-t-red-500">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
            <CardTitle className="text-2xl">❓ Still Have Questions?</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Don't worry! This tool is designed to be simple. Just start with the basics:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4 mt-4 text-lg">
              <li>Enter student name</li>
              <li>Add grading rules</li>
              <li>Upload essay</li>
              <li>Click "Run Grade"</li>
              <li>Review and save</li>
            </ol>
            <p className="text-gray-700 dark:text-gray-300 text-lg mt-4">
              You'll get the hang of it after grading just one or two essays! 🎉
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
