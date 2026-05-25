import { query } from '@/services/database.js';
import { cache } from '@/services/cache.js';
import { publishEvent } from '@/services/messageQueue.js';
import logger from '@/utils/logger.js';

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  budget: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DepartmentPerformance {
  departmentId: string;
  projectCompletionRate: number;
  teamUtilization: number;
  budgetStatus: 'on_track' | 'over' | 'under';
  averageProductivity: number;
  period: string;
}

export interface TeamAssignment {
  departmentId: string;
  staffId: string;
  assignedAt: Date;
  assignedBy: string;
}

/**
 * Create a new department
 */
export async function createDepartment(
  name: string,
  managerId: string,
  budget: number,
  description?: string,
  createdBy?: string
): Promise<Department> {
  try {
    const result = await query(
      `INSERT INTO departments (name, description, manager_id, budget, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, manager_id as "managerId", budget, status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      [name, description || null, managerId, budget, 'active', createdBy]
    );

    const department = (result as any).rows[0];

    // Invalidate cache
    await cache.del(`departments:list`);
    await cache.del(`department:${department.id}`);

    // Publish event for notifications
    await publishEvent('department.created', {
      departmentId: department.id,
      name: department.name,
      managerId: department.managerId,
      createdBy,
      timestamp: new Date(),
    });

    logger.info(`Department created: ${department.id}`);
    return department;
  } catch (err) {
    logger.error('Error creating department', err);
    throw err;
  }
}

/**
 * Get department by ID
 */
export async function getDepartmentById(departmentId: string): Promise<Department | null> {
  try {
    // Try cache first
    const cached = await cache.get(`department:${departmentId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await query(
      `SELECT id, name, description, manager_id as "managerId", budget, status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM departments
       WHERE id = $1`,
      [departmentId]
    );

    if ((result as any).rows.length === 0) {
      return null;
    }

    const department = (result as any).rows[0];

    // Cache for 1 hour
    await cache.setex(`department:${departmentId}`, 3600, JSON.stringify(department));

    return department;
  } catch (err) {
    logger.error('Error getting department', err);
    throw err;
  }
}

/**
 * Get all departments
 */
export async function getAllDepartments(
  limit: number = 100,
  offset: number = 0
): Promise<{ departments: Department[]; total: number }> {
  try {
    // Try cache first
    const cacheKey = `departments:list:${limit}:${offset}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const countResult = await query(`SELECT COUNT(*) as count FROM departments`);
    const total = (countResult as any).rows[0].count;

    const result = await query(
      `SELECT id, name, description, manager_id as "managerId", budget, status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM departments
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const departments = (result as any).rows;
    const response = { departments, total };

    // Cache for 1 hour
    await cache.setex(cacheKey, 3600, JSON.stringify(response));

    return response;
  } catch (err) {
    logger.error('Error getting all departments', err);
    throw err;
  }
}

/**
 * Update department
 */
export async function updateDepartment(
  departmentId: string,
  updates: Partial<Department>,
  updatedBy?: string
): Promise<Department> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.managerId !== undefined) {
      fields.push(`manager_id = $${paramCount++}`);
      values.push(updates.managerId);
    }
    if (updates.budget !== undefined) {
      fields.push(`budget = $${paramCount++}`);
      values.push(updates.budget);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(departmentId);

    const result = await query(
      `UPDATE departments
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, description, manager_id as "managerId", budget, status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      values
    );

    if ((result as any).rows.length === 0) {
      throw new Error('Department not found');
    }

    const department = (result as any).rows[0];

    // Invalidate cache
    await cache.del(`department:${departmentId}`);
    await cache.del(`departments:list`);

    // Publish event for notifications
    await publishEvent('department.updated', {
      departmentId: department.id,
      changes: updates,
      updatedBy,
      timestamp: new Date(),
    });

    logger.info(`Department updated: ${departmentId}`);
    return department;
  } catch (err) {
    logger.error('Error updating department', err);
    throw err;
  }
}

/**
 * Delete department
 */
export async function deleteDepartment(departmentId: string, deletedBy?: string): Promise<void> {
  try {
    const result = await query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [
      departmentId,
    ]);

    if ((result as any).rows.length === 0) {
      throw new Error('Department not found');
    }

    // Invalidate cache
    await cache.del(`department:${departmentId}`);
    await cache.del(`departments:list`);

    // Publish event for notifications
    await publishEvent('department.deleted', {
      departmentId,
      deletedBy,
      timestamp: new Date(),
    });

    logger.info(`Department deleted: ${departmentId}`);
  } catch (err) {
    logger.error('Error deleting department', err);
    throw err;
  }
}

/**
 * Assign staff member to department
 */
export async function assignStaffToDepartment(
  departmentId: string,
  staffId: string,
  assignedBy?: string
): Promise<TeamAssignment> {
  try {
    // Update user's department_id
    const result = await query(
      `UPDATE users
       SET department_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id`,
      [departmentId, staffId]
    );

    if ((result as any).rows.length === 0) {
      throw new Error('Staff member not found');
    }

    const assignment: TeamAssignment = {
      departmentId,
      staffId,
      assignedAt: new Date(),
      assignedBy: assignedBy || 'system',
    };

    // Invalidate cache
    await cache.del(`department:${departmentId}`);
    await cache.del(`departments:list`);
    await cache.del(`user:${staffId}`);

    // Publish event for notifications
    await publishEvent('staff.assigned_to_department', {
      departmentId,
      staffId,
      assignedBy,
      timestamp: new Date(),
    });

    logger.info(`Staff ${staffId} assigned to department ${departmentId}`);
    return assignment;
  } catch (err) {
    logger.error('Error assigning staff to department', err);
    throw err;
  }
}

/**
 * Get team members of a department
 */
export async function getDepartmentTeam(departmentId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT id, email, first_name as "firstName", last_name as "lastName", role, status
       FROM users
       WHERE department_id = $1 AND status = 'active'
       ORDER BY first_name, last_name`,
      [departmentId]
    );

    return (result as any).rows;
  } catch (err) {
    logger.error('Error getting department team', err);
    throw err;
  }
}

