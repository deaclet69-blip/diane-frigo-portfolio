// Démo anglaise uniquement — les données de démo sont désormais générées
// DIRECTEMENT en dollars (voir demo-seed.service.ts), donc plus aucune
// conversion n'est nécessaire ici.
//
// Point important : les montants viennent de champs "Decimal" de la base
// de données, qui arrivent souvent côté frontend comme du TEXTE (ex.
// "138") plutôt que comme un vrai nombre JavaScript, même si TypeScript
// affiche `number` comme type. Sur un texte, .toLocaleString() ne fait
// rien du tout (pas de "$", pas de virgule) — d'où le bug signalé par
// l'utilisateur ("138" au lieu de "$138"). Number(amount) corrige ça.
export function usd(amount: number): string {
  return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
