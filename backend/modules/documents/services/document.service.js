const Document = require('../models/document.model');
const { uploadFile, deleteFile } = require('../../shared/services/fileService');
const { logActivity } = require('../../shared/services/activityLogger.service');

const Course = require('../../lms/models/course.model');

const getDocuments = async ({ tenantId, role, userId, category, scope, courseId, studentId, page = 1, limit = 20 }) => {
  const query = { tenantId };
  if (category) query.category = category;
  
  if (role === 'student') {
    const courses = await Course.find({ tenantId, enrolledStudents: userId }).select('_id');
    const courseIds = courses.map(c => c._id);
    
    query.$or = [
      { scope: 'institute' },
      { scope: 'course', courseId: { $in: courseIds } },
      { scope: 'student_submission', studentId: userId }
    ];
  } else if (role === 'teacher') {
    const courses = await Course.find({ tenantId, instructor: userId }).select('_id');
    const courseIds = courses.map(c => c._id);
    
    query.$or = [
      { scope: 'institute' },
      { scope: 'course', courseId: { $in: courseIds } },
      { uploadedBy: userId }
    ];
    if (scope) query.scope = scope; // If specific scope requested, further filter it
  } else {
    if (scope) query.scope = scope;
    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;
  }
  
  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(query).populate('uploadedBy', 'name email').populate('courseId', 'title').populate('studentId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Document.countDocuments(query),
  ]);
  return { documents, total, page, pages: Math.ceil(total / limit) };
};

const getDocumentById = async (tenantId, docId) => {
  const doc = await Document.findOne({ _id: docId, tenantId }).populate('uploadedBy', 'name email');
  if (!doc) throw Object.assign(new Error('Document not found.'), { statusCode: 404 });
  return doc;
};

const uploadDocument = async (tenantId, file, metadata, userId) => {
  // Upload to Cloudinary
  const { url, publicId, resourceType } = await uploadFile(file, `documents/${tenantId}`);

  const doc = await Document.create({
    tenantId,
    title: metadata.title || file.originalname,
    description: metadata.description,
    category: metadata.category || 'other',
    fileUrl: url,
    publicId: publicId,
    resourceType: resourceType,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileName: file.originalname,
    uploadedBy: userId,
    scope: metadata.scope || 'institute',
    courseId: metadata.courseId || null,
    studentId: metadata.studentId || null,
    lifecycle: 'Created',
    activities: [{ event: 'Created', performedBy: userId }],
  });

  await logActivity({ userId, tenantId, action: 'UPLOAD_DOCUMENT', entityType: 'Document', entityId: doc._id });

  return doc;
};

const updateLifecycle = async (tenantId, docId, event, userId, note) => {
  const doc = await Document.findOne({ _id: docId, tenantId });
  if (!doc) throw Object.assign(new Error('Document not found.'), { statusCode: 404 });

  doc.lifecycle = event;
  doc.activities.push({ event, performedBy: userId, note });
  await doc.save();
  await logActivity({ userId, tenantId, action: `DOC_${event.toUpperCase()}`, entityType: 'Document', entityId: docId });
  return doc;
};

const getDocumentPresignedUrl = async (tenantId, docId, userId) => {
  const doc = await getDocumentById(tenantId, docId);
  // Track "Viewed" lifecycle event
  await updateLifecycle(tenantId, docId, 'Viewed', userId, 'Document accessed');

  const cloudinary = require('../../../config/cloudinary');
  const isRaw = doc.fileUrl.includes('/raw/');

  if (!isRaw) {
    return { url: doc.fileUrl };
  }

  // Generate a signed URL to allow access to raw files blocked by default strict delivery settings
  const url = cloudinary.utils.url(doc.publicId, {
    resource_type: 'raw',
    sign_url: true,
    secure: true
  });

  return { url, fileName: doc.fileName || doc.name || 'document' };
};

const deleteDocument = async (tenantId, docId, userId) => {
  const doc = await Document.findOne({ _id: docId, tenantId });
  if (!doc) throw Object.assign(new Error('Document not found.'), { statusCode: 404 });

  // Remove from Cloudinary
  await deleteFile(doc.publicId);
  await doc.deleteOne();
  await logActivity({ userId, tenantId, action: 'DELETE_DOCUMENT', entityType: 'Document', entityId: docId });
};

module.exports = { getDocuments, getDocumentById, uploadDocument, updateLifecycle, getDocumentPresignedUrl, deleteDocument };
