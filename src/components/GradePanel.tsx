import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Loader2, CheckCircle, Calculator } from 'lucide-react';
import type { Feedback } from '@/lib/schema';
import type { ComputedScores, ExtractedScoresJSON } from '@/lib/calculator/types';

interface GradePanelProps {
  aiFeedback: Feedback | null;
  isGrading: boolean;
  teacherGrade: number | undefined;
  setTeacherGrade: (grade: number) => void;
  teacherFeedback: string;
  setTeacherFeedback: (feedback: string) => void;
  onRunGrade: () => void;
  onSaveEdits: () => void;
  canGrade: boolean;
  isSaving: boolean;
}

export default function GradePanel({
  aiFeedback,
  isGrading,
  teacherGrade,
  setTeacherGrade,
  teacherFeedback,
  setTeacherFeedback,
  onRunGrade,
  onSaveEdits,
  canGrade,
  isSaving,
}: GradePanelProps) {
  return (
    <Card className="h-full shadow-lg border-l-4 border-purple-500 bg-white dark:bg-slate-800">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-300 text-sm">⭐</span>
          </div>
          Grade & Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* AI Grading Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-500">🤖</span> AI Assessment
            </h3>
            <Button 
              onClick={onRunGrade} 
              disabled={!canGrade || isGrading}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGrading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Grading...
                </>
              ) : (
                'Run Grade'
              )}
            </Button>
          </div>

          {aiFeedback && (
            <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-inner">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Overall Grade</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {aiFeedback.overall_grade}
                  </p>
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
              </div>

              {/* BulletProof Grading Breakdown */}
              {(aiFeedback as any).bulletproof?.extracted_scores && (aiFeedback as any).bulletproof?.computed_scores && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <span>Detailed Breakdown</span>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                      BulletProof
                    </span>
                  </p>
                  
                  {/* Per-Criterion Scores */}
                  <div className="space-y-3 mb-4">
                    {((aiFeedback as any).bulletproof.extracted_scores as ExtractedScoresJSON).scores.map((score, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{score.criterion_id}</span>
                          <div className="text-right">
                            <span className="font-bold text-purple-600 dark:text-purple-400">{score.points_awarded}</span>
                            <span className="text-xs text-gray-500 ml-1">pts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            {score.level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{score.rationale}</p>
                      </div>
                    ))}
                  </div>

                  {/* Computed Scores */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">FINAL CALCULATION</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Raw Score:</span>
                        <span className="font-mono font-medium">
                          {((aiFeedback as any).bulletproof.computed_scores as ComputedScores).raw_points} / {((aiFeedback as any).bulletproof.computed_scores as ComputedScores).max_points}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percentage:</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {((aiFeedback as any).bulletproof.computed_scores as ComputedScores).percent}%
                        </span>
                      </div>
                      {((aiFeedback as any).bulletproof.computed_scores as ComputedScores).final_points && (
                        <div className="flex justify-between border-t pt-2">
                          <span>Final Points:</span>
                          <span className="font-mono font-bold text-lg text-purple-700 dark:text-purple-300">
                            {((aiFeedback as any).bulletproof.computed_scores as ComputedScores).final_points}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 font-mono">
                      ✓ Calculated with {(aiFeedback as any).bulletproof.calculator_version}
                    </p>
                  </div>
                </div>
              )}

              {/* Legacy Category Scores (fallback) */}
              {aiFeedback.rubric_scores && aiFeedback.rubric_scores.length > 0 && !(aiFeedback as any).bulletproof && (
                <div>
                  <p className="text-sm font-medium mb-2">Category Scores</p>
                  <div className="space-y-2">
                    {aiFeedback.rubric_scores.map((score, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="flex justify-between">
                          <span>{score.category}</span>
                          <span className="font-medium">{score.score}/100</span>
                        </div>
                        {score.comments && (
                          <p className="text-xs text-muted-foreground mt-1">{score.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft Comparison Feedback */}
              {aiFeedback.improvement_summary && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-xs">
                      IMPROVEMENT ANALYSIS
                    </span>
                  </p>
                  <p className="text-sm mb-3">{aiFeedback.improvement_summary}</p>
                  
                  {aiFeedback.growth_percentage !== undefined && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium">Growth:</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${aiFeedback.growth_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {aiFeedback.growth_percentage}%
                      </span>
                    </div>
                  )}

                  {aiFeedback.areas_improved && aiFeedback.areas_improved.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">✓ Areas Improved:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {aiFeedback.areas_improved.map((area, idx) => (
                          <li key={idx} className="text-xs text-green-600 dark:text-green-400">{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiFeedback.areas_still_need_work && aiFeedback.areas_still_need_work.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">⚠ Still Needs Work:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {aiFeedback.areas_still_need_work.map((area, idx) => (
                          <li key={idx} className="text-xs text-orange-600 dark:text-orange-400">{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Summary</p>
                <p className="text-sm">{aiFeedback.supportive_summary}</p>
              </div>

              {aiFeedback.top_3_suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Top Suggestions</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiFeedback.top_3_suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiFeedback.grammar_findings.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Grammar</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiFeedback.grammar_findings.slice(0, 5).map((finding, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiFeedback.spelling_findings.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Spelling</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiFeedback.spelling_findings.slice(0, 5).map((finding, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiFeedback.structure_findings.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Structure</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiFeedback.structure_findings.slice(0, 5).map((finding, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Teacher Override Section */}
        <div className="space-y-4 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
            <span className="text-green-500">👨‍🏫</span> Teacher Final Grade
          </h3>
          
          <div className="space-y-2 bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
            <Label htmlFor="teacher-grade" className="text-gray-700 dark:text-gray-300 font-medium">
              Final Grade (0-100)
            </Label>
            <Input
              id="teacher-grade"
              type="number"
              min="0"
              max="100"
              value={teacherGrade ?? ''}
              onChange={(e) => setTeacherGrade(Number(e.target.value))}
              placeholder={aiFeedback ? aiFeedback.overall_grade.toString() : ''}
              className="text-2xl font-bold text-center border-2 focus:border-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher-feedback" className="text-gray-700 dark:text-gray-300 font-medium">
              Teacher Comments
            </Label>
            <Textarea
              id="teacher-feedback"
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              placeholder="Add your own comments or edit AI feedback..."
              className="min-h-[120px] border-2 focus:border-green-400"
            />
          </div>

          <Button 
            onClick={onSaveEdits} 
            disabled={isSaving || (teacherGrade === undefined && !teacherFeedback)}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Save Final Grade
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
