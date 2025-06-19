import { z } from "zod";

// Zod schema for task data.
export const taskSchema = z.object({
  // Fields from the backend model
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  is_completed: z.boolean().default(false),
  priority: z.number().min(1).max(3).default(2), // 1: Low, 2: Medium, 3: High
  due_date: z.string().nullable().optional(), // Expected to be a date string
});