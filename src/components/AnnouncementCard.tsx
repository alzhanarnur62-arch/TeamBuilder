import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import type { Announcement } from '../types/announcement';

type Props = { item: Announcement; onPress: () => void };

/** Тізімдегі бір хабарландыру карточкасы. */
export function AnnouncementCard({ item, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name="megaphone" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card,
    borderRadius: 18, padding: 14, marginBottom: 12, ...shadow,
  },
  icon: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
  body: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
});
