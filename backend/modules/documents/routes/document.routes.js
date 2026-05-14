const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/document.controller');

router.use(protect, tenantIsolation);

router.get('/',            authorize('admin', 'hr', 'sales', 'teacher', 'student'), ctrl.getDocuments);
router.get('/:id',         authorize('admin', 'hr', 'sales', 'teacher', 'student'), ctrl.getDocument);
router.post('/upload',     authorize('admin', 'hr', 'sales', 'teacher'), upload.single('file'), ctrl.uploadDocument);
router.put('/:id/lifecycle', authorize('admin', 'hr', 'sales'),          ctrl.updateLifecycle);
router.get('/:id/access',  authorize('admin', 'hr', 'sales', 'teacher', 'student'), ctrl.getPresignedUrl);
router.delete('/:id',      authorize('admin', 'teacher'),                ctrl.deleteDocument);

module.exports = router;
