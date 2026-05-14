const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const Course = require('../../lms/models/course.model');
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
      totalStudents,
      totalCourses,
    ] = await Promise.all([
      User.countDocuments({ tenantId, role: 'student' }),
      Course.countDocuments({ tenantId }),
    ]);

    res.json({
      success: true,
      data: {
        students: { total: totalStudents },
        courses: { total: totalCourses },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
