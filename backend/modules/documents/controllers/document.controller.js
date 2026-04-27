const docService = require('../services/document.service');
const { upload } = require('../middlewares/upload.middleware');

const getDocuments = async (req, res, next) => {
  try { res.json({ success: true, data: await docService.getDocuments({ tenantId: req.tenantId, ...req.query }) }); } catch (e) { next(e); }
};

const getDocument = async (req, res, next) => {
  try { res.json({ success: true, data: await docService.getDocumentById(req.tenantId, req.params.id) }); } catch (e) { next(e); }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    // Parse relatedEntity if sent as a stringified JSON
    let relatedEntity;
    try { if (req.body.relatedEntity) relatedEntity = JSON.parse(req.body.relatedEntity); } catch {}
    
    const doc = await docService.uploadDocument(req.tenantId, req.file, { ...req.body, relatedEntity }, req.user._id);
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
    const data = await docService.getDocumentPresignedUrl(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

const deleteDocument = async (req, res, next) => {
  try {
    await docService.deleteDocument(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, message: 'Document deleted.' });
  } catch (e) { next(e); }
};

module.exports = { getDocuments, getDocument, uploadDocument, updateLifecycle, getPresignedUrl, deleteDocument };
