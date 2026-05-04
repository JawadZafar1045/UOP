import api from './api';

// ── Courses ────────────────────────────────────────────────────────────────────

export const getCourses = async () => {
  const res = await api.get('/lms/courses');
  return res.data;
};

export const getCourse = async (id: string) => {
  const res = await api.get(`/lms/courses/${id}`);
  return res.data;
};

export const createCourse = async (data: any) => {
  const res = await api.post('/lms/courses', data);
  return res.data;
};

export const updateCourse = async (id: string, data: any) => {
  const res = await api.patch(`/lms/courses/${id}`, data);
  return res.data;
};

export const deleteCourse = async (id: string) => {
  const res = await api.delete(`/lms/courses/${id}`);
  return res;
};

export const enrollStudent = async (courseId: string, studentId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/enroll`, { studentId });
  return res.data;
};

// ── Sessions & Attendance ──────────────────────────────────────────────────────

export const getCourseSessions = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/sessions`);
  return res.data;
};

export const createSession = async (courseId: string, data: any) => {
  const res = await api.post(`/lms/courses/${courseId}/sessions`, data);
  return res.data;
};

export const toggleSession = async (sessionId: string) => {
  const res = await api.patch(`/lms/sessions/${sessionId}/toggle`);
  return res.data;
};

export const getSessionAttendance = async (sessionId: string) => {
  const res = await api.get(`/lms/sessions/${sessionId}/attendance`);
  return res.data;
};

export const markSelfPresent = async (sessionId: string) => {
  const res = await api.post(`/lms/sessions/${sessionId}/attend`);
  return res.data;
};

export const getMyAttendanceSummary = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/attendance/mine`);
  return res.data;
};

// ── LMS Documents ──────────────────────────────────────────────────────────────

export const getCourseDocuments = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/documents`);
  return res.data;
};

export const uploadCourseDocument = async (courseId: string, formData: FormData) => {
  const res = await api.post(`/lms/courses/${courseId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteCourseDocument = async (docId: string) => {
  const res = await api.delete(`/lms/documents/${docId}`);
  return res;
};

// ── Assignments ────────────────────────────────────────────────────────────────

export const getCourseAssignments = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/assignments`);
  return res.data;
};

export const createAssignment = async (data: any) => {
  const res = await api.post('/lms/assignments', data);
  return res.data;
};

export const submitAssignment = async (assignmentId: string, formData: FormData) => {
  const res = await api.post(`/lms/assignments/${assignmentId}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getAssignmentSubmissions = async (assignmentId: string) => {
  const res = await api.get(`/lms/assignments/${assignmentId}/submissions`);
  return res.data;
};

export const getMySubmission = async (assignmentId: string) => {
  const res = await api.get(`/lms/assignments/${assignmentId}/submissions/mine`);
  return res.data;
};

export const gradeSubmission = async (assignmentId: string, studentId: string, data: { score: number; feedback: string }) => {
  const res = await api.patch(`/lms/submissions/${assignmentId}/grade/${studentId}`, data);
  return res.data;
};

// ── Quizzes ────────────────────────────────────────────────────────────────────

export const getCourseQuizzes = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/quizzes`);
  return res.data;
};

export const createQuiz = async (courseId: string, data: any) => {
  const res = await api.post(`/lms/courses/${courseId}/quizzes`, data);
  return res.data;
};

export const addQuizQuestion = async (quizId: string, data: any) => {
  const res = await api.post(`/lms/quizzes/${quizId}/questions`, data);
  return res.data;
};

export const publishQuiz = async (quizId: string) => {
  const res = await api.patch(`/lms/quizzes/${quizId}/publish`);
  return res.data;
};

export const startQuiz = async (quizId: string) => {
  const res = await api.post(`/lms/quizzes/${quizId}/start`);
  return res.data;
};

export const submitQuiz = async (quizId: string, answers: any[]) => {
  const res = await api.post(`/lms/quizzes/${quizId}/submit`, { answers });
  return res.data;
};

export const getQuizResults = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/results`);
  return res.data;
};

export const getMyAttempts = async (quizId: string) => {
  const res = await api.get(`/lms/quizzes/${quizId}/attempts/mine`);
  return res.data;
};

// ── Performance ────────────────────────────────────────────────────────────────

export const getCoursePerformance = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/performance`);
  return res.data;
};

export const getMyPerformance = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/performance/mine`);
  return res.data;
};

// ── Certificates ───────────────────────────────────────────────────────────────

export const generateCertificate = async (courseId: string, studentId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/certificates/generate/${studentId}`);
  return res.data;
};

export const generateAllCertificates = async (courseId: string) => {
  const res = await api.post(`/lms/courses/${courseId}/certificates/generate-all`);
  return res.data;
};

export const getCourseCertificates = async (courseId: string) => {
  const res = await api.get(`/lms/courses/${courseId}/certificates`);
  return res.data;
};

export const getMyCertificates = async () => {
  const res = await api.get('/lms/certificates/mine');
  return res.data;
};

export const verifyCertificate = async (code: string) => {
  const res = await api.get(`/lms/certificates/verify/${code}`);
  return res.data;
};
