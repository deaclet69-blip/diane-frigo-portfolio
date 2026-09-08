// Démo anglaise uniquement — les données de démo sont désormais générées
// DIRECTEMENT en dollars (voir demo-seed.service.ts), donc plus aucune
// conversion n'est nécessaire ici. Ancienne version : divisait par un taux
// FCFA->USD, mais ça cassait tous les champs MODIFIABLES (Vérificateur de
// prix, Paramètres de tarification...) qui envoyaient la valeur telle
// quelle au serveur — le serveur comparait alors des dollars à des FCFA.
// Bug signalé par l'utilisateur, corrigé à la source plutôt qu'ici.
export function usd(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
