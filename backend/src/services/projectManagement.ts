import { query, getClient } from '@/services/database.js';
import { broadcastToChannel } from '@/services/websocket.js';
import logger from '@/utils/logger.js';

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamMembers: string[];
  status: 'planning' | 'active' | 'completed' | 'archived';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface KanbanColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project CRUD operations

export async function createProject(
  name: string,
  description: string | undefined,
  teamMembers: string[],
  startDate: Date | undefined,
  createdBy: string
): Promise<Project> {
  try {
    const result = await query(
      `INSERT INTO projects (name, description, team_members, start_date, created_by, status)
       VALUES ($1, $2, $3, $4, $5, 'planning')
       RETURNING id, name, description, team_members as "teamMembers", status, 
                 start_date as "startDate", end_date as "endDate", 
                 created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      [name, description, teamMembers, startDate, createdBy]
    );

    const project = (result as any).rows[0];

    // Initialize default Kanban columns
    await initializeKanbanColumns(project.id);

    logger.info('Project created', { projectId: project.id, createdBy });

    return project;
  } catch (err) {
    logger.error('Error creating project', err);
    throw err;
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const result = await query(
      `SELECT id, name, description, team_members as "teamMembers", status,
              start_date as "startDate", end_date as "endDate",
              created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM projects WHERE id = $1`,
      [projectId]
    );

    return (result as any).rows[0] || null;
  } catch (err) {
    logger.error('Error fetching project', err);
    throw err;
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>,
  updatedBy: string
): Promise<Project> {
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
    if (updates.teamMembers !== undefined) {
      fields.push(`team_members = $${paramCount++}`);
      values.push(updates.teamMembers);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.endDate !== undefined) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(updates.endDate);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(projectId);

    const result = await query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, description, team_members as "teamMembers", status,
                 start_date as "startDate", end_date as "endDate",
                 created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      values
    );

    const project = (result as any).rows[0];

    logger.info('Project updated', { projectId, updatedBy });

    // Broadcast update to all team members
    broadcastToChannel(`project:${projectId}`, 'project:updated', project);

    return project;
  } catch (err) {
    logger.error('Error updating project', err);
    throw err;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    await query('DELETE FROM projects WHERE id = $1', [projectId]);
    logger.info('Project deleted', { projectId });
  } catch (err) {
    logger.error('Error deleting project', err);
    throw err;
  }
}

export async function listProjects(
  limit: number = 50,
  offset: number = 0
): Promise<{ projects: Project[]; total: number }> {
  try {
    const countResult = await query('SELECT COUNT(*) as count FROM projects');
    const total = (countResult as any).rows[0].count;

    const result = await query(
      `SELECT id, name, description, team_members as "teamMembers", status,
              start_date as "startDate", end_date as "endDate",
              created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      projects: (result as any).rows,
      total,
    };
  } catch (err) {
    logger.error('Error listing projects', err);
    throw err;
  }
}

// Kanban board operations

async function initializeKanbanColumns(projectId: string): Promise<void> {
  const defaultColumns = [
    { name: 'To Do', position: 0 },
    { name: 'In Progress', position: 1 },
    { name: 'Done', position: 2 },
  ];

  for (const column of defaultColumns) {
    await query(
      `INSERT INTO kanban_columns (project_id, name, position)
       VALUES ($1, $2, $3)`,
      [projectId, column.name, column.position]
    );
  }
}

export async function getKanbanBoard(projectId: string): Promise<KanbanColumn[]> {
  try {
    const result = await query(
      `SELECT id, project_id as "projectId", name, position,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM kanban_columns WHERE project_id = $1 ORDER BY position ASC`,
      [projectId]
    );

    return (result as any).rows;
  } catch (err) {
    logger.error('Error fetching Kanban board', err);
    throw err;
  }
}

export async function addKanbanColumn(
  projectId: string,
  name: string,
  position: number
): Promise<KanbanColumn> {
  try {
    const result = await query(
      `INSERT INTO kanban_columns (project_id, name, position)
       VALUES ($1, $2, $3)
       RETURNING id, project_id as "projectId", name, position,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [projectId, name, position]
    );

    const column = (result as any).rows[0];

    logger.info('Kanban column added', { projectId, columnId: column.id });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'kanban:column:added', column);

    return column;
  } catch (err) {
    logger.error('Error adding Kanban column', err);
    throw err;
  }
}

// Task operations

export async function createTask(
  projectId: string,
  columnId: string,
  title: string,
  description: string | undefined,
  priority: 'low' | 'medium' | 'high',
  dueDate: Date | undefined,
  createdBy: string
): Promise<Task> {
  try {
    // Get the next position in the column
    const posResult = await query(
      `SELECT MAX(position) as max_position FROM tasks WHERE column_id = $1`,
      [columnId]
    );

    const position = ((posResult as any).rows[0].max_position || -1) + 1;

    const result = await query(
      `INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'todo')
       RETURNING id, project_id as "projectId", column_id as "columnId", title, description,
                 assigned_to as "assignedTo", status, priority, due_date as "dueDate", position,
                 created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      [projectId, columnId, title, description, priority, dueDate, position, createdBy]
    );

    const task = (result as any).rows[0];

    logger.info('Task created', { taskId: task.id, projectId, createdBy });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'task:created', task);

    return task;
  } catch (err) {
    logger.error('Error creating task', err);
    throw err;
  }
}

