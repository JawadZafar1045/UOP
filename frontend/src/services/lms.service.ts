import api from './api';
import axios from 'axios';
import { useStore } from '../store/useStore';

// ══════════════════════════════════════════════════════════════════════════════
// Public Course Discovery API (No Login Required)
// ══════════════════════════════════════════════════════════════════════════════

export const getPublicCourses = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  });
  const res = await api.get(`/lms/public/courses?${query.toString()}`);
  return res;
};

export const getPublicCourseBySlug = async (slug: string) => {
  const res = await api.get(`/lms/public/courses/${slug}`);
  return res.data?.data ?? res.data;
};

export const getPublicCategories = async () => {
  const res = await api.get('/lms/public/categories');
  return res.data?.data ?? res.data;
};

export const getPreviewPlayback = async (courseId: string, lectureId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/lectures/${lectureId}/preview`);
  return res.data?.data ?? res.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Enrollment & Paid Registration API
// ══════════════════════════════════════════════════════════════════════════════

export const enrollFreeCourse = async (courseId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/enroll`);
  return res;
};

export const registerPaidCourse = async (courseId: string, data: { paymentReference?: string; notes?: string } = {}) => {
  const res = await api.post(`/lms/courses/${courseId}/register`, data);
  return res;
};

export const getRegistrationStatus = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/registration-status`);
  return res.data?.data ?? res.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Student Dashboard & Classroom Learning API
// ══════════════════════════════════════════════════════════════════════════════

export const getStudentEnrolledCourses = async () => {
  const res = await api.get('/lms/student/courses');
  return res.data?.data ?? res.data;
};

export const getStudentContinueLearning = async () => {
  const res = await api.get('/lms/student/continue-learning');
  return res.data?.data ?? res.data;
};

export const getCourseLearningData = async (slugOrId: string) => {
  const res = await api.get(`/lms/courses/${slugOrId}/learn`);
  return res.data?.data ?? res.data;
};

export const getLecturePlayback = async (courseId: string, lectureId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/lectures/${lectureId}/playback`);
  return res.data?.data ?? res.data;
};

export const updateLectureProgress = async (courseId: string, lectureId: string, progressSeconds: number, durationSeconds: number) => {
  const res = await api.post(`/lms/lectures/${lectureId}/progress`, {
    courseId,
    progressSeconds,
    durationSeconds,
  });
  return res.data?.data ?? res.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Admin Registrations Management API
// ══════════════════════════════════════════════════════════════════════════════

export const getAdminRegistrations = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  });
  const res = await api.get(`/lms/admin/registrations?${query.toString()}`);
  return res.data?.data ?? res.data;
};

export const approveRegistration = async (registrationId: string) => {
  const res = await api.post(`/lms/admin/registrations/${registrationId}/approve`);
  return res;
};

export const rejectRegistration = async (registrationId: string, reason?: string) => {
  const res = await api.post(`/lms/admin/registrations/${registrationId}/reject`, { reason });
  return res;
};

// ══════════════════════════════════════════════════════════════════════════════
// Admin Course Builder API
// ══════════════════════════════════════════════════════════════════════════════

export const addModule = async (courseId: string, data: { title: string; description?: string }) => {
  const res = await api.post(`/lms/admin/courses/${courseId}/modules`, data);
  return res.data?.data ?? res.data;
};

