/**
 * Lit une variable d'environnement OBLIGATOIRE et fait échouer le démarrage
 * de l'application si elle est absente — au lieu de retomber silencieusement
 * sur une valeur par défaut prévisible (ex. "change-me-access"), ce qui
 * serait une vraie faille si jamais la variable manquait en production.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Refusing to start with an insecure default.`,
    );
  }
  return value;
}
