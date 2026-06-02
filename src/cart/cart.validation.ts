import { z } from 'zod';
export class CartValidation {
    static readonly ADD = z.object({
        productId: z.string().nonempty('Product ID is required'),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
    });
    static readonly UPDATE = z.object({
        quantity: z.number().int().min(1),
    });
}