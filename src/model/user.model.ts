
export class RegisterUserRequest{
    name!: string;
    username!: string;
    email!: string;
    password!: string;
    token?: string;
}

export class LoginUserRequest {
    username!: string;
    password!: string;
}

export class UpdateUserRequest {
    username?: string;
    name?: string;
    email?: string
    password?: string;
    role?: string;
}

export class UserResponse {
    username!: string;
    name!: string;
    email!: string;
    role!: string;
    token?: string | null;
}