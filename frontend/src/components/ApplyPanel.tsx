import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { ApiError, applicationsApi } from '../services/api';
import { TextAreaField } from './Field';
import { Alert } from './Alert';
import { useDraft } from '../hooks/useDraft';
import '../styles/applications.css';

const MIN = 10;
const MAX = 500;

// Formulaire « Postuler » de la page détail d'une mission
// Le serveur revérifie tout : message, mission ouverte, pas la sienne, une seule candidature
export function ApplyPanel({ missionId, onApplied }: { missionId: string; onApplied?: () => void }) {
    // Brouillon conservé si la session expire pendant la saisie
    const [message, setMessage, clearDraft] = useDraft(`apply.${missionId}`, '');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const length = message.trim().length;
    const tooShort = length > 0 && length < MIN;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (length < MIN) {
            setError(`Votre message doit contenir au moins ${MIN} caractères.`);
            return;
        }
        setSending(true);
        setError(null);
        try {
            await applicationsApi.create({ missionId, message: message.trim() });
            clearDraft();
            setSent(true);
            onApplied?.();
        } catch (cause) {
            setError(
                cause instanceof ApiError && cause.code === 'CONFLICT'
                    ? 'Vous avez déjà postulé à cette mission.'
                    : cause instanceof Error
                      ? cause.message
                      : 'La candidature n’a pas pu être envoyée.'
            );
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <section className="apply-panel apply-panel--sent" role="status">
                <CheckCircle2 size={24} aria-hidden="true" />
                <div>
                    <strong>Candidature envoyée</strong>
                    <p>Le propriétaire de la mission va la consulter. Suivez sa réponse dans vos candidatures.</p>
                    <Link className="btn btn--secondary btn--sm" to="/applications">
                        Voir mes candidatures
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <form className="apply-panel" onSubmit={handleSubmit} noValidate>
            <h2>Proposer votre aide</h2>
            {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
            <TextAreaField
                label="Votre message"
                placeholder="Présentez-vous en quelques mots : vos disponibilités, votre expérience…"
                rows={4}
                maxLength={MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                error={tooShort ? `Encore ${MIN - length} caractère${MIN - length > 1 ? 's' : ''} minimum` : undefined}
                hint={`${MIN} caractères minimum. Le propriétaire verra votre prénom, votre ville et vos compétences.`}
                required
            />
            <button type="submit" className="btn btn--primary" disabled={sending}>
                <Send size={18} aria-hidden="true" />
                {sending ? 'Envoi…' : 'Postuler'}
            </button>
        </form>
    );
}
