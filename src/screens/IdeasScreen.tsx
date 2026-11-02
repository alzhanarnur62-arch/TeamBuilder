import { useState } from 'react';
import {
  View, Text, FlatList, Pressable, Image, TextInput, ScrollView, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang, roleName, slotName, tagName, localized } from '../i18n';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import { useStudents } from '../context/ProfileContext';
import { useMyId } from '../context/DataContext';
import { useIdeas } from '../context/IdeasContext';
import { useChats } from '../context/ChatsContext';
import { scoreStudent } from '../utils/matching';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Projects'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function IdeasScreen() {
  useLang();
  const ME = useMyId();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const students = useStudents();
  const me = students.find((s) => s.id === ME)!;
  const { allProjects, applications } = useIdeas();
  const { openDirect } = useChats();
  const [tab, setTab] = useState<'projects' | 'students'>('projects');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const allRoles = Array.from(new Set(students.map((s) => String(s.role))));

  const q = query.trim().toLowerCase();
  const filteredStudents = students
    .filter((s) => (roleFilter ? String(s.role) === roleFilter : true))
    .filter((s) => {
      if (!q) return true;
      const haystack = [s.name, roleName(s.role), localized(s.i18n, 'city', s.city ?? ''), localized(s.i18n, 'about', s.about ?? ''), ...s.skills.map(tagName)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

  const message = (studentId: string) => {
    Haptics.selectionAsync();
    const chatId = openDirect(studentId);
    navigation.navigate('Chat', { chatId });
  };

  const owned = allProjects.filter((p) => p.ownerId === ME);
  const joined = applications.filter((a) => a.studentId === ME && a.status === 'accepted');
  const newApps = applications.filter(
    (a) => a.status === 'pending' && owned.some((p) => p.id === a.projectId)
  ).length;

  const segment = (
    <View style={styles.segment}>
      <Pressable
        style={[styles.segBtn, tab === 'projects' && styles.segActive]}
        onPress={() => setTab('projects')}
      >
        <Text style={[styles.segText, tab === 'projects' && styles.segTextActive]}>{t('home.projects')}</Text>
      </Pressable>
      <Pressable
        style={[styles.segBtn, tab === 'students' && styles.segActive]}
        onPress={() => setTab('students')}
      >
        <Text style={[styles.segText, tab === 'students' && styles.segTextActive]}>{t('home.students')}</Text>
      </Pressable>
    </View>
  );

  const stats: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; onPress?: () => void }[] = [
    { icon: 'bulb', value: allProjects.length, label: t('home.projects') },
    { icon: 'people', value: owned.length + joined.length, label: t('home.myTeams'), onPress: () => navigation.navigate('MyTeams') },
    { icon: 'mail-unread', value: newApps, label: t('home.newApps'), onPress: () => navigation.navigate('MyTeams') },
  ];

  const greeting = (
    <>
      <View style={styles.helloRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>{t('home.hello')}</Text>
          <Text style={styles.helloName} numberOfLines={1}>{me.name} 👋</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Profile')} style={styles.meAvatarWrap}>
          {me.photo ? (
            <Image source={{ uri: me.photo }} style={styles.meAvatar} />
          ) : (
            <Ionicons name="person" size={26} color={colors.primary} />
          )}
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <Pressable key={s.label} style={styles.stat} onPress={s.onPress} disabled={!s.onPress}>
            <Ionicons name={s.icon} size={24} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.newsTile} onPress={() => navigation.navigate('News')}>
        <View style={styles.newsIcon}>
          <Ionicons name="newspaper" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.newsTitle}>{t('news.tile')}</Text>
          <Text style={styles.newsSub}>{t('news.tileSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <Pressable style={styles.newsTile} onPress={() => navigation.navigate('EventRegistration')}>
        <View style={[styles.newsIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name="calendar" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.newsTitle}>{t('ev.tile')}</Text>
          <Text style={styles.newsSub}>{t('ev.tileSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {tab === 'students' && (
        <>
          <Text style={styles.title}>{t('home.students')}</Text>
          <Text style={styles.subtitle}>{t('home.studentsSub')}</Text>
          {segment}
        </>
      )}

      {tab === 'projects' ? (
        <FlatList
          data={allProjects}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {greeting}
              {segment}
              <Pressable style={styles.addBtn} onPress={() => navigation.navigate('CreateIdea')}>
                <Ionicons name="add-circle" size={22} color="#fff" />
                <Text style={styles.addText}>{t('common.newIdea')}</Text>
              </Pressable>
            </>
          }
          renderItem={({ item }) => {
            const owner = students.find((s) => s.id === item.ownerId);
            const mine = item.ownerId === ME;
            const fit = mine ? null : scoreStudent(item, me).score;
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('Project', { projectId: item.id })}
              >
                {mine ? (
                  <Text style={styles.badgeMine}>{t('home.mine')}</Text>
                ) : (
                  <Text style={styles.badgeFit}>{t('home.fit', { n: fit ?? 0 })}</Text>
                )}
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardText}>{localized(item.i18n, 'description', item.description)}</Text>
                <View style={styles.chips}>
                  {item.neededRoles.map((r) => (
                    <View key={r} style={styles.chip}>
                      <Text style={styles.chipText}>{roleName(r)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.footer}>
                  <Text style={styles.owner}>{t('common.author', { name: owner?.name ?? '' })}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={t('home.search')}
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <View style={{ marginBottom: 14 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {[null, ...allRoles].map((r) => {
                const active = roleFilter === r;
                return (
                  <Pressable
                    key={r ?? 'all'}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setRoleFilter(r);
                    }}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {r ? roleName(r) : t('home.all')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={filteredStudents}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>{t('home.nobody')}</Text>
                <Text style={styles.emptyText}>{t('home.nobodyHint')}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const info = [item.age ? t('common.age', { n: item.age }) : '', localized(item.i18n, 'city', item.city ?? '')].filter(Boolean).join(' · ');
              return (
                <Pressable
                  style={styles.card}
                  onPress={() => {
                    Haptics.selectionAsync();
                    navigation.navigate('Candidate', { studentId: item.id });
                  }}
                >
                  <View style={styles.personTop}>
                    {item.photo ? (
                      <Image source={{ uri: item.photo }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarEmpty]}>
                        <Text style={styles.avatarLetter}>{item.name[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.owner}>{roleName(item.role)}</Text>
                      {info ? <Text style={styles.info}>{info}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>

                  {item.about ? <Text style={styles.cardText}>{localized(item.i18n, 'about', item.about)}</Text> : null}

                  <View style={styles.chips}>
                    {item.skills.slice(0, 4).map((sk) => (
                      <View key={sk} style={styles.chip}>
                        <Text style={styles.chipText}>{tagName(sk)}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.slotsRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.info}>{item.freeSlots.map(slotName).join(' · ')}</Text>
                  </View>

                  {item.id !== ME && (
                    <Pressable style={styles.msgBtn} onPress={() => message(item.id)}>
                      <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                      <Text style={styles.msgBtnText}>{t('common.message')}</Text>
                    </Pressable>
                  )}
                </Pressable>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  helloRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 18 },
  hello: { fontSize: 30, fontWeight: '500', color: colors.text },
  helloName: { fontSize: 36, fontWeight: '800', color: colors.primary, marginTop: -2 },
  meAvatarWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow,
  },
  meAvatar: { width: 56, height: 56, borderRadius: 28 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  newsTile: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: 20, padding: 14, marginBottom: 20, ...shadow,
  },
  newsIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  newsTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  newsSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 14, gap: 4, ...shadow,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textMuted, marginTop: 6, marginBottom: 16 },
  segment: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
    padding: 4, marginBottom: 16, ...shadow,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  segActive: { backgroundColor: colors.primary },
  segText: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  segTextActive: { color: '#fff' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  filterChip: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  addBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 16, padding: 15, marginBottom: 14,
  },
  addText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  badgeMine: { color: colors.accent, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  badgeFit: { color: colors.success, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  card: {
    backgroundColor: colors.card, borderRadius: 22, padding: 18, marginBottom: 14, ...shadow,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  cardText: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  owner: { color: colors.accent, fontWeight: '700' },
  personTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 28, fontWeight: '800' },
  info: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  slotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  msgBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary, borderRadius: 14, paddingVertical: 11, marginTop: 14,
  },
  msgBtnText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 8, padding: 30 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});