const lmsService = require('../services/lms.service');
const https = require('https');
const http = require('http');
const pathMod = require('path');

const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

const getMimeType = (filename) => {
  const ext = pathMod.extname(filename || '').toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
};

const extractCloudinaryPublicId = (fileUrl) => {
  const parts = fileUrl.split('/upload/');
  if (parts.length < 2) return null;
  const segments = parts[1].split('/');
  const filteredSegments = segments.filter(seg => {
    if (seg.startsWith('s--')) return false;
    if (/^v\d+$/.test(seg)) return false;
    return true;
  });
  if (filteredSegments.length > 0) {
    const lastIdx = filteredSegments.length - 1;
    filteredSegments[lastIdx] = filteredSegments[lastIdx].split('?')[0];
  }
  return filteredSegments.join('/');
};

const proxyDownload = (fileUrl, fileName, res, next) => {
  // Determine resource type from URL or assume raw
  let resourceType = 'raw';
  if (fileUrl.includes('/image/')) resourceType = 'image';
  if (fileUrl.includes('/video/')) resourceType = 'video';
  
  const parsedPublicId = extractCloudinaryPublicId(fileUrl);
  if (parsedPublicId) {
    // Cloudinary indexes 'image' and 'video' resources without their file extensions.
    // 'raw' resources, however, are indexed with their extensions.
    let publicId = parsedPublicId;
    if (resourceType !== 'raw') {
      const lastDot = publicId.lastIndexOf('.');
      if (lastDot !== -1) {
        publicId = publicId.substring(0, lastDot);
      }
    }
    
    const cloudinary = require('../../../config/cloudinary');
    const archiveUrl = cloudinary.utils.download_archive_url({
      public_ids: [publicId],
      resource_type: resourceType,
      flatten_folders: true,
      target_filename: fileName
    });

    console.log(`[Proxy] Generated Archive URL: ${archiveUrl}`);
    const getter = archiveUrl.startsWith('https') ? https : http;
    getter.get(archiveUrl, (cloudRes) => {
      if (cloudRes.statusCode === 200) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}.zip"`);
        return cloudRes.pipe(res);
      }
      
      // Fallback 1: Try the opposite resource type
      const fallbackResourceType = resourceType === 'raw' ? 'image' : 'raw';
      let fallbackPublicId = parsedPublicId;
      if (fallbackResourceType !== 'raw') {
        const lastDot = fallbackPublicId.lastIndexOf('.');
        if (lastDot !== -1) {
          fallbackPublicId = fallbackPublicId.substring(0, lastDot);
        }
      }
      
      const fallbackArchiveUrl = cloudinary.utils.download_archive_url({
        public_ids: [fallbackPublicId],
        resource_type: fallbackResourceType,
        flatten_folders: true,
        target_filename: fileName
      });
      
      console.log(`[Proxy] Archive failed (Status ${cloudRes.statusCode}). Trying fallback: ${fallbackArchiveUrl}`);
      getter.get(fallbackArchiveUrl, (fallbackRes) => {
        if (fallbackRes.statusCode === 200) {
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}.zip"`);
          return fallbackRes.pipe(res);
        }
        
        // Fallback 2: Direct signed download fallback
        console.log(`[Proxy] Fallback archive failed (Status ${fallbackRes.statusCode}). Trying direct signed url.`);
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        const directSignedUrl = cloudinary.utils.private_download_url(parsedPublicId, '', {
          resource_type: resourceType,
          type: 'upload',
          expires_at: expiresAt
        });
        
        getter.get(directSignedUrl, (directRes) => {
          if (directRes.statusCode === 200) {
            res.setHeader('Content-Type', getMimeType(fileName));
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
            return directRes.pipe(res);
          }
          
          // Try direct signed url with the fallback resource type
          const directSignedUrlFallback = cloudinary.utils.private_download_url(parsedPublicId, '', {
            resource_type: fallbackResourceType,
            type: 'upload',
            expires_at: expiresAt
          });
          
          getter.get(directSignedUrlFallback, (directResFallback) => {
            if (directResFallback.statusCode === 200) {
              res.setHeader('Content-Type', getMimeType(fileName));
              res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
              return directResFallback.pipe(res);
            }
            
            console.error('[Proxy] All proxy and signed fallbacks failed.');
            return res.status(502).json({ success: false, message: 'Failed to fetch file.' });
          }).on('error', (e) => next(e));
        }).on('error', (e) => next(e));
      }).on('error', (e) => next(e));
    }).on('error', (e) => next(e));
    return;
  }
  
  // Fallback to direct fetch
  const getter = fileUrl.startsWith('https') ? https : http;
  getter.get(fileUrl, (cloudRes) => {
    res.setHeader('Content-Type', getMimeType(fileName));
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    cloudRes.pipe(res);
  }).on('error', (e) => next(e));
};

