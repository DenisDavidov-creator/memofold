export interface ScheduleLevel {
    level: number
    intervalMinutes: number
}

export interface Schedule {
    id: number
    name: string
    levels?: ScheduleLevel[]
    isDefault: boolean
}

export interface CreateSchedulePayload {
    name: string
    levels: ScheduleLevel[]
}