import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { t } from '../i18n';
import { categoryColor, categoryName, relativeTime, sourceName } from '../utils/newsMeta';
import type { Announcement } from '../types/announcement';

type Props = {
  item: Announcement;
  onPress: () => void;
  /** featured — басты жаңалық (үлкен сурет), row — лентадағы қатар */
  variant?: 'featured' | 'row';
  /** Офлайн сақталған ба (Зертханалық жұмыс 10) */
  saved?: boolean;
  onSave?: () => void;
};

function Cover({ uri, style }: { uri?: string | null; style: object }) {
  if (uri) return <Image source={{ uri }} style={style} resizeMode="cover" />;
  return (
    <View style={[style, styles.coverEmpty]}>
      <Ionicons name="newspaper" size={28} color={colors.primary} />
    </View>
  );
}

/**
 * Жаңалық карточкасы.
 * Карточканы ашатын Pressable мен «Офлайн сақтау» батырмасы бір View ішінде қатар тұр —
 * батырма басқа Pressable ішіне салынбайды, әйтпесе басу әрекеттері араласып кетеді.
 */
export function AnnouncementCard({ item, onPress, variant = 'row', saved = false, onSave }: Props) {
  const color = categoryColor[item.category ?? 'campus'];
  const meta = [sourceName(item.userId), relativeTime(item.publishedAt)].filter(Boolean).join(' · ');

  const saveButton = onSave ? (
    <Pressable
      style={[styles.saveBtn, saved && styles.saveBtnDone]}
      onPress={onSave}
      disabled={saved}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={saved ? t('fav.savedBadge') : t('fav.saveOffline')}
    >
      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.success : colors.primary} />
      <Text style={[styles.saveText, saved && { color: colors.success }]}>
        {saved ? t('fav.savedBadge') : t('fav.saveOffline')}
      </Text>
    </Pressable>
  ) : null;

  if (variant === 'featured') {
    return (
      <View style={styles.featured}>
        <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
          <View>
            <Cover uri={item.image} style={styles.featuredImg} />
            <View style={styles.featuredBadges}>
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Ionicons name="flame" size={12} color="#fff" />
                <Text style={styles.badgeText}>{t('news.featured')}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{categoryName(item.category)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.featuredBody}>
            <Text style={styles.featuredTitle}>{item.title}</Text>
            <Text style={styles.excerpt} numberOfLines={2}>{item.body}</Text>
            <Text style={styles.meta}>{meta}</Text>
          </View>
        </Pressable>
        <View style={styles.featuredFooter}>{saveButton}</View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.7 }]}>
        <Cover uri={item.image} style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.category, { color }]}>{categoryName(item.category).toUpperCase()}</Text>
          <Text style={styles.rowTitle} numberOfLines={3}>{item.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
        </View>
      </Pressable>
      {saveButton}
    </View>
  );
}

const styles = StyleSheet.create({
  coverEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },

  featured: { backgroundColor: colors.card, borderRadius: 22, marginBottom: 18, overflow: 'hidden', ...shadow },
  featuredImg: { width: '100%', height: 200 },
  featuredBadges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  featuredBody: { padding: 16, paddingBottom: 6 },
  featuredTitle: { fontSize: 21, fontWeight: '800', color: colors.text, lineHeight: 27 },
  excerpt: { fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  featuredFooter: { paddingHorizontal: 16, paddingBottom: 14 },

  row: { backgroundColor: colors.card, borderRadius: 18, padding: 12, marginBottom: 12, ...shadow },
  rowMain: { flexDirection: 'row', gap: 12 },
  thumb: { width: 96, height: 96, borderRadius: 14 },
  category: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10,
    borderRadius: 12, paddingVertical: 9, backgroundColor: colors.primarySoft,
  },
  saveBtnDone: { backgroundColor: colors.successSoft },
  saveText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
});
