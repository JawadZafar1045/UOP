const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { authorize } = require('../../shared/middlewares/rbac.middleware');
const Course = require('../../lms/models/course.model');
const User = require('../../auth/models/user.model');

const ActivityLog = require('../../shared/models/activityLog.model');

/**
 * GET /api/dashboard
 * Returns aggregated stats for the current tenant.
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'student') {
      // Student specific stats
      const enrolledCourses = await Course.countDocuments({ enrolledStudents: userId });
      // In a real app, you'd calculate actual progress here
      res.json({
        success: true,
        data: {
          role: 'student',
          stats: {
            enrolled: enrolledCourses,
            completed: 0, // Placeholder
            certificates: 0 // Placeholder
          }
        }
      });
    } else {
      // Admin/Teacher stats
      const [
        totalStudents,
        totalCourses,
        activeCourses,
        recentStudents,
      ] = await Promise.all([
        User.countDocuments({ tenantId, role: 'student' }),
        Course.countDocuments({ tenantId }),
        Course.countDocuments({ tenantId, status: { $in: ['active', 'published'] } }),
        User.find({ tenantId, role: 'student' }).select('name email avatar createdAt').limit(10).sort({ createdAt: -1 }),
      ]);

      res.json({
        success: true,
        data: {
          role,
          stats: {
            students: totalStudents,
            courses: totalCourses,
            active: activeCourses
          },
          recentStudents
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/activities
 * Returns recent activity logs.
 */
router.get('/activities', protect, authorize('admin', 'teacher'), async (req, res, next) => {
  try {
    const activities = await ActivityLog.find({ tenantId: req.tenantId })
      .populate('userId', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
