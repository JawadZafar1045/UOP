const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/document.controller');
const { validateResult } = require('../../shared/middlewares/validation.middleware');
const val = require('../validators/document.validator');

router.use(protect, tenantIsolation);

router.get('/',            authorize('admin', 'teacher', 'student'), ctrl.getDocuments);
router.get('/:id',         val.getDocumentVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getDocument);
router.post('/upload',     authorize('admin', 'teacher'), upload.single('file'), val.uploadDocumentVal, validateResult, ctrl.uploadDocument);
router.put('/:id/lifecycle', val.updateLifecycleVal, validateResult, authorize('admin'), ctrl.updateLifecycle);
router.get('/:id/access',  val.getDocumentVal, validateResult, authorize('admin', 'teacher', 'student'), ctrl.getPresignedUrl);
router.delete('/:id',      val.getDocumentVal, validateResult, authorize('admin', 'teacher'),                ctrl.deleteDocument);

module.exports = router;
