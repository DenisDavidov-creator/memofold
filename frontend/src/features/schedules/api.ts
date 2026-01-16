import { apiClient } from "../../shared/api/client";
import type { CreateSchedulePayload, Schedule } from "./types";

export const GetSchedules = async ():Promise<Schedule[]> => {
    return await apiClient.get('schedules').json()
}

export const CreateSchedule = async (payload: CreateSchedulePayload):Promise<Schedule> => {
    return await apiClient.post('schedules', {json: payload}).json()
}

export const UpdateSchedule = async (id: number, payload: CreateSchedulePayload): Promise<Schedule> => {
    return await apiClient.put(`schedules/${id}`, {json:payload}).json()
}


export const DeleteSchedule = async (id: number, newScheduleId: number) => {
  return await apiClient.delete(`schedules/${id}`, {
      json: { newScheduleId } 
  }).json();
};

