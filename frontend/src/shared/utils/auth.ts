import { jwtDecode } from 'jwt-decode';
import type { JWTPayload } from '../../features/auth/type';


export const getCurrentUserId = (): number | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    
    return decoded.userId;
  } catch (e) {
    return null;
  }
};