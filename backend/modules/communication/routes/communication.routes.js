const express = require('express');
const router = express.Router();
const { protect } = require('../../shared/middlewares/auth.middleware');
const { tenantIsolation } = require('../../shared/middlewares/tenant.middleware');
const ctrl = require('../controllers/communication.controller');

router.use(protect, tenantIsolation);

router.get('/chat/:conversationId', ctrl.getChatHistory);
router.post('/email/send', ctrl.sendEmail);
router.get('/email/logs', ctrl.getEmailLogs);

module.exports = router;
