import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, View, Text, FlatList, TextInput, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang } from '../i18n';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { getAnnouncements, readNewsCache, writeNewsCache, isAbort } from '../api/announcements';
import type { Announcement } from '../types/announcement';
import type { RootStackParamList } from '../types/navigation';
import { savePost, getSavedIds } from '../database/favorites';
import { useMyId } from '../context/DataContext';

type Props = NativeStackScreenProps<RootStackParamList, 'News'>;

const timeOf = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function NewsScreen({ navigation }: Props) {
  const { lang } = useLang();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const myId = useMyId();
  // Офлайн сақталғандардың id-лері (SQLite) — батырманы «Сақталды» деп көрсету үшін
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Экранға қайта оралған сайын (мысалы, «Таңдаулылардан» жойғаннан кейін) қайта оқимыз
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSavedIds(myId)
        .then((ids) => active && setSavedIds(ids))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [myId])
  );

  async function saveOffline(post: Announcement) {
    try {
      const count = await savePost(myId, post);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedIds((prev) => new Set(prev).add(post.id));
      Alert.alert(count ? t('fav.saved') : t('fav.alreadySaved'));
    } catch {
      Alert.alert(t('fav.saveFailed'));
    }
  }

  const loadData = useCallback(async () => {
    // Алдыңғы сұраныс әлі жүріп жатса — тоқтатамыз
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const data = await getAnnouncements(lang, controller.signal);
      setItems(data);
      setError(null);
      setCachedAt(null);
      writeNewsCache(data);
    } catch (e) {
      if (isAbort(e)) return;
      setError(t('news.error'));
      // Интернет жоқ болса — соңғы сақталған тізімді көрсетеміз
      const cache = await readNewsCache();
      if (cache) {
        setItems(cache.items);
        setCachedAt(cache.savedAt);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [lang]);

  // Экран ашылғанда (және тіл ауысқанда) бір рет жүктейміз; экран жабылса — сұранысты тоқтатамыз
  useEffect(() => {
    Promise.resolve().then(loadData);
    return () => abortRef.current?.abort();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const retry = () => {
    Haptics.selectionAsync();
    setLoading(true);
    setError(null);
    loadData();
  };

  const q = query.trim().toLowerCase();
  const visible = q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;

  // 1) Алғашқы жүктеу
  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>{t('news.loading')}</Text>
      </View>
    );
  }

  // 2) Қате және көрсететін ештеңе жоқ
  if (error && items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline" size={56} color={colors.textMuted} />
        <Text style={styles.errorTitle}>{error}</Text>
        <Text style={styles.muted}>{t('news.errorHint')}</Text>
        <Pressable style={styles.retryBtn} onPress={retry}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryText}>{t('news.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  // 3) Тізім (бос болуы да мүмкін)
  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={visible}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <AnnouncementCard
          item={item}
          onPress={() => navigation.navigate('NewsDetails', { announcementId: item.id })}
          saved={savedIds.has(item.id)}
          onSave={() => {
            void saveOffline(item);
          }}
        />
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={t('news.search')}
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {error && cachedAt !== null && (
            <Pressable style={styles.offline} onPress={retry}>
              <Ionicons name="cloud-offline" size={18} color={colors.accent} />
              <Text style={styles.offlineText}>{t('news.cached', { time: timeOf(cachedAt) })}</Text>
              <Ionicons name="refresh" size={18} color={colors.accent} />
            </Pressable>
          )}

          <Text style={styles.source}>{t('news.source')}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name={q ? 'search-outline' : 'newspaper-outline'} size={44} color={colors.textMuted} />
          <Text style={styles.errorTitle}>{q ? t('news.notFound') : t('news.empty')}</Text>
          <Text style={styles.muted}>{q ? t('news.notFoundHint') : t('news.emptyHint')}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 10,
  },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  muted: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primary,
    borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, marginTop: 8,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card,
    borderRadius: 14, paddingHorizontal: 12, height: 46, marginBottom: 12, ...shadow,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  offline: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentSoft,
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  offlineText: { flex: 1, color: colors.accent, fontSize: 13, fontWeight: '700' },
  source: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 50 },
});
