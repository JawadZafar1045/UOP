const Employee = require('../models/employee.model');
const LeaveRequest = require('../models/leaveRequest.model');
const User = require('../../auth/models/user.model');
const { logActivity } = require('../../shared/services/activityLogger.service');

// ── Employees ──────────────────────────────────────────────────────────────────
const getEmployees = async ({ tenantId, page = 1, limit = 20, department, status }) => {
  const query = { tenantId };
  if (department) query.department = department;
  if (status) query.status = status;
  const skip = (page - 1) * limit;
  const [employees, total] = await Promise.all([
    Employee.find(query).populate('userId', 'name email avatar phone role').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Employee.countDocuments(query),
  ]);
  return { employees, total, page, pages: Math.ceil(total / limit) };
};

const getEmployeeById = async (tenantId, id) => {
  const emp = await Employee.findOne({ _id: id, tenantId }).populate('userId', 'name email avatar phone role');
  if (!emp) throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
  return emp;
};

const createEmployee = async (tenantId, data, userId) => {
  // Create a system User account for the employee
  const user = await User.create({
    tenantId,
    name: data.name,
    email: data.email,
    password: data.password || 'TempPass@123',
    phone: data.phone,
    role: data.role || 'hr',
  });

  const employee = await Employee.create({ tenantId, userId: user._id, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_EMPLOYEE', entityType: 'Employee', entityId: employee._id });
  return employee;
};

const updateEmployee = async (tenantId, id, data, userId) => {
  const emp = await Employee.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  if (!emp) throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
  await logActivity({ userId, tenantId, action: 'UPDATE_EMPLOYEE', entityType: 'Employee', entityId: id });
  return emp;
};

const deleteEmployee = async (tenantId, id, userId) => {
  const emp = await Employee.findOneAndDelete({ _id: id, tenantId });
  if (!emp) throw Object.assign(new Error('Employee not found.'), { statusCode: 404 });
  await logActivity({ userId, tenantId, action: 'DELETE_EMPLOYEE', entityType: 'Employee', entityId: id });
};

// ── Leave Requests ─────────────────────────────────────────────────────────────
const createLeaveRequest = async (tenantId, employeeId, data, userId) => {
  const leave = await LeaveRequest.create({ tenantId, employeeId, ...data });
  await logActivity({ userId, tenantId, action: 'CREATE_LEAVE_REQUEST', entityType: 'LeaveRequest', entityId: leave._id });
  return leave;
};

const getLeaveRequests = async (tenantId, employeeId) => {
  const q = { tenantId };
  if (employeeId) q.employeeId = employeeId;
  return LeaveRequest.find(q).populate('employeeId').populate('approvedBy', 'name').sort({ createdAt: -1 });
};

const updateLeaveStatus = async (tenantId, leaveId, status, approverId) => {
  const leave = await LeaveRequest.findOneAndUpdate(
    { _id: leaveId, tenantId },
    { status, approvedBy: approverId, approvedAt: new Date() },
    { new: true }
  );
  if (!leave) throw Object.assign(new Error('Leave request not found.'), { statusCode: 404 });
  return leave;
};

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, createLeaveRequest, getLeaveRequests, updateLeaveStatus };
