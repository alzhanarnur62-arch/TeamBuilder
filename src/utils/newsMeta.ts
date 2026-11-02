import { t } from '../i18n';
import type { Key } from '../i18n/dict';
import type { NewsCategory } from '../types/announcement';

/** Жаңалықтың дереккөзі (бөлім атауы). */
export function sourceName(userId: number): string {
  const key = `news.src.${userId}` as Key;
  return userId >= 1 && userId <= 5 ? t(key) : t('news.author', { n: userId });
}

export const categoryName = (c?: NewsCategory) => t(`news.cat.${c ?? 'campus'}`);

/** «2 сағ бұрын», «кеше», «3 күн бұрын», әйтпесе күні. */
export function relativeTime(iso?: string): string {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 60) return t('news.justNow');
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return t('news.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t('news.yesterday');
  if (days < 7) return t('news.daysAgo', { n: days });
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

/** Оқу уақыты: минутына ~180 сөз, кемінде 1 минут. */
export const readMinutes = (text: string) => Math.max(1, Math.round(text.trim().split(/\s+/).length / 180));

/** Әр айдардың түсі — лентада бірден ажырату үшін. */
export const categoryColor: Record<NewsCategory, string> = {
  events: '#7C3AED',
  study: '#0E7490',
  career: '#B45309',
  sport: '#15803D',
  campus: '#1E3A8A',
  clubs: '#BE185D',
};
