const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const ctrl = require('../controllers/crm.controller');

// All CRM routes require authentication + tenant isolation
router.use(protect, tenantIsolation);

router.get('/leads',              authorize('admin', 'sales', 'hr'), ctrl.getLeads);
router.get('/leads/:id',          authorize('admin', 'sales', 'hr'), ctrl.getLead);
router.post('/leads',             authorize('admin', 'sales'),       ctrl.createLead);
router.put('/leads/:id',          authorize('admin', 'sales'),       ctrl.updateLead);
router.delete('/leads/:id',       authorize('admin'),                ctrl.deleteLead);
router.post('/leads/:id/activities', authorize('admin', 'sales', 'hr'), ctrl.addActivity);

module.exports = router;
