import { z } from 'zod'
import { CATEGORY_SLUGS } from '../../constants/categories'

// Règles partagées entre l'inscription et la modification du profil.
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email('Format d’email invalide')
  .max(254, 'L’email ne doit pas dépasser 254 caractères')

// bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que de tronquer en silence.
// 72 octets et pas 72 caractères : « é » ou un emoji prennent 2 à 4 octets en UTF-8.
export const passwordField = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(72, 'Le mot de passe ne doit pas dépasser 72 caractères')
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Le mot de passe est trop long (72 octets maximum, les accents comptent double)',
  )

export const firstNameField = z
  .string()
  .trim()
  .min(1, 'Le prénom est requis')
  .max(50, 'Le prénom ne doit pas dépasser 50 caractères')

export const lastNameField = z
  .string()
  .trim()
  .min(1, 'Le nom est requis')
  .max(50, 'Le nom ne doit pas dépasser 50 caractères')

export const phoneField = z
  .string()
  .trim()
  .regex(/^0[1-9][0-9]{8}$/, 'Numéro de téléphone invalide (ex. 0612345678)')

export const cityField = z.string().trim().max(80, 'La ville ne doit pas dépasser 80 caractères')

export const bioField = z.string().trim().max(500, 'La bio ne doit pas dépasser 500 caractères')

export const skillsField = z
  .array(z.enum(CATEGORY_SLUGS, { error: 'Compétence inconnue' }))
  .max(8, 'Tu ne peux pas indiquer plus de 8 compétences')
  .transform((skills) => [...new Set(skills)])

// Le rôle n'est volontairement PAS accepté ici : un compte est toujours créé « client ».
// Seul un administrateur peut promouvoir un compte (PATCH /api/users/:id/role).
export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    firstName: firstNameField,
    lastName: lastNameField,
    phone: phoneField.optional(),
    city: cityField.optional(),
    bio: bioField.optional(),
    skills: skillsField.optional(),
  })
  .strict()

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Format d’email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis').max(256),
  })
  .strict()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
