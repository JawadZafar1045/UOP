const commService = require('../services/communication.service');

const getChatHistory = async (req, res, next) => {
  try { res.json({ success: true, data: await commService.getChatHistory(null, req.params.conversationId) }); } catch (e) { next(e); }
};

const sendEmail = async (req, res, next) => {
  try {
    const log = await commService.sendEmail(req.tenantId, req.body, req.user._id);
    res.json({ success: true, message: 'Email queued for sending.', data: log });
  } catch (e) { next(e); }
};

const getEmailLogs = async (req, res, next) => {
  try { res.json({ success: true, data: await commService.getEmailLogs(req.tenantId) }); } catch (e) { next(e); }
};

module.exports = { getChatHistory, sendEmail, getEmailLogs };
