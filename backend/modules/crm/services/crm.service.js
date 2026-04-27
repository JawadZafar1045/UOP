const Lead = require('../models/lead.model');
const { logActivity } = require('../../shared/services/activityLogger.service');

/**
 * Get all leads for a tenant with optional filters.
 */
const getLeads = async ({ tenantId, stage, assignedTo, page = 1, limit = 20 }) => {
  const query = { tenantId };
  if (stage) query.stage = stage;
  if (assignedTo) query.assignedTo = assignedTo;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Lead.countDocuments(query),
  ]);

  return { leads, total, page: parseInt(page), pages: Math.ceil(total / limit) };
};

/**
 * Get a single lead by ID (tenant-scoped).
 */
const getLeadById = async (tenantId, leadId) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId }).populate('assignedTo', 'name email');
  if (!lead) throw Object.assign(new Error('Lead not found.'), { statusCode: 404 });
  return lead;
};

const { sendEmail } = require('../../communication/services/communication.service');

/**
 * Create a new lead.
 */
const createLead = async (tenantId, leadData, userId) => {
  const lead = await Lead.create({ ...leadData, tenantId });
  await logActivity({ userId, tenantId, action: 'CREATE_LEAD', entityType: 'Lead', entityId: lead._id });

  // Example Use Case: Send email when new lead is created
  if (lead.email) {
    sendEmail(tenantId, {
      to: lead.email,
      subject: 'Welcome to UOP - We received your inquiry!',
      text: `Hi ${lead.name},\n\nWe have successfully received your inquiry at UOP. Our team will reach out to you shortly.\n\nBest Regards,\nUOP Team`,
      relatedEntity: { entityType: 'Lead', entityId: lead._id }
    }, userId).catch(err => console.error('[CRM] Failed sending welcome email to lead:', err));
  }

  return lead;
};

/**
 * Update a lead (with stage change detection).
 */
const updateLead = async (tenantId, leadId, updateData, userId) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId });
  if (!lead) throw Object.assign(new Error('Lead not found.'), { statusCode: 404 });

  const oldStage = lead.stage;

  Object.assign(lead, updateData);

  // Auto-log stage change as an activity entry
  if (updateData.stage && updateData.stage !== oldStage) {
    lead.activities.push({
      note: `Stage changed from "${oldStage}" to "${updateData.stage}"`,
      type: 'stage_change',
      createdBy: userId,
    });
  }

  await lead.save();
  await logActivity({ userId, tenantId, action: 'UPDATE_LEAD', entityType: 'Lead', entityId: lead._id });
  return lead;
};

/**
 * Delete a lead.
 */
const deleteLead = async (tenantId, leadId, userId) => {
  const lead = await Lead.findOneAndDelete({ _id: leadId, tenantId });
  if (!lead) throw Object.assign(new Error('Lead not found.'), { statusCode: 404 });
  await logActivity({ userId, tenantId, action: 'DELETE_LEAD', entityType: 'Lead', entityId: leadId });
};

/**
 * Add an activity entry to a lead's log.
 */
const addLeadActivity = async (tenantId, leadId, activityData, userId) => {
  const lead = await Lead.findOne({ _id: leadId, tenantId });
  if (!lead) throw Object.assign(new Error('Lead not found.'), { statusCode: 404 });

  lead.activities.push({ ...activityData, createdBy: userId });
  await lead.save();
  await logActivity({ userId, tenantId, action: 'ADD_LEAD_ACTIVITY', entityType: 'Lead', entityId: lead._id });
  return lead;
};

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead, addLeadActivity };
