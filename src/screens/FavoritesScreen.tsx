import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang } from '../i18n';
import { useMyId } from '../context/DataContext';
import { getAnnouncement } from '../api/announcements';
import { getSavedPosts, toggleRead, removeSaved, updateText, type SavedPost } from '../database/favorites';

type Filter = 'all' | 'unread';

const dateOf = (ts: number) => {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Таңдаулылар: SQLite-тен оқиды, интернет керек емес (Зертханалық жұмыс 10). */
export default function FavoritesScreen() {
  const { lang } = useLang();
  const insets = useSafeAreaInsets();
  const myId = useMyId();
  const [items, setItems] = useState<SavedPost[]>([]); // экрандағы көшірме, тұрақты дерек — SQLite-те
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // оқу барысы
  const [busy, setBusy] = useState(false); // өзгерту барысы
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const locked = useRef(false); // бір басу — бір өзгерту

  // Қойындыға қайта кірген сайын базаны оқимыз
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');
      getSavedPosts(myId)
        .then((rows) => {
          if (active) setItems(rows);
        })
        .catch(() => {
          if (active) setError(t('fav.readError'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [myId])
  );

  async function reloadAfterChange() {
    try {
      setItems(await getSavedPosts(myId));
    } catch {
      // Жазу сәтті болды, бірақ қайта оқу қате берді — UPDATE-ті қайта басу күйді кері ауыстырар еді
      setError(t('fav.reloadError'));
    }
  }

  async function change(action: () => Promise<unknown>, failKey: 'fav.changeError' | 'fav.syncError' = 'fav.changeError') {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch {
      setError(t(failKey));
      locked.current = false;
      setBusy(false);
      return;
    }
    await reloadAfterChange();
    locked.current = false;
    setBusy(false);
  }

  function confirmRemove(id: number) {
    Alert.alert(t('fav.removeTitle'), t('fav.removeText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void change(() => removeSaved(myId, id));
        },
      },
    ]);
  }

  // Күрделі тапсырма: мәтінді серверден жаңарту (оқылу күйі сақталады)
  function syncFromServer() {
    Haptics.selectionAsync();
    void change(async () => {
      for (const item of items) {
        const fresh = await getAnnouncement(item.id, lang);
        await updateText(myId, fresh);
      }
    }, 'fav.syncError');
  }

  const unreadCount = items.filter((i) => i.isRead === 0).length;
  const q = query.trim().toLowerCase();
  const visible = items
    .filter((i) => (filter === 'unread' ? i.isRead === 0 : true))
    .filter((i) => (q ? i.title.toLowerCase().includes(q) : true));
  const disabled = busy || loading || !!error;

  function renderSaved({ item }: { item: SavedPost }) {
    const read = item.isRead === 1;
    return (
      <View style={[styles.card, read && styles.cardRead]}>
        <View style={styles.cardTop}>
          <View style={[styles.status, read ? styles.statusRead : styles.statusUnread]}>
            <Ionicons name={read ? 'checkmark-done' : 'ellipse'} size={read ? 14 : 8} color={read ? colors.success : colors.primary} />
            <Text style={[styles.statusText, { color: read ? colors.success : colors.primary }]}>
              {read ? t('fav.read') : t('fav.unread')}
            </Text>
          </View>
          <Text style={styles.date}>{t('fav.savedAt', { date: dateOf(item.savedAt) })}</Text>
        </View>
        <Text style={styles.heading}>{item.title}</Text>
        <Text style={styles.text}>{item.body}</Text>
        <View style={styles.actions}>
          <Pressable
            style={[styles.action, disabled && styles.disabled]}
            disabled={disabled}
            onPress={() => {
              Haptics.selectionAsync();
              void change(() => toggleRead(myId, item.id));
            }}
          >
            <Ionicons name={read ? 'mail-unread-outline' : 'checkmark-done-outline'} size={16} color={colors.primary} />
            <Text style={styles.actionText}>{read ? t('fav.markUnread') : t('fav.markRead')}</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.actionDanger, disabled && styles.disabled]}
            disabled={disabled}
            onPress={() => confirmRemove(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>{t('common.delete')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 16 }]}
      data={visible}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderSaved}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('fav.title')}</Text>
              <Text style={styles.sub}>{t('fav.sub')}</Text>
            </View>
            {items.length > 0 && (
              <Pressable style={[styles.syncBtn, disabled && styles.disabled]} onPress={syncFromServer} disabled={disabled}>
                {busy ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />}
              </Pressable>
            )}
          </View>

          <View style={styles.filters}>
            {(['all', 'unread'] as const).map((f) => (
              <Pressable
                key={f}
                style={[styles.filter, filter === f && styles.filterActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f);
                }}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all' ? t('fav.all', { n: items.length }) : t('fav.unreadCount', { n: unreadCount })}
                </Text>
              </Pressable>
            ))}
          </View>

          {items.length > 0 && (
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
            </View>
          )}

          {loading && <Text style={styles.muted}>{t('news.loading')}</Text>}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {items.length === 0 ? t('fav.empty') : q ? t('news.notFound') : t('fav.allRead')}
            </Text>
            {items.length === 0 && <Text style={styles.muted}>{t('fav.emptyHint')}</Text>}
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  syncBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filter: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: colors.card, ...shadow },
  filterActive: { backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontWeight: '800', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card,
    borderRadius: 14, paddingHorizontal: 12, height: 46, marginBottom: 12, ...shadow,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  muted: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft,
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  errorText: { flex: 1, color: colors.danger, fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 12, ...shadow },
  cardRead: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusUnread: { backgroundColor: colors.primarySoft },
  statusRead: { backgroundColor: colors.successSoft },
  statusText: { fontSize: 12, fontWeight: '800' },
  date: { fontSize: 11, color: colors.textMuted },
  heading: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  action: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 10, backgroundColor: colors.primarySoft,
  },
  actionDanger: { backgroundColor: colors.dangerSoft, flex: 0, paddingHorizontal: 16 },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.4 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 50 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
});
