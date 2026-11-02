import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { dict, type Key } from './dict';

/*
 * Тілдер: қазақша / русский / English.
 * t('key', { name: 'Арнур' }) — мәтінді қазіргі тілде қайтарады, {name} орнына мән қояды.
 * t() кез келген жерде жұмыс істейді (экрандарда, алгоритмде, қате хабарларында).
 * Экрандар тіл ауысқанда қайта сызылуы үшін компонентте useLang() шақырылады.
 */

export type Lang = 'kk' | 'ru' | 'en';
export const LANGS: { code: Lang; short: string; name: string }[] = [
  { code: 'kk', short: 'Қаз', name: 'Қазақша' },
  { code: 'ru', short: 'Рус', name: 'Русский' },
  { code: 'en', short: 'Eng', name: 'English' },
];

const KEY = 'teambuilder_lang';

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'kk' || code === 'ru' ? code : 'en';
}

let current: Lang = deviceLang();

/** Қазіргі тіл — компоненттен тыс жерде (мысалы, API сұранысында) керек болғанда. */
export const getLang = (): Lang => current;

export type Params = Record<string, string | number>;

export function t(key: Key, params?: Params): string {
  let s: string = dict[key][current];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/* ---------- Базадағы мәндерді көрсету (рөлдер мен уақыт базада қазақша кілт ретінде сақталады) ---------- */

const ROLE_KEYS: Record<string, Key> = {
  Frontend: 'role.frontend',
  Backend: 'role.backend',
  'Дизайнер': 'role.designer',
  'Тестілеуші': 'role.tester',
  'Менеджер': 'role.manager',
};
export const roleName = (role: string) => (ROLE_KEYS[role] ? t(ROLE_KEYS[role]) : role);

const DAY_KEYS: Record<string, Key> = {
  'Дс': 'day.mon', 'Сс': 'day.tue', 'Ср': 'day.wed', 'Бс': 'day.thu', 'Жм': 'day.fri', 'Сн': 'day.sat', 'Жс': 'day.sun',
};
/** 'Дс 18' → 'Пн 18' / 'Mon 18' */
export const slotName = (slot: string) => {
  const [day, ...rest] = slot.split(' ');
  return DAY_KEYS[day] ? [t(DAY_KEYS[day]), ...rest].join(' ') : slot;
};
export const slotsText = (slots: string[]) => slots.map(slotName).join(', ');

/** Қызығушылықтар мен кейбір дағдылар базада қазақша сөз ретінде сақталады — көрсеткенде аударамыз. */
const TAG_KEYS: Record<string, Key> = {
  'Мобильді': 'tag.mobile',
  'Стартап': 'tag.startup',
  'Серверлер': 'tag.servers',
  'Дизайн': 'tag.design',
  'Брендинг': 'tag.branding',
  'Сапа': 'tag.quality',
  'Жобаларды басқару': 'tag.pm',
  'Веб': 'tag.web',
  'Деректер': 'tag.data',
  'Прототиптеу': 'tag.prototyping',
};
export const tagName = (tag: string) => (TAG_KEYS[tag] ? t(TAG_KEYS[tag]) : tag);
export const tagsText = (tags: string[]) => tags.map(tagName).join(', ');

/** Базадағы аудармалар: {"ru": {"about": "..."}, "en": {...}}. Қазақша — негізгі бағанда. */
export type I18nMap = Partial<Record<Lang, Record<string, string>>>;
export const localized = (map: I18nMap | undefined, field: string, original: string) =>
  (current !== 'kk' && map?.[current]?.[field]) || original;

/* ---------- Провайдер ---------- */

type LangContextType = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<LangContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === 'kk' || saved === 'ru' || saved === 'en') {
          current = saved;
          setLangState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    current = l;
    setLangState(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

/** Компонентте шақырыңыз — тіл ауысқанда экран жаңарады. */
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('LanguageProvider not found');
  return ctx;
}