// ── Courses ────────────────────────────────────────────────────────────────────
const getCourses    = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourses({ tenantId: req.tenantId, userId: req.user._id, role: req.user.role, ...req.query }) }); } catch (e) { next(e); } };
const getCourse     = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseById(req.tenantId, req.params.id, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const createCourse  = async (req, res, next) => { try { const c = await lmsService.createCourse(req.tenantId, req.body, req.user._id); res.status(201).json({ success: true, data: c }); } catch (e) { next(e); } };
const updateCourse  = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.updateCourse(req.tenantId, req.params.id, req.body, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const deleteCourse  = async (req, res, next) => { try { await lmsService.deleteCourse(req.tenantId, req.params.id, req.user._id); res.json({ success: true, message: 'Course deleted.' }); } catch (e) { next(e); } };

// ── Enrollment ─────────────────────────────────────────────────────────────────
const enrollStudent = async (req, res, next) => {
  try {
    const course = await lmsService.enrollStudent(req.tenantId, req.params.id, req.body.studentId, req.user._id);
    res.json({ success: true, message: 'Student enrolled.', data: course });
  } catch (e) { next(e); }
};

// ── Legacy Attendance ──────────────────────────────────────────────────────────
const markAttendance      = async (req, res, next) => { try { const a = await lmsService.markAttendance(req.tenantId, req.body, req.user._id); res.status(201).json({ success: true, data: a }); } catch (e) { next(e); } };
const getCourseAttendance = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseAttendance(req.tenantId, req.params.id) }); } catch (e) { next(e); } };

// ── Assignments ────────────────────────────────────────────────────────────────
const createAssignment = async (req, res, next) => { try { const a = await lmsService.createAssignment(req.tenantId, req.body, req.files, req.user._id); res.status(201).json({ success: true, data: a }); } catch (e) { next(e); } };
const getCourseAssignments = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseAssignments(req.tenantId, req.params.courseId) }); } catch (e) { next(e); } };
const updateAssignment = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.updateAssignment(req.tenantId, req.params.id, req.body, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const submitAssignment = async (req, res, next) => {
  try {
    const a = await lmsService.submitAssignment(req.tenantId, req.params.id, req.user._id, req.body, req.file);
    res.json({ success: true, message: 'Assignment submitted.', data: a });
  } catch (e) { next(e); }
};

const deleteAssignment = async (req, res, next) => {
  try {
    await lmsService.deleteAssignment(req.tenantId, req.params.id, req.user._id, req.user.role);
    res.json({ success: true, message: 'Assignment deleted.' });
  } catch (e) { next(e); }
};

// ── Sessions ───────────────────────────────────────────────────────────────────
const createSession       = async (req, res, next) => { try { const s = await lmsService.createSession(req.tenantId, req.params.courseId, req.body, req.files, req.user._id); res.status(201).json({ success: true, data: s }); } catch (e) { next(e); } };
const getCourseSessions   = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseSessions(req.tenantId, req.params.courseId, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const updateSession       = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.updateSession(req.tenantId, req.params.id, req.body, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const toggleSession       = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.toggleSession(req.tenantId, req.params.id, req.user._id) }); } catch (e) { next(e); } };
const getSessionAttendance = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getSessionAttendance(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const overrideAttendance  = async (req, res, next) => { try { const { status, reason } = req.body; res.json({ success: true, data: await lmsService.overrideAttendance(req.tenantId, req.params.id, req.params.studentId, status, reason, req.user._id) }); } catch (e) { next(e); } };

// ── Student Self-Mark ──────────────────────────────────────────────────────────
const markSelfAttendance     = async (req, res, next) => { try { const a = await lmsService.markSelfAttendance(req.tenantId, req.params.id, req.user._id, req.ip); res.status(201).json({ success: true, data: a }); } catch (e) { next(e); } };
const getMyAttendanceSummary = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getMyAttendanceSummary(req.tenantId, req.params.courseId, req.user._id) }); } catch (e) { next(e); } };

