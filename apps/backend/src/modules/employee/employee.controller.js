const employeeService = require('./employee.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

const errMap = {
  STORE_NOT_FOUND: [404, 'Toko tidak ditemukan'],
  EMPLOYEE_NOT_FOUND: [404, 'Karyawan tidak ditemukan'],
  ALREADY_EMPLOYEE: [409, 'Pengguna sudah menjadi karyawan di toko ini'],
  INVITE_EXPIRED: [410, 'Link undangan sudah kadaluwarsa atau tidak valid'],
  PHONE_MISMATCH: [403, 'Nomor HP tidak sesuai dengan undangan'],
  PIN_INVALID_FORMAT: [400, 'PIN harus 6 digit angka'],
  PIN_NOT_SET: [400, 'PIN belum diatur. Minta pemilik toko untuk mengatur PIN Anda'],
  PIN_INVALID: [401, 'PIN salah'],
  FORBIDDEN: [403, 'Tidak memiliki akses'],
  USER_NOT_FOUND: [404, 'Pengguna tidak ditemukan'],
};

function handleErr(err, res, next) {
  const [status, msg] = errMap[err.message] || [null, null];
  if (status) return res.status(status).json(errorResponse(msg));
  next(err);
}

// POST /api/employee/invite
async function invite(req, res, next) {
  try {
    const { storeId, phone, permissions } = req.body;
    if (!storeId || !phone) {
      return res.status(400).json(errorResponse('storeId dan phone wajib diisi'));
    }
    const result = await employeeService.inviteEmployee(req.user.id, storeId, phone, permissions);
    res.status(201).json(successResponse(result, 'Undangan berhasil dikirim'));
  } catch (err) { handleErr(err, res, next); }
}

// POST /api/employee/join
async function join(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json(errorResponse('Token wajib diisi'));
    const employee = await employeeService.joinStore(req.user.id, token);
    res.status(201).json(successResponse(employee, `Berhasil bergabung ke ${employee.store.name}`));
  } catch (err) { handleErr(err, res, next); }
}

// GET /api/employee/list/:storeId
async function list(req, res, next) {
  try {
    const employees = await employeeService.getEmployees(req.user.id, req.params.storeId);
    res.json(successResponse(employees));
  } catch (err) { handleErr(err, res, next); }
}

// PUT /api/employee/:id/permissions
async function updatePermissions(req, res, next) {
  try {
    const updated = await employeeService.updatePermissions(req.user.id, req.params.id, req.body);
    res.json(successResponse(updated, 'Permissions berhasil diperbarui'));
  } catch (err) { handleErr(err, res, next); }
}

// PUT /api/employee/:id/pin
async function setPin(req, res, next) {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json(errorResponse('PIN wajib diisi'));
    await employeeService.setPin(req.user.id, req.params.id, pin);
    res.json(successResponse(null, 'PIN berhasil diatur'));
  } catch (err) { handleErr(err, res, next); }
}

// POST /api/employee/pin-login
async function pinLogin(req, res, next) {
  try {
    const { storeId, phone, pin } = req.body;
    if (!storeId || !phone || !pin) {
      return res.status(400).json(errorResponse('storeId, phone, dan pin wajib diisi'));
    }
    const result = await employeeService.pinLogin(storeId, phone, pin);
    res.json(successResponse(result, 'Login berhasil'));
  } catch (err) { handleErr(err, res, next); }
}

// DELETE /api/employee/:id
async function removeEmployee(req, res, next) {
  try {
    await employeeService.removeEmployee(req.user.id, req.params.id);
    res.json(successResponse(null, 'Karyawan berhasil dihapus'));
  } catch (err) { handleErr(err, res, next); }
}

// GET /api/employee/shift-summary/:storeId
async function shiftSummary(req, res, next) {
  try {
    const summary = await employeeService.getShiftSummary(req.user.id, req.params.storeId);
    res.json(successResponse(summary));
  } catch (err) { handleErr(err, res, next); }
}

module.exports = { invite, join, list, updatePermissions, setPin, pinLogin, removeEmployee, shiftSummary };
