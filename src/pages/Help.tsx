import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Upload, Sparkles, FileText, Printer, Settings, Image, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8" />
                Help Guide
              </h1>
              <p className="text-blue-100 text-sm mt-1">Simple guide for teachers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction */}
        <Card className="mb-6 shadow-xl border-t-4 border-t-indigo-500">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
            <CardTitle className="text-2xl">Welcome to FastAI Grader! 👋</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              FastAI Grader is your helpful assistant for grading 6th grade essays. Think of it as a smart helper that reads student essays and gives you suggestions for grades and feedback. You're always in control and can change anything the AI suggests!
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
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Click "New Submission"</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    On the main page (Dashboard), click the blue <strong>"New Submission"</strong> button in the top right corner.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Enter Student Information</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Fill in the student's name (required). Student ID and Assignment are optional but helpful for keeping track.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Tip:</strong> If you've created assignments, select one from the dropdown to automatically fill in grading criteria!
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
                      <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <strong className="text-gray-900 dark:text-white">Image/PDF:</strong>
                        <span className="text-gray-700 dark:text-gray-300"> Upload a photo of handwritten work</span>
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
                  <div className="mt-3 bg-teal-50 dark:bg-teal-950 p-3 rounded-lg border border-teal-200 dark:border-teal-800">
                    <p className="text-sm text-teal-900 dark:text-teal-100">
                      <strong>📸 For handwritten essays:</strong> After uploading, click <strong>"Enhance Text"</strong> to clean up any OCR mistakes!
                    </p>
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
          <CardContent className="pt-6 space-y-6">
            {/* Assignments */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                📁 Creating Assignments
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Save time by creating assignments with pre-set grading criteria:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Click <strong>"New Assignment"</strong> on the Dashboard</li>
                <li>Give it a name (e.g., "Persuasive Essay #1")</li>
                <li>Add grading criteria (or use AI to enhance it)</li>
                <li>Now when grading, select this assignment and criteria auto-fills!</li>
              </ol>
            </div>

            {/* Draft Comparison */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                📝 Draft Comparison Mode
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Compare a student's rough draft to their final draft to see improvement. Toggle to <strong>"Draft Comparison"</strong> mode at the top of the grading page.
              </p>
            </div>

            {/* PDF Annotations */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                PDF Annotations (New!)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                For PDF and Word document submissions, use the <strong>"Annotate"</strong> tab to mark up the actual student document with highlights, drawings, and comments!
              </p>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800 space-y-2">
                <p className="font-semibold text-purple-900 dark:text-purple-100">Available Tools:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-purple-800 dark:text-purple-200 ml-4">
                  <li><strong>Highlight:</strong> Mark important sections in 6 different colors</li>
                  <li><strong>Pen:</strong> Draw freehand to circle errors or underline text</li>
                  <li><strong>Comments:</strong> Add detailed feedback boxes directly on the PDF</li>
                  <li><strong>Eraser:</strong> Remove any annotation you don't want</li>
                </ul>
                <p className="text-sm text-purple-800 dark:text-purple-200 mt-2">
                  <strong>Tip:</strong> Click the <strong>"Help"</strong> button in the annotation toolbar for detailed instructions on using each tool!
                </p>
              </div>
            </div>

            {/* Print/Download */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Print or Download
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                After grading, use the <strong>"Print"</strong> or <strong>"Download"</strong> buttons to save a nice-looking report. For annotated PDFs, use the <strong>"Export PDF"</strong> button in the Annotate tab to download the marked-up version.
              </p>
            </div>

            {/* Grouped View */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                📁 Organizing by Assignment
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                The Dashboard has two view modes to help you organize submissions:
              </p>
              <div className="space-y-3 ml-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">📋 List View</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Shows all submissions in one sortable table. Great for seeing everything at once or sorting by student name, grade, or date.
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-semibold text-green-900 dark:text-green-100 mb-1">📂 By Assignment View</p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Groups submissions by assignment. Click on an assignment folder to expand and see all student submissions for that assignment. Perfect when you want to review all essays for a specific assignment together!
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                <strong>Tip:</strong> Use the buttons at the top of the submissions card to switch between views.
              </p>
            </div>

            {/* Dashboard Features */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                📊 Other Dashboard Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li><strong>Sort:</strong> Click any column header to sort by that column (in List View)</li>
                <li><strong>Search:</strong> Use the search box to find specific students</li>
                <li><strong>Delete Submission:</strong> Click the trash icon next to a submission to remove it</li>
                <li><strong>Delete Assignment:</strong> Click the trash icon on an assignment folder to delete the entire assignment and all its submissions</li>
                <li><strong>Export:</strong> Download all grades as a CSV file for your records</li>
              </ul>
            </div>

            {/* Image Support in Draft Comparison */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                <Image className="w-5 h-5" />
                Handwritten Essays in Draft Comparison
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                You can now upload handwritten essays for BOTH rough and final drafts!
              </p>
              <div className="bg-teal-50 dark:bg-teal-950 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
                <p className="text-sm text-teal-900 dark:text-teal-100 mb-2">
                  <strong>How it works:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-teal-800 dark:text-teal-200 ml-4">
                  <li>Upload an image for rough draft → see image and text side-by-side</li>
                  <li>Upload an image for final draft → see image and text side-by-side</li>
                  <li>Click "Enhance Text" on either draft to clean up OCR errors</li>
                  <li>Compare handwritten rough draft to handwritten final draft visually!</li>
                </ul>
              </div>
            </div>

            {/* AI Settings */}
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                AI Settings (Advanced)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Click the gear icon (⚙️) in the Dashboard header to customize how the AI works:
              </p>
              <div className="space-y-3 ml-4">
                <div className="bg-indigo-50 dark:bg-indigo-950 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">Essay Grading Prompt</p>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                    Customize how the AI grades essays. Change the tone, focus areas, or grading approach.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">OCR Cleanup Prompt</p>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Control how the AI cleans up text from handwritten essays. Adjust how strict or lenient it is.
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-950 p-3 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="font-semibold text-pink-900 dark:text-pink-100 mb-1">Rubric Enhancement Prompt</p>
                  <p className="text-sm text-pink-800 dark:text-pink-200">
                    Adjust how the AI transforms your simple grading rules into detailed rubrics.
                  </p>
                </div>
              </div>
              <div className="mt-3 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>⚡ Changes take effect immediately!</strong> Your custom prompts are used right away - no need to redeploy or restart anything.
                </p>
              </div>
            </div>
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
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-purple-900 dark:text-purple-100">
                  <strong>Use PDF annotations:</strong> The Annotate tab lets you mark up PDFs just like grading on paper. Highlights, drawings, and comments all save automatically and export with the PDF!
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-indigo-900 dark:text-indigo-100">
                  <strong>Customize AI behavior:</strong> Use the Settings (⚙️) to adjust how the AI grades if you want it more strict, more encouraging, or focused on different areas.
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

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button 
            onClick={() => navigate(-1)}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Grading
          </Button>
        </div>
      </div>
    </div>
  );
}
