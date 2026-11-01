import { useLayoutEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, StyleSheet, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang, roleName, slotName } from '../i18n';
import { useMyId } from '../context/DataContext';
import { useIdeas } from '../context/IdeasContext';
import { useProfile, useStudents } from '../context/ProfileContext';
import { useChats } from '../context/ChatsContext';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Candidate'>;


export default function CandidateScreen({ route, navigation }: Props) {
  useLang();
  const ME = useMyId();
  const students = useStudents();
  const { studentId } = route.params;
  const { allProjects } = useIdeas();
  const { profile } = useProfile();
  const { openDirect, sendMessage } = useChats();
  const insets = useSafeAreaInsets();

  const base = students.find((s) => s.id === studentId);
  const [failed, setFailed] = useState(false);
  const [picking, setPicking] = useState(false);

  useLayoutEffect(() => {
    if (base) navigation.setOptions({ title: base.name });
  }, [navigation, base?.name]);

  if (!base) return null;

  const isMe = base.id === ME;
  const student = isMe
    ? {
        ...base,
        photo: profile.photo || base.photo,
        age: profile.age || base.age,
        city: profile.city || base.city,
        about: profile.about || base.about,
      }
    : base;

  const info = [student.age ? t('common.age', { n: student.age }) : '', student.city].filter(Boolean).join(' · ');

  const matches = allProjects
    .filter((p) => p.ownerId !== student.id)
    .map((p) => {
      const needed = p.neededSkills.map((x) => String(x).toLowerCase());
      const have = student.skills.filter((sk) => needed.includes(String(sk).toLowerCase()));
      const roleOk = p.neededRoles.map((r) => String(r)).includes(String(student.role));
      const skillPart = needed.length > 0 ? have.length / needed.length : 0;
      const pct = Math.round((roleOk ? 50 : 0) + skillPart * 50);

      const parts: string[] = [];
      if (roleOk) parts.push(t('cand.roleFits', { role: roleName(student.role) }));
      else parts.push(t('cand.roleNo', { role: roleName(student.role) }));
      if (have.length > 0) parts.push(t('cand.skills', { list: have.join(', ') }));
      else parts.push(t('cand.noSkills'));

      return { project: p, pct, reason: parts.join(' · ') };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const myProjects = allProjects.filter((p) => p.ownerId === ME);

  const message = () => {
    Haptics.selectionAsync();
    const chatId = openDirect(student.id);
    navigation.navigate('Chat', { chatId });
  };

  const startInvite = () => {
    Haptics.selectionAsync();
    if (myProjects.length === 0) {
      Alert.alert(t('cand.noProject'), t('cand.noProjectText'));
      return;
    }
    setPicking(!picking);
  };

  const invite = (projectId: string) => {
    const project = allProjects.find((p) => p.id === projectId);
    if (!project) return;
    const chatId = openDirect(student.id);
    sendMessage(
      chatId,
      t('cand.inviteMsg', { project: project.title, role: roleName(student.role) })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPicking(false);
    navigation.navigate('Chat', { chatId });
  };

  const pctColor = (pct: number) =>
    pct >= 70 ? colors.success : pct >= 40 ? colors.accent : colors.textMuted;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {student.photo && !failed ? (
            <Image
              source={{ uri: student.photo }}
              style={styles.avatar}
              onError={() => setFailed(true)}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty]}>
              <Text style={styles.avatarLetter}>{student.name[0]}</Text>
            </View>
          )}
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.role}>{roleName(student.role)}</Text>
          {info ? <Text style={styles.info}>{info}</Text> : null}
        </View>

        {student.about ? (
          <>
            <Text style={styles.section}>{t('cand.about')}</Text>
            <View style={styles.box}>
              <Text style={styles.about}>{student.about}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.section}>{t('cand.skillsTitle')}</Text>
        <View style={styles.chips}>
          {student.skills.map((sk) => (
            <View key={sk} style={styles.chip}>
              <Text style={styles.chipText}>{sk}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>{t('cand.slots')}</Text>
        <View style={styles.box}>
          <View style={styles.slotsRow}>
            <Ionicons name="time-outline" size={18} color={colors.textMuted} />
            <Text style={styles.about}>{student.freeSlots.map(slotName).join(' · ')}</Text>
          </View>
        </View>

        {matches.length > 0 && (
          <>
            <Text style={styles.section}>{t('cand.fit')}</Text>
            {matches.map((m) => (
              <Pressable
                key={m.project.id}
                style={styles.matchCard}
                onPress={() => navigation.navigate('Project', { projectId: m.project.id })}
              >
                <View style={styles.matchTop}>
                  <Text style={styles.matchTitle} numberOfLines={1}>
                    {m.project.title}
                  </Text>
                  <Text style={[styles.pct, { color: pctColor(m.pct) }]}>{m.pct}%</Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${m.pct}%`, backgroundColor: pctColor(m.pct) },
                    ]}
                  />
                </View>
                <Text style={styles.reason}>{m.reason}</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {!isMe && (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {picking && (
            <View style={styles.pickBox}>
              <Text style={styles.pickTitle}>{t('cand.which')}</Text>
              {myProjects.map((p) => (
                <Pressable key={p.id} style={styles.pickItem} onPress={() => invite(p.id)}>
                  <Ionicons name="rocket" size={18} color={colors.primary} />
                  <Text style={styles.pickText} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.actions}>
            <Pressable style={[styles.actBtn, styles.actGhost]} onPress={message}>
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
              <Text style={styles.actGhostText}>{t('common.message')}</Text>
            </Pressable>
            <Pressable style={[styles.actBtn, styles.actMain]} onPress={startInvite}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.actMainText}>{t('cand.invite')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6 },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 46, fontWeight: '800' },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 8 },
  role: { fontSize: 16, fontWeight: '800', color: colors.accent },
  info: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 10 },
  box: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 14, ...shadow,
  },
  about: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  slotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchCard: {
    backgroundColor: colors.card, borderRadius: 18,
    padding: 14, marginBottom: 10, gap: 8, ...shadow,
  },
  matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  matchTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  pct: { fontSize: 20, fontWeight: '800' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  reason: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
  pickBox: {
    backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 10, gap: 6,
  },
  pickTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginLeft: 4 },
  pickItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12,
  },
  pickText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', gap: 10 },
  actBtn: {
    flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14,
  },
  actGhost: { borderWidth: 1, borderColor: colors.primary },
  actGhostText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  actMain: { backgroundColor: colors.primary },
  actMainText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});