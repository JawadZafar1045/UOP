import api from './api';
import axios from 'axios';
import { useStore } from '../store/useStore';

// ── Courses ────────────────────────────────────────────────────────────────────

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

export const uploadThumbnail = async (file: File) => {
  const formData = new FormData();
  formData.append('thumbnail', file);
  const res: any = await api.post('/lms/upload/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.url || res?.data?.url || res;
};

export const enrollStudent = async (courseId: string, studentId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/enroll`, { studentId });
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

export const deleteSession = async (sessionId: string) => {
  const res = await api.delete(`/lms/sessions/${sessionId}`);
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

export const downloadCourseDocument = async (docId: string, fileName: string) => {
  const token = useStore.getState().accessToken;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const response = await axios.get(`${baseURL}/lms/documents/${docId}/access`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
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

export const downloadFileByUrl = async (fileUrl: string, fileName: string) => {
  const token = useStore.getState().accessToken;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const response = await axios.post(`${baseURL}/lms/files/sign`, { url: fileUrl }, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
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

// ── Assignments ────────────────────────────────────────────────────────────────

export const getCourseAssignments = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/assignments`);
  return res.data?.data ?? res.data;
};

export const createAssignment = async (formData: FormData) => {
  const res = await api.post('/lms/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data ?? res.data;
};

export const updateAssignment = async (id: string, data: any) => {
  const res = await api.patch(`/lms/assignments/${id}`, data);
  return res.data?.data ?? res.data;
};

export const deleteAssignment = async (id: string) => {
  const res = await api.delete(`/lms/assignments/${id}`);
  return res;
};

export const submitAssignment = async (assignmentId: string, formData: FormData) => {
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

export const getMySubmission = async (assignmentId: string) => {
  const res = await api.get(`/lms/assignments/${assignmentId}/submissions/mine`);
  return res.data?.data ?? res.data;
};

export const gradeSubmission = async (assignmentId: string, studentId: string, data: { score: number; feedback: string }) => {
  const res = await api.patch(`/lms/submissions/${assignmentId}/grade/${studentId}`, data);
  return res.data?.data ?? res.data;
};

// ── Quizzes ────────────────────────────────────────────────────────────────────

export const getCourseQuizzes = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/quizzes`);
  return res.data?.data ?? res.data;
};

export const getQuizQuestions = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/questions`);
  return res.data?.data ?? res.data;
};

