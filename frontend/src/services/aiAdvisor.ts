import { api } from './api';
import type { AiSummary, ChatMessage } from '../types';

export function getAiSummary() {
  return api.get<AiSummary>('/ai-advisor/summary').then((r) => r.data);
}

export function askAi(question: string, history: ChatMessage[]) {
  return api.post<{ text: string }>('/ai-advisor/chat', { question, history }).then((r) => r.data);
}
