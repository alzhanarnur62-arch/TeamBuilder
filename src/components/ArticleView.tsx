import type { ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { t } from '../i18n';
import { categoryColor, categoryName, readMinutes, relativeTime, sourceName } from '../utils/newsMeta';
import type { NewsCategory } from '../types/announcement';

type Props = {
  image?: string | null;
  category?: NewsCategory | null;
  title: string;
  body: string;
  userId?: number | null;
  publishedAt?: string | null;
  /** Суреттің үстіндегі белгі (мысалы, «Офлайн көшірме») */
  badge?: ReactNode;
  /** Мәтіннен кейінгі батырмалар */
  actions?: ReactNode;
  footer?: string;
};

/** Мәтінді абзацтарға бөлеміз: әр екі сөйлем — бір абзац. */
function toParagraphs(body: string) {
  const sentences = (body.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [body]).map((x) => x.trim()).filter(Boolean);
  return sentences.reduce<string[]>((acc, sentence, i) => {
    if (i % 2 === 0) acc.push(sentence);
    else acc[acc.length - 1] += ' ' + sentence;
    return acc;
  }, []);
}

/** Жаңалықтың толық беті — «Жаңалықтар» мен «Таңдаулыларда» бірдей көрінеді. */
export default function ArticleView({ image, category, title, body, userId, publishedAt, badge, actions, footer }: Props) {
  const color = categoryColor[category ?? 'campus'];
  const meta = [relativeTime(publishedAt ?? undefined), t('news.readTime', { n: readMinutes(body) })].filter(Boolean).join(' · ');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.card }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View>
        {image ? (
          <Image source={{ uri: image }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroEmpty]}>
            <Ionicons name="newspaper" size={48} color={colors.primary} />
          </View>
        )}
        {badge && <View style={styles.badgeFloat}>{badge}</View>}
      </View>

      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{categoryName(category ?? undefined)}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.sourceIcon}>
            <Ionicons name="business" size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            {userId ? <Text style={styles.source}>{sourceName(userId)}</Text> : null}
            <Text style={styles.meta}>{meta}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {toParagraphs(body).map((p, i) => (
          <Text key={i} style={[styles.body, i === 0 && styles.lead]}>{p}</Text>
        ))}

        {actions && <View style={styles.actions}>{actions}</View>}
        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </View>
    </ScrollView>
  );
}

/** Мақаланың астындағы батырма. */
export function ArticleButton({
  icon, label, onPress, done = false, danger = false, disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  done?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const tint = done ? colors.success : danger ? colors.danger : colors.primary;
  return (
    <Pressable
      style={[styles.actionBtn, done && styles.actionBtnDone, danger && styles.actionBtnDanger, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.actionText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 240 },
  heroEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  badgeFloat: { position: 'absolute', top: 14, left: 14 },
  content: { padding: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 33 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  sourceIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  source: { fontSize: 14, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  lead: { fontSize: 18, fontWeight: '600', lineHeight: 27 },
  body: { fontSize: 16, color: colors.text, lineHeight: 25, marginBottom: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  actionBtn: {
    flexGrow: 1, flexBasis: '45%', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 10,
  },
  actionBtnDone: { backgroundColor: colors.successSoft },
  actionBtnDanger: { backgroundColor: colors.dangerSoft },
  actionText: { fontSize: 14, fontWeight: '800' },
  footer: { fontSize: 12, color: colors.textMuted, marginTop: 20, textAlign: 'center' },
});
