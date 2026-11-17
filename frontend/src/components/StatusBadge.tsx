import type { MissionStatus } from '../types/mission'

const labels: Record<MissionStatus, string> = {
  open: 'Ouverte',
  assigned: 'Attribuée',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

export function StatusBadge({ status }: { status: MissionStatus }) {
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>
}
