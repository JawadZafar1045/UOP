const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const Lead = require('../../crm/models/lead.model');
const Course = require('../../lms/models/course.model');
const Employee = require('../../employee/models/employee.model');
const User = require('../../auth/models/user.model');

/**
 * GET /api/dashboard
 * Returns aggregated stats for the current tenant.
 * Accessible by admin, hr, sales, teacher
 */
router.get('/', protect, authorize('admin', 'hr', 'sales', 'teacher'), async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [
      totalLeads,
      convertedLeads,
      totalStudents,
      totalEmployees,
      totalCourses,
    ] = await Promise.all([
      Lead.countDocuments({ tenantId }),
      Lead.countDocuments({ tenantId, stage: 'Enrolled' }),
      User.countDocuments({ tenantId, role: 'student' }),
      Employee.countDocuments({ tenantId }),
      Course.countDocuments({ tenantId }),
    ]);

    // Pipeline stage breakdown
    const pipelineStats = await Lead.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);

    const conversionRate = totalLeads > 0
      ? ((convertedLeads / totalLeads) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        leads: { total: totalLeads, converted: convertedLeads, conversionRate: `${conversionRate}%`, pipeline: pipelineStats },
        students: { total: totalStudents },
        employees: { total: totalEmployees },
        courses: { total: totalCourses },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
