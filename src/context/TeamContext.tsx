import { useMemo } from 'react';
import { useData, type TaskStatus } from './DataContext';

// Деректер енді Supabase-те (DataContext). Бұл файл экрандар үшін ыңғайлы қабық.
export type { Task, TaskStatus } from './DataContext';

export type Message = {
  id: string;
  projectId: string;
  authorId: string;
  text: string;
  time: string;
};

const NEXT: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' };

const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function useTeam() {
  const { messages: all, tasks, sendMessage: send, addTask, setTaskStatus, removeTask } = useData();

  const messages: Message[] = useMemo(
    () =>
      all
        .filter((m) => m.chatId.startsWith('p:'))
        .map((m) => ({
          id: m.id,
          projectId: m.chatId.slice(2),
          authorId: m.authorId,
          text: m.text,
          time: hhmm(m.createdAt),
        })),
    [all]
  );

  return {
    messages,
    tasks,
    sendMessage: (projectId: string, text: string) => send(`p:${projectId}`, text),
    addTask,
    moveTask: (id: string) => {
      const t = tasks.find((x) => x.id === id);
      if (t) setTaskStatus(id, NEXT[t.status]);
    },
    removeTask,
  };
}
