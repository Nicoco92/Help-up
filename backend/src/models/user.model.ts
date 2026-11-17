import { Schema, model, type Document } from 'mongoose'
import { USER_ROLES, type UserRole } from '../constants/roles'
import { CATEGORY_SLUGS } from '../constants/categories'

export interface IUser {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone?: string
  city?: string
  bio?: string
  skills: string[]
  role: UserRole
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface IUserDocument extends IUser, Document {
  id: string
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^A-Z@\s]+@[^A-Z@\s]+\.[^A-Z@\s]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    phone: {
      type: String,
      trim: true,
      match: /^0[1-9][0-9]{8}$/,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    skills: {
      type: [{ type: String, enum: CATEGORY_SLUGS }],
      default: [],
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'client',
      required: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      match: /^https:\/\//,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = String(ret._id)
        }
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = String(ret._id)
        }
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
  },
)

export const User = model<IUserDocument>('User', userSchema)
