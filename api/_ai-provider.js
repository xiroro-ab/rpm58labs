import OpenAI from 'openai';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const OPENROUTER_MODEL = 'google/gemini-3.6-flash';
export const OPENROUTER_FREE_MODEL = 'openrouter/free';

function normalizeModel(value) {
  if (typeof value !== 'string') return '';
  const model = value.trim();
  if (!model || model.length > 120) return '';
  return /^[A-Za-z0-9][A-Za-z0-9._:-]*(?:\/[A-Za-z0-9][A-Za-z0-9._:-]*)*$/.test(model) ? model : '';
}

export function normalizeProvider(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : 'gemini';
}

export function isOpenRouterProvider(value) {
  const provider = normalizeProvider(value);
  return provider === 'openrouter' || provider === 'openrouter-free';
}

export function getGeminiModel(value) {
  return normalizeModel(value) || normalizeModel(process.env.GEMINI_MODEL) || DEFAULT_GEMINI_MODEL;
}

export function getOpenRouterModel(provider, value) {
  const manualModel = normalizeModel(value);
  if (manualModel) return manualModel;
  if (normalizeProvider(provider) === 'openrouter-free') {
    return normalizeModel(process.env.OPENROUTER_FREE_MODEL) || OPENROUTER_FREE_MODEL;
  }
  return normalizeModel(process.env.OPENROUTER_MODEL) || OPENROUTER_MODEL;
}

export function getApiKey(customApiKey, provider) {
  if (typeof customApiKey === 'string' && customApiKey.trim()) {
    return customApiKey.trim();
  }

  const selectedProvider = normalizeProvider(provider);
  if (selectedProvider === 'gemini') return process.env.GEMINI_API_KEY;
  if (isOpenRouterProvider(selectedProvider)) return process.env.OPENROUTER_API_KEY;
  return undefined;
}

export function createOpenRouterClient(apiKey) {
  return new OpenAI({ apiKey, baseURL: OPENROUTER_BASE_URL });
}
