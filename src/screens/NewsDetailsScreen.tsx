import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, View, Text, Pressable, ActivityIndicator, Share, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { t, useLang } from '../i18n';
import { getAnnouncement, readNewsCache, isAbort } from '../api/announcements';
import type { Announcement } from '../types/announcement';
import { sourceName } from '../utils/newsMeta';
import ArticleView, { ArticleButton } from '../components/ArticleView';
import { getSavedIds, savePost } from '../database/favorites';
import { useMyId } from '../context/DataContext';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NewsDetails'>;

/** Маршрут параметріндегі id бойынша бір хабарландыруды API-ден алады. */
export default function NewsDetailsScreen({ route }: Props) {
  const { lang } = useLang();
  const { announcementId } = route.params;
  const [item, setItem] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const myId = useMyId();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getSavedIds(myId)
      .then((ids) => active && setSaved(ids.has(announcementId)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [myId, announcementId]);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const data = await getAnnouncement(announcementId, lang, controller.signal);
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
  }, [announcementId, lang]);

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

  const share = () => {
    Haptics.selectionAsync();
    const message = [item.title, item.body, `— TeamBuilder · ${sourceName(item.userId)}`].join('\n\n');
    Share.share({ message }).catch(() => {});
  };

  const saveOffline = async () => {
    try {
      const count = await savePost(myId, item);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
      Alert.alert(count ? t('fav.saved') : t('fav.alreadySaved'));
    } catch {
      Alert.alert(t('fav.saveFailed'));
    }
  };

  return (
    <ArticleView
      image={item.image}
      category={item.category}
      title={item.title}
      body={item.body}
      userId={item.userId}
      publishedAt={item.publishedAt}
      footer={t('news.source')}
      actions={
        <>
          <ArticleButton icon="share-outline" label={t('news.share')} onPress={share} />
          <ArticleButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? t('fav.savedBadge') : t('fav.saveOffline')}
            done={saved}
            disabled={saved}
            onPress={() => {
              void saveOffline();
            }}
          />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10,
  },
  muted: { fontSize: 14, color: colors.textMuted },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primary,
    borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, marginTop: 8,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