/**
 * Calculate department performance metrics
 */
export async function calculateDepartmentPerformance(
  departmentId: string,
  period: string = 'current_month'
): Promise<DepartmentPerformance> {
  try {
    // Get department info
    const deptResult = await query(`SELECT budget FROM departments WHERE id = $1`, [
      departmentId,
    ]);

    if ((deptResult as any).rows.length === 0) {
      throw new Error('Department not found');
    }

    const budget = (deptResult as any).rows[0].budget;

    // Get team members
    const teamResult = await query(
      `SELECT COUNT(*) as count FROM users WHERE department_id = $1 AND status = 'active'`,
      [departmentId]
    );

    const teamSize = (teamResult as any).rows[0].count;

    // Calculate metrics (simplified - in production would aggregate from projects, tasks, etc.)
    const projectCompletionRate = 85; // Placeholder
    const teamUtilization = teamSize > 0 ? 75 : 0; // Placeholder
    const averageProductivity = 80; // Placeholder

    // Determine budget status
    let budgetStatus: 'on_track' | 'over' | 'under' = 'on_track';
    // In production, would calculate actual spending vs budget

    const performance: DepartmentPerformance = {
      departmentId,
      projectCompletionRate,
      teamUtilization,
      budgetStatus,
      averageProductivity,
      period,
    };

    return performance;
  } catch (err) {
    logger.error('Error calculating department performance', err);
    throw err;
  }
}

/**
 * Remove staff member from department
 */
export async function removeStaffFromDepartment(
  staffId: string,
  removedBy?: string
): Promise<void> {
  try {
    const result = await query(
      `UPDATE users
       SET department_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING department_id`,
      [staffId]
    );

    if ((result as any).rows.length === 0) {
      throw new Error('Staff member not found');
    }

    const departmentId = (result as any).rows[0].department_id;

    // Invalidate cache
    await cache.del(`user:${staffId}`);
    if (departmentId) {
      await cache.del(`department:${departmentId}`);
      await cache.del(`departments:list`);
    }

    // Publish event for notifications
    await publishEvent('staff.removed_from_department', {
      staffId,
      departmentId,
      removedBy,
      timestamp: new Date(),
    });

    logger.info(`Staff ${staffId} removed from department`);
  } catch (err) {
    logger.error('Error removing staff from department', err);
    throw err;
  }
}

/**
 * Search departments
 */
export async function searchDepartments(
  searchTerm: string,
  limit: number = 50
): Promise<Department[]> {
  try {
    const result = await query(
      `SELECT id, name, description, manager_id as "managerId", budget, status, created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM departments
       WHERE name ILIKE $1 OR description ILIKE $1
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );

    return (result as any).rows;
  } catch (err) {
    logger.error('Error searching departments', err);
    throw err;
  }
}
