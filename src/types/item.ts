import { z } from 'zod';

export const conditionSchema = z.enum(['like_new', 'good', 'fair', 'needs_repair']);
export const statusSchema = z.enum(['available', 'reserved', 'sold']);

export const imageSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
});

export const itemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2).max(80),
  description: z.string().max(1000),
  category: z.string().min(1).max(30),
  condition: conditionSchema,
  status: statusSchema,
  images: z.array(imageSchema).min(1).max(4),
  /** epoch milliseconds */
  createdAt: z.number().int().positive(),
  /** epoch milliseconds */
  updatedAt: z.number().int().positive(),
  /** Manual selling price in INR for sold items */
  soldPrice: z.number().min(0).optional(),
});

export const itemInputSchema = itemSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type Item = z.infer<typeof itemSchema>;
export type ItemInput = z.infer<typeof itemInputSchema>;
export type ItemImage = z.infer<typeof imageSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type Status = z.infer<typeof statusSchema>;
