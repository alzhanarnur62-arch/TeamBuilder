export type NewsCategory = 'events' | 'study' | 'career' | 'sport' | 'campus' | 'clubs';

/** REST API жауабындағы бір хабарландыру. */
export type Announcement = {
  userId: number; // дереккөз (бөлім) нөмірі
  id: number;
  title: string;
  body: string;
  /** Жаңалықтың суреті */
  image?: string | null;
  category?: NewsCategory;
  /** Жарияланған уақыты (ISO) */
  publishedAt?: string;
};
