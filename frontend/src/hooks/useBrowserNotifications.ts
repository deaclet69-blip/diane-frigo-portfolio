import { useEffect, useRef } from 'react';
import { getFullDashboard } from '../services/dashboard';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Demande la permission d'afficher des notifications système (celles qui
 * apparaissent même quand l'onglet n'est pas au premier plan), puis vérifie
 * périodiquement les alertes réelles. Si de nouvelles alertes apparaissent
 * depuis la dernière vérification, une notification système est déclenchée.
 */
export function useBrowserNotifications() {
  const knownTitles = useRef<Set<string>>(new Set());
  const isFirstCheck = useRef(true);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    async function check() {
      try {
        const data = await getFullDashboard();
        const currentTitles = new Set(data.alerts.map((a) => `${a.title}:${a.detail}`));

        if (!isFirstCheck.current && Notification.permission === 'granted') {
          for (const key of currentTitles) {
            if (!knownTitles.current.has(key)) {
              const [title, detail] = key.split(':');
              new Notification(`DIANE FRIGO — ${title}`, {
                body: detail,
                icon: '/icon-192.png',
              });
            }
          }
        }
        knownTitles.current = currentTitles;
        isFirstCheck.current = false;
      } catch {
        // silencieux — pas grave si une vérification échoue
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
