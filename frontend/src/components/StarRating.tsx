import { useId } from 'react';
import { Star } from 'lucide-react';

const STARS = [1, 2, 3, 4, 5];
const LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

// Note affichée : les étoiles sont décoratives, le texte « 4,5 sur 5 » est lu par les lecteurs d'écran
export function RatingStars({ value, size = 16 }: { value: number; size?: number }) {
    const label = `Note : ${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} sur 5`;
    return (
        <span className="rating-stars" role="img" aria-label={label}>
            {STARS.map((n) => (
                <Star
                    key={n}
                    size={size}
                    aria-hidden="true"
                    className={n <= Math.round(value) ? 'is-on' : ''}
                />
            ))}
        </span>
    );
}

// Choix de la note : un vrai groupe de boutons radio (flèches du clavier, lecteur d'écran)
// stylé en étoiles ; le libellé de la note choisie s'affiche en texte, pas seulement en couleur
export function StarRatingInput({
    value,
    onChange,
    error
}: {
    value: number;
    onChange: (rating: number) => void;
    error?: string;
}) {
    const name = useId();
    return (
        <fieldset className={`star-input${error ? ' star-input--invalid' : ''}`} aria-describedby={error ? `${name}-error` : undefined}>
            <legend className="field__label">Votre note</legend>
            <div className="star-input__row">
                {STARS.map((n) => (
                    <label key={n} className={`star-input__star${n <= value ? ' is-on' : ''}`}>
                        <input
                            type="radio"
                            name={name}
                            value={n}
                            checked={value === n}
                            onChange={() => onChange(n)}
                            className="visually-hidden"
                        />
                        <Star size={28} aria-hidden="true" />
                        <span className="visually-hidden">
                            {n} étoile{n > 1 ? 's' : ''} sur 5 : {LABELS[n]}
                        </span>
                    </label>
                ))}
                <span className="star-input__label" aria-hidden="true">
                    {value ? LABELS[value] : 'Choisissez une note'}
                </span>
            </div>
            {error && (
                <p className="field__error" id={`${name}-error`}>
                    {error}
                </p>
            )}
        </fieldset>
    );
}
