/*
 * Іс-шараға тіркелу формасын тексеру (Зертханалық жұмыс 9).
 * Бұл файлда интерфейс жоқ: validate() тек қате кілттерін қайтарады,
 * ал экран оларды таңдалған тілге аударады. Сондықтан тексеруді бөлек сынауға болады.
 */

export type EventType = 'hackathon' | 'seminar' | 'masterclass' | '';
export const eventTypes = ['hackathon', 'seminar', 'masterclass'] as const;

export type FormValues = {
  fullName: string;
  group: string;
  phone: string;
  email: string;
  eventType: EventType;
  eventDate: string;
  participants: string;
  comment: string;
  accepted: boolean;
};

/** Әр өріс үшін қате мәтінінің кілті (i18n). ? — қате болмауы мүмкін. */
export type FormErrors = {
  fullName?: ErrorKey;
  group?: ErrorKey;
  phone?: ErrorKey;
  email?: ErrorKey;
  eventType?: ErrorKey;
  eventDate?: ErrorKey;
  participants?: ErrorKey;
  comment?: ErrorKey;
  accepted?: ErrorKey;
};

export type ErrorKey =
  | 'ev.err.name'
  | 'ev.err.group'
  | 'ev.err.phone'
  | 'ev.err.email'
  | 'ev.err.type'
  | 'ev.err.dateFormat'
  | 'ev.err.dateReal'
  | 'ev.err.datePast'
  | 'ev.err.count'
  | 'ev.err.comment'
  | 'ev.err.accept';

export const MIN_COUNT = 1;
export const MAX_COUNT = 5;
export const COMMENT_MIN = 10;
export const COMMENT_MAX = 200;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** +7 немесе 8, сосын 10 цифр. Бос орын, сызықша, жақша рұқсат. */
const phonePattern = /^(\+7|8)\d{10}$/;

/** JavaScript 2026-02-31 сияқты күнді келесі айға ауыстырып жібереді — сондықтан бөліктерін салыстырамыз. */
export function isRealDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export const normalizePhone = (value: string) => value.replace(/[\s\-()]/g, '');

export function validate(v: FormValues, today: Date = new Date()): FormErrors {
  const next: FormErrors = {};

  if (v.fullName.trim().length < 3) next.fullName = 'ev.err.name';
  if (!v.group.trim()) next.group = 'ev.err.group';

  // Қосымша тапсырма: телефон және email
  if (!phonePattern.test(normalizePhone(v.phone))) next.phone = 'ev.err.phone';
  if (!emailPattern.test(v.email.trim())) next.email = 'ev.err.email';

  if (!v.eventType) next.eventType = 'ev.err.type';

  if (!datePattern.test(v.eventDate)) {
    next.eventDate = 'ev.err.dateFormat';
  } else if (!isRealDate(v.eventDate)) {
    next.eventDate = 'ev.err.dateReal';
  } else {
    const selected = new Date(v.eventDate + 'T00:00:00');
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    if (selected < start) next.eventDate = 'ev.err.datePast';
  }

  // «2.5», «0», «8», «abc», бос жол — бәрі қате
  const raw = v.participants.trim();
  const count = Number(raw);
  if (!raw || !Number.isInteger(count) || count < MIN_COUNT || count > MAX_COUNT) {
    next.participants = 'ev.err.count';
  }

  if (v.comment.trim().length < COMMENT_MIN) next.comment = 'ev.err.comment';
  if (!v.accepted) next.accepted = 'ev.err.accept';

  return next;
}

export const emptyForm: FormValues = {
  fullName: '',
  group: '',
  phone: '',
  email: '',
  eventType: '',
  eventDate: '',
  participants: '1',
  comment: '',
  accepted: false,
};
