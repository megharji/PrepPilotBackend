export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    created_at: Date;
}

// DB se aane wali row, jisme hashed password bhi hai (sirf service ke andar use karo)
export interface UserWithPassword extends User {
    password: string;
}
