import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Announcement } from '../types/announcement';

/*
 * Сыртқы REST API: хабарландырулар (Зертханалық жұмыс 8).
 * Мекенжай .env файлында (EXPO_PUBLIC_NEWS_API_URL), жоқ болса — JSONPlaceholder.
 */
export const API_URL = process.env.EXPO_PUBLIC_NEWS_API_URL ?? 'https://jsonplaceholder.typicode.com';
const ANNOUNCEMENTS_URL = API_URL + '/posts?_limit=10';
const CACHE_KEY = 'teambuilder_news_cache_v1';

/** GET /posts?_limit=10 — 10 хабарландыру. signal — сұранысты тоқтату үшін (AbortController). */
export async function getAnnouncements(signal?: AbortSignal): Promise<Announcement[]> {
  const response = await fetch(ANNOUNCEMENTS_URL, { signal });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  return response.json() as Promise<Announcement[]>;
}

/** GET /posts/:id — бір хабарландыру. */
export async function getAnnouncement(id: number, signal?: AbortSignal): Promise<Announcement> {
  const response = await fetch(API_URL + '/posts/' + id, { signal });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  return response.json() as Promise<Announcement>;
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
