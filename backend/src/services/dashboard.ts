import { query } from '@/services/database.js';
import { get, set } from '@/services/cache.js';
import logger from '@/utils/logger.js';

export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  moduleId: string;
  previousValue?: number;
  changePercent?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

export interface DashboardMetrics {
  kpis: KPI[];
  charts: Record<string, ChartData>;
  lastUpdated: Date;
}

/**
 * Get all KPIs with caching
 */
export async function getKPIs(): Promise<KPI[]> {
  try {
    // Try to get from cache first
    const cachedKPIs = await get<KPI[]>('dashboard:kpis');
    if (cachedKPIs) {
      logger.debug('KPIs retrieved from cache');
      return cachedKPIs;
    }

    // Query database for KPIs
    const result = await query(
      `
      SELECT 
        id,
        name,
        value,
        unit,
        trend,
        last_updated as "lastUpdated",
        module_id as "moduleId",
        previous_value as "previousValue"
      FROM kpis
      WHERE active = true
      ORDER BY module_id, name
      `
    );

    const kpis: KPI[] = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      value: row.value,
      unit: row.unit,
      trend: row.trend,
      lastUpdated: new Date(row.lastUpdated),
      moduleId: row.moduleId,
      previousValue: row.previousValue,
      changePercent:
        row.previousValue && row.previousValue !== 0
          ? ((row.value - row.previousValue) / row.previousValue) * 100
          : 0,
    }));

    // Cache for 5 minutes
    await set('dashboard:kpis', kpis, 300);

    return kpis;
  } catch (err) {
    logger.error('Error fetching KPIs', err);
    throw err;
  }
}

/**
 * Get specific KPI by ID
 */
