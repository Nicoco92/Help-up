import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Compass, History, MapPin, Users } from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { Dashboard, DashboardMission } from '../types/dashboard';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { CandidatesPanel } from '../components/CandidatesPanel';
import { formatDay, formatReward } from '../utils/missionFormat';
import '../styles/applications.css';
import '../styles/dashboard.css';

function MissionFacts({ mission }: { mission: DashboardMission }) {
    return (
        <div className="application-card__facts">
            <span>
                <MapPin size={16} aria-hidden="true" />
                {mission.quartierLabel}
            </span>
            <span>
                <CalendarDays size={16} aria-hidden="true" />
                {formatDay(mission.scheduledAt)}
            </span>
            <strong className="application-card__price">{formatReward(mission.rewardCents)}</strong>
        </div>
    );
}

// Une de mes missions publiées : candidats, prestataire retenu, clôture
function PublishedCard({ mission, onChange }: { mission: DashboardMission; onChange: () => void }) {
    const [open, setOpen] = useState(mission.status === 'open' && mission.pendingApplications > 0);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const complete = async () => {
        setBusy(true);
        setError(null);
        try {
            await dashboardApi.completeMission(mission.id);
            onChange();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'La mission n’a pas pu être clôturée.');
            setBusy(false);
            setConfirming(false);
        }
    };

    return (
        <article className="card application-card">
            <div className="application-card__head">
                <h3>{mission.title}</h3>
                <StatusBadge status={mission.status} />
            </div>
            <MissionFacts mission={mission} />
            {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

            {mission.status === 'assigned' && (
                <div className="dashboard-assigned">
                    <p>
                        Réalisée par <strong>{mission.counterpart ? `${mission.counterpart.firstName} ${mission.counterpart.lastName}` : 'un membre'}</strong>
                        {mission.counterpart?.city && ` (${mission.counterpart.city})`}
                    </p>
                    <div className="application-card__actions">
                        {confirming ? (
                            <>
                                <span>La mission a bien été réalisée ?</span>
                                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setConfirming(false)} disabled={busy}>
                                    Annuler
                                </button>
                                <button type="button" className="btn btn--primary btn--sm" onClick={complete} disabled={busy}>
                                    {busy ? 'Clôture…' : 'Confirmer'}
                                </button>
                            </>
                        ) : (
                            <button type="button" className="btn btn--primary btn--sm" onClick={() => setConfirming(true)}>
                                <CheckCircle2 size={16} aria-hidden="true" />
                                Marquer comme terminée
                            </button>
                        )}
                    </div>
                </div>
            )}

            <button
                type="button"
                className="dashboard-toggle"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <Users size={16} aria-hidden="true" />
                {mission.totalApplications === 0
                    ? 'Aucune candidature'
                    : `${mission.totalApplications} candidature${mission.totalApplications > 1 ? 's' : ''}`}
                {mission.pendingApplications > 0 && (
                    <span className="badge badge--neutral">{mission.pendingApplications} en attente</span>
                )}
                <ChevronDown size={16} aria-hidden="true" className={open ? 'is-open' : ''} />
            </button>
            {open && <CandidatesPanel missionId={mission.id} canDecide={mission.status === 'open'} onDecision={onChange} />}
        </article>
    );
}

// Une mission qui m'est attribuée
function ObtainedCard({ mission }: { mission: DashboardMission }) {
    return (
        <article className="card application-card">
            <div className="application-card__head">
                <h3>{mission.title}</h3>
                <StatusBadge status={mission.status} />
            </div>
            <MissionFacts mission={mission} />
            <p className="muted">
                Pour <strong>{mission.counterpart ? `${mission.counterpart.firstName} ${mission.counterpart.lastName}` : 'un membre'}</strong>
                {' '}· {mission.estimatedMinutes} minutes estimées. Le client marquera la mission comme terminée.
            </p>
        </article>
    );
}

