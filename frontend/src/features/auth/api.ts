import { apiClient } from "../../shared/api/client";
import type { AuthResponse, LoginPayload, RegisterPayload, RegisterResponse} from "./type";

export const login = async (payload:LoginPayload):Promise<AuthResponse> => {
    return await apiClient.post('login', {json:payload}).json()
} 

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    return await apiClient.post('register',{json: payload}).json()

}

export const logout = () => {
    localStorage.removeItem('accessToken')
}