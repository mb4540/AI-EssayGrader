import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContextHelp from '@/components/help/ContextHelp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudentInfoCardProps {
    bridge: any; // Using any for now to avoid importing complex types, but ideally should be typed
    selectedStudentUuid: string;
    setSelectedStudentUuid: (uuid: string) => void;
    studentName: string;
    setStudentName: (name: string) => void;
    studentId: string;
    setStudentId: (id: string) => void;
    assignmentId: string | undefined;
    setAssignmentId: (id: string | undefined) => void;
    assignmentsData: any;
    setEditingAssignment: (assignment: any) => void;
    setIsEditModalOpen: (isOpen: boolean) => void;
}

const CLASS_PERIOD_STORAGE_KEY = 'grader_selected_class_period';

export function StudentInfoCard({
    bridge,
    selectedStudentUuid,
    setSelectedStudentUuid,
    studentName,
    setStudentName,
    studentId,
    setStudentId,
    assignmentId,
    setAssignmentId,
    assignmentsData,
    setEditingAssignment,
    setIsEditModalOpen
}: StudentInfoCardProps) {
    const navigate = useNavigate();
    
    // Class period filter state (persisted to localStorage)
    const [selectedClassPeriod, setSelectedClassPeriod] = useState<string>(() => {
        return localStorage.getItem(CLASS_PERIOD_STORAGE_KEY) || 'all';
    });

    // Persist class period selection
    useEffect(() => {
        localStorage.setItem(CLASS_PERIOD_STORAGE_KEY, selectedClassPeriod);
    }, [selectedClassPeriod]);

    // Get unique class periods from students
    const classPeriods = useMemo(() => {
        const periods = new Set<string>();
        bridge.students.forEach((s: any) => {
            if (s.classPeriod) periods.add(s.classPeriod);
        });
        // Also include class periods from bridge.getClassPeriods() if available
        if (bridge.getClassPeriods) {
            bridge.getClassPeriods().forEach((p: string) => periods.add(p));
        }
        return Array.from(periods).sort();
    }, [bridge.students, bridge.getClassPeriods]);

    // Filter students by selected class period
    const filteredStudents = useMemo(() => {
        if (selectedClassPeriod === 'all') {
            return bridge.students;
        }
        if (selectedClassPeriod === 'unassigned') {
            return bridge.students.filter((s: any) => !s.classPeriod);
        }
        return bridge.students.filter((s: any) => s.classPeriod === selectedClassPeriod);
    }, [bridge.students, selectedClassPeriod]);

    // Clear student selection if they're not in the filtered list
    useEffect(() => {
        if (selectedStudentUuid && selectedClassPeriod !== 'all') {
            const studentInFilter = filteredStudents.some((s: any) => s.uuid === selectedStudentUuid);
            if (!studentInFilter) {
                setSelectedStudentUuid('');
                setStudentName('');
                setStudentId('');
            }
        }
    }, [selectedClassPeriod, filteredStudents, selectedStudentUuid, setSelectedStudentUuid, setStudentName, setStudentId]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-300 text-sm">👤</span>
                    </div>
                    Student Information
                </div>
                <ContextHelp helpId="grade.studentInfo" />
            </h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="student-select" className="text-gray-700 dark:text-gray-300 font-medium">
                        Select Student <span className="text-red-500">*</span>
                    </Label>
                    {bridge.isLocked ? (
                        <div className="mt-1 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 mb-2">
                                🔒 Student roster is locked. Please unlock it first.
                            </p>
                            <Button
                                onClick={() => navigate('/bridge')}
                                variant="outline"
                                size="sm"
                                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                            >
                                Go to Students Page to Unlock
                            </Button>
                        </div>
                    ) : bridge.students.length === 0 ? (
                        <div className="mt-1 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 mb-2">
                                No students in roster. Please add students first.
                            </p>
                            <Button
                                onClick={() => navigate('/bridge')}
                                variant="outline"
                                size="sm"
                                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                                Go to Students Page
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Class Period Filter */}
                            {classPeriods.length > 0 && (
                                <div className="mb-3">
                                    <Label className="text-gray-600 dark:text-gray-400 text-sm">Filter by Class Period</Label>
                                    <Select
                                        value={selectedClassPeriod}
                                        onValueChange={setSelectedClassPeriod}
                                    >
                                        <SelectTrigger className="mt-1 border-gray-300 bg-gray-50">
                                            <SelectValue placeholder="All Students" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Students ({bridge.students.length})</SelectItem>
                                            {classPeriods.map((period: string) => {
                                                const count = bridge.students.filter((s: any) => s.classPeriod === period).length;
                                                return (
                                                    <SelectItem key={period} value={period}>
                                                        {period} ({count})
                                                    </SelectItem>
                                                );
                                            })}
                                            <SelectItem value="unassigned">
                                                Unassigned ({bridge.students.filter((s: any) => !s.classPeriod).length})
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            {/* Student Selector */}
                            <Select
                                value={selectedStudentUuid}
                                onValueChange={(uuid) => {
                                    setSelectedStudentUuid(uuid);
                                    const student = bridge.findByUuid(uuid);
                                    if (student) {
                                        setStudentName(student.name);
                                        setStudentId(student.localId);
                                    }
                                }}
                            >
                                <SelectTrigger className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                                    <SelectValue placeholder="Choose a student from your roster" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredStudents.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                                            No students in this class period
                                        </div>
                                    ) : (
                                        filteredStudents.map((student: any) => (
                                            <SelectItem key={student.uuid} value={student.uuid}>
                                                {student.name} ({student.localId})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {selectedStudentUuid && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Selected: {studentName} (ID: {studentId})
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div>
                    <Label className="text-gray-700 dark:text-gray-300 font-medium">
                        Student UUID <span className="text-gray-400 text-xs">(auto-filled)</span>
                    </Label>
                    <Input
                        value={selectedStudentUuid}
                        disabled
                        placeholder="UUID will be auto-filled"
                        className="mt-1 border-gray-300 bg-gray-50 text-gray-500"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="assignment" className="text-gray-700 dark:text-gray-300 font-medium">
                            Assignment <span className="text-gray-400 text-xs">(optional)</span>
                        </Label>
                        {assignmentId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const selectedAssignment = assignmentsData?.assignments.find((a: any) => a.id === assignmentId);
                                    if (selectedAssignment) {
                                        setEditingAssignment(selectedAssignment);
                                        setIsEditModalOpen(true);
                                    }
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
                            >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                            </Button>
                        )}
                    </div>
                    <Select value={assignmentId || ''} onValueChange={(value) => setAssignmentId(value || undefined)}>
                        <SelectTrigger className="mt-1 border-gray-300">
                            <SelectValue placeholder="Select an assignment..." />
                        </SelectTrigger>
                        <SelectContent>
                            {assignmentsData?.assignments.map((assignment: any) => (
                                <SelectItem key={assignment.id} value={assignment.id}>
                                    {assignment.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
