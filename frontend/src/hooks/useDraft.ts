import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'helpup.draft.';

const read = <T,>(key: string, fallback: T): T => {
    try {
        const raw = sessionStorage.getItem(PREFIX + key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
};

// Brouillon d'un formulaire gardé dans l'onglet (sessionStorage) : si la session expire pendant
// la saisie, on se reconnecte et on retrouve son texte (WCAG 2.2.5 AAA, « Ré-authentification »).
// clear() l'efface une fois le formulaire envoyé.
export function useDraft<T>(key: string, initial: T): [T, (value: T) => void, () => void] {
    const [value, setValue] = useState<T>(() => read(key, initial));

    useEffect(() => {
        try {
            sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch {
            // Stockage indisponible (navigation privée stricte) : le brouillon n'est simplement pas gardé
        }
    }, [key, value]);

    const clear = useCallback(() => {
        try {
            sessionStorage.removeItem(PREFIX + key);
        } catch {
            // rien à faire
        }
    }, [key]);

    return [value, setValue, clear];
}
