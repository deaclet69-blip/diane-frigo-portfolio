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

  // Assistant IA propulsé par l'API Google Gemini (niveau gratuit — clé créée
  // sur https://aistudio.google.com/apikey, aucune carte bancaire requise).
  private async callGemini(messages: { role: 'user' | 'assistant'; content: string }[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        "Clé API Gemini manquante — ajoute GEMINI_API_KEY dans le fichier .env du backend " +
          '(clé gratuite sur https://aistudio.google.com/apikey).',
      );
    }

    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    // Gemini utilise les rôles 'user' et 'model' (pas 'assistant').
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 1024 },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Erreur API Gemini (${response.status}) : ${text}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p.text ?? '').join('\n').trim();
  }

  /** Résumé automatique pour le bloc du tableau de bord. */
  async getSummary() {
    const snapshot = await this.snapshotService.getSnapshot();
    const prompt = `Voici l'instantané actuel de l'activité :\n\n${JSON.stringify(snapshot, null, 2)}\n\n
Donne un résumé court (5-8 lignes maximum) de l'état de santé général de l'activité, suivi de
2 à 4 suggestions concrètes classées par priorité. Format : d'abord le résumé en prose, puis une
liste à puces pour les suggestions.`;

    const text = await this.callGemini([{ role: 'user', content: prompt }]);
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

    const text = await this.callGemini(messages);
    return { text };
  }
}
