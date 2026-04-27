const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const ctrl = require('../controllers/employee.controller');

router.use(protect, tenantIsolation);

router.get('/',              authorize('admin', 'hr'),  ctrl.getEmployees);
router.get('/:id',           authorize('admin', 'hr'),  ctrl.getEmployee);
router.post('/',             authorize('admin', 'hr'),  ctrl.createEmployee);
router.put('/:id',           authorize('admin', 'hr'),  ctrl.updateEmployee);
router.delete('/:id',        authorize('admin'),         ctrl.deleteEmployee);

// Leave requests
router.get('/leaves/all',           authorize('admin', 'hr'), ctrl.getLeaves);
router.post('/:empId/leaves',       authorize('admin', 'hr'), ctrl.createLeave);
router.put('/leaves/:leaveId',      authorize('admin', 'hr'), ctrl.updateLeave);

module.exports = router;
