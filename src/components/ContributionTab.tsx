import { useState } from 'react';
import { View, Text, Image, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, roleName } from '../i18n';
import { useData, type Task } from '../context/DataContext';
import type { Project, Student } from '../types';

/*
 * Жеке үлес:
 *   үлес индексі = 60% тапсырмалар (команданың ең жоғары ұпайына қатысты)
 *                + 40% командадағылардың орташа бағасы (1–5 жұлдыз).
 * Баға жоқ болса — тек тапсырмалар есептеледі.
 */

const TASK_W = 0.6;
const RATING_W = 0.4;

function Avatar({ student, size = 40 }: { student: Student; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (student.photo) return <Image source={{ uri: student.photo }} style={box} />;
  return (
    <View style={[box, styles.avatarEmpty]}>
      <Text style={styles.avatarLetter}>{student.name[0]}</Text>
    </View>
  );
}

function Stars({ value, onChange, size = 28 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          disabled={!onChange}
          hitSlop={4}
          onPress={() => {
            Haptics.selectionAsync();
            onChange?.(n);
          }}
          accessibilityLabel={`${n}/5`}
        >
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={colors.accent} />
        </Pressable>
      ))}
    </View>
  );
}

type Props = { project: Project; members: Student[]; tasks: Task[] };

export default function ContributionTab({ project, members, tasks }: Props) {
  const { myId, ratings, rate } = useData();
  const projectRatings = ratings.filter((r) => r.projectId === project.id);

  // Әр адамға: ұпай, тапсырма саны, орташа баға, үлес индексі
  const base = members.map((m) => {
    const done = tasks.filter((x) => x.assigneeId === m.id && x.status === 'done');
    const got = projectRatings.filter((r) => r.toId === m.id);
    const avg = got.length ? got.reduce((s, r) => s + r.score, 0) / got.length : null;
    return { student: m, count: done.length, pts: done.reduce((s, x) => s + x.points, 0), avg, n: got.length };
  });
  const totalPts = base.reduce((s, x) => s + x.pts, 0);
  const maxPts = Math.max(0, ...base.map((x) => x.pts));
  const stats = base
    .map((x) => {
      const taskNorm = maxPts > 0 ? x.pts / maxPts : 0;
      const index =
        x.avg === null ? Math.round(taskNorm * 100) : Math.round((TASK_W * taskNorm + RATING_W * (x.avg / 5)) * 100);
      const share = totalPts > 0 ? Math.round((x.pts / totalPts) * 100) : 0;
      return { ...x, index, share };
    })
    .sort((a, b) => b.index - a.index);

  const myFeedback = projectRatings.filter((r) => r.toId === myId && r.comment.trim());
  const others = members.filter((m) => m.id !== myId);

  // Бағалау жобалары: әр адамға бөлек
  const mine = (toId: string) => projectRatings.find((r) => r.fromId === myId && r.toId === toId);
  const [drafts, setDrafts] = useState<Record<string, { score: number; comment: string }>>({});
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const draftOf = (id: string) => drafts[id] ?? { score: mine(id)?.score ?? 0, comment: mine(id)?.comment ?? '' };
  const setDraft = (id: string, patch: Partial<{ score: number; comment: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...draftOf(id), ...patch } }));

  const save = (id: string) => {
    const d = draftOf(id);
    if (d.score < 1) return;
    rate(project.id, id, d.score, d.comment.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedFor(id);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <View style={styles.formula}>
        <Ionicons name="calculator" size={18} color={colors.primary} />
        <Text style={styles.formulaText}>{t('team.formula')}</Text>
      </View>

      {stats.map((s, i) => {
        const top = i === 0 && s.index > 0;
        return (
          <View key={s.student.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Avatar student={s.student} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {s.student.name}
                  {s.student.id === project.ownerId ? ' 👑' : ''}
                </Text>
                <Text style={styles.muted}>
                  {t('team.tasksShare', { n: s.share })} · {t('team.stat', { n: s.count, pts: s.pts })}
                </Text>
                <Text style={styles.muted}>
                  {s.avg === null ? t('team.noRatings') : t('team.avg', { avg: s.avg.toFixed(1), n: s.n })}
                </Text>
              </View>
              <View style={styles.indexBox}>
                <Text style={[styles.indexValue, top && { color: colors.success }]}>{s.index}</Text>
                <Text style={styles.indexLabel}>{t('team.index')}</Text>
              </View>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${s.index}%`, backgroundColor: top ? colors.success : colors.primary }]} />
            </View>
          </View>
        );
      })}

      {myFeedback.length > 0 && (
        <>
          <Text style={styles.section}>{t('team.comments')}</Text>
          {myFeedback.map((r) => (
            <View key={r.id} style={styles.feedback}>
              <Stars value={r.score} size={16} />
              <Text style={styles.feedbackText}>{r.comment}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.section}>{t('team.rateTitle')}</Text>
      <Text style={styles.muted}>{t('team.rateHint')}</Text>
      {others.length === 0 && <Text style={[styles.muted, { marginTop: 10 }]}>{t('team.onlyYou')}</Text>}

      {others.map((m) => {
        const d = draftOf(m.id);
        const existing = mine(m.id);
        const dirty = !!drafts[m.id];
        return (
          <View key={m.id} style={styles.card}>
            <View style={styles.row}>
              <Avatar student={m} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.muted}>{roleName(m.role)}</Text>
              </View>
              {existing && !dirty && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark" size={14} color={colors.success} />
                  <Text style={styles.savedText}>{savedFor === m.id ? t('team.saved') : t('team.yourScore')}</Text>
                </View>
              )}
            </View>
            <View style={{ marginTop: 12 }}>
              <Stars value={d.score} onChange={(v) => setDraft(m.id, { score: v })} />
            </View>
            {(dirty || d.score > 0) && (
              <>
                <TextInput
                  style={styles.input}
                  value={d.comment}
                  onChangeText={(v) => setDraft(m.id, { comment: v })}
                  placeholder={t('team.commentPh')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                {dirty && (
                  <Pressable style={[styles.saveBtn, d.score < 1 && { opacity: 0.4 }]} onPress={() => save(m.id)} disabled={d.score < 1}>
                    <Text style={styles.saveText}>{t('team.saveRating')}</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formula: {
    flexDirection: 'row', gap: 8, backgroundColor: colors.primarySoft, borderRadius: 14, padding: 12, marginBottom: 12,
  },
  formulaText: { flex: 1, color: colors.primary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginTop: 10, ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { width: 18, fontSize: 16, fontWeight: '800', color: colors.textMuted, textAlign: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  indexBox: { alignItems: 'center', minWidth: 64 },
  indexValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  indexLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  section: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 4 },
  feedback: { backgroundColor: colors.card, borderRadius: 14, padding: 12, marginTop: 8, gap: 6 },
  feedbackText: { fontSize: 14, color: colors.text, lineHeight: 19 },
  stars: { flexDirection: 'row', gap: 6 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, fontSize: 15, color: colors.text, marginTop: 12, minHeight: 60, textAlignVertical: 'top',
  },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successSoft,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  savedText: { color: colors.success, fontSize: 12, fontWeight: '800' },
  avatarEmpty: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.primary, fontSize: 16, fontWeight: '800' },
});
