import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Polyfill DOMMatrix for pdfjs-dist
if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
        multiply() { return this; }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
        transformPoint() { return { x: 0, y: 0 }; }
        inverse() { return this; }
    } as any;
}

// Mock PDF.js and Mammoth before imports
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(),
}));
vi.mock('mammoth', () => ({
    extractRawText: vi.fn(),
}));

// Mock the docx library to avoid loading pdfjs-dist
vi.mock('@/lib/docx', () => ({
    extractTextFromDocx: vi.fn(),
    extractTextFromPDF: vi.fn(),
}));

// Mock VerbatimViewer to avoid loading useFileUpload -> docx -> pdfjs-dist
vi.mock('@/components/VerbatimViewer', () => ({
    default: () => <div data-testid="verbatim-viewer">Verbatim Viewer</div>,
}));

// Mock SubmissionContent to avoid loading VerbatimViewer -> useFileUpload -> docx -> pdfjs-dist
vi.mock('./Submission/components/SubmissionContent', () => ({
    SubmissionContent: () => <div data-testid="submission-content">Submission Content</div>,
}));

// Mock usePdfPages to avoid loading pdfjs-dist
vi.mock('@/hooks/usePdfPages', () => ({
    usePdfPages: () => ({
        currentPage: 1,
        totalPages: 1,
        isLoading: false,
        error: null,
        renderPage: vi.fn(),
        nextPage: vi.fn(),
        prevPage: vi.fn(),
        canGoNext: false,
        canGoPrev: false,
        scale: 1,
        setScale: vi.fn(),
        loadPdf: vi.fn(),
    }),
}));

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Submission from './Submission';

// Mock the API hooks
vi.mock('./Submission/hooks/useSubmissionState', () => ({
    useSubmissionState: () => ({
        draftMode: 'single',
        selectedStudentUuid: '',
        studentName: '',
        studentId: '',
        assignmentId: undefined,
        criteria: '',
        totalPoints: 100,
        verbatimText: '',
        roughDraftText: '',
        finalDraftText: '',
        sourceType: 'text',
        roughDraftSourceType: 'text',
        finalDraftSourceType: 'text',
        submissionId: undefined,
        aiFeedback: null,
        teacherGrade: undefined,
        teacherFeedback: '',
        saveMessage: null,
        imageDataUrl: undefined,
        storedImageUrl: undefined,
        pendingFile: null,
        activeTab: 'grade',
        isEditModalOpen: false,
        editingAssignment: null,
        originalFileUrl: undefined,
        annotations: [],
        annotationsRefreshKey: 0,
        assignmentsData: { assignments: [] },
        existingSubmission: null,
        bridge: {
            students: [],
            isLocked: false,
            findByUuid: vi.fn(),
        },
        setDraftMode: vi.fn(),
        setSelectedStudentUuid: vi.fn(),
        setStudentName: vi.fn(),
        setStudentId: vi.fn(),
        setAssignmentId: vi.fn(),
        setCriteria: vi.fn(),
        setTotalPoints: vi.fn(),
        setVerbatimText: vi.fn(),
        setRoughDraftText: vi.fn(),
        setFinalDraftText: vi.fn(),
        setSourceType: vi.fn(),
        setRoughDraftSourceType: vi.fn(),
        setFinalDraftSourceType: vi.fn(),
        setSubmissionId: vi.fn(),
        setAiFeedback: vi.fn(),
        setTeacherGrade: vi.fn(),
        setTeacherFeedback: vi.fn(),
        setSaveMessage: vi.fn(),
        setImageDataUrl: vi.fn(),
        setStoredImageUrl: vi.fn(),
        setPendingFile: vi.fn(),
        setActiveTab: vi.fn(),
        setIsEditModalOpen: vi.fn(),
        setEditingAssignment: vi.fn(),
        setOriginalFileUrl: vi.fn(),
        setAnnotations: vi.fn(),
        setAnnotationsRefreshKey: vi.fn(),
    }),
}));

vi.mock('./Submission/hooks/useSubmissionActions', () => ({
    useSubmissionActions: () => ({
        ingestMutation: { isPending: false, mutateAsync: vi.fn() },
        gradeMutation: { isPending: false, mutateAsync: vi.fn() },
        saveMutation: { isPending: false, mutateAsync: vi.fn() },
        handleTextExtracted: vi.fn(),
        handleTextEnhanced: vi.fn(),
        handleRoughDraftExtracted: vi.fn(),
        handleFinalDraftExtracted: vi.fn(),
        handleRoughDraftEnhanced: vi.fn(),
        handleFinalDraftEnhanced: vi.fn(),
        handleRunGrade: vi.fn(),
        handleSaveEdits: vi.fn(),
        handleNewSubmission: vi.fn(),
        handlePrint: vi.fn(),
        refreshAssignments: vi.fn(),
    }),
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { user_id: 'test-user', email: 'test@example.com' },
        isAuthenticated: true,
        token: 'test-token',
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock bridge storage
vi.mock('@/bridge/storage', () => ({
    isFileSystemAccessSupported: vi.fn(() => false),
    chooseBridgeFile: vi.fn(),
    saveBridgeFile: vi.fn(),
    readBridgeFile: vi.fn(),
    writeBridgeFile: vi.fn(),
    saveBridgeToIndexedDB: vi.fn(),
    loadBridgeFromIndexedDB: vi.fn(() => Promise.resolve(null)),
    downloadBridgeFile: vi.fn(),
    uploadBridgeFile: vi.fn(),
}));

describe('Submission Page', () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    it('renders without crashing', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Submission />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText('Grade Submission')).toBeDefined();
        expect(screen.getByText('Student Information')).toBeDefined();
    });
});
