const Document = require('../models/document.model');
const { uploadFile, deleteFile } = require('../../shared/services/fileService');
const { logActivity } = require('../../shared/services/activityLogger.service');

const getDocuments = async ({ tenantId, category, page = 1, limit = 20 }) => {
  const query = { tenantId };
  if (category) query.category = category;
  const skip = (page - 1) * limit;
  const [documents, total] = await Promise.all([
    Document.find(query).populate('uploadedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
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
  const { url, publicId } = await uploadFile(file, `documents/${tenantId}`);

  const doc = await Document.create({
    tenantId,
    title: metadata.title || file.originalname,
    description: metadata.description,
    category: metadata.category || 'other',
    fileUrl: url,
    publicId: publicId,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileName: file.originalname,
    uploadedBy: userId,
    relatedEntity: metadata.relatedEntity,
    lifecycle: 'Created',
    activities: [{ event: 'Created', performedBy: userId }],
  });

  await logActivity({ userId, tenantId, action: 'UPLOAD_DOCUMENT', entityType: 'Document', entityId: doc._id });

  // Example Use Case: Send email when Document is uploaded
  // Since we don't know the exact recipient, we can mock sending it to the uploader 
  // or a system admin to notify that a document was added.
  const User = require('../../auth/models/user.model');
  const uploader = await User.findById(userId);
  if (uploader && uploader.email) {
    const { sendEmail } = require('../../communication/services/communication.service');
    sendEmail(tenantId, {
      to: uploader.email,
      subject: `Document Uploaded: ${doc.title}`,
      text: `Your document '${doc.title}' has been successfully uploaded to Cloudinary.\nCategory: ${doc.category}\nLink: ${doc.fileUrl}`,
      relatedEntity: { entityType: 'Document', entityId: doc._id }
    }, userId).catch(err => console.error('[Docs] Failed sending doc upload email:', err));
  }

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
  // Cloudinary URLs are generally public or signed at generation. We just return the saved URL.
  // Track "Viewed" lifecycle event
  await updateLifecycle(tenantId, docId, 'Viewed', userId, 'Document accessed');
  return { url: doc.fileUrl };
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
