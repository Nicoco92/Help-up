export const USER_ROLES = ['client', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]
