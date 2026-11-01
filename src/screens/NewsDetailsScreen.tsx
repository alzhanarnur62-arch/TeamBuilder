import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang } from '../i18n';
import { getAnnouncement, readNewsCache, isAbort } from '../api/announcements';
import type { Announcement } from '../types/announcement';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NewsDetails'>;

/** Маршрут параметріндегі id бойынша бір хабарландыруды API-ден алады. */
export default function NewsDetailsScreen({ route }: Props) {
  useLang();
  const { announcementId } = route.params;
  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const data = await getAnnouncement(announcementId, controller.signal);
      setItem(data);
      setError(null);
    } catch (e) {
      if (isAbort(e)) return;
      // Интернет жоқ болса — кэштен іздейміз
      const cached = (await readNewsCache())?.items.find((x) => x.id === announcementId);
      if (cached) setItem(cached);
      else setError(t('news.error'));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [announcementId]);

  useEffect(() => {
    Promise.resolve().then(load);
    return () => abortRef.current?.abort();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>{t('news.loading')}</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline" size={56} color={colors.textMuted} />
        <Text style={styles.title}>{error ?? t('news.error')}</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            Haptics.selectionAsync();
            setLoading(true);
            setError(null);
            load();
          }}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryText}>{t('news.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.card}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('news.number', { n: item.id })}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="person" size={12} color={colors.primary} />
            <Text style={styles.badgeText}>{t('news.author', { n: item.userId })}</Text>
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
      <Text style={styles.source}>{t('news.source')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10,
  },
  muted: { fontSize: 14, color: colors.textMuted },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 20, ...shadow },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textTransform: 'capitalize', textAlign: 'left' },
  body: { fontSize: 16, color: colors.text, lineHeight: 24, marginTop: 12 },
  retryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primary,
    borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, marginTop: 8,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  source: { fontSize: 12, color: colors.textMuted, marginTop: 14, textAlign: 'center' },
});
