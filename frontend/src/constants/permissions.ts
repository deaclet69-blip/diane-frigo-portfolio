// Source unique de vérité des pages/sections restreignables par utilisateur.
// Les clés DOIVENT correspondre à celles du backend
// (backend/src/users/permissions.ts). L'ordre définit l'ordre d'affichage
// dans le formulaire de gestion des accès.
export interface PermissionSection {
  key: string;
  label: string;
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'ventes', label: 'Ventes' },
  { key: 'stock', label: 'Stock' },
  { key: 'produits', label: 'Produits' },
  { key: 'clients', label: 'Clients' },
  { key: 'depots', label: 'Dépôts clients' },
  { key: 'achats', label: 'Achats' },
  { key: 'charges', label: 'Dépenses / Charges' },
  { key: 'pertes', label: 'Pertes' },
  { key: 'rentabilite', label: 'Rentabilité' },
  { key: 'rapports', label: 'Rapports' },
  { key: 'investissement', label: 'Investissement' },
  { key: 'assistant', label: 'Assistant IA' },
  { key: 'utilisateurs', label: 'Utilisateurs' },
  { key: 'parametres', label: 'Paramètres' },
];

export const PERMISSION_KEYS = PERMISSION_SECTIONS.map((s) => s.key);

// L'ADMIN a toujours accès à tout, quelle que soit la liste stockée.
export function hasPermission(
  user: { role: string; permissions?: string[] } | null | undefined,
  key: string,
): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return (user.permissions ?? []).includes(key);
}
