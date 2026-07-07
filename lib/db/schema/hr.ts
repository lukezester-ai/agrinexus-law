import { pgTable, text, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  position: text('position'),
  department: text('department'),
  salary: numeric('salary', { precision: 12, scale: 2 }),
  insuranceCategory: text('insurance_category').default('third'),
  contractType: text('contract_type').default('full_time'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  isActive: text('is_active').default('true'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  hoursWorked: numeric('hours_worked', { precision: 5, scale: 2 }).default('0'),
  type: text('type').notNull().default('worked'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  type: text('type').notNull(),
  daysRequested: numeric('days_requested', { precision: 4, scale: 0 }),
  reason: text('reason'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payrollBatches = pgTable('payroll_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  month: text('month').notNull(),
  status: text('status').default('draft'),
  totalGross: numeric('total_gross', { precision: 15, scale: 2 }).default('0'),
  totalEmployeeInsurance: numeric('total_employee_insurance', { precision: 15, scale: 2 }).default('0'),
  totalEmployerInsurance: numeric('total_employer_insurance', { precision: 15, scale: 2 }).default('0'),
  totalTax: numeric('total_tax', { precision: 15, scale: 2 }).default('0'),
  totalNet: numeric('total_net', { precision: 15, scale: 2 }).default('0'),
  totalEmployerCost: numeric('total_employer_cost', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const payrollItems = pgTable('payroll_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').notNull().references(() => payrollBatches.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  employeeName: text('employee_name').notNull(),
  baseSalary: numeric('base_salary', { precision: 12, scale: 2 }).notNull(),
  workingDays: numeric('working_days', { precision: 4, scale: 0 }).notNull(),
  workedDays: numeric('worked_days', { precision: 4, scale: 0 }).notNull(),
  bonus: numeric('bonus', { precision: 12, scale: 2 }).default('0'),
  gross: numeric('gross', { precision: 12, scale: 2 }).notNull(),
  insuranceBase: numeric('insurance_base', { precision: 12, scale: 2 }).notNull(),
  employeeInsurance: numeric('employee_insurance', { precision: 12, scale: 2 }).notNull(),
  employerInsurance: numeric('employer_insurance', { precision: 12, scale: 2 }).notNull(),
  incomeTax: numeric('income_tax', { precision: 12, scale: 2 }).notNull(),
  net: numeric('net', { precision: 12, scale: 2 }).notNull(),
  employerCost: numeric('employer_cost', { precision: 12, scale: 2 }).notNull(),
  hasWarning: text('has_warning').default('false'),
  warning: text('warning'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
