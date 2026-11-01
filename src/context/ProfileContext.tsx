import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadAvatar } from '../lib/avatar';
import { t } from '../i18n';
import { useData, rowToStudent, type ProfileRow } from './DataContext';
import type { Role, Student } from '../types';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  date: string;
};

export type Profile = {
  email: string;
  name: string;
  age: string;
  city: string;
  about: string;
  photo: string | null;
  role: Role;
  skills: string[];
  interests: string[];
  freeSlots: string[];
  achievements: Achievement[];
};

type ProfileContextType = {
  profile: Profile;
  /** Базада менің профилім бар ма (жоқ болса — толтыру экраны) */
  hasProfile: boolean;
  loaded: boolean;
  /** Фото серверге жүктеліп жатыр */
  uploading: boolean;
  /** Галереядан таңдалған фотоны бәріне көрінетіндей етіп сақтайды */
  setPhoto: (localUri: string) => Promise<void>;
  update: (patch: Partial<Profile>) => void;
  addAchievement: (a: Omit<Achievement, 'id'>) => void;
  removeAchievement: (id: string) => void;
};

/** Телефонда ғана сақталатындар: фото (жергілікті файл) және жетістіктер. */
type LocalExtras = { photo: string | null; achievements: Achievement[] };
const localKey = (id: string) => `teambuilder_local_${id}`;

const empty: Profile = {
  email: '', name: '', age: '', city: '', about: '', photo: null,
  role: 'Frontend', skills: [], interests: [], freeSlots: [], achievements: [],
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { ready, myId, profiles, saveMyProfile } = useData();
  const [extras, setExtras] = useState<LocalExtras>({ photo: null, achievements: [] });
  const [extrasLoaded, setExtrasLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!myId) return;
    AsyncStorage.getItem(localKey(myId))
      .then((raw) => {
        if (raw) {
          try {
            setExtras({ photo: null, achievements: [], ...JSON.parse(raw) });
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setExtrasLoaded(true));
  }, [myId]);

  const row = profiles.find((p) => p.id === myId);

  const profile: Profile = row
    ? {
        email: row.email ?? '',
        name: row.name,
        age: row.age,
        city: row.city,
        about: row.about,
        photo: extras.photo ?? row.photo,
        role: row.role,
        skills: row.skills,
        interests: row.interests,
        freeSlots: row.free_slots,
        achievements: extras.achievements,
      }
    : { ...empty, photo: extras.photo, achievements: extras.achievements };

  const saveExtras = (next: LocalExtras) => {
    setExtras(next);
    if (myId) AsyncStorage.setItem(localKey(myId), JSON.stringify(next)).catch(() => {});
  };

  const update = (patch: Partial<Profile>) => {
    if ('photo' in patch || 'achievements' in patch) {
      saveExtras({
        photo: patch.photo !== undefined ? patch.photo : extras.photo,
        achievements: patch.achievements ?? extras.achievements,
      });
    }
    const db: Partial<ProfileRow> = {};
    if (patch.name !== undefined) db.name = patch.name;
    if (patch.age !== undefined) db.age = patch.age;
    if (patch.city !== undefined) db.city = patch.city;
    if (patch.about !== undefined) db.about = patch.about;
    if (patch.role !== undefined) db.role = patch.role;
    if (patch.skills !== undefined) db.skills = patch.skills;
    if (patch.interests !== undefined) db.interests = patch.interests;
    if (patch.freeSlots !== undefined) db.free_slots = patch.freeSlots;
    if (Object.keys(db).length > 0) {
      // Жаңа профильде міндетті өрістерді толтырамыз.
      saveMyProfile(row ? db : { grp: '', age: '', city: '', about: '', photo: null, ...db } as Partial<ProfileRow>);
    }
  };

  const setPhoto = async (localUri: string) => {
    if (!myId) return;
    // Бірден көрсетеміз, сосын фонда серверге жүктейміз.
    const keep = extras.achievements;
    saveExtras({ photo: localUri, achievements: keep });
    setUploading(true);
    try {
      const url = await uploadAvatar(myId, localUri);
      const ok = await saveMyProfile({ photo: url });
      // Енді базадағы сілтеме қолданылады — басқа телефондарда да осы фото.
      if (ok) saveExtras({ photo: null, achievements: keep });
    } catch (e) {
      Alert.alert(
        t('common.error'),
        [t('db.failed', { what: t('db.photo') }), e instanceof Error ? e.message : '', t('db.retry')]
          .filter(Boolean)
          .join('\n\n')
      );
    } finally {
      setUploading(false);
    }
  };

  const addAchievement = (a: Omit<Achievement, 'id'>) =>
    saveExtras({ ...extras, achievements: [{ id: String(Date.now()), ...a }, ...extras.achievements] });

  const removeAchievement = (id: string) =>
    saveExtras({ ...extras, achievements: extras.achievements.filter((x) => x.id !== id) });

  return (
    <ProfileContext.Provider
      value={{
        profile,
        hasProfile: !!row,
        loaded: ready && extrasLoaded,
        uploading,
        setPhoto,
        update,
        addAchievement,
        removeAchievement,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}

/** Барлық студенттер базадан; менің фотом телефондағы нұсқадан алынады. */
export function useStudents(): Student[] {
  const { profiles, myId } = useData();
  const { profile } = useProfile();
  return useMemo(
    () =>
      profiles.map((p) => {
        const s = rowToStudent(p);
        return p.id === myId && profile.photo ? { ...s, photo: profile.photo } : s;
      }),
    [profiles, myId, profile.photo]
  );
}
