import { useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { t as tr, useLang } from '../i18n';
import { useMyId } from '../context/DataContext';
import { useIdeas } from '../context/IdeasContext';
import { useProfile, useStudents } from '../context/ProfileContext';
import { useTeam } from '../context/TeamContext';
import type { TaskStatus } from '../context/TeamContext';
import { RootStackParamList } from '../types/navigation';
import ContributionTab from '../components/ContributionTab';
import type { Student } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Team'>;
type Tab = 'chat' | 'tasks' | 'share';


const statusLabel = (st: TaskStatus) => tr(`team.${st}`);
const statusColor: Record<TaskStatus, string> = {
  todo: colors.textMuted,
  doing: colors.accent,
  done: colors.success,
};
const NEXT_KEY = { todo: 'team.start', doing: 'team.finish', done: 'team.reopen' } as const;
const nextLabel = (st: TaskStatus) => tr(NEXT_KEY[st]);
const POINTS = [1, 2, 3, 5];

function Avatar({ student, size = 36 }: { student?: Student; size?: number }) {
  const ME = useMyId();
  const { profile } = useProfile();
  const photo = student?.id === ME ? profile.photo || student.photo : student?.photo;
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (photo) {
    return <Image source={{ uri: photo }} style={box} />;
  }
  return (
    <View style={[box, styles.avatarEmpty]}>
      <Text style={styles.avatarLetter}>{(student?.name ?? '?')[0]}</Text>
    </View>
  );
}

export default function TeamScreen({ route }: Props) {
  useLang();
  const ME = useMyId();
  const students = useStudents();
  const { allProjects, applications } = useIdeas();
  const { messages, tasks, sendMessage, addTask, moveTask, removeTask } = useTeam();

  const project = allProjects.find((p) => p.id === route.params.projectId);

  const [tab, setTab] = useState<Tab>('chat');
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);

  const [adding, setAdding] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tAssignee, setTAssignee] = useState(ME);
  const [tPoints, setTPoints] = useState(3);

  if (!project) return null;

  const ids = [
    project.ownerId,
    ...applications
      .filter((a) => a.projectId === project.id && a.status === 'accepted')
      .map((a) => a.studentId),
  ];
  const members = Array.from(new Set(ids))
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is Student => !!s);

  // если выбранный исполнитель не входит в команду, берём первого участника
  const assigneeId = members.some((m) => m.id === tAssignee) ? tAssignee : members[0]?.id;

  const projectMessages = messages.filter((m) => m.projectId === project.id);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    sendMessage(project.id, value);
    setText('');
    Haptics.selectionAsync();
  };

  const saveTask = () => {
    if (!tTitle.trim() || !assigneeId) return;
    addTask(project.id, tTitle.trim(), assigneeId, tPoints);
    setTTitle('');
    setAdding(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmRemove = (id: string) => {
    Alert.alert(tr('common.delete'), tr('team.deleteTask'), [
      { text: tr('common.no'), style: 'cancel' },
      { text: tr('common.yes'), style: 'destructive', onPress: () => removeTask(id) },
    ]);
  };


  const tabs: { key: Tab; label: string }[] = [
    { key: 'chat', label: tr('team.tabChat') },
    { key: 'tasks', label: tr('team.tabTasks') },
    { key: 'share', label: tr('team.tabShare') },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.head}>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.sub}>{tr('team.members', { names: members.map((m) => m.name).join(', ') })}</Text>
        <View style={styles.segment}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.segBtn, tab === t.key && styles.segActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.segText, tab === t.key && styles.segTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'chat' && (
        <>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {projectMessages.length === 0 && (
              <Text style={styles.muted}>{tr('common.noMessages')}</Text>
            )}
            {projectMessages.map((m) => {
              const mine = m.authorId === ME;
              const author = students.find((s) => s.id === m.authorId);
              return (
                <View key={m.id} style={[styles.msgRow, mine && { justifyContent: 'flex-end' }]}>
                  {!mine && <Avatar student={author} size={32} />}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                    {!mine && <Text style={styles.msgAuthor}>{author?.name}</Text>}
                    <Text style={styles.msgText}>{m.text}</Text>
                    <Text style={styles.msgTime}>{m.time}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              value={text}
              onChangeText={setText}
              placeholder={tr('common.writeMessage')}
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable style={styles.sendBtn} onPress={send}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        </>
      )}

      {tab === 'tasks' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.addBtn} onPress={() => setAdding(!adding)}>
            <Ionicons name={adding ? 'close-circle' : 'add-circle'} size={22} color={colors.primary} />
            <Text style={styles.addText}>{adding ? tr('common.close') : tr('team.newTask')}</Text>
          </Pressable>

          {adding && (
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={tTitle}
                onChangeText={setTTitle}
                placeholder={tr('team.taskTitle')}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>{tr('team.assignee')}</Text>
              <View style={styles.chips}>
                {members.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setTAssignee(m.id)}
                    style={[styles.chip, assigneeId === m.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, assigneeId === m.id && styles.chipTextActive]}>
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>{tr('team.points')}</Text>
              <View style={styles.chips}>
                {POINTS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setTPoints(p)}
                    style={[styles.chip, tPoints === p && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, tPoints === p && styles.chipTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.button} onPress={saveTask}>
                <Text style={styles.buttonText}>{tr('common.add')}</Text>
              </Pressable>
            </View>
          )}

          {(['todo', 'doing', 'done'] as TaskStatus[]).map((status) => {
            const list = projectTasks.filter((t) => t.status === status);
            return (
              <View key={status}>
                <View style={styles.colHead}>
                  <View style={[styles.dot, { backgroundColor: statusColor[status] }]} />
                  <Text style={styles.colTitle}>{statusLabel(status)}</Text>
                  <Text style={styles.colCount}>{list.length}</Text>
                </View>
                {list.length === 0 && <Text style={styles.muted}>{tr('team.empty')}</Text>}
                {list.map((t) => {
                  const st = students.find((s) => s.id === t.assigneeId);
                  return (
                    <View key={t.id} style={styles.card}>
                      <View style={styles.taskTop}>
                        <Text style={styles.taskTitle}>{t.title}</Text>
                        <Pressable onPress={() => confirmRemove(t.id)} hitSlop={10}>
                          <Ionicons name="trash-outline" size={20} color={colors.danger} />
                        </Pressable>
                      </View>
                      <View style={styles.taskBottom}>
                        <Avatar student={st} size={28} />
                        <Text style={styles.taskWho}>{st?.name}</Text>
                        <View style={styles.pointsChip}>
                          <Text style={styles.pointsText}>{tr('team.pts', { n: t.points })}</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <Pressable
                          style={[styles.moveBtn, { borderColor: statusColor[status] }]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            moveTask(t.id);
                          }}
                        >
                          <Text style={[styles.moveText, { color: statusColor[status] }]}>
                            {nextLabel(status)}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}

      {tab === 'share' && <ContributionTab project={project} members={members} tasks={projectTasks} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { padding: 16, paddingBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  segment: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, marginTop: 14, ...shadow,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11 },
  segActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  segTextActive: { color: '#fff' },
  muted: { fontSize: 14, color: colors.textMuted },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 15, fontWeight: '800' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleOther: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6,
  },
  msgAuthor: { color: colors.accent, fontSize: 12, fontWeight: '800', marginBottom: 2 },
  msgText: { color: colors.text, fontSize: 15 },
  msgTime: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
  },
  chatInput: {
    flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: colors.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  addBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginBottom: 14,
  },
  addText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 14, marginBottom: 10, gap: 10, ...shadow,
  },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, fontSize: 16, color: colors.text,
  },
  label: { fontSize: 14, fontWeight: '800', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  button: { backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  colHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  colTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  colCount: { fontSize: 14, color: colors.textMuted, fontWeight: '700' },
  taskTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  taskBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskWho: { fontSize: 14, color: colors.textMuted, fontWeight: '700' },
  pointsChip: { backgroundColor: colors.accentSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pointsText: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  moveBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  moveText: { fontSize: 13, fontWeight: '800' },

  rank: { width: 20, fontSize: 18, fontWeight: '800', color: colors.textMuted },
  percent: { fontSize: 22, fontWeight: '800', color: colors.primary },
  barBg: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});