// ── LMS Documents ──────────────────────────────────────────────────────────────
const uploadCourseDocument = async (req, res, next) => { try { const doc = await lmsService.uploadCourseDocument(req.tenantId, req.params.courseId, req.file, req.body, req.user._id); res.status(201).json({ success: true, data: doc }); } catch (e) { next(e); } };
const getCourseDocuments   = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseDocuments(req.tenantId, req.params.courseId, req.user.role) }); } catch (e) { next(e); } };
const deleteCourseDocument = async (req, res, next) => { try { await lmsService.deleteCourseDocument(req.tenantId, req.params.id, req.user._id); res.json({ success: true, message: 'Document deleted.' }); } catch (e) { next(e); } };
const getCourseDocumentAccess = async (req, res, next) => { 
  try { 
    const doc = await lmsService.getLmsDocumentById(req.tenantId, req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    
    proxyDownload(doc.fileUrl, doc.fileName || doc.title || 'document', res, next);
  } catch (e) { next(e); } 
};

// ── Assignment Grading ─────────────────────────────────────────────────────────
const gradeSubmission         = async (req, res, next) => { try { const { score, feedback } = req.body; res.json({ success: true, data: await lmsService.gradeSubmission(req.tenantId, req.params.assignmentId, req.params.studentId, score, feedback, req.user._id) }); } catch (e) { next(e); } };
const getAssignmentSubmissions = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getAssignmentSubmissions(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const getMySubmission         = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getMySubmission(req.tenantId, req.params.id, req.user._id) }); } catch (e) { next(e); } };

// ── Quizzes ────────────────────────────────────────────────────────────────────
const createQuiz        = async (req, res, next) => { try { const q = await lmsService.createQuiz(req.tenantId, req.params.courseId, req.body, req.user._id); res.status(201).json({ success: true, data: q }); } catch (e) { next(e); } };
const getCourseQuizzes  = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseQuizzes(req.tenantId, req.params.courseId, req.user.role, req.user._id) }); } catch (e) { next(e); } };
const addQuizQuestion   = async (req, res, next) => { try { const q = await lmsService.addQuizQuestion(req.tenantId, req.params.id, req.body); res.status(201).json({ success: true, data: q }); } catch (e) { next(e); } };
const updateQuiz         = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.updateQuiz(req.tenantId, req.params.id, req.body, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const updateQuizQuestion = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.updateQuizQuestion(req.tenantId, req.params.id, req.body, req.user._id, req.user.role) }); } catch (e) { next(e); } };
const publishQuiz       = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.publishQuiz(req.tenantId, req.params.id, req.user._id) }); } catch (e) { next(e); } };
const startQuizAttempt  = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.startQuizAttempt(req.tenantId, req.params.id, req.user._id) }); } catch (e) { next(e); } };
const submitQuizAttempt = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.submitQuizAttempt(req.tenantId, req.params.id, req.user._id, req.body.answers) }); } catch (e) { next(e); } };
const getQuizResults    = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getQuizResults(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const getMyQuizAttempts = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getMyQuizAttempts(req.tenantId, req.params.id, req.user._id) }); } catch (e) { next(e); } };

// ── Performance ────────────────────────────────────────────────────────────────
const getCoursePerformance = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCoursePerformance(req.tenantId, req.params.courseId) }); } catch (e) { next(e); } };
const getMyPerformance     = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getMyPerformance(req.tenantId, req.params.courseId, req.user._id) }); } catch (e) { next(e); } };

// ── Certificates ───────────────────────────────────────────────────────────────
const generateCertificate    = async (req, res, next) => { try { const c = await lmsService.generateCertificate(req.tenantId, req.params.courseId, req.params.studentId, req.user._id); res.status(201).json({ success: true, data: c }); } catch (e) { next(e); } };
const generateAllCertificates = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.generateAllCertificates(req.tenantId, req.params.courseId, req.user._id) }); } catch (e) { next(e); } };
const getCourseCertificates  = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getCourseCertificates(req.tenantId, req.params.courseId) }); } catch (e) { next(e); } };
const getMyCertificates      = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.getMyCertificates(req.tenantId, req.user._id) }); } catch (e) { next(e); } };
const verifyCertificate      = async (req, res, next) => { try { res.json({ success: true, data: await lmsService.verifyCertificate(req.params.code) }); } catch (e) { next(e); } };
const getCertificatePdfPublic = async (req, res, next) => {
  try {
    const cert = await lmsService.verifyCertificate(req.params.code);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    let downloadUrl = cert.fileUrl;
    const parsedPublicId = extractCloudinaryPublicId(cert.fileUrl);
    if (parsedPublicId) {
      // Stripping off extension for image resource type
      let p = parsedPublicId;
      const lastDot = p.lastIndexOf('.');
      if (lastDot !== -1) {
        p = p.substring(0, lastDot);
      }

      const cloudinary = require('../../../config/cloudinary');
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      
      // Try generating secure link as 'image' (PDFs are typically indexed under image namespace by Cloudinary)
      downloadUrl = cloudinary.utils.private_download_url(p, '', {
        resource_type: 'image',
        type: 'upload',
        expires_at: expiresAt
      });
    }

    const https = require('https');
    https.get(downloadUrl, (cloudRes) => {
      // If the 'image' resource type fails, perform auto-fallback to 'raw' type
      if (cloudRes.statusCode !== 200) {
        let rawDownloadUrl = cert.fileUrl;
        if (parsedPublicId) {
          const cloudinary = require('../../../config/cloudinary');
          const expiresAt = Math.floor(Date.now() / 1000) + 3600;
          rawDownloadUrl = cloudinary.utils.private_download_url(parsedPublicId, '', {
            resource_type: 'raw',
            type: 'upload',
            expires_at: expiresAt
          });
        }

        https.get(rawDownloadUrl, (rawRes) => {
          if (rawRes.statusCode !== 200) {
            console.error(`[PDFProxy] Failed to fetch. Status: ${rawRes.statusCode}`);
            return res.status(502).json({ success: false, message: 'Failed to fetch certificate file from storage.' });
          }
          res.removeHeader('X-Frame-Options');
          res.setHeader('Content-Security-Policy', "frame-ancestors *");
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
          rawRes.pipe(res);
        }).on('error', (e) => next(e));
        return;
      }

      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
      cloudRes.pipe(res);
    }).on('error', (e) => {
      console.error('[PDFProxy] Error:', e);
      next(e);
    });

  } catch (e) {
    next(e);
  }
};

