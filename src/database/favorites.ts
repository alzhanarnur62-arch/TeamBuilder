import * as SQLite from 'expo-sqlite';
import type { Announcement, NewsCategory } from '../types/announcement';

/*
 * Таңдаулы хабарландырулар — телефондағы SQLite базасында (Зертханалық жұмыс 10).
 * Интернетсіз де оқылады. CRUD: savePost (CREATE), getSavedPosts (READ),
 * toggleRead (UPDATE), removeSaved (DELETE).
 * owner_id — бір телефонда бірнеше аккаунт болса, әрқайсысының өз тізімі болуы үшін.
 * Сурет base64 түрінде базаның өзінде сақталады — сондықтан интернетсіз де көрінеді.
 */

export type SavedPost = {
  id: number;
  title: string;
  body: string;
  isRead: 0 | 1;
  savedAt: number;
  userId: number | null;
  category: NewsCategory | null;
  publishedAt: string | null;
  /** Сурет сілтемесі (интернет бар кезде) */
  image: string | null;
  /** Суреттің офлайн көшірмесі (data:image/jpeg;base64,...) */
  imageData: string | null;
};

export type PostInput = Pick<Announcement, 'id' | 'title' | 'body'> & Partial<Announcement>;

// Кейін қосылған бағандар: ескі кестеге де қосамыз (деректер жоғалмайды)
const EXTRA_COLUMNS: [string, string][] = [
  ['userId', 'INTEGER'],
  ['category', 'TEXT'],
  ['publishedAt', 'TEXT'],
  ['image', 'TEXT'],
  ['imageData', 'TEXT'],
];

// Кесте дайын болғанда ғана база беріледі; әр операция await readyDb арқылы күтеді.
const readyDb = (async () => {
  const db = await SQLite.openDatabaseAsync('teambuilder_favorites.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favorites (
      owner_id TEXT NOT NULL,
      id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0 CHECK (isRead IN (0, 1)),
      savedAt INTEGER NOT NULL,
      PRIMARY KEY (owner_id, id)
    );
  `);
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(favorites)');
  for (const [name, type] of EXTRA_COLUMNS) {
    if (!cols.some((c) => c.name === name)) {
      await db.execAsync(`ALTER TABLE favorites ADD COLUMN ${name} ${type}`);
    }
  }
  return db;
})();

/** Суретті кішірейтіп жүктеп, base64 етеміз. Болмаса — null (сонда тек сілтеме қалады). */
async function downloadImage(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const small = url.replace(/([?&])w=\d+/, '$1w=600');
    const response = await fetch(small);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size > 400_000) return null; // базаны ауырлатпаймыз
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** CREATE. Бір хабарландыру екі рет сақталмайды: 1 — қосылды, 0 — бұрын сақталған. */
export async function savePost(ownerId: string, post: PostInput) {
  const db = await readyDb;
  const imageData = await downloadImage(post.image);
  const result = await db.runAsync(
    `INSERT INTO favorites (owner_id, id, title, body, savedAt, userId, category, publishedAt, image, imageData)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(owner_id, id) DO NOTHING`,
    ownerId, post.id, post.title, post.body, Date.now(),
    post.userId ?? null, post.category ?? null, post.publishedAt ?? null, post.image ?? null, imageData
  );
  return result.changes;
}

/** READ. fetch шақырмайды — интернетсіз жұмыс істейді. Алдымен оқылмағандар. */
export async function getSavedPosts(ownerId: string) {
  const db = await readyDb;
  return db.getAllAsync<SavedPost>(
    `SELECT id, title, body, isRead, savedAt, userId, category, publishedAt, image, imageData
     FROM favorites
     WHERE owner_id = ?
     ORDER BY isRead ASC, id DESC`,
    ownerId
  );
}

/** READ (бір жазба). Интернетсіз ашу үшін — тек базадан. */
export async function getSavedPost(ownerId: string, id: number) {
  const db = await readyDb;
  return db.getFirstAsync<SavedPost>(
    `SELECT id, title, body, isRead, savedAt, userId, category, publishedAt, image, imageData
     FROM favorites WHERE owner_id = ? AND id = ?`,
    ownerId, id
  );
}

/** Ашқанда «оқылды» деп белгілеу (тек оқылмаған болса). */
export async function markRead(ownerId: string, id: number) {
  const db = await readyDb;
  await db.runAsync('UPDATE favorites SET isRead = 1 WHERE owner_id = ? AND id = ? AND isRead = 0', ownerId, id);
}

/** Жаңалықтар тізімінде қайсысы сақталғанын белгілеу үшін. */
export async function getSavedIds(ownerId: string) {
  const db = await readyDb;
  const rows = await db.getAllAsync<{ id: number }>('SELECT id FROM favorites WHERE owner_id = ?', ownerId);
  return new Set(rows.map((r) => r.id));
}

/** UPDATE. 0 → 1, 1 → 0. Мәтін мен ID өзгермейді. */
export async function toggleRead(ownerId: string, id: number) {
  const db = await readyDb;
  await db.runAsync('UPDATE favorites SET isRead = 1 - isRead WHERE owner_id = ? AND id = ?', ownerId, id);
}

/** DELETE. Тек жергілікті көшірме жойылады, серверде ештеңе өзгермейді. */
export async function removeSaved(ownerId: string, id: number) {
  const db = await readyDb;
  await db.runAsync('DELETE FROM favorites WHERE owner_id = ? AND id = ?', ownerId, id);
}

/** Күрделі тапсырма: мәтін мен суретті серверден жаңарту, isRead сақталады. */
export async function updateText(ownerId: string, post: PostInput) {
  const db = await readyDb;
  const imageData = await downloadImage(post.image);
  const result = await db.runAsync(
    `UPDATE favorites
     SET title = ?, body = ?, userId = ?, category = ?, publishedAt = ?, image = ?,
         imageData = COALESCE(?, imageData)
     WHERE owner_id = ? AND id = ?`,
    post.title, post.body, post.userId ?? null, post.category ?? null, post.publishedAt ?? null,
    post.image ?? null, imageData, ownerId, post.id
  );
  return result.changes;
}
