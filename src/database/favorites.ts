import * as SQLite from 'expo-sqlite';

/*
 * Таңдаулы хабарландырулар — телефондағы SQLite базасында (Зертханалық жұмыс 10).
 * Интернетсіз де оқылады. CRUD: savePost (CREATE), getSavedPosts (READ),
 * toggleRead (UPDATE), removeSaved (DELETE).
 * owner_id — бір телефонда бірнеше аккаунт болса, әрқайсысының өз тізімі болуы үшін.
 */

export type SavedPost = {
  id: number;
  title: string;
  body: string;
  isRead: 0 | 1;
  savedAt: number;
};

export type PostInput = Pick<SavedPost, 'id' | 'title' | 'body'>;

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
  return db;
})();

/** CREATE. Бір хабарландыру екі рет сақталмайды: 1 — қосылды, 0 — бұрын сақталған. */
export async function savePost(ownerId: string, post: PostInput) {
  const db = await readyDb;
  const result = await db.runAsync(
    `INSERT INTO favorites (owner_id, id, title, body, savedAt) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(owner_id, id) DO NOTHING`,
    ownerId, post.id, post.title, post.body, Date.now()
  );
  return result.changes;
}

/** READ. fetch шақырмайды — интернетсіз жұмыс істейді. Алдымен оқылмағандар. */
export async function getSavedPosts(ownerId: string) {
  const db = await readyDb;
  return db.getAllAsync<SavedPost>(
    `SELECT id, title, body, isRead, savedAt
     FROM favorites
     WHERE owner_id = ?
     ORDER BY isRead ASC, id DESC`,
    ownerId
  );
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

/** Күрделі тапсырма: мәтінді серверден жаңарту, isRead сақталады. */
export async function updateText(ownerId: string, post: PostInput) {
  const db = await readyDb;
  const result = await db.runAsync(
    'UPDATE favorites SET title = ?, body = ? WHERE owner_id = ? AND id = ?',
    post.title, post.body, ownerId, post.id
  );
  return result.changes;
}
