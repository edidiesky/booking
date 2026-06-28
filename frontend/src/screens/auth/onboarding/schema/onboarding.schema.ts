import { z } from "zod";

export const initiateSchema = z
  .object({
    email:           z.string().email("Enter a valid email address"),
    password:        z
      .string()
      .min(8,         "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain one uppercase letter")
      .regex(/[0-9]/, "Must contain one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

export const guestDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  phone:     z.string().optional(),
});

export const hostDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  phone:     z.string().optional(),
});

export const createPropertySchema = z.object({
  tenantName: z.string().min(2, "Property name must be at least 2 characters"),
  tenantSlug: z
    .string()
    .min(3,  "URL must be at least 3 characters")
    .max(50, "URL too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  platformFeePct: z.number().min(0).max(100).optional(),
});

export type InitiateFormData       = z.infer<typeof initiateSchema>;
export type GuestDetailsFormData   = z.infer<typeof guestDetailsSchema>;
export type HostDetailsFormData    = z.infer<typeof hostDetailsSchema>;
export type CreatePropertyFormData = z.infer<typeof createPropertySchema>;