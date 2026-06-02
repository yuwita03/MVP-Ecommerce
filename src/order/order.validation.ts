import { z } from 'zod';
export class OrderValidation {
    static readonly CheckoutRequest = z.object({
        addressId: z.string().uuid()
    })
}