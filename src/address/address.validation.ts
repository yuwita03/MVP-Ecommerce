import { z } from 'zod';
export class AddressValidation {
    static readonly CREATE = z.object({
        name: z.string().min(1).max(100),
        phone: z.string().min(1).max(20),
        street: z.string().min(1).max(255),
        city: z.string().min(1).max(100),
        province: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(20),
        isDefault: z.boolean().optional(),
    })
    static readonly UPDATE = z.object({
        name: z.string().min(1).max(100).optional(),
        phone: z.string().min(1).max(20).optional(),
        street: z.string().min(1).max(255).optional(),
        city: z.string().min(1).max(100).optional(),
        province: z.string().min(1).max(100).optional(),
        postalCode: z.string().min(1).max(20).optional(),
        isDefault: z.boolean().optional(),
    });
}