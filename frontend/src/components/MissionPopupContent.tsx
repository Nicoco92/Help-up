import { ArrowUpRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Mission } from '../types/mission'
import { Button } from './Button'
import { CategoryBadge } from './CategoryBadge'

function formatReward(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value / 100)
}

export function MissionPopupContent({
  mission,
  onClose,
}: {
  mission: Mission
  onClose: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="map-popup">
      <div className="map-popup-header">
        <CategoryBadge category={mission.category} label={mission.categoryLabel} />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Fermer l’aperçu de la mission"
          title="Fermer"
          icon={<X size={16} />}
          onClick={onClose}
        />
      </div>
      {mission.urgent && <span className="urgent-badge">Besoin urgent</span>}
      <strong>{mission.title}</strong>
      <span>{mission.quartierLabel}</span>
      <span className="map-popup-price">{formatReward(mission.rewardCents)} €</span>
      <Button
        variant="secondary"
        size="sm"
        icon={<ArrowUpRight size={16} />}
        onClick={() => navigate(`/missions/${mission.id}`)}
      >
        Voir la mission
      </Button>
    </div>
  )
}
