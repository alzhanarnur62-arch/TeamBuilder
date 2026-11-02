import { useCallback, useState } from 'react';
import { Alert, View, Text, ActivityIndicator, Share, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { t, useLang } from '../i18n';
import { useMyId } from '../context/DataContext';
import { getSavedPost, markRead, toggleRead, removeSaved, type SavedPost } from '../database/favorites';
import { sourceName } from '../utils/newsMeta';
import ArticleView, { ArticleButton } from '../components/ArticleView';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedDetails'>;

const dateOf = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * Сақталған жаңалықтың толық беті (Зертханалық жұмыс 10).
 * Тек SQLite-тен оқиды — fetch жоқ, сондықтан интернетсіз ашылады. Сурет те базада сақталған.
 */
export default function SavedDetailsScreen({ route, navigation }: Props) {
  useLang();
  const { id } = route.params;
  const myId = useMyId();
  const [item, setItem] = useState<SavedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          // Ашқанда «оқылды» деп белгілейміз — нағыз жаңалық қосымшаларындағыдай
          await markRead(myId, id);
          const row = await getSavedPost(myId, id);
          if (active) setItem(row);
        } catch {
          if (active) setItem(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [myId, id])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
        <Text style={styles.title}>{t('fav.notFound')}</Text>
      </View>
    );
  }

  const read = item.isRead === 1;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.selectionAsync();
    try {
      await toggleRead(myId, item.id);
      setItem(await getSavedPost(myId, item.id));
    } catch {
      Alert.alert(t('fav.changeError'));
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    Alert.alert(t('fav.removeTitle'), t('fav.removeText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSaved(myId, item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
          } catch {
            Alert.alert(t('fav.changeError'));
          }
        },
      },
    ]);
  };

  const share = () => {
    Haptics.selectionAsync();
    const parts = [item.title, item.body, item.userId ? `— TeamBuilder · ${sourceName(item.userId)}` : '— TeamBuilder'];
    Share.share({ message: parts.join('\n\n') }).catch(() => {});
  };

  return (
    <ArticleView
      image={item.imageData ?? item.image}
      category={item.category}
      title={item.title}
      body={item.body}
      userId={item.userId}
      publishedAt={item.publishedAt}
      footer={t('fav.savedOn', { date: dateOf(item.savedAt) })}
      badge={
        <View style={styles.offline}>
          <Ionicons name="cloud-done" size={14} color={colors.success} />
          <Text style={styles.offlineText}>{t('fav.offlineCopy')}</Text>
        </View>
      }
      actions={
        <>
          <ArticleButton
            icon={read ? 'mail-unread-outline' : 'checkmark-done-outline'}
            label={read ? t('fav.markUnread') : t('fav.markRead')}
            onPress={() => {
              void toggle();
            }}
            disabled={busy}
          />
          <ArticleButton icon="share-outline" label={t('news.share')} onPress={share} />
          <ArticleButton icon="trash-outline" label={t('common.delete')} onPress={remove} danger />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  offline: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.successSoft,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  offlineText: { color: colors.success, fontSize: 12, fontWeight: '800' },
});
