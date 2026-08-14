import { api } from './api';
import type { PricingSettings, ProfitabilityAnalysis, PriceCheckResult } from '../types';

export function getPricingSettings() {
  return api.get<PricingSettings>('/pricing/settings').then((r) => r.data);
}

export function updatePricingSettings(patch: Partial<PricingSettings>) {
  return api.patch<PricingSettings>('/pricing/settings', patch).then((r) => r.data);
}

export function getProfitabilityAnalysis() {
  return api.get<ProfitabilityAnalysis>('/pricing/analysis').then((r) => r.data);
}

export function checkPrice(productId: string, price: number) {
  return api.get<PriceCheckResult>('/pricing/check', { params: { productId, price } }).then((r) => r.data);
}
