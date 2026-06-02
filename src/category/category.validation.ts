import { z } from 'zod';
import { createCategoryRequest } from 'src/model/category.model';
export class CategoryValidation {
    static readonly CREATE:  z.ZodType<createCategoryRequest>= z.object({
        name: z.string().min(2).max(100),
        slug: z.string().min(2).max(100)
    })
    static readonly UPDATE: z.ZodType<Partial<createCategoryRequest>> = z.object({
        name: z.string().min(2).max(100).optional(),
        slug: z.string().min(2).max(100).optional()
    })
}