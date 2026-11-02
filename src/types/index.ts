import type { I18nMap } from '../i18n';

export type Role = 'Frontend' | 'Backend' | 'Дизайнер' | 'Тестілеуші' | 'Менеджер';

export type Student = {
  id: string;
  name: string;
  group: string;
  role: Role;
  skills: string[];
  interests: string[];
  freeSlots: string[];
  photo?: string;
  age?: string;
  city?: string;
  about?: string;
  /** Аудармалар: about, city */
  i18n?: I18nMap;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  neededRoles: Role[];
  neededSkills: string[];
  interests?: string[];
  slots: string[];
  teamSize: number;
  /** Аудармалар: description */
  i18n?: I18nMap;
};

export type Match = {
  student: Student;
  score: number;
  reasons: string[];
};
