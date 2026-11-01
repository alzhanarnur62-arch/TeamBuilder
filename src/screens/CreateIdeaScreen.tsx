import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { t, useLang, roleName, slotName } from '../i18n';
import { students } from '../data/mock';
import { useIdeas } from '../context/IdeasContext';
import type { Role } from '../types';
import { RootStackParamList } from '../types/navigation';

const ROLES: Role[] = ['Frontend', 'Backend', 'Дизайнер', 'Тестілеуші', 'Менеджер'];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function CreateIdeaScreen() {
  useLang();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addIdea } = useIdeas();

  const baseSkills = useMemo(() => Array.from(new Set(students.flatMap((s) => s.skills))), []);
  const allSlots = useMemo(() => Array.from(new Set(students.flatMap((s) => s.freeSlots))), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [skillOptions, setSkillOptions] = useState<string[]>(baseSkills);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState(4);

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s) return;
    if (!skillOptions.includes(s)) setSkillOptions([...skillOptions, s]);
    if (!skills.includes(s)) setSkills([...skills, s]);
    setNewSkill('');
  };

  const save = () => {
    if (title.trim().length < 3) {
      Alert.alert(t('idea.needTitle'), t('idea.needTitleText'));
      return;
    }
    if (roles.length === 0) {
      Alert.alert(t('idea.needRole'), t('idea.needRoleText'));
      return;
    }
    const id = addIdea({
      title: title.trim(),
      description: description.trim(),
      neededRoles: roles,
      neededSkills: skills,
      slots,
      teamSize,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('Project', { projectId: id });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('idea.title')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('idea.titlePh')}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{t('idea.desc')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('idea.descPh')}
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={styles.label}>{t('idea.roles')}</Text>
        <View style={styles.chips}>
          {ROLES.map((r) => (
            <Chip key={r} label={roleName(r)} active={roles.includes(r)} onPress={() => setRoles(toggle(roles, r))} />
          ))}
        </View>

        <Text style={styles.label}>{t('idea.skills')}</Text>
        <View style={styles.chips}>
          {skillOptions.map((s) => (
            <Chip key={s} label={s} active={skills.includes(s)} onPress={() => setSkills(toggle(skills, s))} />
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newSkill}
            onChangeText={setNewSkill}
            placeholder={t('idea.ownSkill')}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={addSkill}
          />
          <Pressable onPress={addSkill} hitSlop={10}>
            <Ionicons name="add-circle" size={38} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.label}>{t('idea.slots')}</Text>
        <View style={styles.chips}>
          {allSlots.map((s) => (
            <Chip key={s} label={slotName(s)} active={slots.includes(s)} onPress={() => setSlots(toggle(slots, s))} />
          ))}
        </View>

        <Text style={styles.label}>{t('idea.size')}</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => setTeamSize(Math.max(2, teamSize - 1))}>
            <Ionicons name="remove" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.stepValue}>{teamSize}</Text>
          <Pressable style={styles.stepBtn} onPress={() => setTeamSize(Math.min(8, teamSize + 1))}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>{t('idea.publish')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
    padding: 14, fontSize: 16, color: colors.text,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { fontSize: 24, fontWeight: '800', color: colors.text, minWidth: 30, textAlign: 'center' },
  button: {
    backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 30,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});