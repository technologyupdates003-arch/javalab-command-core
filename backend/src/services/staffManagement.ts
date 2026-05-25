import { query } from './database.js';
import { set, get, del } from './cache.js';
import logger from '@/utils/logger.js';
import { StaffMember, AttendanceRecord, PayrollRecord, PayrollDeduction, AppError } from '@/types/index.js';

/**
 * Staff Management Service
 * Handles staff CRUD operations, attendance tracking, and payroll calculations
 */

// Cache keys
const STAFF_CACHE_KEY = (id: string) => `staff:${id}`;
const STAFF_LIST_CACHE_KEY = (departmentId?: string) => `staff:list:${departmentId || 'all'}`;
const ATTENDANCE_CACHE_KEY = (staffId: string, date: string) => `attendance:${staffId}:${date}`;
const PAYROLL_CACHE_KEY = (staffId: string, period: string) => `payroll:${staffId}:${period}`;

/**
 * Create a new staff member
 */
export async function createStaffMember(
  data: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<StaffMember> {
  try {
    const result = await query(
      `INSERT INTO staff_members 
       (name, email, phone, role, department_id, reporting_manager_id, employment_status, salary, join_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, email, phone, role, department_id, reporting_manager_id, employment_status, salary, join_date, end_date, created_at, updated_at, created_by`,
      [
        data.name,
        data.email,
        data.phone || null,
        data.role,
        data.departmentId,
        data.reportingManagerId || null,
        data.employmentStatus,
        data.salary,
        data.joinDate,
        data.endDate || null,
        userId,
      ]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('STAFF_CREATE_FAILED', 500, 'Failed to create staff member');
    }

    const staff = rows[0];
    const staffMember: StaffMember = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      departmentId: staff.department_id,
      reportingManagerId: staff.reporting_manager_id,
      employmentStatus: staff.employment_status,
      salary: parseFloat(staff.salary),
      joinDate: new Date(staff.join_date),
      endDate: staff.end_date ? new Date(staff.end_date) : undefined,
      createdAt: new Date(staff.created_at),
      updatedAt: new Date(staff.updated_at),
      createdBy: staff.created_by,
    };

    // Invalidate cache
    await del(STAFF_LIST_CACHE_KEY(data.departmentId));

    logger.info('Staff member created', { staffId: staff.id, email: data.email, userId });

    return staffMember;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Error creating staff member', err);
    throw new AppError('STAFF_CREATE_ERROR', 500, 'Failed to create staff member');
  }
}

/**
 * Get staff member by ID
 */
export async function getStaffMember(id: string): Promise<StaffMember> {
  try {
    // Check cache first
    const cached = await get(STAFF_CACHE_KEY(id));
    if (cached) {
      return cached as StaffMember;
    }

    const result = await query(
      `SELECT id, name, email, phone, role, department_id, reporting_manager_id, employment_status, salary, join_date, end_date, created_at, updated_at, created_by
       FROM staff_members WHERE id = $1`,
      [id]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('STAFF_NOT_FOUND', 404, 'Staff member not found');
    }

    const staff = rows[0];
    const staffMember: StaffMember = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      departmentId: staff.department_id,
      reportingManagerId: staff.reporting_manager_id,
      employmentStatus: staff.employment_status,
      salary: parseFloat(staff.salary),
      joinDate: new Date(staff.join_date),
      endDate: staff.end_date ? new Date(staff.end_date) : undefined,
      createdAt: new Date(staff.created_at),
      updatedAt: new Date(staff.updated_at),
      createdBy: staff.created_by,
    };

    // Cache for 1 hour
    await set(STAFF_CACHE_KEY(id), staffMember, 3600);

    return staffMember;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Error getting staff member', err);
    throw new AppError('STAFF_GET_ERROR', 500, 'Failed to get staff member');
  }
}

/**
 * Get all staff members in a department
 */
export async function getStaffByDepartment(departmentId: string): Promise<StaffMember[]> {
  try {
    // Check cache first
    const cached = await get(STAFF_LIST_CACHE_KEY(departmentId));
    if (cached) {
      return cached as StaffMember[];
    }

    const result = await query(
      `SELECT id, name, email, phone, role, department_id, reporting_manager_id, employment_status, salary, join_date, end_date, created_at, updated_at, created_by
       FROM staff_members WHERE department_id = $1 AND employment_status = 'active'
       ORDER BY name ASC`,
      [departmentId]
    );

    const rows = (result as any).rows;
    const staffMembers: StaffMember[] = rows.map((staff: any) => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      departmentId: staff.department_id,
      reportingManagerId: staff.reporting_manager_id,
      employmentStatus: staff.employment_status,
      salary: parseFloat(staff.salary),
      joinDate: new Date(staff.join_date),
      endDate: staff.end_date ? new Date(staff.end_date) : undefined,
      createdAt: new Date(staff.created_at),
      updatedAt: new Date(staff.updated_at),
      createdBy: staff.created_by,
    }));

    // Cache for 1 hour
    await set(STAFF_LIST_CACHE_KEY(departmentId), staffMembers, 3600);

    return staffMembers;
  } catch (err) {
    logger.error('Error getting staff by department', err);
    throw new AppError('STAFF_LIST_ERROR', 500, 'Failed to get staff members');
  }
}