export async function getTask(taskId: string): Promise<Task | null> {
  try {
    const result = await query(
      `SELECT id, project_id as "projectId", column_id as "columnId", title, description,
              assigned_to as "assignedTo", status, priority, due_date as "dueDate", position,
              created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM tasks WHERE id = $1`,
      [taskId]
    );

    return (result as any).rows[0] || null;
  } catch (err) {
    logger.error('Error fetching task', err);
    throw err;
  }
}

export async function updateTask(
  taskId: string,
  projectId: string,
  updates: Partial<Task>,
  updatedBy: string
): Promise<Task> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.assignedTo !== undefined) {
      fields.push(`assigned_to = $${paramCount++}`);
      values.push(updates.assignedTo);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(updates.priority);
    }
    if (updates.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(updates.dueDate);
    }
    if (updates.columnId !== undefined) {
      fields.push(`column_id = $${paramCount++}`);
      values.push(updates.columnId);
    }
    if (updates.position !== undefined) {
      fields.push(`position = $${paramCount++}`);
      values.push(updates.position);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(taskId);

    const result = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING id, project_id as "projectId", column_id as "columnId", title, description,
                 assigned_to as "assignedTo", status, priority, due_date as "dueDate", position,
                 created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      values
    );

    const task = (result as any).rows[0];

    logger.info('Task updated', { taskId, projectId, updatedBy });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'task:updated', task);

    return task;
  } catch (err) {
    logger.error('Error updating task', err);
    throw err;
  }
}

export async function moveTask(
  taskId: string,
  projectId: string,
  newColumnId: string,
  newPosition: number
): Promise<Task> {
  try {
    const result = await query(
      `UPDATE tasks SET column_id = $1, position = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, project_id as "projectId", column_id as "columnId", title, description,
                 assigned_to as "assignedTo", status, priority, due_date as "dueDate", position,
                 created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"`,
      [newColumnId, newPosition, taskId]
    );

    const task = (result as any).rows[0];

    logger.info('Task moved', { taskId, projectId, newColumnId, newPosition });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'task:moved', task);

    return task;
  } catch (err) {
    logger.error('Error moving task', err);
    throw err;
  }
}

export async function deleteTask(taskId: string, projectId: string): Promise<void> {
  try {
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);
    logger.info('Task deleted', { taskId, projectId });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'task:deleted', { taskId });
  } catch (err) {
    logger.error('Error deleting task', err);
    throw err;
  }
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  try {
    const result = await query(
      `SELECT id, project_id as "projectId", column_id as "columnId", title, description,
              assigned_to as "assignedTo", status, priority, due_date as "dueDate", position,
              created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
       FROM tasks WHERE project_id = $1 ORDER BY column_id, position ASC`,
      [projectId]
    );

    return (result as any).rows;
  } catch (err) {
    logger.error('Error fetching project tasks', err);
    throw err;
  }
}

// Task comment operations

export async function addTaskComment(
  taskId: string,
  projectId: string,
  userId: string,
  content: string
): Promise<TaskComment> {
  try {
    const result = await query(
      `INSERT INTO task_comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, task_id as "taskId", user_id as "userId", content,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [taskId, userId, content]
    );

    const comment = (result as any).rows[0];

    logger.info('Task comment added', { taskId, userId });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'task:comment:added', comment);

    return comment;
  } catch (err) {
    logger.error('Error adding task comment', err);
    throw err;
  }
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  try {
    const result = await query(
      `SELECT id, task_id as "taskId", user_id as "userId", content,
              created_at as "createdAt", updated_at as "updatedAt"
       FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC`,
      [taskId]
    );

    return (result as any).rows;
  } catch (err) {
    logger.error('Error fetching task comments', err);
    throw err;
  }
}

export async function deleteTaskComment(
  commentId: string,
  projectId: string
): Promise<void> {
  try {
    await query('DELETE FROM task_comments WHERE id = $1', [commentId]);
    logger.info('Task comment deleted', { commentId, projectId });

    // Broadcast to project channel
    broadcastToChannel(`project:${projectId}`, 'task:comment:deleted', { commentId });
  } catch (err) {
    logger.error('Error deleting task comment', err);
    throw err;
  }
}

// Task watcher operations

export async function addTaskWatcher(taskId: string, userId: string): Promise<void> {
  try {
    await query(
      `INSERT INTO task_watchers (task_id, user_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [taskId, userId]
    );

    logger.info('Task watcher added', { taskId, userId });
  } catch (err) {
    logger.error('Error adding task watcher', err);
    throw err;
  }
}

export async function removeTaskWatcher(taskId: string, userId: string): Promise<void> {
  try {
    await query('DELETE FROM task_watchers WHERE task_id = $1 AND user_id = $2', [
      taskId,
      userId,
    ]);

    logger.info('Task watcher removed', { taskId, userId });
  } catch (err) {
    logger.error('Error removing task watcher', err);
    throw err;
  }
}

export async function getTaskWatchers(taskId: string): Promise<string[]> {
  try {
    const result = await query(
      `SELECT user_id as "userId" FROM task_watchers WHERE task_id = $1`,
      [taskId]
    );

    return (result as any).rows.map((row: any) => row.userId);
  } catch (err) {
    logger.error('Error fetching task watchers', err);
    throw err;
  }
}
