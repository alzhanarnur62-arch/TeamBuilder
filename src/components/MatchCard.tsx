import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { t, roleName, tagName } from '../i18n';
import type { Project } from '../types';
import type { TeamMember } from '../utils/matching';

/** Ұсынылған командадағы бір адамның карточкасы: неге таңдалды, қандай ескерту бар. */
export default function MatchCard({
  member, project, onPress,
}: { member: TeamMember; project: Project; onPress?: () => void }) {
  const s = member.student;

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.top}>
        {s.photo ? (
          <Image source={{ uri: s.photo }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{s.name.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{s.name}</Text>
          <Text style={styles.role}>{roleName(s.role)}{s.group ? ` · ${s.group}` : ''}</Text>
        </View>
        {member.fixed ? (
          <View style={styles.fixedBadge}>
            <Text style={styles.fixedText}>{t('mc.inTeam')}</Text>
          </View>
        ) : member.contribution > 0 ? (
          <View style={styles.contrib}>
            <Text style={styles.contribValue}>+{member.contribution}</Text>
            <Text style={styles.contribLabel}>{t('mc.pts')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.chips}>
        {s.skills.map((sk) => {
          const hit = project.neededSkills.some((x) => x.toLowerCase() === sk.toLowerCase());
          return (
            <View key={sk} style={[styles.chip, hit && styles.chipHit]}>
              <Text style={[styles.chipText, hit && styles.chipTextHit]}>
                {hit ? '✓ ' : ''}{tagName(sk)}
              </Text>
            </View>
          );
        })}
      </View>

      {member.reasons.map((r) => (
        <View key={r} style={styles.line}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.icon} />
          <Text style={styles.reason}>{r}</Text>
        </View>
      ))}
      {member.warnings.map((w) => (
        <View key={w} style={styles.line}>
          <Ionicons name="warning" size={16} color={colors.accent} style={styles.icon} />
          <Text style={[styles.reason, { color: colors.accent }]}>{w}</Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 12, ...shadow },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  role: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  fixedBadge: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  fixedText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  contrib: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  contribValue: { color: colors.success, fontSize: 18, fontWeight: '800' },
  contribLabel: { color: colors.success, fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 6 },
  chip: { backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  chipHit: { backgroundColor: colors.successSoft },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  chipTextHit: { color: colors.success },
  line: { flexDirection: 'row', gap: 6, marginTop: 6 },
  icon: { marginTop: 1 },
  reason: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 19 },
});
