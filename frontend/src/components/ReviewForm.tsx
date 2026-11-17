import { useState, type FormEvent } from 'react';
import { ApiError, reviewsApi } from '../services/api';
import { StarRatingInput } from './StarRating';
import { TextAreaField } from './Field';
import { Alert } from './Alert';
import { useDraft } from '../hooks/useDraft';

const MAX = 500;

interface ReviewFormProps {
    missionId: string;
    // Prénom de la personne notée, pour le titre du formulaire
    targetName: string;
    // Avis existant : le formulaire passe en modification
    existing?: { id: string; rating: number; comment: string } | null;
    onSaved: () => void;
    onCancel: () => void;
}

// Noter l'autre participant d'une mission terminée (création ou modification)
// Le serveur revérifie tout : mission terminée, participant, un seul avis, note entière de 1 à 5
export function ReviewForm({ missionId, targetName, existing, onSaved, onCancel }: ReviewFormProps) {
    // Brouillon conservé si la session expire pendant la saisie
    const [rating, setRating, clearRating] = useDraft(`review.${missionId}.rating`, existing?.rating ?? 0);
    const [comment, setComment, clearComment] = useDraft(`review.${missionId}.comment`, existing?.comment ?? '');
    const [ratingError, setRatingError] = useState<string | undefined>();
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!rating) {
            setRatingError('Choisissez une note de 1 à 5 étoiles.');
            return;
        }
        setSending(true);
        setError(null);
        try {
            const payload = { rating, comment: comment.trim() };
            if (existing) {
                await reviewsApi.update(existing.id, payload);
            } else {
                await reviewsApi.create(missionId, payload);
            }
            clearRating();
            clearComment();
            onSaved();
        } catch (cause) {
            setError(
                cause instanceof ApiError && cause.code === 'CONFLICT'
                    ? 'Vous avez déjà noté cette mission.'
                    : cause instanceof Error
                      ? cause.message
                      : 'L’avis n’a pas pu être enregistré.'
            );
            setSending(false);
        }
    };

    return (
        <form className="review-form" onSubmit={handleSubmit} noValidate>
            <h3>{existing ? 'Modifier votre avis' : `Noter ${targetName}`}</h3>
            {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
            <StarRatingInput
                value={rating}
                onChange={(n) => {
                    setRating(n);
                    setRatingError(undefined);
                }}
                error={ratingError}
            />
            <TextAreaField
                label="Commentaire"
                optional
                rows={3}
                maxLength={MAX}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                hint="Votre avis est visible sur le profil de ce membre."
            />
            <div className="review-form__actions">
                <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => {
                        clearRating();
                        clearComment();
                        onCancel();
                    }}
                    disabled={sending}
                >
                    Annuler
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={sending}>
                    {sending ? 'Envoi…' : existing ? 'Enregistrer' : 'Publier l’avis'}
                </button>
            </div>
        </form>
    );
}
