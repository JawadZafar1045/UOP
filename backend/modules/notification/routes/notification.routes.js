const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const Notification = require('../../shared/models/notification.model');

router.use(protect, tenantIsolation);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      tenantId: req.tenantId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (e) { next(e); }
});

// PATCH /api/notifications/read-all  (must be before /:id/read)
router.patch('/read-all', async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, tenantId: req.tenantId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, data: { updated: result.modifiedCount } });
  } catch (e) { next(e); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, tenantId: req.tenantId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, data: notification });
  } catch (e) { next(e); }
});

module.exports = router;
