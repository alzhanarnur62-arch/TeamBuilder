import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { useProfile } from '../context/ProfileContext';
import { t, useLang, roleName, slotName, tagName } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { students } from '../data/mock';
import type { Role } from '../types';

const ROLES: Role[] = ['Frontend', 'Backend', 'Дизайнер', 'Тестілеуші', 'Менеджер'];
const ALL_SKILLS = Array.from(new Set(students.flatMap((s) => s.skills)));
const ALL_INTERESTS = Array.from(new Set(students.flatMap((s) => s.interests)));
const ALL_SLOTS = Array.from(new Set(students.flatMap((s) => s.freeSlots)));

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function Chips({ options, selected, onToggle, label = (x) => x }: {
  options: string[]; selected: string[]; onToggle: (x: string) => void; label?: (x: string) => string;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() => { Haptics.selectionAsync(); onToggle(o); }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Бірінші кіргенде бір рет көрсетіледі: аты, рөлі, дағдылары, бос уақыты. */
export default function ProfileSetupScreen({ email }: { email: string }) {
  const insets = useSafeAreaInsets();
  const { profile, update } = useProfile();
  useLang();
  const sameUser = profile.email === '' || profile.email === email;

  const [name, setName] = useState(sameUser && profile.email ? profile.name : '');
  const [role, setRole] = useState<Role | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [extraSkills, setExtraSkills] = useState<string[]>([]);

  const ok = name.trim().length >= 2 && role !== null && skills.length > 0 && slots.length > 0;

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    if (!ALL_SKILLS.includes(s) && !extraSkills.includes(s)) setExtraSkills([...extraSkills, s]);
    if (!skills.includes(s)) setSkills([...skills, s]);
    setNewSkill('');
  };

  const save = () => {
    if (!ok || !role) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    update({
      email,
      name: name.trim(),
      role,
      skills,
      interests,
      freeSlots: slots,
      // Басқа аккаунт кірсе — алдыңғы адамның жеке деректерін тазалаймыз.
      ...(sameUser ? {} : { photo: null, age: '', city: '', about: '', achievements: [] }),
    });
  };

  const missing = [
    name.trim().length < 2 && t('setup.m.name'),
    !role && t('setup.m.role'),
    skills.length === 0 && t('setup.m.skills'),
    slots.length === 0 && t('setup.m.slots'),
  ].filter(Boolean);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
      >
        <LanguageSwitcher />
        <Text style={[styles.title, { marginTop: 16 }]}>{t('setup.title')}</Text>
        <Text style={styles.sub}>
          {t('setup.sub')}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>{t('setup.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('setup.namePh')}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>{t('setup.role')}</Text>
          <Chips options={ROLES} selected={role ? [role] : []} onToggle={(r) => setRole(r as Role)} label={roleName} />

          <Text style={styles.label}>{t('setup.skills')}</Text>
          <Chips
            options={[...ALL_SKILLS, ...extraSkills]}
            selected={skills}
            label={tagName}
            onToggle={(x) => setSkills(toggle(skills, x))}
          />
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder={t('common.otherSkill')}
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={addSkill}
            />
            <Pressable onPress={addSkill} hitSlop={10}>
              <Ionicons name="add-circle" size={40} color={colors.primary} />
            </Pressable>
          </View>

          <Text style={styles.label}>{t('setup.interests')}</Text>
          <Chips options={ALL_INTERESTS} selected={interests} onToggle={(x) => setInterests(toggle(interests, x))} label={tagName} />

          <Text style={styles.label}>{t('setup.slots')}</Text>
          <Chips options={ALL_SLOTS} selected={slots} onToggle={(x) => setSlots(toggle(slots, x))} label={slotName} />
        </View>

        {!ok && <Text style={styles.hint}>{t('setup.missing', { list: missing.join(', ') })}</Text>}

        <Pressable style={[styles.button, !ok && { opacity: 0.45 }]} onPress={save} disabled={!ok}>
          <Text style={styles.buttonText}>{t('common.done')}</Text>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: 8, marginBottom: 18, lineHeight: 21 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 18, ...shadow },
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, fontSize: 16, color: colors.text,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  hint: { color: colors.textMuted, textAlign: 'center', marginTop: 16 },
  button: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 18, height: 56, marginTop: 14,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
