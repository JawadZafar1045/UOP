const docService = require('../services/document.service');
const { upload } = require('../middlewares/upload.middleware');
const https = require('https');
const http = require('http');
const path = require('path');

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
  const ext = path.extname(filename || '').toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
};

const getDocuments = async (req, res, next) => {
  try { res.json({ success: true, data: await docService.getDocuments({ tenantId: req.tenantId, role: req.user.role, userId: req.user._id, ...req.query }) }); } catch (e) { next(e); }
};

const getDocument = async (req, res, next) => {
  try { res.json({ success: true, data: await docService.getDocumentById(req.tenantId, req.params.id) }); } catch (e) { next(e); }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    
    const doc = await docService.uploadDocument(req.tenantId, req.file, req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Document uploaded.', data: doc });
  } catch (e) { next(e); }
};

const updateLifecycle = async (req, res, next) => {
  try {
    const doc = await docService.updateLifecycle(req.tenantId, req.params.id, req.body.event, req.user._id, req.body.note);
    res.json({ success: true, message: 'Lifecycle updated.', data: doc });
  } catch (e) { next(e); }
};

const getPresignedUrl = async (req, res, next) => {
  try {
    const doc = await docService.getDocumentById(req.tenantId, req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const cloudinary = require('../../../config/cloudinary');
    const resourceType = doc.resourceType || (doc.mimeType === 'application/pdf' ? 'image' : 'raw');
    
    const archiveUrl = cloudinary.utils.download_archive_url({
      public_ids: [doc.publicId],
      resource_type: resourceType,
      flatten_folders: true,
      target_filename: doc.fileName || doc.title || 'document'
    });

    console.log(`[Proxy] Generated Archive URL for doc ${doc._id}: ${archiveUrl}`);
    
    const getter = archiveUrl.startsWith('https') ? https : http;
    getter.get(archiveUrl, (cloudRes) => {
      if (cloudRes.statusCode !== 200) {
        console.error(`[Proxy] Archive fetch failed with status ${cloudRes.statusCode}`);
        return res.status(502).json({ success: false, message: 'Failed to fetch file from storage.' });
      }
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title || 'document')}.zip"`);
      cloudRes.pipe(res);
    }).on('error', (e) => {
      console.error('Proxy download error:', e);
      next(e);
    });
  } catch (e) { next(e); }
};

const deleteDocument = async (req, res, next) => {
  try {
    await docService.deleteDocument(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, message: 'Document deleted.' });
  } catch (e) { next(e); }
};

module.exports = { getDocuments, getDocument, uploadDocument, updateLifecycle, getPresignedUrl, deleteDocument };
