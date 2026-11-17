// Montant en centimes → « 30 € »
export const formatReward = (cents: number): string =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

// Date ISO → « samedi 22 novembre »
export const formatDay = (iso: string): string =>
    new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));

// Date ISO → « il y a 3 jours », « aujourd'hui »
export const formatAgo = (iso: string): string => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000));
    if (days <= 0) return 'aujourd’hui';
    if (days === 1) return 'hier';
    return `il y a ${days} jours`;
};
