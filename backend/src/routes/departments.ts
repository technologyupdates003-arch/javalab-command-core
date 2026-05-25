import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createDepartment,
  getDepartmentById,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  assignStaffToDepartment,
  getDepartmentTeam,
  calculateDepartmentPerformance,
  removeStaffFromDepartment,
  searchDepartments,
} from '@/services/departments.js';
import { query } from '@/services/database.js';
import logger from '@/utils/logger.js';

const router = Router();

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(1).max(255),
  managerId: z.string().uuid(),
  budget: z.number().positive(),
  description: z.string().optional(),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  managerId: z.string().uuid().optional(),
  budget: z.number().positive().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const assignStaffSchema = z.object({
  staffId: z.string().uuid(),
});

/**
 * POST /api/departments
 * Create a new department
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createDepartmentSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const department = await createDepartment(
      validated.name,
      validated.managerId,
      validated.budget,
      validated.description,
      userId
    );

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, timestamp)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        userId,
        'CREATE',
        'department',
        department.id,
        JSON.stringify({
          name: validated.name,
          managerId: validated.managerId,
          budget: validated.budget,
        }),
      ]
    );

    res.status(201).json(department);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else {
      logger.error('Error creating department', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/departments
 * Get all departments with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getAllDepartments(limit, offset);

    res.json(result);
  } catch (err) {
    logger.error('Error getting departments', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/departments/search
 * Search departments
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      res.status(400).json({ error: 'Search term must be at least 2 characters' });
      return;
    }

    const departments = await searchDepartments(q);

    res.json(departments);
  } catch (err) {
    logger.error('Error searching departments', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/departments/:departmentId
 * Get department by ID
 */
router.get('/:departmentId', async (req: Request, res: Response) => {
  try {
    const department = await getDepartmentById(req.params.departmentId);

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    res.json(department);
  } catch (err) {
    logger.error('Error getting department', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/departments/:departmentId
 * Update department
 */
router.put('/:departmentId', async (req: Request, res: Response) => {
  try {
    const validated = updateDepartmentSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const department = await updateDepartment(req.params.departmentId, validated, userId);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, timestamp)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [userId, 'UPDATE', 'department', req.params.departmentId, JSON.stringify(validated)]
    );

    res.json(department);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else if ((err as Error).message === 'Department not found') {
      res.status(404).json({ error: 'Department not found' });
    } else {
      logger.error('Error updating department', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * DELETE /api/departments/:departmentId
 * Delete department
 */
router.delete('/:departmentId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await deleteDepartment(req.params.departmentId, userId);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, timestamp)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      [userId, 'DELETE', 'department', req.params.departmentId]
    );

    res.status(204).send();
  } catch (err) {
    if ((err as Error).message === 'Department not found') {
      res.status(404).json({ error: 'Department not found' });
    } else {
      logger.error('Error deleting department', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/departments/:departmentId/assign-staff
 * Assign staff member to department
 */
router.post('/:departmentId/assign-staff', async (req: Request, res: Response) => {
  try {
    const validated = assignStaffSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const assignment = await assignStaffToDepartment(
      req.params.departmentId,
      validated.staffId,
      userId
    );

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, timestamp)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        userId,
        'ASSIGN_STAFF',
        'department',
        req.params.departmentId,
        JSON.stringify({ staffId: validated.staffId }),
      ]
    );

    res.status(201).json(assignment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
    } else if ((err as Error).message === 'Staff member not found') {
      res.status(404).json({ error: 'Staff member not found' });
    } else {
      logger.error('Error assigning staff', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * DELETE /api/departments/:departmentId/staff/:staffId
 * Remove staff member from department
 */
router.delete('/:departmentId/staff/:staffId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    await removeStaffFromDepartment(req.params.staffId, userId);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, timestamp)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        userId,
        'REMOVE_STAFF',
        'department',
        req.params.departmentId,
        JSON.stringify({ staffId: req.params.staffId }),
      ]
    );

    res.status(204).send();
  } catch (err) {
    if ((err as Error).message === 'Staff member not found') {
      res.status(404).json({ error: 'Staff member not found' });
    } else {
      logger.error('Error removing staff', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/departments/:departmentId/team
 * Get team members of a department
 */
router.get('/:departmentId/team', async (req: Request, res: Response) => {
  try {
    const team = await getDepartmentTeam(req.params.departmentId);

    res.json(team);
  } catch (err) {
    logger.error('Error getting department team', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/departments/:departmentId/performance
 * Get department performance metrics
 */
router.get('/:departmentId/performance', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'current_month';

    const performance = await calculateDepartmentPerformance(req.params.departmentId, period);

    res.json(performance);
  } catch (err) {
    if ((err as Error).message === 'Department not found') {
      res.status(404).json({ error: 'Department not found' });
    } else {
      logger.error('Error calculating performance', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
