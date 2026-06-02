import {z, ZodType} from 'zod';
import {LoginUserRequest, RegisterUserRequest, UpdateUserRequest} from '../model/user.model';


export class UserValidation {
    static readonly REGISTER: ZodType<RegisterUserRequest> = z.object({
        name: z.string().min(1, 'Name is required'),
        username: z.string().min(1, 'Username is required'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
    })
    static readonly LOGIN: ZodType<LoginUserRequest> = z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
    })
    static readonly UPDATE: ZodType<UpdateUserRequest> = z.object({
        username: z.string().min(1, 'Username is required').optional(),
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
    })
}