import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../theme';
import { t, useLang, roleName } from '../i18n';
import MatchCard from './MatchCard';
import { buildTeam, type Busy, type TeamResult } from '../utils/matching';
import type { Application } from '../context/IdeasContext';
import type { Project, Student } from '../types';

type Props = {
  project: Project;
  students: Student[];
  allProjects: Project[];
  applications: Application[];
  onOpenStudent: (id: string) => void;
};

/** Кім қай басқа жобада бос емес: жетекші немесе қабылданған мүше. */
function busyMap(project: Project, allProjects: Project[], applications: Application[]): Busy {
  const busy: Busy = {};
  const add = (id: string, title: string) => {
    busy[id] = [...(busy[id] ?? []), title];
  };
  for (const p of allProjects) {
    if (p.id === project.id) continue;
    add(p.ownerId, p.title);
    applications
      .filter((a) => a.projectId === p.id && a.status === 'accepted')
      .forEach((a) => add(a.studentId, p.title));
  }
  return busy;
}

const BARS: { key: 'roles' | 'skills' | 'time' | 'interests'; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'roles', icon: 'people' },
  { key: 'skills', icon: 'construct' },
  { key: 'time', icon: 'time' },
  { key: 'interests', icon: 'heart' },
];

export default function TeamSuggestion({ project, students, allProjects, applications, onOpenStudent }: Props) {
  const { lang } = useLang();
  const [ran, setRan] = useState(false);
  const [vi, setVi] = useState(0);
  const [showRejected, setShowRejected] = useState(false);

  // Тіл немесе деректер өзгерсе (мысалы, жаңа өтінім қабылданса) — нәтиже қайта есептеледі.
  const result: TeamResult | null = useMemo(() => {
    if (!ran) return null;
    const acceptedIds = applications
      .filter((a) => a.projectId === project.id && a.status === 'accepted')
      .map((a) => a.studentId);
    return buildTeam(project, students, { acceptedIds, busy: busyMap(project, allProjects, applications) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ran, lang, project, students, allProjects, applications]);

  const run = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRan(true);
    setVi(0);
    setShowRejected(false);
  };

  const v = result?.variants[Math.min(vi, (result?.variants.length ?? 1) - 1)];

  return (
    <View>
      <Text style={styles.section}>{t('ts.title')}</Text>
      <Text style={styles.text}>
        {t('ts.text')}
      </Text>

      <Pressable style={styles.runBtn} onPress={run}>
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.runText}>{result ? t('ts.rerun') : t('ts.run')}</Text>
      </Pressable>

      {result && result.full && (
        <View style={styles.note}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={styles.noteText}>
            {t('ts.full')}
          </Text>
        </View>
      )}

      {result && v && (
        <>
          {!result.full && (
            <Text style={styles.checked}>{t('ts.checked', { n: result.checked })}</Text>
          )}

          {result.variants.length > 1 && (
            <View style={styles.tabs}>
              {result.variants.map((x, i) => (
                <Pressable
                  key={i}
                  onPress={() => { Haptics.selectionAsync(); setVi(i); }}
                  style={[styles.tab, vi === i && styles.tabActive]}
                >
                  <Text style={[styles.tabTitle, vi === i && styles.tabTextActive]}>{t('ts.variant', { n: i + 1 })}</Text>
                  <Text style={[styles.tabScore, vi === i && styles.tabTextActive]}>{t('ts.points', { n: x.score })}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.scoreCard}>
            <View style={styles.scoreTop}>
              <View>
                <Text style={styles.scoreLabel}>{t('ts.score')}</Text>
                <Text style={styles.scoreValue}>{v.score}<Text style={styles.scoreMax}> / 100</Text></Text>
              </View>
              <Ionicons name="ribbon" size={40} color={colors.primary} />
            </View>
            {v.diff && <Text style={styles.diff}>{v.diff}</Text>}

            {BARS.map((b) => {
              const val = v.breakdown[b.key];
              if (val === null) return null;
              const pct = Math.round(val * 100);
              return (
                <View key={b.key} style={styles.barRow}>
                  <View style={styles.barHead}>
                    <Ionicons name={b.icon} size={14} color={colors.textMuted} />
                    <Text style={styles.barLabel}>{t(`ts.bar.${b.key}`)}</Text>
                    <Text style={styles.barPct}>{pct}%</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.section}>{t('ts.lineup')}</Text>
          {v.members.map((m) => (
            <MatchCard
              key={m.student.id}
              member={m}
              project={project}
              onPress={() => onOpenStudent(m.student.id)}
            />
          ))}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{t('ts.why')}</Text>
            {v.summary.map((line) => (
              <Text key={line} style={styles.summaryLine}>• {line}</Text>
            ))}
          </View>

          {!result.full && result.rejected.length > 0 && (
            <>
              <Pressable
                style={styles.rejHeader}
                onPress={() => { Haptics.selectionAsync(); setShowRejected(!showRejected); }}
              >
                <Text style={styles.rejTitle}>{t('ts.rejected', { n: result.rejected.length })}</Text>
                <Ionicons name={showRejected ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
              </Pressable>
              {showRejected &&
                result.rejected.map((r) => (
                  <Pressable key={r.student.id} style={styles.rejCard} onPress={() => onOpenStudent(r.student.id)}>
                    <Text style={styles.rejName}>
                      {r.student.name} <Text style={styles.rejRole}>· {roleName(r.student.role)}</Text>
                    </Text>
                    {r.reasons.map((line) => (
                      <View key={line} style={styles.rejLine}>
                        <Ionicons name="close-circle" size={15} color={colors.textMuted} style={{ marginTop: 2 }} />
                        <Text style={styles.rejText}>{line}</Text>
                      </View>
                    ))}
                  </Pressable>
                ))}
              <Text style={styles.footnote}>
                {t('ts.footnote')}
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 8 },
  text: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  runBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 16, height: 54, marginTop: 14,
  },
  runText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  note: {
    flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primarySoft,
    borderRadius: 14, padding: 12, marginTop: 14,
  },
  noteText: { flex: 1, color: colors.primary, fontSize: 14, fontWeight: '600' },
  checked: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tab: {
    flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, paddingVertical: 10, ...shadow,
  },
  tabActive: { backgroundColor: colors.primary },
  tabTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  tabScore: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  tabTextActive: { color: '#fff' },
  scoreCard: { backgroundColor: colors.card, borderRadius: 22, padding: 18, marginTop: 14, ...shadow },
  scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  scoreLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  scoreValue: { color: colors.primary, fontSize: 40, fontWeight: '800' },
  scoreMax: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
  diff: {
    color: colors.accent, backgroundColor: colors.accentSoft, borderRadius: 10, padding: 8,
    fontSize: 13, fontWeight: '700', marginBottom: 6,
  },
  barRow: { marginTop: 10 },
  barHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  barLabel: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  barPct: { fontSize: 13, color: colors.text, fontWeight: '800' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  summaryBox: { backgroundColor: colors.primarySoft, borderRadius: 18, padding: 16, gap: 6, marginTop: 4 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  summaryLine: { fontSize: 14, color: colors.text, lineHeight: 20 },
  rejHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 14, ...shadow,
  },
  rejTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  rejCard: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 8 },
  rejName: { fontSize: 15, fontWeight: '800', color: colors.text },
  rejRole: { fontWeight: '600', color: colors.textMuted },
  rejLine: { flexDirection: 'row', gap: 6, marginTop: 5 },
  rejText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  footnote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 12 },
});
