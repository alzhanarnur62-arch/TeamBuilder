import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang, roleName } from '../i18n';
import { useMyId } from '../context/DataContext';
import { useIdeas } from '../context/IdeasContext';
import { useTeam } from '../context/TeamContext';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import type { Project } from '../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'MyTeams'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const statusColor = { pending: colors.accent, accepted: colors.success, rejected: colors.danger };

export default function MyTeamsScreen() {
  useLang();
  const ME = useMyId();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { allProjects, applications } = useIdeas();
  const { tasks } = useTeam();

  const owned = allProjects.filter((p) => p.ownerId === ME);
  const myApps = applications.filter((a) => a.studentId === ME);
  const joined = allProjects.filter((p) =>
    myApps.some((a) => a.projectId === p.id && a.status === 'accepted')
  );
  const waiting = myApps.filter((a) => a.status !== 'accepted');

  const teamProjects = [...owned, ...joined];
  const empty = teamProjects.length === 0 && waiting.length === 0;

  const open = (p: Project) => {
    Haptics.selectionAsync();
    navigation.navigate('Project', { projectId: p.id });
  };

  const renderTeamCard = (p: Project) => {
    const isOwner = p.ownerId === ME;
    const apps = applications.filter((a) => a.projectId === p.id);
    const members = 1 + apps.filter((a) => a.status === 'accepted').length;
    const newApps = apps.filter((a) => a.status === 'pending').length;
    const myOpen = tasks.filter(
      (t) => t.projectId === p.id && t.assigneeId === ME && t.status !== 'done'
    ).length;

    return (
      <Pressable key={p.id} style={styles.card} onPress={() => open(p)}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{p.title}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
        <Text style={styles.role}>{isOwner ? t('teams.leader') : t('teams.member')}</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <Text style={styles.statText}>{t('teams.people', { n: members, max: p.teamSize })}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="checkbox-outline" size={16} color={colors.textMuted} />
            <Text style={styles.statText}>
              {myOpen > 0 ? t('teams.myTasks', { n: myOpen }) : t('teams.noTasks')}
            </Text>
          </View>
        </View>

        {isOwner && newApps > 0 && (
          <View style={styles.alert}>
            <Ionicons name="mail-unread" size={16} color={colors.accent} />
            <Text style={styles.alertText}>{t('teams.newApps', { n: newApps })}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 30 }}
    >
      <Text style={styles.title}>{t('teams.title')}</Text>
      <Text style={styles.sub}>{t('teams.sub')}</Text>

      {empty ? (
        <View style={styles.empty}>
          <Ionicons name="people-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{t('teams.empty')}</Text>
          <Text style={styles.emptyText}>
            {t('teams.emptyHint')}
          </Text>
          <Pressable style={styles.btnPrimary} onPress={() => navigation.navigate('Projects')}>
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t('teams.find')}</Text>
          </Pressable>
          <Pressable style={styles.btnGhost} onPress={() => navigation.navigate('CreateIdea')}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.btnGhostText}>{t('common.newIdea')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {teamProjects.length > 0 && (
            <>
              <Text style={styles.section}>{t('teams.mine')}</Text>
              {teamProjects.map(renderTeamCard)}
            </>
          )}

          {waiting.length > 0 && (
            <>
              <Text style={styles.section}>{t('teams.sent')}</Text>
              {waiting.map((a) => {
                const p = allProjects.find((x) => x.id === a.projectId);
                if (!p) return null;
                return (
                  <Pressable key={a.id} style={styles.card} onPress={() => open(p)}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{p.title}</Text>
                        <Text style={styles.statText}>{t('common.role', { role: roleName(a.role) })}</Text>
                      </View>
                      <Text style={[styles.status, { color: statusColor[a.status] }]}>
                        {t(`status.${a.status}`)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 16, color: colors.textMuted, marginTop: 6, marginBottom: 8 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: 20,
    padding: 18, marginBottom: 12, ...shadow,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: colors.text, flexShrink: 1 },
  role: { color: colors.accent, fontWeight: '700', marginTop: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    backgroundColor: colors.accentSoft, borderRadius: 12, padding: 10,
  },
  alertText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  status: { fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  btnPrimary: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, alignSelf: 'stretch',
  },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnGhost: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, alignSelf: 'stretch',
  },
  btnGhostText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