export const updateModule = async (courseId: string, moduleId: string, data: any) => {
  const res = await api.patch(`/lms/admin/courses/${courseId}/modules/${moduleId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteModule = async (courseId: string, moduleId: string) => {
  const res = await api.delete(`/lms/admin/courses/${courseId}/modules/${moduleId}`);
  return res.data?.data ?? res.data;
};

export const addLecture = async (courseId: string, moduleId: string, data: any) => {
  const res = await api.post(`/lms/admin/courses/${courseId}/modules/${moduleId}/lectures`, data);
  return res.data?.data ?? res.data;
};

export const updateLecture = async (courseId: string, moduleId: string, lectureId: string, data: any) => {
  const res = await api.patch(`/lms/admin/courses/${courseId}/modules/${moduleId}/lectures/${lectureId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteLecture = async (courseId: string, moduleId: string, lectureId: string) => {
  const res = await api.delete(`/lms/admin/courses/${courseId}/modules/${moduleId}/lectures/${lectureId}`);
  return res.data?.data ?? res.data;
};

export const uploadLectureVideo = async (formData: FormData) => {
  const res = await api.post('/lms/admin/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data ?? res.data;
};

export const uploadThumbnail = async (formData: FormData) => {
  const res = await api.post('/lms/admin/upload-thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data ?? res.data;
};

export const getInstructors = async () => {
  const res = await api.get('/lms/instructors');
  return res.data?.data ?? res.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// Preserved Course API
// ══════════════════════════════════════════════════════════════════════════════

export const getCourses = async () => {
  const res = await api.get('/lms/courses');
  return res.data?.data ?? res.data;
};

export const getCourse = async (id: string) => {
  const res = await api.get(`/lms/courses/${id}`);
  return res.data?.data ?? res.data;
};

export const createCourse = async (data: any) => {
  const res = await api.post('/lms/courses', data);
  return res.data?.data ?? res.data;
};

export const updateCourse = async (id: string, data: any) => {
  const res = await api.patch(`/lms/courses/${id}`, data);
  return res.data?.data ?? res.data;
};

export const deleteCourse = async (id: string) => {
  const res = await api.delete(`/lms/courses/${id}`);
  return res;
};

export const enrollStudent = async (courseId: string, studentId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/manual-enroll`, { studentId });
  return res.data?.data ?? res.data;
};

export const unenrollStudent = async (courseId: string, studentId: string) => {
  const res = await api.delete(`/lms/courses/${courseId}/enroll/${studentId}`);
  return res.data?.data ?? res.data;
};

export const getTenantStudents = async () => {
  const res = await api.get('/lms/students');
  return res.data?.data ?? res.data;
};

// ── Sessions & Attendance ──────────────────────────────────────────────────────

export const getCourseSessions = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/sessions`);
  return res.data?.data ?? res.data;
};

export const createSession = async (courseId: string, data: any) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const res = await api.post(`/lms/courses/${courseId}/sessions`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return res.data?.data ?? res.data;
};

export const toggleSession = async (sessionId: string) => {
  const res = await api.patch(`/lms/sessions/${sessionId}/toggle`);
  return res.data?.data ?? res.data;
};

export const updateSession = async (sessionId: string, data: any) => {
  const res = await api.patch(`/lms/sessions/${sessionId}`, data);
  return res.data?.data ?? res.data;
};

export const getSessionAttendance = async (sessionId: string) => {
  const res = await api.get(`/lms/sessions/${sessionId}/attendance`);
  return res.data?.data ?? res.data;
};

export const markSelfPresent = async (sessionId: string) => {
  const res = await api.post(`/lms/sessions/${sessionId}/attend`);
  return res.data?.data ?? res.data;
};

export const getMyAttendanceSummary = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/attendance/mine`);
  return res.data?.data ?? res.data;
};

// ── LMS Documents ──────────────────────────────────────────────────────────────

export const getCourseDocuments = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/documents`);
  return res.data?.data ?? res.data;
};

export const uploadCourseDocument = async (courseId: string, formData: FormData) => {
  const res = await api.post(`/lms/courses/${courseId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data?.data ?? res.data;
};

export const deleteCourseDocument = async (docId: string) => {
  const res = await api.delete(`/lms/documents/${docId}`);
  return res;
};

// ── Assignments ────────────────────────────────────────────────────────────────

export const getCourseAssignments = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/assignments`);
  return res.data?.data ?? res.data;
};

export const createAssignment = async (data: any) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  const res = await api.post('/lms/assignments', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return res.data?.data ?? res.data;
};

export const updateAssignment = async (assignmentId: string, data: any) => {
  const res = await api.patch(`/lms/assignments/${assignmentId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteAssignment = async (assignmentId: string) => {
  const res = await api.delete(`/lms/assignments/${assignmentId}`);
  return res;
};

export const submitAssignment = async (assignmentId: string, fileOrFormData: File | FormData) => {
  let formData: FormData;
  if (typeof FormData !== 'undefined' && fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append('file', fileOrFormData as File);
  }
  const res = await api.post(`/lms/assignments/${assignmentId}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data?.data ?? res.data;
};

export const getAssignmentSubmissions = async (assignmentId: string) => {
  const res = await api.get(`/lms/assignments/${assignmentId}/submissions`);
  return res.data?.data ?? res.data;
};

export const gradeSubmission = async (assignmentId: string, studentId: string, grade: number, feedback?: string) => {
  const res = await api.patch(`/lms/submissions/${assignmentId}/grade/${studentId}`, {
    grade,
    feedback,
  });
  return res.data?.data ?? res.data;
};

// ── Quizzes ────────────────────────────────────────────────────────────────────

export const getCourseQuizzes = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/quizzes`);
  return res.data?.data ?? res.data;
};

export const createQuiz = async (courseId: string, data: any) => {
  const res = await api.post(`/lms/courses/${courseId}/quizzes`, data);
  return res.data?.data ?? res.data;
};

export const updateQuiz = async (quizId: string, data: any) => {
  const res = await api.patch(`/lms/quizzes/${quizId}`, data);
  return res.data?.data ?? res.data;
};

export const publishQuiz = async (quizId: string) => {
  const res = await api.patch(`/lms/quizzes/${quizId}/publish`);
  return res.data?.data ?? res.data;
};

export const getQuizQuestions = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/questions`);
  return res.data?.data ?? res.data;
};

export const addQuizQuestion = async (quizId: string, data: any) => {
  const res = await api.post(`/lms/quizzes/${quizId}/questions`, data);
  return res.data?.data ?? res.data;
};

export const updateQuizQuestion = async (questionId: string, data: any) => {
  const res = await api.patch(`/lms/questions/${questionId}`, data);
  return res.data?.data ?? res.data;
};

export const startQuizAttempt = async (quizId: string) => {
  const res = await api.post(`/lms/quizzes/${quizId}/start`);
  return res.data?.data ?? res.data;
};
export const startQuiz = startQuizAttempt;

export const submitQuizAttempt = async (quizId: string, answers: any) => {
  const res = await api.post(`/lms/quizzes/${quizId}/submit`, { answers });
  return res.data?.data ?? res.data;
};
export const submitQuiz = submitQuizAttempt;

export const getQuizResults = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/results`);
  return res.data?.data ?? res.data;
};

export const getMyQuizAttempts = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/attempts/mine`);
  return res.data?.data ?? res.data;
};
export const getMyAttempts = getMyQuizAttempts;

