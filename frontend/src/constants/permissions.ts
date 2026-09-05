// Source unique de vérité des pages/sections restreignables par utilisateur.
// Les clés DOIVENT correspondre à celles du backend
// (backend/src/users/permissions.ts). L'ordre définit l'ordre d'affichage
// dans le formulaire de gestion des accès.
export interface PermissionSection {
  key: string;
  label: string;
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'ventes', label: 'Sales' },
  { key: 'stock', label: 'Stock' },
  { key: 'produits', label: 'Products' },
  { key: 'clients', label: 'Customers' },
  { key: 'depots', label: 'Customer Deposits' },
  { key: 'achats', label: 'Purchases' },
  { key: 'charges', label: 'Expenses' },
  { key: 'pertes', label: 'Losses' },
  { key: 'rentabilite', label: 'Profitability' },
  { key: 'rapports', label: 'Reports' },
  { key: 'investissement', label: 'Investment' },
  { key: 'assistant', label: 'AI Assistant' },
  { key: 'utilisateurs', label: 'Users' },
  { key: 'parametres', label: 'Settings' },
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
