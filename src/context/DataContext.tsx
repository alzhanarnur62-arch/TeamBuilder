import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Alert, AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { t } from '../i18n';
import type { Key } from '../i18n/dict';
import type { Project, Role, Student } from '../types';

/*
 * Барлық ортақ деректер Supabase-те: профильдер, жобалар, өтінімдер,
 * тапсырмалар, хабарламалар. Бұл контекст оларды жүктейді, өзгерістерді
 * тірідей (Realtime) тыңдайды және әрекеттерді базаға жазады.
 * Әрекеттер «оптимистік»: экран бірден жаңарады, қате болса — қайта жүктейміз.
 */

export type AppStatus = 'pending' | 'accepted' | 'rejected';
export type Application = {
  id: string;
  projectId: string;
  studentId: string;
  role: Role;
  message: string;
  status: AppStatus;
};

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Task = {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  points: number;
};

export type Rating = {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  score: number;
  comment: string;
};

export type DbMessage = {
  id: string;
  chatId: string;
  authorId: string;
  text: string;
  createdAt: number;
};

/** Профильдің базадағы өрістері (фото мен жетістіктер телефонда сақталады). */
export type ProfileRow = {
  id: string;
  email: string | null;
  name: string;
  grp: string;
  role: Role;
  skills: string[];
  interests: string[];
  free_slots: string[];
  age: string;
  city: string;
  about: string;
  photo: string | null;
  is_demo: boolean;
  i18n?: Record<string, Record<string, string>>;
};

export type NewIdea = Omit<Project, 'id' | 'ownerId'>;

type DataContextType = {
  ready: boolean;
  myId: string;
  profiles: ProfileRow[];
  projects: Project[];
  applications: Application[];
  tasks: Task[];
  messages: DbMessage[];
  ratings: Rating[];
  reload: () => Promise<void>;
  saveMyProfile: (patch: Partial<ProfileRow>) => Promise<boolean>;
  addProject: (idea: NewIdea) => string;
  apply: (projectId: string, role: Role, message: string) => void;
  setAppStatus: (id: string, status: AppStatus) => void;
  setAppRole: (id: string, role: Role) => void;
  rate: (projectId: string, toId: string, score: number, comment: string) => void;
  addTask: (projectId: string, title: string, assigneeId: string, points: number) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;
  sendMessage: (chatId: string, text: string) => void;
};

const DataContext = createContext<DataContextType | null>(null);

export const newId = (prefix: string) =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- Базадағы жолдарды қосымша типтеріне айналдыру ---------- */

const toProject = (r: any): Project => ({
  id: r.id,
  ownerId: r.owner_id,
  title: r.title,
  description: r.description ?? '',
  neededRoles: r.needed_roles ?? [],
  neededSkills: r.needed_skills ?? [],
  interests: r.interests ?? [],
  slots: r.slots ?? [],
  teamSize: r.team_size ?? 4,
  i18n: r.i18n ?? {},
});
const toApp = (r: any): Application => ({
  id: r.id,
  projectId: r.project_id,
  studentId: r.student_id,
  role: r.role,
  message: r.message ?? '',
  status: r.status,
});
const toTask = (r: any): Task => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  assigneeId: r.assignee_id,
  status: r.status,
  points: r.points,
});
const toRating = (r: any): Rating => ({
  id: r.id,
  projectId: r.project_id,
  fromId: r.from_id,
  toId: r.to_id,
  score: r.score,
  comment: r.comment ?? '',
});
const toMsg = (r: any): DbMessage => ({
  id: r.id,
  chatId: r.chat_id,
  authorId: r.author_id,
  text: r.text,
  createdAt: Date.parse(r.created_at),
});

export function rowToStudent(p: ProfileRow): Student {
  return {
    id: p.id,
    name: p.name,
    group: p.grp,
    role: p.role,
    skills: p.skills ?? [],
    interests: p.interests ?? [],
    freeSlots: p.free_slots ?? [],
    photo: p.photo ?? undefined,
    age: p.age || undefined,
    city: p.city || undefined,
    about: p.about || undefined,
    i18n: p.i18n ?? {},
  };
}

