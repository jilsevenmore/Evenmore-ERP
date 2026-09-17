import { z } from 'zod';

/**
 * validation.js — logic-only input schemas (zod is already a dependency).
 * No UI changes: components can adopt these when ready; nothing imports
 * them automatically so existing behavior is untouched.
 */

export const leadSchema = z.object({
  name: z.string().trim().min(1, 'Lead name is required'),
  company: z.string().trim().min(1, 'Company is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  status: z.string().trim().min(1).default('New'),
  source: z.string().trim().min(1).default('Website'),
  owner: z.string().trim().optional().default(''),
  products: z.array(z.string()).optional().default([]),
  users: z.array(z.string()).optional().default([]),
});

export const taskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required'),
  role: z.string().trim().min(1, 'Role is required'),
  dueIn: z.coerce.number().int().min(0).default(0),
  repeats: z.coerce.number().int().min(0).default(0),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  description: z.string().optional().default(''),
});

export const formFieldSchema = z.object({
  id: z.string().trim().min(1),
  type: z.string().trim().min(1),
  label: z.string().trim().min(1),
  required: z.boolean().default(false),
  showInList: z.boolean().default(false),
  uniqueValue: z.boolean().default(false),
});

export const invoiceLineSchema = z.object({
  description: z.string().trim().min(1),
  qty: z.coerce.number().positive('Qty must be positive'),
  rate: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  customer: z.string().trim().min(1, 'Customer is required'),
  items: z.array(invoiceLineSchema).min(1, 'At least one line item is required'),
  tax: z.coerce.number().min(0).default(0),
});

export const estimateSchema = z.object({
  customer: z.string().trim().min(1, 'Customer is required'),
  items: z.array(invoiceLineSchema).min(1, 'At least one line item is required'),
  validUntil: z.string().trim().min(1).default('15 Days'),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  mode: z.string().trim().min(1, 'Payment mode is required'),
  reference: z.string().trim().optional().default(''),
});

export const leaveRequestSchema = z.object({
  employeeId: z.string().trim().min(1),
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  reason: z.string().trim().min(1, 'Reason is required'),
});

export const stockAdjustmentSchema = z.object({
  itemId: z.string().trim().min(1),
  quantity: z.coerce.number().refine((n) => n !== 0, 'Adjustment cannot be zero'),
  reason: z.string().trim().min(1, 'Reason is required'),
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data, errors: {} };
  const errors = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path.join('.') || '_form';
    if (!errors[key]) errors[key] = issue.message;
  });
  return { ok: false, data: null, errors };
}
