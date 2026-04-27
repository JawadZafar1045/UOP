const empService = require('../services/employee.service');

const getEmployees    = async (req, res, next) => { try { res.json({ success: true, data: await empService.getEmployees({ tenantId: req.tenantId, ...req.query }) }); } catch (e) { next(e); } };
const getEmployee     = async (req, res, next) => { try { res.json({ success: true, data: await empService.getEmployeeById(req.tenantId, req.params.id) }); } catch (e) { next(e); } };
const createEmployee  = async (req, res, next) => { try { const e = await empService.createEmployee(req.tenantId, req.body, req.user._id); res.status(201).json({ success: true, data: e }); } catch (e) { next(e); } };
const updateEmployee  = async (req, res, next) => { try { res.json({ success: true, data: await empService.updateEmployee(req.tenantId, req.params.id, req.body, req.user._id) }); } catch (e) { next(e); } };
const deleteEmployee  = async (req, res, next) => { try { await empService.deleteEmployee(req.tenantId, req.params.id, req.user._id); res.json({ success: true, message: 'Employee deleted.' }); } catch (e) { next(e); } };

// Leave requests
const getLeaves       = async (req, res, next) => { try { res.json({ success: true, data: await empService.getLeaveRequests(req.tenantId, req.query.employeeId) }); } catch (e) { next(e); } };
const createLeave     = async (req, res, next) => { try { const l = await empService.createLeaveRequest(req.tenantId, req.params.empId, req.body, req.user._id); res.status(201).json({ success: true, data: l }); } catch (e) { next(e); } };
const updateLeave     = async (req, res, next) => { try { res.json({ success: true, data: await empService.updateLeaveStatus(req.tenantId, req.params.leaveId, req.body.status, req.user._id) }); } catch (e) { next(e); } };

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getLeaves, createLeave, updateLeave };