/**
 * Update staff member
 */
export async function updateStaffMember(
  id: string,
  data: Partial<Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>,
  userId: string
): Promise<StaffMember> {
  try {
    // Get current staff member for audit trail
    const current = await getStaffMember(id);

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }
    if (data.departmentId !== undefined) {
      updates.push(`department_id = $${paramCount++}`);
      values.push(data.departmentId);
    }
    if (data.reportingManagerId !== undefined) {
      updates.push(`reporting_manager_id = $${paramCount++}`);
      values.push(data.reportingManagerId);
    }
    if (data.employmentStatus !== undefined) {
      updates.push(`employment_status = $${paramCount++}`);
      values.push(data.employmentStatus);
    }
    if (data.salary !== undefined) {
      updates.push(`salary = $${paramCount++}`);
      values.push(data.salary);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(data.endDate);
    }

    if (updates.length === 0) {
      return current;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE staff_members SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, phone, role, department_id, reporting_manager_id, employment_status, salary, join_date, end_date, created_at, updated_at, created_by`,
      values
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('STAFF_UPDATE_FAILED', 500, 'Failed to update staff member');
    }

    const staff = rows[0];
    const staffMember: StaffMember = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      departmentId: staff.department_id,
      reportingManagerId: staff.reporting_manager_id,
      employmentStatus: staff.employment_status,
      salary: parseFloat(staff.salary),
      joinDate: new Date(staff.join_date),
      endDate: staff.end_date ? new Date(staff.end_date) : undefined,
      createdAt: new Date(staff.created_at),
      updatedAt: new Date(staff.updated_at),
      createdBy: staff.created_by,
    };

    // Invalidate cache
    await del(STAFF_CACHE_KEY(id));
    await del(STAFF_LIST_CACHE_KEY(current.departmentId));
    if (data.departmentId) {
      await del(STAFF_LIST_CACHE_KEY(data.departmentId));
    }

    logger.info('Staff member updated', { staffId: id, userId });

    return staffMember;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Error updating staff member', err);
    throw new AppError('STAFF_UPDATE_ERROR', 500, 'Failed to update staff member');
  }
}

/**
 * Record attendance for a staff member
 */
export async function recordAttendance(
  staffId: string,
  data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string
): Promise<AttendanceRecord> {
  try {
    // Verify staff member exists
    await getStaffMember(staffId);

    const result = await query(
      `INSERT INTO attendance_records 
       (staff_id, date, check_in_time, check_out_time, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (staff_id, date) DO UPDATE SET
       check_in_time = EXCLUDED.check_in_time,
       check_out_time = EXCLUDED.check_out_time,
       status = EXCLUDED.status,
       notes = EXCLUDED.notes,
       updated_at = NOW()
       RETURNING id, staff_id, date, check_in_time, check_out_time, status, notes, created_at, updated_at, created_by`,
      [
        staffId,
        data.date,
        data.checkInTime || null,
        data.checkOutTime || null,
        data.status,
        data.notes || null,
        userId,
      ]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('ATTENDANCE_RECORD_FAILED', 500, 'Failed to record attendance');
    }

    const record = rows[0];
    const attendance: AttendanceRecord = {
      id: record.id,
      staffId: record.staff_id,
      date: new Date(record.date),
      checkInTime: record.check_in_time ? new Date(record.check_in_time) : undefined,
      checkOutTime: record.check_out_time ? new Date(record.check_out_time) : undefined,
      status: record.status,
      notes: record.notes,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
    };

    // Invalidate cache
    const dateStr = data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date;
    await del(ATTENDANCE_CACHE_KEY(staffId, dateStr));

    logger.info('Attendance recorded', { staffId, date: data.date, userId });

    return attendance;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Error recording attendance', err);
    throw new AppError('ATTENDANCE_ERROR', 500, 'Failed to record attendance');
  }
}

/**
 * Get attendance records for a staff member
 */
export async function getAttendanceRecords(
  staffId: string,
  startDate: Date,
  endDate: Date
): Promise<AttendanceRecord[]> {
  try {
    const result = await query(
      `SELECT id, staff_id, date, check_in_time, check_out_time, status, notes, created_at, updated_at, created_by
       FROM attendance_records 
       WHERE staff_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date DESC`,
      [staffId, startDate, endDate]
    );

    const rows = (result as any).rows;
    const records: AttendanceRecord[] = rows.map((record: any) => ({
      id: record.id,
      staffId: record.staff_id,
      date: new Date(record.date),
      checkInTime: record.check_in_time ? new Date(record.check_in_time) : undefined,
      checkOutTime: record.check_out_time ? new Date(record.check_out_time) : undefined,
      status: record.status,
      notes: record.notes,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
    }));

    return records;
  } catch (err) {
    logger.error('Error getting attendance records', err);
    throw new AppError('ATTENDANCE_GET_ERROR', 500, 'Failed to get attendance records');
  }
}

/**
 * Calculate payroll for a staff member
 */
export async function calculatePayroll(
  staffId: string,
  period: string,
  userId: string
): Promise<PayrollRecord> {
  try {
    // Get staff member
    const staff = await getStaffMember(staffId);

    // Get attendance records for the period
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const attendanceRecords = await getAttendanceRecords(staffId, startDate, endDate);

    // Calculate working days and deductions
    const presentDays = attendanceRecords.filter((r) => r.status === 'present').length;
    const halfDays = attendanceRecords.filter((r) => r.status === 'half_day').length;
    const absentDays = attendanceRecords.filter((r) => r.status === 'absent').length;

    // Calculate salary (simplified: base salary for present days, half for half days)
    const daysInPeriod = endDate.getDate();
    const dailyRate = staff.salary / daysInPeriod;
    const earnedSalary = presentDays * dailyRate + halfDays * (dailyRate / 2);

    // Calculate deductions (simplified: 10% for absent days)
    const deductions = absentDays * dailyRate * 0.1;
    const netSalary = earnedSalary - deductions;

    // Create payroll record
    const result = await query(
      `INSERT INTO payroll_records 
       (staff_id, period, base_salary, deductions, net_salary, processed_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       ON CONFLICT (staff_id, period) DO UPDATE SET
       base_salary = EXCLUDED.base_salary,
       deductions = EXCLUDED.deductions,
       net_salary = EXCLUDED.net_salary,
       updated_at = NOW()
       RETURNING id, staff_id, period, base_salary, deductions, net_salary, processed_date, processed_by, status, created_at, updated_at`,
      [staffId, period, staff.salary, deductions, netSalary, userId]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('PAYROLL_CREATE_FAILED', 500, 'Failed to create payroll record');
    }

    const payroll = rows[0];
    const payrollRecord: PayrollRecord = {
      id: payroll.id,
      staffId: payroll.staff_id,
      period: payroll.period,
      baseSalary: parseFloat(payroll.base_salary),
      deductions: parseFloat(payroll.deductions),
      netSalary: parseFloat(payroll.net_salary),
      processedDate: payroll.processed_date ? new Date(payroll.processed_date) : undefined,
      processedBy: payroll.processed_by,
      status: payroll.status,
      createdAt: new Date(payroll.created_at),
      updatedAt: new Date(payroll.updated_at),
    };

    // Invalidate cache
    await del(PAYROLL_CACHE_KEY(staffId, period));

    logger.info('Payroll calculated', { staffId, period, userId });

    return payrollRecord;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Error calculating payroll', err);
    throw new AppError('PAYROLL_CALC_ERROR', 500, 'Failed to calculate payroll');
  }
}

/**
 * Get payroll records for a staff member
 */
export async function getPayrollRecords(staffId: string, limit: number = 12): Promise<PayrollRecord[]> {
  try {
    const result = await query(
      `SELECT id, staff_id, period, base_salary, deductions, net_salary, processed_date, processed_by, status, created_at, updated_at
       FROM payroll_records 
       WHERE staff_id = $1
       ORDER BY period DESC
       LIMIT $2`,
      [staffId, limit]
    );

    const rows = (result as any).rows;
    const records: PayrollRecord[] = rows.map((payroll: any) => ({
      id: payroll.id,
      staffId: payroll.staff_id,
      period: payroll.period,
      baseSalary: parseFloat(payroll.base_salary),
      deductions: parseFloat(payroll.deductions),
      netSalary: parseFloat(payroll.net_salary),
      processedDate: payroll.processed_date ? new Date(payroll.processed_date) : undefined,
      processedBy: payroll.processed_by,
      status: payroll.status,
      createdAt: new Date(payroll.created_at),
      updatedAt: new Date(payroll.updated_at),
    }));

    return records;
  } catch (err) {
    logger.error('Error getting payroll records', err);
    throw new AppError('PAYROLL_GET_ERROR', 500, 'Failed to get payroll records');
  }
}

/**
 * Process payroll for all staff members in a period
 */
export async function processPayrollBatch(period: string, userId: string): Promise<{ processed: number; failed: number }> {
  try {
    // Get all active staff members
    const result = await query(
      `SELECT id FROM staff_members WHERE employment_status = 'active'`
    );

    const rows = (result as any).rows;
    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        await calculatePayroll(row.id, period, userId);
        processed++;
      } catch (err) {
        logger.error('Error processing payroll for staff', { staffId: row.id, error: err });
        failed++;
      }
    }

    logger.info('Payroll batch processed', { period, processed, failed, userId });

    return { processed, failed };
  } catch (err) {
    logger.error('Error processing payroll batch', err);
    throw new AppError('PAYROLL_BATCH_ERROR', 500, 'Failed to process payroll batch');
  }
}
