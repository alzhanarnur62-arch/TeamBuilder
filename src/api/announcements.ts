import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '../i18n';
import type { Announcement } from '../types/announcement';

/*
 * REST API: кампус хабарландырулары (Зертханалық жұмыс 8, 10).
 * Өз REST API-міз — Supabase-тегі announcements кестесі (PostgREST). Мәтін 3 тілде,
 * сұраныста қазіргі тілдің бағандары таңдалады: title:title_ru → жауапта жай ғана «title».
 * Мекенжай .env файлында (EXPO_PUBLIC_NEWS_API_URL).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_NEWS_API_URL ?? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1`;
const API_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const HEADERS = { apikey: API_KEY, Accept: 'application/json' };
const CACHE_KEY = 'teambuilder_news_cache_v3';

/** Жауап Announcement типімен бірдей болуы үшін бағандардың атын өзгертеміз. */
const fields = (lang: Lang) =>
  `id,userId:author_id,title:title_${lang},body:body_${lang},image:image_url,category,publishedAt:published_at`;

/** GET /announcements — 10 хабарландыру. signal — сұранысты тоқтату үшін (AbortController). */
export async function getAnnouncements(lang: Lang, signal?: AbortSignal): Promise<Announcement[]> {
  const response = await fetch(`${API_URL}/announcements?select=${fields(lang)}&order=published_at.desc&limit=10`, {
    signal,
    headers: HEADERS,
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  return response.json() as Promise<Announcement[]>;
}

/** GET /announcements?id=eq.:id — бір хабарландыру. */
export async function getAnnouncement(id: number, lang: Lang, signal?: AbortSignal): Promise<Announcement> {
  const response = await fetch(`${API_URL}/announcements?select=${fields(lang)}&id=eq.${id}`, {
    signal,
    headers: HEADERS,
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  const rows = (await response.json()) as Announcement[];
  if (rows.length === 0) throw new Error('HTTP 404');
  return rows[0];
}

/* ---------- Кэш: интернет жоқ кезде соңғы жүктелген тізім көрсетіледі ---------- */

export type CachedNews = { items: Announcement[]; savedAt: number };

export async function readNewsCache(): Promise<CachedNews | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedNews) : null;
  } catch {
    return null;
  }
}

export async function writeNewsCache(items: Announcement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ items, savedAt: Date.now() }));
  } catch {}
}

/** Сұранысты біз өзіміз тоқтаттық па (экран жабылды) — бұл қате емес. */
export const isAbort = (e: unknown) => e instanceof Error && e.name === 'AbortError';
