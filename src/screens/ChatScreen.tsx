import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, Image, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { t, useLang } from '../i18n';
import { useMyId } from '../context/DataContext';
import { useChats, formatTime } from '../context/ChatsContext';
import { useProfile, useStudents } from '../context/ProfileContext';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const AV = 30;

function SmallAvatar({ studentId }: { studentId: string }) {
  const ME = useMyId();
  const students = useStudents();
  const { profile } = useProfile();
  const [failed, setFailed] = useState(false);
  const st = students.find((s) => s.id === studentId);
  const photo = studentId === ME ? profile.photo || st?.photo : st?.photo;
  if (photo && !failed) {
    return <Image source={{ uri: photo }} style={styles.avatar} onError={() => setFailed(true)} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarEmpty]}>
      <Text style={styles.avatarLetter}>{(st?.name ?? '?')[0]}</Text>
    </View>
  );
}

export default function ChatScreen({ route, navigation }: Props) {
  useLang();
  const ME = useMyId();
  const students = useStudents();
  const { chatId } = route.params;
  const { chats, sendMessage, markRead, setActiveChat } = useChats();
  const insets = useSafeAreaInsets();
  const chat = chats.find((c) => c.id === chatId);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useLayoutEffect(() => {
    if (chat) navigation.setOptions({ title: chat.title });
  }, [navigation, chat?.title]);

  useEffect(() => {
    setActiveChat(chatId);
    markRead(chatId);
    return () => setActiveChat(null);
  }, [chatId]);

  if (!chat) return null;

  const isGroup = chat.kind === 'group';

  const send = () => {
    const value = text.trim();
    if (!value) return;
    sendMessage(chatId, value);
    setText('');
    Haptics.selectionAsync();
  };

  const scrollEnd = () => listRef.current?.scrollToEnd({ animated: true });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={chat.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 4, flexGrow: 1 }}
        onContentSizeChange={scrollEnd}
        onLayout={scrollEnd}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('common.noMessages')}</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const mine = item.authorId === ME;
          const prev = chat.messages[index - 1];
          const next = chat.messages[index + 1];
          const firstOfRun = !prev || prev.authorId !== item.authorId;
          const lastOfRun = !next || next.authorId !== item.authorId;
          const author = students.find((s) => s.id === item.authorId);

          return (
            <View
              style={[
                styles.row,
                mine && { justifyContent: 'flex-end' },
                firstOfRun && { marginTop: 8 },
              ]}
            >
              {!mine && (
                <View style={{ width: AV }}>
                  {isGroup && lastOfRun ? <SmallAvatar studentId={item.authorId} /> : null}
                </View>
              )}
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                {!mine && isGroup && firstOfRun && (
                  <Text style={styles.author}>{author?.name}</Text>
                )}
                <Text style={styles.msgText}>{item.text}</Text>
                <Text style={[styles.msgTime, !mine && { color: colors.textMuted }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={t('common.writeMessage')}
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
          onPress={send}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={19} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  avatar: { width: AV, height: AV, borderRadius: AV / 2 },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 6 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleOther: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  author: { color: colors.accent, fontSize: 12, fontWeight: '800', marginBottom: 2 },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  msgTime: {
    color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 3,
    alignSelf: 'flex-end', fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 42, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, borderRadius: 21,
    paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 16, color: colors.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});