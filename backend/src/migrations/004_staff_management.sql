-- Staff Management Schema
-- This migration creates tables for staff management, attendance, and payroll

-- Staff Members table
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(100) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  reporting_manager_id UUID REFERENCES staff_members(id),
  employment_status VARCHAR(20) DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on_leave')),
  salary DECIMAL(15, 2) NOT NULL,
  join_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_email (email),
  INDEX idx_department_id (department_id),
  INDEX idx_employment_status (employment_status),
  INDEX idx_reporting_manager_id (reporting_manager_id),
  INDEX idx_created_at (created_at)
);

-- Attendance Records table
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  UNIQUE KEY unique_staff_date (staff_id, date),
  INDEX idx_staff_id (staff_id),
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Payroll Records table
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  base_salary DECIMAL(15, 2) NOT NULL,
  deductions DECIMAL(15, 2) DEFAULT 0,
  net_salary DECIMAL(15, 2) NOT NULL,
  processed_date TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_staff_id (staff_id),
  INDEX idx_period (period),
  INDEX idx_status (status),
  INDEX idx_processed_date (processed_date),
  INDEX idx_created_at (created_at)
);

-- Payroll Deductions table
CREATE TABLE payroll_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
  deduction_type VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payroll_record_id (payroll_record_id),
  INDEX idx_deduction_type (deduction_type)
);

-- Create indexes for common queries
CREATE INDEX idx_staff_members_department_status ON staff_members(department_id, employment_status);
CREATE INDEX idx_attendance_staff_date ON attendance_records(staff_id, date);
CREATE INDEX idx_payroll_staff_period ON payroll_records(staff_id, period);
