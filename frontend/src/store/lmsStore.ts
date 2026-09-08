import { create } from 'zustand';
import * as lmsService from '../services/lms.service';

interface Course {
  _id: string;
  title: string;
  description?: string;
  instructor?: any;
  thumbnail?: string;
  duration?: string;
  isPublished: boolean;
  status: 'draft' | 'active' | 'completed';
  featuredOnHomepage?: boolean;
  startDate?: string;
  endDate?: string;
  completionCriteria?: {
    minAttendancePercent: number;
    minAssignmentScore: number;
    minQuizScore: number;
  };
  modules?: any[];
  enrolledStudents?: any[];
  students?: any[];
  programId?: any;
  majorId?: any;
  isCommon?: boolean;
  courseCode?: string;
  creditHours?: number;
  stats?: {
    sessions: number;
    assignments: number;
    quizzes: number;
  };
}

interface Session {
  _id: string;
  tenantId: string;
  courseId: string;
  createdBy: any;
  title: string;
  date: string;
  attendanceOpenAt?: string;
  attendanceCloseAt?: string;
  isOpen: boolean;
  materialUrl?: string;
  materials?: any[];
  isAttended?: boolean;
}

interface LmsDocument {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  publicId: string;
  fileType?: string;
  fileSize?: number;
  visibleToStudents: boolean;
  uploadedBy: any;
  createdAt: string;
}

interface Assignment {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  maxMarks: number;
  materials?: any[];
  submissions?: any[];
}

interface Quiz {
  _id: string;
  title: string;
  instructions?: string;
  timeLimit?: number;
  passMark: number;
  maxAttempts: number;
  allowRetake?: boolean;
  shuffleQuestions: boolean;
  showResultImmediately: boolean;
  enableNegativeMarking?: boolean;
  correctMark?: number;
  negativeMark?: number;
  unattemptedMark?: number;
  status: 'draft' | 'published' | 'closed';
  questionCount?: number;
  myAttempts?: number;
  bestScore?: number | null;
}

interface Certificate {
  _id: string;
  courseId: any;
  studentId: any;
  certificateNumber: string;
  issuedAt: string;
  attendancePercent?: number;
  averageAssignmentScore?: number;
  averageQuizScore?: number;
  fileUrl?: string;
  publicId?: string;
  verificationCode: string;
  isValid: boolean;
}

interface Performance {
  eligible: boolean;
  reason: string | null;
  attendancePercent: number;
  assignmentScore: number;
  quizScore: number;
  certificate?: any;
}

interface LmsState {
  courses: Course[];
  currentCourse: Course | null;
  sessions: Session[];
  documents: LmsDocument[];
  assignments: Assignment[];
  currentAssignmentSubmissions: any | null;
  quizzes: Quiz[];
  certificates: Certificate[];
  myPerformance: Performance | null;
  isLoading: boolean;
  error: string | null;

  fetchCourses: () => Promise<void>;
  fetchCourse: (id: string) => Promise<void>;
  createCourse: (data: any) => Promise<void>;
  
  fetchSessions: (courseId: string) => Promise<void>;
  createSession: (courseId: string, data: any) => Promise<void>;
  toggleSession: (sessionId: string) => Promise<void>;
  markPresent: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  fetchDocuments: (courseId: string) => Promise<void>;
  uploadDocument: (courseId: string, formData: FormData) => Promise<void>;
  
  fetchAssignments: (courseId: string) => Promise<void>;
  createAssignment: (formData: FormData) => Promise<void>;
  submitAssignment: (id: string, formData: FormData) => Promise<void>;
  fetchAssignmentSubmissions: (id: string) => Promise<void>;
  gradeAssignment: (assignmentId: string, studentId: string, data: any) => Promise<void>;
  
  fetchQuizzes: (courseId: string) => Promise<void>;
  submitQuiz: (quizId: string, answers: any[]) => Promise<void>;
  
  fetchMyPerformance: (courseId: string) => Promise<void>;
  fetchMyCertificates: () => Promise<void>;
  
  updateCourse: (id: string, data: any) => Promise<void>;
  updateSession: (id: string, data: any) => Promise<void>;
  updateAssignment: (id: string, data: any) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updateQuiz: (id: string, data: any) => Promise<void>;
}

