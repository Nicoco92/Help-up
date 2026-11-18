import type { ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type BackLinkProps =
  | { to: To; onClick?: never; children: ReactNode }
  | { to?: never; onClick: () => void; children: ReactNode }

export function BackLink(props: BackLinkProps) {
  const content = (
    <>
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{props.children}</span>
    </>
  )

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className="back-link">
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className="back-link" onClick={props.onClick}>
      {content}
    </button>
  )
}
