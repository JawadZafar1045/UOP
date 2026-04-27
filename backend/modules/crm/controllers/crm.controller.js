const crmService = require('../services/crm.service');

/** GET /api/crm/leads */
const getLeads = async (req, res, next) => {
  try {
    const { stage, assignedTo, page, limit } = req.query;
    const result = await crmService.getLeads({ tenantId: req.tenantId, stage, assignedTo, page, limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

/** GET /api/crm/leads/:id */
const getLead = async (req, res, next) => {
  try {
    const lead = await crmService.getLeadById(req.tenantId, req.params.id);
    res.json({ success: true, data: lead });
  } catch (err) { next(err); }
};

/** POST /api/crm/leads */
const createLead = async (req, res, next) => {
  try {
    const lead = await crmService.createLead(req.tenantId, req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Lead created.', data: lead });
  } catch (err) { next(err); }
};

/** PUT /api/crm/leads/:id */
const updateLead = async (req, res, next) => {
  try {
    const lead = await crmService.updateLead(req.tenantId, req.params.id, req.body, req.user._id);
    res.json({ success: true, message: 'Lead updated.', data: lead });
  } catch (err) { next(err); }
};

/** DELETE /api/crm/leads/:id */
const deleteLead = async (req, res, next) => {
  try {
    await crmService.deleteLead(req.tenantId, req.params.id, req.user._id);
    res.json({ success: true, message: 'Lead deleted.' });
  } catch (err) { next(err); }
};

/** POST /api/crm/leads/:id/activities */
const addActivity = async (req, res, next) => {
  try {
    const lead = await crmService.addLeadActivity(req.tenantId, req.params.id, req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Activity logged.', data: lead });
  } catch (err) { next(err); }
};

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, addActivity };