export const downloadQuizTemplate = async () => {
  const token = useStore.getState().accessToken;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const response = await axios.get(`${baseUrl}/lms/quizzes/template`, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Quiz_Question_Template.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const validateQuizExcel = async (courseId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res: any = await api.post(`/lms/courses/${courseId}/quizzes/validate-excel`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res?.data ?? res;
};

export const bulkCreateQuiz = async (courseId: string, data: { quiz: any; questions: any[] }) => {
  const res: any = await api.post(`/lms/courses/${courseId}/quizzes/bulk-create`, data);
  return res?.data ?? res;
};

export const createQuiz = async (courseId: string, data: any) => {
  const res = await api.post(`/lms/courses/${courseId}/quizzes`, data);
  return res.data?.data ?? res.data;
};

export const addQuizQuestion = async (quizId: string, data: any) => {
  const res = await api.post(`/lms/quizzes/${quizId}/questions`, data);
  return res.data?.data ?? res.data;
};

export const publishQuiz = async (quizId: string) => {
  const res = await api.patch(`/lms/quizzes/${quizId}/publish`);
  return res.data?.data ?? res.data;
};

export const updateQuiz = async (quizId: string, data: any) => {
  const res = await api.patch(`/lms/quizzes/${quizId}`, data);
  return res.data?.data ?? res.data;
};

export const updateQuizQuestion = async (questionId: string, data: any) => {
  const res = await api.patch(`/lms/questions/${questionId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteQuizQuestion = async (questionId: string) => {
  const res = await api.delete(`/lms/questions/${questionId}`);
  return res.data?.data ?? res.data;
};

export const startQuiz = async (quizId: string) => {
  const res = await api.post(`/lms/quizzes/${quizId}/start`);
  return res.data?.data ?? res.data;
};

export const submitQuiz = async (quizId: string, answers: any[]) => {
  const res = await api.post(`/lms/quizzes/${quizId}/submit`, { answers });
  return res.data?.data ?? res.data;
};

export const getQuizResults = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/results`);
  return res.data?.data ?? res.data;
};

export const getMyAttempts = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/attempts/mine`);
  return res.data?.data ?? res.data;
};

// ── Performance ────────────────────────────────────────────────────────────────

export const getCoursePerformance = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/performance`);
  return res.data?.data ?? res.data;
};

export const getMyPerformance = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/performance/mine`);
  return res.data?.data ?? res.data;
};

// ── Certificates ───────────────────────────────────────────────────────────────

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

export const downloadCertificate = async (certId: string, fileName: string) => {
  const token = useStore.getState().accessToken;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const response = await axios.get(`${baseURL}/lms/certificates/${certId}/access`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

  const blob = response.data;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Always append .zip because the backend uses proxyDownload (archive) logic
  a.download = `${fileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
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

export const approveUser = async (id: string, programId?: string) => {
  const res = await api.patch(`/lms/admin/users/${id}/approve`, { programId });
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

// ── Academic Programs (Degrees) ───────────────────────────────────────────────
export const getPrograms = async () => {
  const res = await api.get('/lms/programs');
  return res.data?.data ?? res.data;
};

export const getProgramById = async (id: string) => {
  const res = await api.get(`/lms/programs/${id}`);
  return res.data?.data ?? res.data;
};

export const createProgram = async (data: any) => {
  const res = await api.post('/lms/programs', data);
  return res.data?.data ?? res.data;
};

export const updateProgram = async (id: string, data: any) => {
  const res = await api.patch(`/lms/programs/${id}`, data);
  return res.data?.data ?? res.data;
};

export const deleteProgram = async (id: string) => {
  const res = await api.delete(`/lms/programs/${id}`);
  return res.data?.data ?? res.data;
};

// ── Academic Majors (Specializations) ─────────────────────────────────────────
export const getMajors = async (programId?: string) => {
  const res = await api.get('/lms/majors', { params: programId ? { programId } : {} });
  return res.data?.data ?? res.data;
};

export const createMajor = async (data: any) => {
  const res = await api.post('/lms/majors', data);
  return res.data?.data ?? res.data;
};

export const updateMajor = async (id: string, data: any) => {
  const res = await api.patch(`/lms/majors/${id}`, data);
  return res.data?.data ?? res.data;
};

export const deleteMajor = async (id: string) => {
  const res = await api.delete(`/lms/majors/${id}`);
  return res.data?.data ?? res.data;
};

// ── Academic Hierarchy Tree ───────────────────────────────────────────────────
export const getAcademicTree = async () => {
  const res = await api.get('/lms/programs/tree');
  return res.data?.data ?? res.data;
};

// ── Degree Performance ────────────────────────────────────────────────────────
export const getProgramPerformanceOverview = async (programId: string) => {
  const res = await api.get(`/lms/programs/${programId}/performance`);
  return res.data?.data ?? res.data;
};

export const getStudentDegreePerformance = async (programId: string, studentId?: string) => {
  const url = studentId
    ? `/lms/programs/${programId}/performance/${studentId}`
    : `/lms/programs/${programId}/performance/mine`;
  const res = await api.get(url);
  return res.data?.data ?? res.data;
};

// ── Video Lectures ────────────────────────────────────────────────────────────
export const getVideoLectures = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/lectures`);
  return res.data?.data ?? res.data;
};

export const createVideoLecture = async (courseId: string, data: any) => {
  const res = await api.post(`/lms/courses/${courseId}/lectures`, data);
  return res.data?.data ?? res.data;
};

export const updateVideoLecture = async (courseId: string, lectureId: string, data: any) => {
  const res = await api.patch(`/lms/courses/${courseId}/lectures/${lectureId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteVideoLecture = async (courseId: string, lectureId: string) => {
  const res = await api.delete(`/lms/courses/${courseId}/lectures/${lectureId}`);
  return res.data?.data ?? res.data;
};

export const toggleVideoLectureProgress = async (courseId: string, lectureId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/lectures/${lectureId}/progress`);
  return res.data?.data ?? res.data;
};