// ── Performance & Certificates ─────────────────────────────────────────────────

export const getCoursePerformance = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/performance`);
  return res.data?.data ?? res.data;
};

export const getMyPerformance = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/performance/mine`);
  return res.data?.data ?? res.data;
};

export const generateCertificate = async (courseId: string, studentId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/certificates/generate/${studentId}`);
  return res.data?.data ?? res.data;
};

export const generateAllCertificates = async (courseId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/certificates/generate-all`);
  return res.data?.data ?? res.data;
};

export const getCourseCertificates = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/certificates`);
  return res.data?.data ?? res.data;
};

export const getMyCertificates = async () => {
  const res = await api.get('/lms/certificates/mine');
  return res.data?.data ?? res.data;
};

export const verifyCertificate = async (code: string) => {
  const res = await api.get(`/lms/certificates/verify/${code}`);
  return res.data?.data ?? res.data;
};

// ── Secure Downloads ───────────────────────────────────────────────────────────

export const downloadDocument = async (docId: string, fileName: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = useStore.getState().accessToken;
  const response = await axios.get(`${baseUrl}/lms/documents/${docId}/access`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
    withCredentials: true,
  });

  const blob = response.data;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
export const downloadCourseDocument = downloadDocument;

export const downloadCertificate = async (certId: string, fileName: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = useStore.getState().accessToken;
  const response = await axios.get(`${baseUrl}/lms/certificates/${certId}/access`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
    withCredentials: true,
  });

  const blob = response.data;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
export const downloadCourseCertificate = downloadCertificate;

export const downloadFileByUrl = async (url: string, fileName?: string) => {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  if (fileName) a.download = fileName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ── Admin API Functions ────────────────────────────────────────────────────────

export const getAdminStats = async () => {
  const res = await api.get('/lms/admin/stats');
  return res.data?.data ?? res.data;
};

export const getAdminUsers = async () => {
  const res = await api.get('/lms/admin/users');
  return res.data?.data ?? res.data;
};

export const updateUserRole = async (id: string, role: string) => {
  const res = await api.patch(`/lms/admin/users/${id}/role`, { role });
  return res.data?.data ?? res.data;
};

export const deactivateUser = async (id: string) => {
  const res = await api.delete(`/lms/admin/users/${id}`);
  return res.data?.data ?? res.data;
};

export const activateUser = async (id: string) => {
  const res = await api.patch(`/lms/admin/users/${id}/activate`);
  return res.data?.data ?? res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/lms/admin/users/${id}/hard`);
  return res.data?.data ?? res.data;
};

export const approveUser = async (id: string) => {
  const res = await api.patch(`/lms/admin/users/${id}/approve`);
  return res.data?.data ?? res.data;
};

export const getAdminCourses = async () => {
  const res = await api.get('/lms/admin/courses');
  return res.data?.data ?? res.data;
};

export const deleteAdminCourse = async (id: string) => {
  const res = await api.delete(`/lms/admin/courses/${id}`);
  return res.data?.data ?? res.data;
};

export const getAdminCertificates = async () => {
  const res = await api.get('/lms/admin/certificates');
  return res.data?.data ?? res.data;
};

export const revokeCertificate = async (id: string) => {
  const res = await api.patch(`/lms/admin/certificates/${id}/revoke`);
  return res.data?.data ?? res.data;
};

// ── Certificate Template ───────────────────────────────────────────────────────
export const getCertificateTemplate = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/certificate-template`);
  return res.data?.data ?? res.data;
};

export const saveCertificateTemplate = async (courseId: string, formData: FormData) => {
  const res = await api.post(`/lms/courses/${courseId}/certificate-template`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data ?? res.data;
};