// ── File proxy for assignment materials/submissions ────────────────────────────
const getCertificateAccess = async (req, res, next) => {
  try {
    console.log(`[CertAccess] Requesting cert ID: ${req.params.id}`);
    const cert = await lmsService.getCertificateById(req.tenantId, req.params.id);
    // Certificates are always 'image' (PDF) or 'raw'
    // We use proxyDownload which handles the archive workaround
    proxyDownload(cert.fileUrl, `Certificate_${cert.certificateNumber}.pdf`, res, next);
  } catch (e) {
    next(e);
  }
};

const signFileUrl = async (req, res, next) => {
  try {
    const { url: fileUrl } = req.body;
    if (!fileUrl) return res.status(400).json({ success: false, message: 'URL is required' });
    
    let downloadUrl = fileUrl;
    const parsedPublicId = extractCloudinaryPublicId(fileUrl);
    
    if (fileUrl.includes('/raw/') && parsedPublicId) {
      const cloudinary = require('../../../config/cloudinary');
      downloadUrl = cloudinary.utils.url(parsedPublicId, {
        resource_type: 'raw',
        sign_url: true,
        secure: true
      });
    }

    const urlParts = fileUrl.split('/');
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]) || 'file';
    
    proxyDownload(downloadUrl, fileName, res, next);
  } catch (e) {
    next(e);
  }
};

// ── Certificate Template ───────────────────────────────────────────────────────
const getCertificateTemplate = async (req, res, next) => {
  try {
    const data = await lmsService.getCertificateTemplate(req.tenantId, req.params.courseId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const saveCertificateTemplate = async (req, res, next) => {
  try {
    const data = await lmsService.saveCertificateTemplate(req.tenantId, req.params.courseId, req.body, req.file, req.user._id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

// ── Admin Controllers ──────────────────────────────────────────────────────────
const getAdminStats = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminStats(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminUsers(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const data = await lmsService.updateUserRole(req.tenantId, req.params.id, req.body.role, req.user._id.toString());
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const deactivateUser = async (req, res, next) => {
  try {
    const data = await lmsService.deactivateUser(req.tenantId, req.params.id, req.user._id.toString());
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const getAdminCourses = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminCourses(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const deleteAdminCourse = async (req, res, next) => {
  try {
    const data = await lmsService.deleteAdminCourse(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const getAdminCertificates = async (req, res, next) => {
  try {
    const data = await lmsService.getAdminCertificates(req.tenantId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const revokeCertificate = async (req, res, next) => {
  try {
    const data = await lmsService.revokeCertificate(req.tenantId, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

module.exports = {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse, enrollStudent,
  markAttendance, getCourseAttendance,
  createAssignment, updateAssignment, deleteAssignment, submitAssignment, getCourseAssignments,
  createSession, updateSession, getCourseSessions, toggleSession, getSessionAttendance, overrideAttendance,
  markSelfAttendance, getMyAttendanceSummary,
  uploadCourseDocument, getCourseDocuments, deleteCourseDocument, getCourseDocumentAccess,
  gradeSubmission, getAssignmentSubmissions, getMySubmission,
  createQuiz, updateQuiz, getCourseQuizzes, addQuizQuestion, updateQuizQuestion, publishQuiz, startQuizAttempt, submitQuizAttempt, getQuizResults, getMyQuizAttempts,
  getCoursePerformance, getMyPerformance,
  generateCertificate, generateAllCertificates, getCourseCertificates, getMyCertificates, verifyCertificate, getCertificatePdfPublic, getCertificateAccess, signFileUrl,
  getAdminStats, getAdminUsers, updateUserRole, deactivateUser, getAdminCourses, deleteAdminCourse, getAdminCertificates, revokeCertificate,
  getCertificateTemplate, saveCertificateTemplate
};
