const ChatMessage = require('../models/chatMessage.model');
const EmailLog = require('../models/emailLog.model');
const { sendEmail: mailerSend } = require('../../shared/services/emailService');

const getChatHistory = async (tenantId, conversationId, limit = 50) => {
  return ChatMessage.find({ tenantId, conversationId })
    .populate('senderId', 'name avatar role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const saveChatMessage = async (tenantId, conversationId, senderId, content) => {
  return ChatMessage.create({ tenantId, conversationId, senderId, content });
};

const sendEmail = async (tenantId, { to, subject, html, text, relatedEntity }, userId) => {
  const log = await EmailLog.create({
    tenantId, to, subject, body: html || text, sentBy: userId, relatedEntity
  });

  try {
    await mailerSend(to, subject, text, html);
    log.status = 'sent';
  } catch (error) {
    log.status = 'failed';
    log.errorMsg = error.message;
  }
  
  await log.save();

  return log;
};

const getEmailLogs = async (tenantId, limit = 50) => {
  return EmailLog.find({ tenantId }).sort({ createdAt: -1 }).limit(limit);
};

module.exports = { getChatHistory, saveChatMessage, sendEmail, getEmailLogs };
