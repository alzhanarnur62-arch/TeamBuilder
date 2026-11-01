import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Image, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { t, useLang, roleName } from '../i18n';
import { useIdeas } from '../context/IdeasContext';
import { useStudents } from '../context/ProfileContext';
import { useData, useMyId } from '../context/DataContext';
import { useChats } from '../context/ChatsContext';
import TeamSuggestion from '../components/TeamSuggestion';
import { RootStackParamList } from '../types/navigation';
import type { Role, Student } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Project'>;

const ALL_ROLES: Role[] = ['Frontend', 'Backend', 'Дизайнер', 'Тестілеуші', 'Менеджер'];

const statusColor = {
  pending: colors.accent,
  accepted: colors.success,
  rejected: colors.danger,
};

function Avatar({ student }: { student?: Student }) {
  if (student?.photo) {
    return <Image source={{ uri: student.photo }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarEmpty]}>
      <Text style={styles.avatarLetter}>{(student?.name ?? '?')[0]}</Text>
    </View>
  );
}

export default function ProjectScreen({ route, navigation }: Props) {
  useLang();
  const ME = useMyId();
  const { allProjects, applications, apply, setStatus } = useIdeas();
  const { openGroup } = useChats();
  const students = useStudents();
  const project = allProjects.find((p) => p.id === route.params.projectId)!;

  const { setAppRole } = useData();
  const [role, setRole] = useState<Role | null>(null);
  const [message, setMessage] = useState('');
  // Жетекші қай мүшенің рөлін өзгертіп жатыр (өтінім id)
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const isOwner = project.ownerId === ME;
  const owner = students.find((s) => s.id === project.ownerId);
  const projectApps = applications.filter((a) => a.projectId === project.id);
  const accepted = projectApps.filter((a) => a.status === 'accepted');
  const myApp = projectApps.find((a) => a.studentId === ME);
  const isMember = isOwner || myApp?.status === 'accepted';

  const filledRoles = [...(owner ? [owner.role] : []), ...accepted.map((a) => a.role)];
  const missingRoles = project.neededRoles.filter((r) => !filledRoles.includes(r));
  const membersCount = 1 + accepted.length;

  const sendApplication = () => {
    if (!role) return;
    apply(project.id, role, message.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRole(null);
    setMessage('');
  };

  const decide = (id: string, status: 'accepted' | 'rejected') => {
    setStatus(id, status);
    Haptics.notificationAsync(
      status === 'accepted'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
  };

  const openChat = () => {
    Haptics.selectionAsync();
    const memberIds = [project.ownerId, ...accepted.map((a) => a.studentId)];
    const chatId = openGroup(project.id, project.title, memberIds);
    navigation.navigate('Chat', { chatId });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.text}>{project.description}</Text>
        <Text style={styles.owner}>{t('common.author', { name: owner?.name ?? '' })}</Text>

        <Text style={styles.section}>{t('project.skills')}</Text>
        <View style={styles.chips}>
          {project.neededSkills.map((s) => (
            <View key={s} style={styles.chip}>
              <Text style={styles.chipText}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>
          {t('project.members', { n: membersCount, max: project.teamSize })}
        </Text>
        <View style={styles.box}>
          <View style={styles.memberRow}>
            <Avatar student={owner} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{owner?.name}</Text>
              <Text style={styles.memberRole}>{t('project.leader')}</Text>
            </View>
          </View>
          {accepted.map((a) => {
            const st = students.find((s) => s.id === a.studentId);
            const editing = editingRole === a.id;
            // Басқа мүшелер жабатын рөлдер — қалғандары «керек» деп белгіленеді
            const takenByOthers = [owner?.role, ...accepted.filter((x) => x.id !== a.id).map((x) => x.role)];
            return (
              <View key={a.id}>
                <View style={styles.memberRow}>
                  <Avatar student={st} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{st?.name}</Text>
                    <Text style={styles.memberRole}>{roleName(a.role)}</Text>
                  </View>
                  {isOwner ? (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setEditingRole(editing ? null : a.id);
                      }}
                      style={[styles.roleBtn, editing && styles.roleBtnActive]}
                      hitSlop={8}
                      accessibilityLabel={t('project.changeRole')}
                    >
                      <Ionicons name={editing ? 'close' : 'swap-horizontal'} size={16} color={editing ? '#fff' : colors.primary} />
                      {!editing && <Text style={styles.roleBtnText}>{t('project.changeRole')}</Text>}
                    </Pressable>
                  ) : (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  )}
                </View>
                {editing && (
                  <View style={styles.rolePicker}>
                    <Text style={styles.memberRole}>{t('project.pickRole')}</Text>
                    <View style={[styles.chips, { marginTop: 8 }]}>
                      {ALL_ROLES.map((r) => {
                        const active = a.role === r;
                        const needed = project.neededRoles.includes(r) && !takenByOthers.includes(r);
                        return (
                          <Pressable
                            key={r}
                            onPress={() => {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              if (!active) setAppRole(a.id, r);
                              setEditingRole(null);
                            }}
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {roleName(r)}{needed && !active ? ` · ${t('project.roleNeeded')}` : ''}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          {missingRoles.length > 0 ? (
            <>
              <Text style={styles.missingTitle}>{t('project.missingRoles')}</Text>
              <View style={styles.chips}>
                {missingRoles.map((r) => (
                  <View key={r} style={styles.missingChip}>
                    <Text style={styles.missingText}>{roleName(r)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.full}>{t('project.full')}</Text>
          )}
        </View>

        {isMember && (
          <>
            <Pressable
              style={styles.teamButton}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('Team', { projectId: project.id });
              }}
            >
              <Ionicons name="checkbox" size={20} color="#fff" />
              <Text style={styles.teamButtonText}>{t('project.tasks')}</Text>
            </Pressable>

            <Pressable style={styles.chatButton} onPress={openChat}>
              <Ionicons name="chatbubbles" size={20} color={colors.primary} />
              <Text style={styles.chatButtonText}>{t('project.chat')}</Text>
            </Pressable>
          </>
        )}

        {isOwner && (
          <TeamSuggestion
            project={project}
            students={students}
            allProjects={allProjects}
            applications={applications}
            onOpenStudent={(id) => navigation.navigate('Candidate', { studentId: id })}
          />
        )}

        {isOwner ? (
          <>
            <Text style={styles.section}>{t('project.apps', { n: projectApps.length })}</Text>
            {projectApps.length === 0 && (
              <Text style={styles.text}>
                {t('project.noApps')}
              </Text>
            )}
            {projectApps.map((a) => {
              const st = students.find((s) => s.id === a.studentId);
              return (
                <View key={a.id} style={styles.appCard}>
                  <View style={styles.memberRow}>
                    <Avatar student={st} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{st?.name}</Text>
                      <Text style={styles.memberRole}>{t('common.role', { role: roleName(a.role) })}</Text>
                    </View>
                    <Text style={[styles.status, { color: statusColor[a.status] }]}>
                      {t(`status.${a.status}`)}
                    </Text>
                  </View>
                  {a.message ? <Text style={styles.appMsg}>{a.message}</Text> : null}
                  {a.status === 'pending' && (
                    <View style={styles.row}>
                      <Pressable style={[styles.btn, styles.btnReject]} onPress={() => decide(a.id, 'rejected')}>
                        <Text style={styles.btnRejectText}>{t('project.reject')}</Text>
                      </Pressable>
                      <Pressable style={[styles.btn, styles.btnAccept]} onPress={() => decide(a.id, 'accepted')}>
                        <Text style={styles.btnAcceptText}>{t('project.accept')}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.section}>{t('project.application')}</Text>
            {myApp ? (
              <View style={styles.appCard}>
                <Text style={styles.memberName}>{t('project.yourApp', { role: roleName(myApp.role) })}</Text>
                <Text style={[styles.status, { color: statusColor[myApp.status], marginTop: 6 }]}>
                  {t(`status.${myApp.status}`)}
                </Text>
              </View>
            ) : (
              <View style={styles.appCard}>
                <Text style={styles.memberRole}>{t('project.whichRole')}</Text>
                <View style={[styles.chips, { marginTop: 10 }]}>
                  {project.neededRoles.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setRole(r);
                      }}
                      style={[styles.chip, role === r && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{roleName(r)}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('project.msgPh')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                <Pressable
                  style={[styles.button, !role && { opacity: 0.4 }]}
                  onPress={sendApplication}
                  disabled={!role}
                >
                  <Text style={styles.buttonText}>{t('project.send')}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  roleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  roleBtnActive: { backgroundColor: colors.primary, paddingHorizontal: 8 },
  roleBtnText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  rolePicker: { backgroundColor: colors.background, borderRadius: 14, padding: 12, marginTop: 10 },
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.textMuted, marginTop: 8 },
  owner: { color: colors.accent, fontWeight: '700', marginTop: 8 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 22, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  box: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 14, gap: 12, ...shadow,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  memberName: { fontSize: 16, fontWeight: '800', color: colors.text },
  memberRole: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  missingTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  missingChip: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.danger,
  },
  missingText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  full: { color: colors.success, fontWeight: '800' },
  teamButton: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 16, padding: 16, marginTop: 14,
  },
  teamButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  chatButton: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary, borderRadius: 16, padding: 16, marginTop: 10,
  },
  chatButtonText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  appCard: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 14, marginBottom: 12, gap: 10, ...shadow,
  },
  appMsg: { fontSize: 14, color: colors.textMuted },
  status: { fontSize: 13, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, alignItems: 'center', borderRadius: 12, padding: 12 },
  btnAccept: { backgroundColor: colors.primary },
  btnAcceptText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnReject: { borderWidth: 1, borderColor: colors.danger },
  btnRejectText: { color: colors.danger, fontSize: 15, fontWeight: '800' },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
    padding: 14, fontSize: 15, color: colors.text, minHeight: 70, textAlignVertical: 'top',
  },
  button: { backgroundColor: colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  buttonGhost: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginTop: 22,
  },
  buttonGhostText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  warn: { color: colors.danger, fontWeight: '700', marginTop: 6 },
  summaryBox: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 14, marginTop: 6, gap: 6, ...shadow,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  summaryLine: { fontSize: 14, color: colors.textMuted },
});