function HistoryRow({ mission }: { mission: DashboardMission }) {
    const other = mission.counterpart ? `${mission.counterpart.firstName} ${mission.counterpart.lastName}` : 'un membre';
    return (
        <li className="history-row">
            <div>
                <strong>{mission.title}</strong>
                <span>
                    {mission.role === 'owner' ? `Publiée · réalisée par ${other}` : `Réalisée pour ${other}`}
                    {mission.completedAt && ` · terminée le ${new Date(mission.completedAt).toLocaleDateString('fr-FR')}`}
                </span>
            </div>
            <strong className={mission.role === 'provider' ? 'history-row__earned' : ''}>
                {mission.role === 'provider' ? '+ ' : ''}
                {formatReward(mission.rewardCents)}
            </strong>
        </li>
    );
}

export function DashboardPage() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        dashboardApi
            .get()
            .then((result) => {
                setDashboard(result);
                setError(null);
            })
            .catch((err: Error) => setError(err.message));
    }, []);

    useEffect(load, [load]);

    return (
        <div className="page">
            <div className="container">
                <header className="page-header">
                    <div>
                        <h1>Tableau de bord</h1>
                        <p>{user ? `Bonjour ${user.firstName}, ` : ''}voici où en sont vos missions.</p>
                    </div>
                    <Link to="/applications" className="btn btn--secondary">
                        Mes candidatures
                    </Link>
                </header>

                {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

                {!dashboard && !error && (
                    <div className="application-list" aria-busy="true" aria-label="Chargement du tableau de bord">
                        <div className="skeleton" style={{ height: 96 }} />
                        <div className="skeleton" style={{ height: 180 }} />
                    </div>
                )}

                {dashboard && (
                    <>
                        <dl className="dashboard-stats">
                            <div>
                                <dt>Missions ouvertes</dt>
                                <dd>{dashboard.stats.openMissions}</dd>
                            </div>
                            <div>
                                <dt>Candidatures à traiter</dt>
                                <dd>{dashboard.stats.pendingApplications}</dd>
                            </div>
                            <div>
                                <dt>Missions obtenues</dt>
                                <dd>{dashboard.stats.obtainedMissions}</dd>
                            </div>
                            <div>
                                <dt>Gagné sur HelpUP</dt>
                                <dd>{formatReward(dashboard.stats.earnedCents)}</dd>
                            </div>
                        </dl>

                        <section className="dashboard-section" aria-labelledby="published-title">
                            <h2 id="published-title">Mes missions publiées</h2>
                            {dashboard.published.length === 0 ? (
                                <EmptyState icon={ClipboardList} title="Aucune mission en cours">
                                    Les missions que vous publiez apparaîtront ici, avec leurs candidats.
                                </EmptyState>
                            ) : (
                                <div className="application-list">
                                    {dashboard.published.map((m) => (
                                        <PublishedCard key={m.id} mission={m} onChange={load} />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="dashboard-section" aria-labelledby="obtained-title">
                            <h2 id="obtained-title">Missions obtenues</h2>
                            {dashboard.obtained.length === 0 ? (
                                <EmptyState
                                    icon={Compass}
                                    title="Aucune mission obtenue pour l’instant"
                                    action={
                                        <Link to="/missions" className="btn btn--primary">
                                            Trouver une mission
                                        </Link>
                                    }
                                >
                                    Quand un voisin accepte votre candidature, la mission s’affiche ici.
                                </EmptyState>
                            ) : (
                                <div className="application-list">
                                    {dashboard.obtained.map((m) => (
                                        <ObtainedCard key={m.id} mission={m} />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="dashboard-section" aria-labelledby="history-title">
                            <h2 id="history-title">Historique</h2>
                            {dashboard.history.length === 0 ? (
                                <EmptyState icon={History} title="Pas encore de mission terminée" />
                            ) : (
                                <ul className="card history-list">
                                    {dashboard.history.map((m) => (
                                        <HistoryRow key={m.id} mission={m} />
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
