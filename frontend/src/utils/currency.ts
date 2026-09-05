// Démo anglaise uniquement — convertit les montants FCFA stockés en base en
// dollars US pour l'affichage, avec un taux approximatif fixe (assez pour
// une démo, pas destiné à un usage financier réel).
const FCFA_TO_USD_RATE = 600;

export function usd(fcfaAmount: number): string {
  const value = fcfaAmount / FCFA_TO_USD_RATE;
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
