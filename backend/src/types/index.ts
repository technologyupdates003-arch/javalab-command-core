// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  departmentId?: string;
  status: 'active' | 'inactive';
  twoFaEnabled: boolean;
  twoFaMethod?: 'totp' | 'sms' | 'email';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// RBAC Types
export interface Role {
  id: string;
  name: string;
  permissions: string[];
  description: string;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

// Audit Trail Types
export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Error Types
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Request Context
export interface RequestContext {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  ipAddress: string;
  userAgent: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channels: ('in_app' | 'email' | 'sms')[];
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationPreference {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  eventTypes: Record<string, boolean>;
}

// Queue Types
export interface QueuedTask {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
  maxRetries: number;
  error?: string;
}

// Cache Types
export interface CacheEntry<T> {
  key: string;
  value: T;
  ttl?: number;
  createdAt: Date;
  expiresAt?: Date;
}

// WebSocket Types
export interface WebSocketConnection {
  id: string;
  userId: string;
  connectedAt: Date;
  subscriptions: string[];
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: Date;
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  apiGateway: HealthStatus;
  database: HealthStatus;
  cache: HealthStatus;
  messageQueue: HealthStatus;
  elasticsearch: HealthStatus;
  timestamp: Date;
}

// Staff Management Types
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  departmentId: string;
  reportingManagerId?: string;
  employmentStatus: 'active' | 'inactive' | 'on_leave';
  salary: number;
  joinDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  period: string;
  baseSalary: number;
  deductions: number;
  netSalary: number;
  processedDate?: Date;
  processedBy?: string;
  status: 'pending' | 'processed' | 'paid' | 'failed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollDeduction {
  id: string;
  payrollRecordId: string;
  deductionType: string;
  amount: number;
  description?: string;
  createdAt: Date;
}
