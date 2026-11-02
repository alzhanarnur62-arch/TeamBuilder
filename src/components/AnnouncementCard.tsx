import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { t } from '../i18n';
import type { Announcement } from '../types/announcement';

type Props = {
  item: Announcement;
  onPress: () => void;
  /** Офлайн сақталған ба (Зертханалық жұмыс 10) */
  saved?: boolean;
  onSave?: () => void;
};

/**
 * Тізімдегі бір хабарландыру карточкасы.
 * Карточканы ашатын Pressable мен «Офлайн сақтау» батырмасы бір View ішінде қатар тұр —
 * батырма басқа Pressable ішіне салынбайды, әйтпесе басу әрекеттері араласып кетеді.
 */
export function AnnouncementCard({ item, onPress, saved = false, onSave }: Props) {
  return (
    <View style={styles.card}>
      <Pressable style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]} onPress={onPress}>
        <View style={styles.icon}>
          <Ionicons name="megaphone" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      {onSave && (
        <Pressable
          style={[styles.saveBtn, saved && styles.saveBtnDone]}
          onPress={onSave}
          disabled={saved}
          accessibilityRole="button"
          accessibilityState={{ disabled: saved }}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.success : colors.primary} />
          <Text style={[styles.saveText, saved && { color: colors.success }]}>
            {saved ? t('fav.savedBadge') : t('fav.saveOffline')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 12, ...shadow },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12,
    borderRadius: 12, paddingVertical: 9, backgroundColor: colors.primarySoft,
  },
  saveBtnDone: { backgroundColor: colors.successSoft },
  saveText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
});
