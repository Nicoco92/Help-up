import { initials } from '../utils/format'

interface AvatarProps {
  firstName: string
  lastName: string
  avatarUrl?: string
  size?: number
}

export function Avatar({ firstName, lastName, avatarUrl, size = 40 }: AvatarProps) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {avatarUrl ? (
        // Image hébergée ailleurs : on n'envoie pas l'adresse de la page au site de l'image
        <img src={avatarUrl} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
      ) : (
        initials({ firstName, lastName })
      )}
    </span>
  )
}
