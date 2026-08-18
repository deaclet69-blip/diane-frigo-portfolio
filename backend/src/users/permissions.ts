// Source unique de vérité des pages/sections restreignables par utilisateur.
// Les clés DOIVENT correspondre à celles utilisées côté frontend
// (frontend/src/constants/permissions.ts) — elles pilotent la barre latérale
// et l'accès aux pages. Le rôle ADMIN ignore toujours cette liste (accès total).
export const PERMISSION_KEYS = [
  'dashboard',
  'ventes',
  'stock',
  'produits',
  'clients',
  'depots',
  'achats',
  'charges',
  'pertes',
  'rentabilite',
  'rapports',
  'investissement',
  'assistant',
  'utilisateurs',
  'parametres',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
