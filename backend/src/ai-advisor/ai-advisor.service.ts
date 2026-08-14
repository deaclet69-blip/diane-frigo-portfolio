import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BusinessSnapshotService } from './business-snapshot.service';

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré à DIANE FRIGO, un logiciel de gestion pour une
activité de chambre froide (vente de viande/poisson congelé en gros et au détail) à Pointe-Noire,
République du Congo. On te fournit un instantané JSON des données réelles de l'activité (stock,
ventes, finances, clients).

Ton rôle : donner une analyse claire et des suggestions concrètes et actionnables, en français,
adaptées à une entrepreneure qui gère son activité au quotidien — pas de jargon technique ou
financier compliqué. Sois direct, chiffré quand c'est utile, et priorise ce qui compte vraiment
(ruptures de stock imminentes, baisses de ventes anormales, clients qui décrochent, dettes qui
traînent, résultat net qui se dégrade).

Ne jamais inventer de chiffres qui ne sont pas dans les données fournies. Si les données sont
insuffisantes pour répondre à quelque chose, dis-le simplement plutôt que de deviner.`;

@Injectable()
export class AiAdvisorService {
  constructor(private snapshotService: BusinessSnapshotService) {}

  private async callClaude(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        "Clé API Anthropic manquante — ajoute ANTHROPIC_API_KEY dans le fichier .env du backend.",
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Erreur API Claude (${response.status}) : ${text}`);
    }

    const data = await response.json();
    return data.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  }

  /** Résumé automatique pour le bloc du tableau de bord. */
  async getSummary() {
    const snapshot = await this.snapshotService.getSnapshot();
    const prompt = `Voici l'instantané actuel de l'activité :\n\n${JSON.stringify(snapshot, null, 2)}\n\n
Donne un résumé court (5-8 lignes maximum) de l'état de santé général de l'activité, suivi de
2 à 4 suggestions concrètes classées par priorité. Format : d'abord le résumé en prose, puis une
liste à puces pour les suggestions.`;

    const text = await this.callClaude([{ role: 'user', content: prompt }]);
    return { text, generatedAt: snapshot.generatedAt };
  }

  /** Chat libre : la personne pose une question, on répond avec le contexte des données réelles. */
  async chat(question: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    const snapshot = await this.snapshotService.getSnapshot();
    const contextMessage = `Instantané actuel des données de l'activité (pour référence dans toute
la conversation) :\n\n${JSON.stringify(snapshot, null, 2)}`;

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: "Compris, j'ai bien les données actuelles de l'activité sous les yeux. Pose-moi ta question." },
      ...history,
      { role: 'user', content: question },
    ];

    const text = await this.callClaude(messages);
    return { text };
  }
}
