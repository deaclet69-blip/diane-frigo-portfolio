import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BusinessSnapshotService } from './business-snapshot.service';

const SYSTEM_PROMPT = `You are the AI assistant built into DIANE FRIGO, management software for a
cold storage business (wholesale and retail sale of frozen meat/fish) based in a demo environment
showcasing the product. You are given a JSON snapshot of the business's real data (stock,
sales, finances, customers).

Your role: give clear analysis and concrete, actionable suggestions, in English,
suited to a business owner managing their operations day to day — no complicated technical or
financial jargon. Be direct, use numbers when useful, and prioritize what actually matters
(imminent stockouts, abnormal sales drops, customers falling off, lingering debts,
a deteriorating net result).

Never invent numbers that aren't in the provided data. If the data is
insufficient to answer something, say so plainly rather than guessing.

Vocabulary: always call the stock unit "boxes" (never "cartons" or "units") —
match the exact wording used throughout the rest of the application.

The snapshot contains the FULL sales history (from the very first sale ever recorded, no date
limit). For each product ("quantityAndRevenueByProductAllTime") you have: quantity sold, revenue,
transaction count, number of UNIQUE CUSTOMERS ("uniqueCustomers"), its top customer
("topCustomer"), and its best-selling month ("bestMonth"). Use "uniqueCustomers" (not quantity)
to answer a question about how many customers a product attracted — those are different things.`;

const AI_BACKEND_VERSION = 'FULL_DATA_V2';

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
          // Augmenté (1024 -> 4096) — avec de vraies données importées,
          // l'IA a davantage à dire et se faisait couper en plein milieu
          // de réponse (signalé par l'utilisateur).
          generationConfig: { maxOutputTokens: 4096 },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(`Gemini API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p.text ?? '').join('\n').trim();
  }

  /** Résumé automatique pour le bloc du tableau de bord. */
  async getSummary() {
    const snapshot = await this.snapshotService.getSnapshot();
    const prompt = `Here is the current snapshot of the business:\n\n${JSON.stringify(snapshot, null, 2)}\n\n
Give a short summary (5-8 lines max) of the overall health of the business, followed by
2 to 4 concrete suggestions ranked by priority. Format: prose summary first, then a
bulleted list for the suggestions.`;

    const text = await this.callGemini([{ role: 'user', content: prompt }]);
    return { text, generatedAt: snapshot.generatedAt };
  }

  /** Chat libre : la personne pose une question, on répond avec le contexte des données réelles. */
  async chat(question: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    const snapshot = await this.snapshotService.getSnapshot();

    console.log(`AI_BACKEND_VERSION: ${AI_BACKEND_VERSION}`);
    console.log('AI_DIAGNOSTIC question:', question);
    console.log('AI_DIAGNOSTIC period covered:', JSON.stringify(snapshot.sales.periodCovered));
    console.log('AI_DIAGNOSTIC product count (all time):', snapshot.sales.quantityAndRevenueByProductAllTime.length);

    const contextMessage = `Current snapshot of the business data (for reference throughout
the conversation):\n\n${JSON.stringify(snapshot, null, 2)}`;

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: "Understood, I have the current business data in front of me. Ask me your question." },
      ...history,
      { role: 'user', content: question },
    ];

    const text = await this.callGemini(messages);
    return { text, backendVersion: AI_BACKEND_VERSION };
  }
}
