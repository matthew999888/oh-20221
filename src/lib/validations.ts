import { z } from 'zod';

export const itemSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  quantity: z.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative").max(10000, "Quantity must be less than 10,000"),
  condition: z.enum(['new', 'good', 'needs-repair', 'unserviceable'], {
    errorMap: () => ({ message: "Invalid condition selected" })
  }),
  location: z.string().trim().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  notes: z.string().max(1000, "Notes must be less than 1,000 characters").optional(),
});

export const checkoutSchema = z.object({
  cadetName: z.string().trim().min(1, "Cadet name is required").max(100, "Name must be less than 100 characters"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
