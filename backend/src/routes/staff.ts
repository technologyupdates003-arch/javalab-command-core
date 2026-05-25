import { Router, Request, Response } from 'express';
import {
  createStaffMember,
  getStaffMember,
  getStaffByDepartment,
  updateStaffMember,
  recordAttendance,
  getAttendanceRecords,
  calculatePayroll,
  getPayrollRecords,
  processPayrollBatch,
} from '@/services/staffManagement.js';
import { query } from '@/services/database.js';
import logger from '@/utils/logger.js';
import { AppError, ApiResponse, StaffMember, AttendanceRecord, PayrollRecord } from '@/types/index.js';

const router = Router();

/**
 * Create a new staff member
 * POST /api/staff
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const { name, email, phone, role, departmentId, reportingManagerId, employmentStatus, salary, joinDate, endDate } =
      req.body;

    if (!name || !email || !role || !departmentId || !salary || !joinDate) {
      throw new AppError('INVALID_INPUT', 400, 'Missing required fields');
    }

    const staff = await createStaffMember(
      {
        name,
        email,
        phone,
        role,
        departmentId,
        reportingManagerId,
        employmentStatus: employmentStatus || 'active',
        salary: parseFloat(salary),
        joinDate: new Date(joinDate),
        endDate: endDate ? new Date(endDate) : undefined,
        createdBy: req.context.userId,
      },
      req.context.userId
    );

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.context.userId, 'CREATE', 'staff_member', staff.id, req.context.ipAddress, req.context.userAgent]
    );

    const response: ApiResponse<StaffMember> = {
      success: true,
      data: staff,
      timestamp: new Date(),
    };

    res.status(201).json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error creating staff member', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Get staff member by ID
 * GET /api/staff/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const staff = await getStaffMember(req.params.id);

    // Log to activity log
    await query(
      `INSERT INTO activity_logs (user_id, action, module, timestamp)
       VALUES ($1, $2, $3, NOW())`,
      [req.context.userId, 'VIEW', 'staff_management']
    );

    const response: ApiResponse<StaffMember> = {
      success: true,
      data: staff,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error getting staff member', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Get staff members by department
 * GET /api/staff/department/:departmentId
 */
router.get('/department/:departmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const staff = await getStaffByDepartment(req.params.departmentId);

    const response: ApiResponse<StaffMember[]> = {
      success: true,
      data: staff,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error getting staff by department', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Update staff member
 * PUT /api/staff/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const staff = await updateStaffMember(req.params.id, req.body, req.context.userId);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.context.userId, 'UPDATE', 'staff_member', staff.id, req.context.ipAddress, req.context.userAgent]
    );

    const response: ApiResponse<StaffMember> = {
      success: true,
      data: staff,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error updating staff member', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Record attendance
 * POST /api/staff/:id/attendance
 */
router.post('/:id/attendance', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const { date, checkInTime, checkOutTime, status, notes } = req.body;

    if (!date || !status) {
      throw new AppError('INVALID_INPUT', 400, 'Missing required fields');
    }

    const attendance = await recordAttendance(
      req.params.id,
      {
        date: new Date(date),
        checkInTime: checkInTime ? new Date(checkInTime) : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        status,
        notes,
        staffId: req.params.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.context.userId,
      },
      req.context.userId
    );

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.context.userId, 'CREATE', 'attendance_record', attendance.id, req.context.ipAddress, req.context.userAgent]
    );

    const response: ApiResponse<AttendanceRecord> = {
      success: true,
      data: attendance,
      timestamp: new Date(),
    };

    res.status(201).json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error recording attendance', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Get attendance records
 * GET /api/staff/:id/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/:id/attendance', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('INVALID_INPUT', 400, 'startDate and endDate are required');
    }

    const records = await getAttendanceRecords(req.params.id, new Date(startDate as string), new Date(endDate as string));

    const response: ApiResponse<AttendanceRecord[]> = {
      success: true,
      data: records,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error getting attendance records', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Calculate payroll
 * POST /api/staff/:id/payroll/calculate
 */
router.post('/:id/payroll/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const { period } = req.body;

    if (!period) {
      throw new AppError('INVALID_INPUT', 400, 'Period is required (format: YYYY-MM)');
    }

    const payroll = await calculatePayroll(req.params.id, period, req.context.userId);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.context.userId, 'CREATE', 'payroll_record', payroll.id, req.context.ipAddress, req.context.userAgent]
    );

    const response: ApiResponse<PayrollRecord> = {
      success: true,
      data: payroll,
      timestamp: new Date(),
    };

    res.status(201).json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error calculating payroll', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Get payroll records
 * GET /api/staff/:id/payroll
 */
router.get('/:id/payroll', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const { limit } = req.query;
    const records = await getPayrollRecords(req.params.id, limit ? parseInt(limit as string) : 12);

    const response: ApiResponse<PayrollRecord[]> = {
      success: true,
      data: records,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error getting payroll records', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

/**
 * Process payroll batch
 * POST /api/staff/payroll/batch
 */
router.post('/payroll/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const { period } = req.body;

    if (!period) {
      throw new AppError('INVALID_INPUT', 400, 'Period is required (format: YYYY-MM)');
    }

    const result = await processPayrollBatch(period, req.context.userId);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.context.userId, 'BATCH_PROCESS', 'payroll', period, req.context.ipAddress, req.context.userAgent]
    );

    const response: ApiResponse<{ processed: number; failed: number }> = {
      success: true,
      data: result,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Error processing payroll batch', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
});

export default router;
