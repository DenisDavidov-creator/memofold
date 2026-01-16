import { apiClient } from "../../shared/api/client";
import type { FullProfile } from "./types";


export const getFullProfile = async (): Promise<FullProfile> => {
  return await apiClient.get('profile').json();
};