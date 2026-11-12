import { z } from "zod";

export const initiateSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must contain one uppercase letter")
      .regex(/[0-9]/, "Must contain one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const guestDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

export const hostDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

export const businessSchema = z.object({
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
  tenantSlug: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .max(50, "URL too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  businessTypes: z
    .array(
      z.enum(["shortlet", "hotel", "guesthouse", "apartment", "bnb", "other"]),
    )
    .min(1, "Select at least one type"),
  city: z.string().min(1, "Location is required"),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});


export const workspaceSchema = z.object({
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1, "Currency is required"),
  phone: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  address: z.string().optional(),
});

export const listingsPathSchema = z.object({
  path: z.enum(["scratch", "csv", "later"]),
});

export const teamInviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["host:staff", "host:inspector", "host:admin"]),
});

export type InitiateFormData = z.infer<typeof initiateSchema>;
export type GuestDetailsFormData = z.infer<typeof guestDetailsSchema>;
export type HostDetailsFormData = z.infer<typeof hostDetailsSchema>;
export type BusinessFormData = z.infer<typeof businessSchema>;
export type WorkspaceFormData = z.infer<typeof workspaceSchema>;
export type ListingsPathFormData = z.infer<typeof listingsPathSchema>;
export type TeamInviteFormData = z.infer<typeof teamInviteSchema>;

/** @deprecated use businessSchema — kept for any old imports */
export const createPropertySchema = businessSchema.pick({
  tenantName: true,
  tenantSlug: true,
});
export type CreatePropertyFormData = z.infer<typeof createPropertySchema> & {
  platformFeePct?: number;
};
