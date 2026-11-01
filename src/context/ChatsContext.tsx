import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useData } from './DataContext';
import { t } from '../i18n';

/*
 * Чаттар базадағы хабарламалардан құралады:
 *  - 'p:<projectId>' — жоба чаты (жетекші + қабылданған мүшелер);
 *  - 'd:<id1>|<id2>' — жеке чат.
 * Оқылмағандар саны телефонда сақталатын «соңғы оқылған уақыт» бойынша есептеледі.
 */

export type ChatMessage = {
  id: string;
  authorId: string;
  text: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  kind: 'direct' | 'group';
  title: string;
  memberIds: string[];
  projectId?: string;
  messages: ChatMessage[];
  unread: number;
};

const MIN = 60 * 1000;

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatListTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(ts);
  const y = new Date(now.getTime() - 24 * 60 * MIN);
  if (d.toDateString() === y.toDateString()) return t('common.yesterday');
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const directChatId = (a: string, b: string) => `d:${[a, b].sort().join('|')}`;

type ChatsContextType = {
  chats: Chat[];
  totalUnread: number;
  sendMessage: (chatId: string, text: string) => void;
  markRead: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  openDirect: (studentId: string) => string;
  openGroup: (projectId: string, title: string, memberIds: string[]) => string;
};

const ChatsContext = createContext<ChatsContextType | null>(null);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const { myId, profiles, projects, applications, messages, sendMessage } = useData();
  const [lastRead, setLastRead] = useState<Record<string, number>>({});
  const [opened, setOpened] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const key = `teambuilder_read_${myId}`;

  useEffect(() => {
    if (!myId) return;
    AsyncStorage.getItem(key)
      .then((raw) => raw && setLastRead(JSON.parse(raw)))
      .catch(() => {});
  }, [myId, key]);

  const markRead = (chatId: string) => {
    setLastRead((prev) => {
      const next = { ...prev, [chatId]: Date.now() };
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  // Чаттан шыққанда — ішінде отырғанда келген хабарлар да оқылды деп есептеледі.
  const setActiveChat = (chatId: string | null) => {
    if (chatId === null && active) markRead(active);
    setActive(chatId);
  };

  const chats = useMemo(() => {
    if (!myId) return [];
    const nameOf = (id: string) => profiles.find((p) => p.id === id)?.name ?? t('common.student');
    const byChat = new Map<string, ChatMessage[]>();
    for (const m of messages) {
      const list = byChat.get(m.chatId) ?? [];
      list.push({ id: m.id, authorId: m.authorId, text: m.text, createdAt: m.createdAt });
      byChat.set(m.chatId, list);
    }

    const unread = (id: string, list: ChatMessage[]) =>
      id === active ? 0 : list.filter((m) => m.authorId !== myId && m.createdAt > (lastRead[id] ?? 0)).length;

    const out: Chat[] = [];

    // Мен мүше болған жобалардың чаттары
    for (const p of projects) {
      const accepted = applications
        .filter((a) => a.projectId === p.id && a.status === 'accepted')
        .map((a) => a.studentId);
      const members = [p.ownerId, ...accepted];
      if (!members.includes(myId)) continue;
      const id = `p:${p.id}`;
      const list = byChat.get(id) ?? [];
      out.push({ id, kind: 'group', title: p.title, memberIds: members, projectId: p.id, messages: list, unread: unread(id, list) });
    }

    // Жеке чаттар: хабары барлар + жаңа ашылғандар
    const directIds = new Set<string>([...opened, ...[...byChat.keys()].filter((k) => k.startsWith('d:'))]);
    for (const id of directIds) {
      const members = id.slice(2).split('|');
      if (!members.includes(myId)) continue;
      const other = members.find((x) => x !== myId) ?? myId;
      const list = byChat.get(id) ?? [];
      out.push({ id, kind: 'direct', title: nameOf(other), memberIds: members, messages: list, unread: unread(id, list) });
    }
    return out;
  }, [myId, profiles, projects, applications, messages, opened, lastRead, active]);

  const totalUnread = useMemo(() => chats.reduce((sum, c) => sum + c.unread, 0), [chats]);

  const openDirect = (studentId: string) => {
    const id = directChatId(myId, studentId);
    setOpened((prev) => (prev.includes(id) ? prev : [...prev, id]));
    return id;
  };

  const openGroup = (projectId: string) => `p:${projectId}`;

  return (
    <ChatsContext.Provider
      value={{ chats, totalUnread, sendMessage, markRead, setActiveChat, openDirect, openGroup }}
    >
      {children}
    </ChatsContext.Provider>
  );
}

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error('useChats must be used inside ChatsProvider');
  return ctx;
}
