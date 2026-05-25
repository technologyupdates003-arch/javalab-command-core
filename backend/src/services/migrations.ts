import fs from 'fs';
import path from 'path';
import { query, getDatabase } from '@/services/database.js';
import logger from '@/utils/logger.js';

interface Migration {
  name: string;
  version: number;
  executed: boolean;
  executedAt?: Date;
}

/**
 * Initialize migrations table
 */
async function initializeMigrationsTable(): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        version INTEGER NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Migrations table initialized');
  } catch (err) {
    logger.error('Error initializing migrations table', err);
    throw err;
  }
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<Migration[]> {
  try {
    const result = await query('SELECT name, version, executed_at FROM migrations ORDER BY version ASC');
    return ((result as any).rows || []).map((row: any) => ({
      name: row.name,
      version: row.version,
      executed: true,
      executedAt: row.executed_at,
    }));
  } catch (err) {
    logger.error('Error fetching executed migrations', err);
    return [];
  }
}

/**
 * Get list of available migrations
 */
async function getAvailableMigrations(): Promise<Migration[]> {
  try {
    const migrationsDir = path.join(process.cwd(), 'src', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      logger.warn('Migrations directory does not exist', { path: migrationsDir });
      return [];
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    return files.map((file, index) => ({
      name: file,
      version: index + 1,
      executed: false,
    }));
  } catch (err) {
    logger.error('Error fetching available migrations', err);
    return [];
  }
}

/**
 * Execute a single migration
 */
async function executeMigration(migrationName: string): Promise<void> {
  try {
    const migrationsDir = path.join(process.cwd(), 'src', 'migrations');
    const migrationPath = path.join(migrationsDir, migrationName);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL statements by semicolon
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await query(statement);
    }

    // Record migration as executed
    await query(
      'INSERT INTO migrations (name, version) VALUES ($1, $2)',
      [migrationName, parseInt(migrationName.split('_')[0], 10)]
    );

    logger.info('Migration executed successfully', { migration: migrationName });
  } catch (err) {
    logger.error('Error executing migration', { migration: migrationName, error: err });
    throw err;
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');

    // Initialize migrations table
    await initializeMigrationsTable();

    // Get executed and available migrations
    const executed = await getExecutedMigrations();
    const available = await getAvailableMigrations();

    const executedNames = new Set(executed.map((m) => m.name));
    const pending = available.filter((m) => !executedNames.has(m.name));

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pending.length} pending migrations`);

    // Execute pending migrations
    for (const migration of pending) {
      logger.info(`Executing migration: ${migration.name}`);
      await executeMigration(migration.name);
    }

    logger.info('All migrations completed successfully');
  } catch (err) {
    logger.error('Migration failed', err);
    throw err;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  executed: Migration[];
  pending: Migration[];
}> {
  try {
    const executed = await getExecutedMigrations();
    const available = await getAvailableMigrations();

    const executedNames = new Set(executed.map((m) => m.name));
    const pending = available.filter((m) => !executedNames.has(m.name));

    return { executed, pending };
  } catch (err) {
    logger.error('Error getting migration status', err);
    throw err;
  }
}

/**
 * Rollback last migration (use with caution)
 */
export async function rollbackLastMigration(): Promise<void> {
  try {
    const executed = await getExecutedMigrations();

    if (executed.length === 0) {
      logger.warn('No migrations to rollback');
      return;
    }

    const lastMigration = executed[executed.length - 1];

    // Delete from migrations table
    await query('DELETE FROM migrations WHERE name = $1', [lastMigration.name]);

    logger.warn('Migration rolled back', { migration: lastMigration.name });
  } catch (err) {
    logger.error('Error rolling back migration', err);
    throw err;
  }
}

/**
 * Seed initial data
 */
export async function seedInitialData(): Promise<void> {
  try {
    logger.info('Seeding initial data...');

    // Check if data already exists
    const result = await query('SELECT COUNT(*) as count FROM roles');
    const count = (result as any).rows[0].count;

    if (count > 0) {
      logger.info('Initial data already exists, skipping seed');
      return;
    }

    // Create default roles
    const adminRoleResult = await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id`,
      ['admin', 'Administrator role with full system access']
    );
    const adminRoleId = (adminRoleResult as any).rows[0].id;

    const managerRoleResult = await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id`,
      ['manager', 'Manager role with department management access']
    );
    const managerRoleId = (managerRoleResult as any).rows[0].id;

    const staffRoleResult = await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id`,
      ['staff', 'Staff role with limited access']
    );
    const staffRoleId = (staffRoleResult as any).rows[0].id;

    const viewerRoleResult = await query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id`,
      ['viewer', 'Viewer role with read-only access']
    );
    const viewerRoleId = (viewerRoleResult as any).rows[0].id;

    logger.info('Default roles created', {
      admin: adminRoleId,
      manager: managerRoleId,
      staff: staffRoleId,
      viewer: viewerRoleId,
    });

    // Create default permissions
    const modules = [
      'dashboard',
      'clients',
      'subscriptions',
      'staff',
      'departments',
      'projects',
      'vault',
      'office',
      'marketing',
      'sms',
      'support',
      'finance',
      'security',
      'developer',
      'products',
    ];

    const actions = ['read', 'create', 'update', 'delete'];

    for (const module of modules) {
      for (const action of actions) {
        await query(
          `INSERT INTO permissions (name, description, module, action) VALUES ($1, $2, $3, $4)`,
          [`${module}:${action}`, `${action} ${module}`, module, action]
        );
      }
    }

    logger.info('Default permissions created', { count: modules.length * actions.length });

    // Assign all permissions to admin role
    const permissionsResult = await query('SELECT id FROM permissions');
    const permissions = (permissionsResult as any).rows;

    for (const permission of permissions) {
      await query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [adminRoleId, permission.id]
      );
    }

    logger.info('Permissions assigned to admin role', { count: permissions.length });

    logger.info('Initial data seeding completed');
  } catch (err) {
    logger.error('Error seeding initial data', err);
    throw err;
  }
}
