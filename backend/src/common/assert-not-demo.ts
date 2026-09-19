import { ForbiddenException } from '@nestjs/common';

/**
 * Bloque une action destructrice/irréversible côté backend (pas juste
 * cachée côté écran) quand la variable DEMO_MODE=true est définie —
 * activée uniquement sur le backend de la démo publique, jamais sur le
 * vrai site.
 *
 * Le compte démo public reste RESPONSABLE (pas ADMIN), mais garde
 * beaucoup de fonctions métier volontairement — l'objectif ici n'est pas
 * de tout bloquer, seulement les actions qui pourraient dégrader
 * l'expérience des visiteurs suivants jusqu'à la prochaine régénération
 * quotidienne (suppression/fusion client, annulation facture,
 * modification des paramètres de tarification).
 */
export function assertNotDemo(action: string) {
  if (process.env.DEMO_MODE === 'true') {
    throw new ForbiddenException(`${action} is disabled in the public demo version.`);
  }
}
