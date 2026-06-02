import { z } from 'zod';
export class ProductValidation {
    static readonly CREATE = z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).optional(),
        price: z.number().min(0),
        stock: z.number().min(0),
        image: z.string().optional(),
        slug: z.string().min(1).max(100),
        isActive: z.boolean().optional(),
        categoryId: z.string().min(1),
    });
    static readonly UPDATE = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().min(1).optional(),
        price: z.number().min(0).optional(),
        stock: z.number().min(0).optional(),
        image: z.string().optional(),
        slug: z.string().min(1).max(100).optional(),
        isActive: z.boolean().optional(),
        categoryId: z.string().min(1).optional(),
    });
}