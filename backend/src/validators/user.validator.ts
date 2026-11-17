import { z } from 'zod'
import { USER_ROLES } from '../constants/roles'
import {
  bioField,
  cityField,
  firstNameField,
  lastNameField,
  phoneField,
  skillsField,
} from './auth.validator'

// Une chaîne vide sur un champ facultatif signifie « effacer la valeur ».
const clearable = <T extends z.ZodType>(schema: T) => z.union([z.literal(''), schema]).optional()

export const updateProfileSchema = z
  .object({
    firstName: firstNameField.optional(),
    lastName: lastNameField.optional(),
    phone: clearable(phoneField),
    city: clearable(cityField),
    bio: clearable(bioField),
    skills: skillsField.optional(),
    avatarUrl: clearable(
      z
        .string()
        .trim()
        .regex(/^https:\/\//, 'L’URL d’avatar doit commencer par https://')
        .max(500, 'L’URL d’avatar est trop longue'),
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Indique au moins un champ à modifier',
  })

export const updateRoleSchema = z
  .object({
    role: z.enum(USER_ROLES, { error: 'Rôle inconnu' }),
  })
  .strict()

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