export const useLmsStore = create<LmsState>((set) => ({
  courses: [],
  currentCourse: null,
  sessions: [],
  documents: [],
  assignments: [],
  currentAssignmentSubmissions: null,
  quizzes: [],
  certificates: [],
  myPerformance: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getCourses();
      const courseData = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      set({ courses: courseData, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch courses', isLoading: false });
    }
  },

  fetchCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getCourse(id);
      set({ currentCourse: res.success ? res.data : res, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch course', isLoading: false });
    }
  },

  createCourse: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newCourse = await lmsService.createCourse(data);
      set((state) => ({ courses: [newCourse, ...state.courses], isLoading: false }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to create course', isLoading: false });
    }
  },

  fetchSessions: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getCourseSessions(courseId);
      const sessionData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      set({ sessions: sessionData, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch sessions', isLoading: false });
    }
  },

  createSession: async (courseId, data) => {
    set({ isLoading: true, error: null });
    try {
      const newSession = await lmsService.createSession(courseId, data);
      set((state) => ({ sessions: [newSession, ...state.sessions], isLoading: false }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to create session', isLoading: false });
    }
  },

  toggleSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSession = await lmsService.toggleSession(sessionId);
      set((state) => ({
        sessions: state.sessions.map((s) => (s._id === sessionId ? updatedSession : s)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to toggle session', isLoading: false });
    }
  },

  markPresent: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      await lmsService.markSelfPresent(sessionId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to mark present', isLoading: false });
      throw error; // Rethrow to let the UI catch and show toast if needed
    }
  },

  fetchDocuments: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getCourseDocuments(courseId);
      const docData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      set({ documents: docData, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch documents', isLoading: false });
    }
  },

  uploadDocument: async (courseId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const newDoc = await lmsService.uploadCourseDocument(courseId, formData);
      set((state) => ({ documents: [newDoc, ...state.documents], isLoading: false }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to upload document', isLoading: false });
      throw error;
    }
  },

  fetchAssignments: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getCourseAssignments(courseId);
      const assignData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      set({ assignments: assignData, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch assignments', isLoading: false });
    }
  },

  createAssignment: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const newAssignment = await lmsService.createAssignment(formData);
      set((state) => ({ assignments: [newAssignment, ...state.assignments], isLoading: false }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to create assignment', isLoading: false });
      throw error;
    }
  },

  submitAssignment: async (id, formData) => {
    set({ isLoading: true, error: null });
    try {
      await lmsService.submitAssignment(id, formData);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to submit assignment', isLoading: false });
      throw error;
    }
  },

  fetchAssignmentSubmissions: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const data = await lmsService.getAssignmentSubmissions(id);
      set({ currentAssignmentSubmissions: data, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch submissions', isLoading: false });
    }
  },

  gradeAssignment: async (assignmentId, studentId, data) => {
    set({ isLoading: true, error: null });
    try {
      await lmsService.gradeSubmission(assignmentId, studentId, data);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to grade assignment', isLoading: false });
      throw error;
    }
  },

  fetchQuizzes: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getCourseQuizzes(courseId);
      const quizData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      set({ quizzes: quizData, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch quizzes', isLoading: false });
    }
  },

  submitQuiz: async (quizId, answers) => {
    set({ isLoading: true, error: null });
    try {
      await lmsService.submitQuiz(quizId, answers);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to submit quiz', isLoading: false });
      throw error;
    }
  },

  fetchMyPerformance: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getMyPerformance(courseId);
      set({ myPerformance: res.success ? res.data : res, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch performance', isLoading: false });
    }
  },

  fetchMyCertificates: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await lmsService.getMyCertificates();
      const certData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      set({ certificates: certData, isLoading: false });
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch certificates', isLoading: false });
    }
  },

  updateCourse: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await lmsService.updateCourse(id, data);
      set((state) => ({
        courses: state.courses.map((c) => (c._id === id ? { ...c, ...updated } : c)),
        currentCourse: state.currentCourse?._id === id ? { ...state.currentCourse, ...updated } : state.currentCourse,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to update course', isLoading: false });
      throw error;
    }
  },

  updateSession: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await lmsService.updateSession(id, data);
      set((state) => ({
        sessions: state.sessions.map((s) => (s._id === id ? { ...s, ...updated } : s)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to update session', isLoading: false });
      throw error;
    }
  },

  deleteSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await lmsService.deleteSession(id);
      set((state) => ({
        sessions: state.sessions.filter((s) => s._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to delete session', isLoading: false });
      throw error;
    }
  },

  updateAssignment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await lmsService.updateAssignment(id, data);
      set((state) => ({
        assignments: state.assignments.map((a) => (a._id === id ? { ...a, ...updated } : a)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to update assignment', isLoading: false });
      throw error;
    }
  },

  deleteAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await lmsService.deleteAssignment(id);
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to delete assignment', isLoading: false });
      throw error;
    }
  },

  updateQuiz: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await lmsService.updateQuiz(id, data);
      set((state) => ({
        quizzes: state.quizzes.map((q) => (q._id === id ? { ...q, ...updated } : q)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error?.message || 'Failed to update quiz', isLoading: false });
      throw error;
    }
  },
}));
