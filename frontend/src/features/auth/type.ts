export interface User {
    id: number
    email: string
}

export interface AuthResponse {
    accessToken: string
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    email: string
    login: string
    password: string
}

export interface RegisterResponse {
    email: string
    login: string 
    isPremium: boolean
}

export interface JWTPayload {
    userId: number
    login: string
    isPremium: boolean
    exp: number
}