function oops(what: Key, message?: string) {
  Alert.alert(t('common.error'), `${t('db.failed', { what: t(what) })}${message ? `\n\n${message}` : ''}\n\n${t('db.retry')}`);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const myId = session?.user.id ?? '';

  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    if (data) setProfiles(data as ProfileRow[]);
  }, []);
  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data.map(toProject));
  }, []);
  const loadApps = useCallback(async () => {
    const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (data) setApplications(data.map(toApp));
  }, []);
  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at');
    if (data) setTasks(data.map(toTask));
  }, []);
  const loadRatings = useCallback(async () => {
    const { data } = await supabase.from('ratings').select('*');
    if (data) setRatings(data.map(toRating));
  }, []);
  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at').limit(2000);
    if (data) setMessages(data.map(toMsg));
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([loadProfiles(), loadProjects(), loadApps(), loadTasks(), loadMessages(), loadRatings()]);
  }, [loadProfiles, loadProjects, loadApps, loadTasks, loadMessages, loadRatings]);

  // Кіргенде бәрін жүктейміз. Аккаунт ауысқанда бұл провайдер толық қайта құрылады (App-тағы key).
  useEffect(() => {
    if (!myId) return;
    let alive = true;
    // Жүктеу асинхронды: күй тек жауап келгеннен кейін өзгереді.
    Promise.resolve()
      .then(reload)
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [myId, reload]);

  // Тірі жаңарту: басқа телефоннан келген өзгерістер бірден көрінеді.
  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel('teambuilder-db')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = toMsg(payload.new);
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => loadProjects())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        loadApps();
        // Жаңа мүше қосылса — оған тапсырмалар мен чат көріне бастайды.
        loadTasks();
        loadMessages();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, () => loadRatings())
      .subscribe();

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') reload();
    });
    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [myId, reload, loadProjects, loadApps, loadTasks, loadMessages, loadRatings]);

  /* ---------- Әрекеттер ---------- */

  const saveMyProfile = async (patch: Partial<ProfileRow>) => {
    if (!myId) return false;
    const current = profiles.find((p) => p.id === myId);
    const row = { ...(current ?? {}), ...patch, id: myId, email: session?.user.email ?? null };
    setProfiles((prev) =>
      prev.some((p) => p.id === myId)
        ? prev.map((p) => (p.id === myId ? (row as ProfileRow) : p))
        : [...prev, row as ProfileRow]
    );
    const { is_demo, ...toSave } = row as ProfileRow;
    const { error } = await supabase.from('profiles').upsert(toSave);
    if (error) {
      oops('db.saveProfile', error.message);
      loadProfiles();
      return false;
    }
    return true;
  };

  const addProject = (idea: NewIdea) => {
    const id = newId('p');
    const project: Project = { id, ownerId: myId, ...idea };
    setProjects((prev) => [project, ...prev]);
    supabase
      .from('projects')
      .insert({
        id,
        owner_id: myId,
        title: idea.title,
        description: idea.description,
        needed_roles: idea.neededRoles,
        needed_skills: idea.neededSkills,
        interests: idea.interests ?? [],
        slots: idea.slots,
        team_size: idea.teamSize,
      })
      .then(({ error }) => {
        if (error) {
          oops('db.publish', error.message);
          loadProjects();
        }
      });
    return id;
  };

  const apply = (projectId: string, role: Role, message: string) => {
    const app: Application = { id: newId('a'), projectId, studentId: myId, role, message, status: 'pending' };
    setApplications((prev) => [app, ...prev]);
    supabase
      .from('applications')
      .insert({ id: app.id, project_id: projectId, student_id: myId, role, message, status: 'pending' })
      .then(({ error }) => {
        if (error) {
          oops('db.apply', error.message);
          loadApps();
        }
      });
  };

  const setAppStatus = (id: string, status: AppStatus) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          oops('db.decide', error.message);
          loadApps();
        }
      });
  };

  const addTask = (projectId: string, title: string, assigneeId: string, points: number) => {
    const task: Task = { id: newId('t'), projectId, title, assigneeId, status: 'todo', points };
    setTasks((prev) => [...prev, task]);
    supabase
      .from('tasks')
      .insert({ id: task.id, project_id: projectId, title, assignee_id: assigneeId, status: 'todo', points })
      .then(({ error }) => {
        if (error) {
          oops('db.addTask', error.message);
          loadTasks();
        }
      });
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    supabase
      .from('tasks')
      .update({ status })
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          oops('db.updateTask', error.message);
          loadTasks();
        }
      });
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          oops('db.deleteTask', error.message);
          loadTasks();
        }
      });
  };

  const setAppRole = (id: string, role: Role) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, role } : a)));
    supabase
      .from('applications')
      .update({ role })
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          oops('db.setRole', error.message);
          loadApps();
        }
      });
  };

  const rate = (projectId: string, toId: string, score: number, comment: string) => {
    const id = `${projectId}:${myId}:${toId}`;
    const r: Rating = { id, projectId, fromId: myId, toId, score, comment };
    setRatings((prev) => [...prev.filter((x) => x.id !== id), r]);
    supabase
      .from('ratings')
      .upsert({ id, project_id: projectId, from_id: myId, to_id: toId, score, comment })
      .then(({ error }) => {
        if (error) {
          oops('db.rate', error.message);
          loadRatings();
        }
      });
  };

  const sendMessage = (chatId: string, text: string) => {
    const value = text.trim();
    if (!value || !myId) return;
    const m: DbMessage = { id: newId('m'), chatId, authorId: myId, text: value, createdAt: Date.now() };
    setMessages((prev) => [...prev, m]);
    supabase
      .from('messages')
      .insert({ id: m.id, chat_id: chatId, author_id: myId, text: value })
      .then(({ error }) => {
        if (error) {
          oops('db.send', error.message);
          setMessages((prev) => prev.filter((x) => x.id !== m.id));
        }
      });
  };

  const value = useMemo(
    () => ({
      ready, myId, profiles, projects, applications, tasks, messages, ratings, reload,
      saveMyProfile, addProject, apply, setAppStatus, setAppRole, rate, addTask, setTaskStatus, removeTask, sendMessage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, myId, profiles, projects, applications, tasks, messages, ratings, reload]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}

/** Қазір кірген пайдаланушының id-і (бұрын барлық жерде 's1' болатын). */
export function useMyId() {
  return useData().myId;
}
