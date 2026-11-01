import { useState } from 'react';
import { View, Text, FlatList, Image, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { t, useLang } from '../i18n';
import { useMyId } from '../context/DataContext';
import { useStudents } from '../context/ProfileContext';
import { useChats, formatListTime } from '../context/ChatsContext';
import type { Chat } from '../context/ChatsContext';
import { RootStackParamList } from '../types/navigation';

const SIZE = 54;

function ChatAvatar({ chat }: { chat: Chat }) {
  const ME = useMyId();
  const students = useStudents();
  const [failed, setFailed] = useState(false);

  if (chat.kind === 'group') {
    return (
      <LinearGradient
        colors={[colors.primary, '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Ionicons name="people" size={26} color="#fff" />
      </LinearGradient>
    );
  }

  const otherId = chat.memberIds.find((id) => id !== ME);
  const st = students.find((s) => s.id === otherId);
  if (st?.photo && !failed) {
    return <Image source={{ uri: st.photo }} style={styles.avatar} onError={() => setFailed(true)} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarEmpty]}>
      <Text style={styles.avatarLetter}>{(chat.title || '?')[0]}</Text>
    </View>
  );
}

export default function ChatsScreen() {
  useLang();
  const ME = useMyId();
  const students = useStudents();
  const { chats } = useChats();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const lastTime = (c: Chat) =>
    c.messages.length > 0 ? c.messages[c.messages.length - 1].createdAt : 0;

  const list = chats
    .filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => lastTime(b) - lastTime(a));

  const preview = (c: Chat) => {
    const last = c.messages[c.messages.length - 1];
    if (!last) return t('common.noMessages');
    if (last.authorId === ME) return t('chats.you', { text: last.text });
    if (c.kind === 'group') {
      const who = students.find((s) => s.id === last.authorId);
      return `${who?.name ?? ''}: ${last.text}`;
    }
    return last.text;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={styles.title}>{t('chats.title')}</Text>
            <Text style={styles.sub}>{t('chats.sub')}</Text>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t('chats.search')}
                placeholderTextColor={colors.textMuted}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('chats.none')}</Text>
            <Text style={styles.emptyText}>
              {t('chats.noneHint')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const last = item.messages[item.messages.length - 1];
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.card }]}
              onPress={() => {
                Haptics.selectionAsync();
                navigation.navigate('Chat', { chatId: item.id });
              }}
            >
              <ChatAvatar chat={item} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.top}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {last && (
                    <Text style={[styles.time, item.unread > 0 && { color: colors.primary }]}>
                      {formatListTime(last.createdAt)}
                    </Text>
                  )}
                </View>
                <View style={styles.bottom}>
                  <Text
                    style={[styles.preview, item.unread > 0 && { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {preview(item)}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
    backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  avatar: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmpty: { backgroundColor: colors.primarySoft },
  avatarLetter: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  time: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { flex: 1, fontSize: 14, color: colors.textMuted },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});