export async function getKPIById(kpiId: string): Promise<KPI | null> {
  try {
    const cacheKey = `dashboard:kpi:${kpiId}`;
    const cached = await get<KPI>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await query(
      `
      SELECT 
        id,
        name,
        value,
        unit,
        trend,
        last_updated as "lastUpdated",
        module_id as "moduleId",
        previous_value as "previousValue"
      FROM kpis
      WHERE id = $1 AND active = true
      `,
      [kpiId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const kpi: KPI = {
      id: row.id,
      name: row.name,
      value: row.value,
      unit: row.unit,
      trend: row.trend,
      lastUpdated: new Date(row.lastUpdated),
      moduleId: row.moduleId,
      previousValue: row.previousValue,
      changePercent:
        row.previousValue && row.previousValue !== 0
          ? ((row.value - row.previousValue) / row.previousValue) * 100
          : 0,
    };

    // Cache for 5 minutes
    await set(cacheKey, kpi, 300);

    return kpi;
  } catch (err) {
    logger.error('Error fetching KPI by ID', err);
    throw err;
  }
}

/**
 * Update KPI value
 */
export async function updateKPI(
  kpiId: string,
  newValue: number,
  userId: string
): Promise<KPI> {
  try {
    // Get current KPI
    const currentResult = await query(
      `
      SELECT value FROM kpis WHERE id = $1
      `,
      [kpiId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error(`KPI ${kpiId} not found`);
    }

    const previousValue = currentResult.rows[0].value;

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (newValue > previousValue) {
      trend = 'up';
    } else if (newValue < previousValue) {
      trend = 'down';
    }

    // Update KPI
    const updateResult = await query(
      `
      UPDATE kpis
      SET 
        value = $1,
        previous_value = $2,
        trend = $3,
        last_updated = NOW(),
        updated_by = $4
      WHERE id = $5
      RETURNING 
        id,
        name,
        value,
        unit,
        trend,
        last_updated as "lastUpdated",
        module_id as "moduleId",
        previous_value as "previousValue"
      `,
      [newValue, previousValue, trend, userId, kpiId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error(`Failed to update KPI ${kpiId}`);
    }

    const row = updateResult.rows[0];
    const kpi: KPI = {
      id: row.id,
      name: row.name,
      value: row.value,
      unit: row.unit,
      trend: row.trend,
      lastUpdated: new Date(row.lastUpdated),
      moduleId: row.moduleId,
      previousValue: row.previousValue,
      changePercent:
        row.previousValue && row.previousValue !== 0
          ? ((row.value - row.previousValue) / row.previousValue) * 100
          : 0,
    };

    // Invalidate cache
    await invalidateKPICache(kpiId);

    return kpi;
  } catch (err) {
    logger.error('Error updating KPI', err);
    throw err;
  }
}

/**
 * Get chart data for a specific chart type
 */
export async function getChartData(chartType: string): Promise<ChartData> {
  try {
    const cacheKey = `dashboard:chart:${chartType}`;
    const cached = await get<ChartData>(cacheKey);
    if (cached) {
      return cached;
    }

    let chartData: ChartData;

    switch (chartType) {
      case 'revenue':
        chartData = await getRevenueChart();
        break;
      case 'clients':
        chartData = await getClientsChart();
        break;
      case 'projects':
        chartData = await getProjectsChart();
        break;
      case 'staff':
        chartData = await getStaffChart();
        break;
      case 'subscriptions':
        chartData = await getSubscriptionsChart();
        break;
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }

    // Cache for 10 minutes
    await set(cacheKey, chartData, 600);

    return chartData;
  } catch (err) {
    logger.error('Error fetching chart data', err);
    throw err;
  }
}

/**
 * Get revenue chart data (last 12 months)
 */
async function getRevenueChart(): Promise<ChartData> {
  const result = await query(
    `
    SELECT 
      DATE_TRUNC('month', transaction_date)::date as month,
      SUM(amount) as total
    FROM financial_transactions
    WHERE type = 'income' AND transaction_date >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', transaction_date)
    ORDER BY month
    `
  );

  const labels = result.rows.map((row: any) => {
    const date = new Date(row.month);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  const data = result.rows.map((row: any) => parseFloat(row.total) || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Monthly Revenue',
        data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
    ],
  };
}

/**
 * Get clients chart data (by status)
 */
async function getClientsChart(): Promise<ChartData> {
  const result = await query(
    `
    SELECT 
      kyc_status as status,
      COUNT(*) as count
    FROM clients
    GROUP BY kyc_status
    `
  );

  const labels = result.rows.map((row: any) => {
    const status = row.status || 'unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  });

  const data = result.rows.map((row: any) => row.count);

  return {
    labels,
    datasets: [
      {
        label: 'Clients by KYC Status',
        data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };
}

/**
 * Get projects chart data (by status)
 */
async function getProjectsChart(): Promise<ChartData> {
  const result = await query(
    `
    SELECT 
      status,
      COUNT(*) as count
    FROM projects
    GROUP BY status
    `
  );

  const labels = result.rows.map((row: any) => {
    const status = row.status || 'unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  });

  const data = result.rows.map((row: any) => row.count);

  return {
    labels,
    datasets: [
      {
        label: 'Projects by Status',
        data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };
}

/**
 * Get staff chart data (by department)
 */
async function getStaffChart(): Promise<ChartData> {
  const result = await query(
    `
    SELECT 
      d.name as department,
      COUNT(s.id) as count
    FROM staff s
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE s.employment_status = 'active'
    GROUP BY d.name
    ORDER BY count DESC
    LIMIT 10
    `
  );

  const labels = result.rows.map((row: any) => row.department || 'Unassigned');
  const data = result.rows.map((row: any) => row.count);

  return {
    labels,
    datasets: [
      {
        label: 'Active Staff by Department',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    ],
  };
}

/**
 * Get subscriptions chart data (by status)
 */
async function getSubscriptionsChart(): Promise<ChartData> {
  const result = await query(
    `
    SELECT 
      status,
      COUNT(*) as count
    FROM subscriptions
    GROUP BY status
    `
  );

  const labels = result.rows.map((row: any) => {
    const status = row.status || 'unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  });

  const data = result.rows.map((row: any) => row.count);

  return {
    labels,
    datasets: [
      {
        label: 'Subscriptions by Status',
        data,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };
}

/**
 * Invalidate KPI cache
 */
export async function invalidateKPICache(kpiId?: string): Promise<void> {
  try {
    if (kpiId) {
      await import('@/services/cache.js').then((m) => m.del(`dashboard:kpi:${kpiId}`));
    }
    await import('@/services/cache.js').then((m) => m.del('dashboard:kpis'));
    logger.debug('KPI cache invalidated', { kpiId });
  } catch (err) {
    logger.error('Error invalidating KPI cache', err);
  }
}

/**
 * Invalidate chart cache
 */
export async function invalidateChartCache(chartType?: string): Promise<void> {
  try {
    if (chartType) {
      await import('@/services/cache.js').then((m) => m.del(`dashboard:chart:${chartType}`));
    } else {
      // Invalidate all chart caches
      const chartTypes = ['revenue', 'clients', 'projects', 'staff', 'subscriptions'];
      for (const type of chartTypes) {
        await import('@/services/cache.js').then((m) => m.del(`dashboard:chart:${type}`));
      }
    }
    logger.debug('Chart cache invalidated', { chartType });
  } catch (err) {
    logger.error('Error invalidating chart cache', err);
  }
}

/**
 * Get dashboard metrics (KPIs + charts)
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const kpis = await getKPIs();
    const charts = {
      revenue: await getChartData('revenue'),
      clients: await getChartData('clients'),
      projects: await getChartData('projects'),
      staff: await getChartData('staff'),
      subscriptions: await getChartData('subscriptions'),
    };

    return {
      kpis,
      charts,
      lastUpdated: new Date(),
    };
  } catch (err) {
    logger.error('Error fetching dashboard metrics', err);
    throw err;
  }
}
